// ============================================================
// FISENT - HISTORIA CLINICA PAGE (UI Mejorada)
// ============================================================
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { historyService, appointmentService, cie10Service, patientService } from '../data-access/services';
import { ClinicalHistory, ClinicalHistoryCreateDTO, Appointment, Cie10, Patient } from '../domain/models';
import { clinicalHistorySchema, ClinicalHistoryFormData } from '../domain/schemas';
import {
  Card, Button, Select, Textarea, Modal, Badge, TableSkeleton, EmptyState, PageHeader,
} from '../components/ui/Components';
import { FileText, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const emptyForm: ClinicalHistoryFormData = {
  id_cita: 0,
  id_cie: 0,
  evolucion: '',
  antecedentes_sincronizados: false,
};

export default function HistoryPage() {
  const [histories, setHistories] = useState<ClinicalHistory[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cie10List, setCie10List] = useState<Cie10[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<number | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ClinicalHistoryFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appts, cies, pts] = await Promise.all([
        appointmentService.getAll().catch(() => []),
        cie10Service.getAll().catch(() => []),
        patientService.getAll().catch(() => []),
      ]);
      setAppointments(appts.filter((a: Appointment) => a.estado === 'COMPLETADA' || a.estado === 'CONFIRMADA'));
      setCie10List(cies || []);
      setPatients(pts || []);
      if (selectedPatient) {
        const hists = await historyService.getByPatient(Number(selectedPatient)).catch(() => []);
        setHistories(hists || []);
      } else {
        setHistories([]);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [selectedPatient]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setForm(emptyForm); setErrors({}); setModalOpen(true); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = clinicalHistorySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => { fieldErrors[String(err.path[0])] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    const existing = histories.find((h) => h.id_cita === form.id_cita);
    if (existing) { toast.error('Ya existe una evolucion registrada para esta cita'); return; }
    setSaving(true);
    try {
      await historyService.create(result.data as ClinicalHistoryCreateDTO);
      toast.success('Evolucion registrada exitosamente');
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar evolucion');
    } finally { setSaving(false); }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FileText className="w-6 h-6" />}
        title="Historia Clinica"
        subtitle="Evoluciones por cita"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nueva Evolucion</Button>}
      />

      <Card>
        <div className="p-4">
          <Select
            label="Filtrar por Paciente"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value ? Number(e.target.value) : '')}
            options={patients.filter(p => p.estado).map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido} (${p.num_doc})` }))}
            className="max-w-md"
          />
        </div>
      </Card>

      {loading ? (
        <Card className="p-6"><TableSkeleton rows={5} /></Card>
      ) : histories.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="No hay evoluciones registradas"
            description={selectedPatient ? "Este paciente no tiene evoluciones" : "Seleccione un paciente para ver su historia clinica"}
            action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nueva Evolucion</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {histories.map((h) => (
            <Card key={h.id} className="overflow-hidden" hover>
              <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">Cita #{h.id_cita} - {h.cita?.fecha?.split('T')[0]}</p>
                    <p className="text-sm text-gray-400 mt-0.5">CIE10: {h.cie10?.codigo} - {h.cie10?.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.antecedentes_sincronizados && <Badge variant="info">Antecedentes sync</Badge>}
                    <span className="text-xs text-gray-400">{format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-teal-50/20 rounded-xl p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{h.evolucion}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Evolucion" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Select label="Cita *" value={form.id_cita || ''} onChange={(e) => updateField('id_cita', Number(e.target.value))} options={appointments.map((a) => ({ value: a.id, label: `#${a.id} - ${a.paciente?.nombre} ${a.paciente?.apellido} (${a.fecha?.split('T')[0]})` }))} error={errors.id_cita} />
          <Select label="Diagnostico CIE10 *" value={form.id_cie || ''} onChange={(e) => updateField('id_cie', Number(e.target.value))} options={cie10List.map((c) => ({ value: c.id, label: `${c.codigo} - ${c.descripcion}` }))} error={errors.id_cie} />
          <Textarea label="Evolucion *" value={form.evolucion} onChange={(e) => updateField('evolucion', e.target.value)} rows={5} placeholder="Describa la evolucion del paciente en esta sesion..." error={errors.evolucion} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sync-antecedentes" checked={form.antecedentes_sincronizados || false} onChange={(e) => updateField('antecedentes_sincronizados', e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
            <label htmlFor="sync-antecedentes" className="text-sm text-gray-700 font-medium">Sincronizar antecedentes del paciente</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving}>Registrar Evolucion</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
