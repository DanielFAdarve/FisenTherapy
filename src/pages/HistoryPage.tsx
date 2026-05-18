// ============================================================
// FISENT - HISTORIA CLINICA PAGE (UI Mejorada)
// ============================================================
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { historyService, appointmentService, cie10Service, patientService } from '../data-access/services';
import { ClinicalHistory, ClinicalHistoryCreateDTO, Appointment, Cie10, Patient, HistoryQuoteContext } from '../domain/models';
import { clinicalHistorySchema, ClinicalHistoryFormData } from '../domain/schemas';
import {
  Card, Button, Select, Textarea, Modal, Badge, TableSkeleton, EmptyState, PageHeader, Alert,
} from '../components/ui/Components';
import { PatientSearchField } from '../components/PatientSearchField';
import { Download, Edit2, Eye, FileText, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const emptyForm: ClinicalHistoryFormData = {
  id_cita: 0,
  id_cie: 0,
  evolucion: '',
  descripcion_estado_paciente: '',
  subjetivo: '',
  objetivo: '',
  intervencion: '',
  recomendaciones: '',
  antecedentes: '',
  antecedentes_personales: '',
  antecedentes_patologicos: '',
  antecedentes_quirurgicos: '',
  antecedentes_traumaticos: '',
  antecedentes_farmacologicos: '',
  antecedentes_familiares: '',
  antecedentes_sociales: '',
  antecedentes_sincronizados: false,
};

const emptyText = (value?: string | null) => value || 'No registra';

const historyToForm = (history: ClinicalHistory): ClinicalHistoryFormData => ({
  ...emptyForm,
  id_cita: history.id_cita,
  id_cie: history.id_cie,
  evolucion: history.evolucion || '',
  descripcion_estado_paciente: history.descripcion_estado_paciente || '',
  subjetivo: history.subjetivo || '',
  objetivo: history.objetivo || '',
  intervencion: history.intervencion || '',
  recomendaciones: history.recomendaciones || '',
  antecedentes_sincronizados: history.antecedentes_sincronizados,
});

const patientBackgroundToForm = (patient?: Patient | null): Partial<ClinicalHistoryFormData> => ({
  antecedentes: emptyText(patient?.antecedentes),
  antecedentes_personales: emptyText(patient?.antecedentes_personales),
  antecedentes_patologicos: emptyText(patient?.antecedentes_patologicos),
  antecedentes_quirurgicos: emptyText(patient?.antecedentes_quirurgicos),
  antecedentes_traumaticos: emptyText(patient?.antecedentes_traumaticos),
  antecedentes_farmacologicos: emptyText(patient?.antecedentes_farmacologicos),
  antecedentes_familiares: emptyText(patient?.antecedentes_familiares),
  antecedentes_sociales: emptyText(patient?.antecedentes_sociales),
  antecedentes_sincronizados: Boolean(patient),
});

const appointmentLabel = (appointment: Appointment) => (
  `#${appointment.id} - ${appointment.paciente_nombre || appointment.paciente || 'Paciente'} (${appointment.fecha?.split('T')[0] || 'sin fecha'})`
);

const formatHistoryDate = (value?: string) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, 'dd/MM/yyyy HH:mm');
};

export default function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const quoteParam = searchParams.get('quote');
  const [histories, setHistories] = useState<ClinicalHistory[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cie10List, setCie10List] = useState<Cie10[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<number | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState<ClinicalHistoryFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [editingHistory, setEditingHistory] = useState<ClinicalHistory | null>(null);
  const [quoteContext, setQuoteContext] = useState<HistoryQuoteContext | null>(null);

  const mergePatients = useCallback((foundPatients: Patient[]) => {
    setPatients((current) => {
      const merged = [...current];
      foundPatients.forEach((patient) => {
        if (!merged.some((item) => item.id === patient.id)) merged.push(patient);
      });
      return merged;
    });
  }, []);

  const mergeAppointment = useCallback((appointment?: Appointment | null) => {
    if (!appointment) return;
    setAppointments((current) => [appointment, ...current.filter((item) => item.id !== appointment.id)]);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appts, cies] = await Promise.all([
        selectedPatient ? appointmentService.getAll(undefined, undefined, Number(selectedPatient), 1, 100).catch(() => []) : Promise.resolve([]),
        cie10Service.getAll(undefined, 1, 100).catch(() => []),
      ]);
      setAppointments(appts || []);
      setCie10List(cies || []);
      if (selectedPatient) {
        const hists = await historyService.getByPatient(Number(selectedPatient), { page: 1, limit: 50 }).catch(() => []);
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

  const applyQuoteContext = useCallback((context: HistoryQuoteContext) => {
    setQuoteContext(context);
    mergeAppointment(context.cita);
    if (context.paciente) {
      mergePatients([context.paciente]);
      setSelectedPatient(context.paciente.id);
    } else if (context.cita?.id_paciente) {
      setSelectedPatient(context.cita.id_paciente);
    }

    const history = context.historia;
    setEditingHistory(history);
    setForm({
      ...(history ? historyToForm(history) : emptyForm),
      id_cita: context.cita?.id ?? history?.id_cita ?? 0,
      id_cie: history?.id_cie || context.cie10_historia?.id || context.cie10_paciente?.id || context.paciente?.id_cie || 0,
      ...(!history ? patientBackgroundToForm(context.paciente) : {}),
    });
    setErrors({});
    setModalOpen(true);
  }, [mergeAppointment, mergePatients]);

  const hydrateBackgroundFromAppointment = useCallback(async (appointmentId: number) => {
    if (!appointmentId) return;
    setSaving(true);
    try {
      const context = await historyService.getQuoteContext(appointmentId);
      applyQuoteContext(context);
    } catch {
      const appointment = appointments.find((item) => item.id === appointmentId) ?? await appointmentService.getById(appointmentId).catch(() => null);
      mergeAppointment(appointment);
      const patientId = appointment?.id_paciente || Number(selectedPatient || 0);
      const existing = histories.find((history) => history.id_cita === appointmentId) ?? null;

      if (existing) {
        setEditingHistory(existing);
        setForm(historyToForm(existing));
        return;
      }

      setEditingHistory(null);
      let patient: Patient | null = null;
      if (patientId) patient = await patientService.getById(patientId).catch(() => null);
      if (patient) mergePatients([patient]);
      setForm((prev) => ({
        ...prev,
        id_cita: appointmentId,
        id_cie: patient?.id_cie || prev.id_cie || 0,
        ...patientBackgroundToForm(patient),
      }));
    } finally {
      setSaving(false);
    }
  }, [applyQuoteContext, appointments, histories, mergeAppointment, mergePatients, selectedPatient]);

  useEffect(() => {
    const quoteId = Number(quoteParam || 0);
    if (!quoteId) return;
    historyService.getQuoteContext(quoteId)
      .then(applyQuoteContext)
      .catch(() => toast.error('No se pudo cargar la cita para historia clínica'));
  }, [applyQuoteContext, quoteParam]);

  const openCreate = () => {
    setEditingHistory(null);
    setQuoteContext(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (history: ClinicalHistory) => {
    setEditingHistory(history);
    setQuoteContext(null);
    setForm(historyToForm(history));
    setErrors({});
    setModalOpen(true);
    hydrateBackgroundFromAppointment(history.id_cita);
  };

  const closeModal = () => {
    setModalOpen(false);
    setPreviewOpen(false);
    setQuoteContext(null);
    if (quoteParam) setSearchParams({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = clinicalHistorySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => { fieldErrors[String(err.path[0])] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    const existing = editingHistory ?? histories.find((h) => h.id_cita === form.id_cita);
    setSaving(true);
    try {
      const saved = existing
        ? await historyService.update(existing.id, result.data as ClinicalHistoryCreateDTO)
        : await historyService.create(result.data as ClinicalHistoryCreateDTO);
      toast.success(existing ? 'Historia clínica actualizada exitosamente' : 'Evolución registrada exitosamente');
      setEditingHistory(saved);
      setHistories((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      closeModal();
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar evolución');
    } finally { setSaving(false); }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const downloadHistory = async (history: ClinicalHistory) => {
    setExportingId(history.id);
    try {
      const blob = await historyService.exportDocument(history.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historia-clinica-${history.id}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Documento DOCX generado');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo generar el DOCX');
    } finally {
      setExportingId(null);
    }
  };

  const selectedAppointment = appointments.find((appointment) => appointment.id === form.id_cita) ?? quoteContext?.cita ?? editingHistory?.cita ?? null;
  const modalTitle = editingHistory ? 'Ver / Editar Historia Clínica' : 'Nueva Evolución';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FileText className="w-6 h-6" />}
        title="Historia Clínica"
        subtitle="Evoluciones por cita con antecedentes precargados"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nueva Evolución</Button>}
      />

      <Card>
        <div className="p-4">
          <PatientSearchField
            label="Filtrar por Paciente"
            value={selectedPatient}
            initialPatient={patients.find((patient) => patient.id === selectedPatient) ?? null}
            onChange={(patientId, patient) => {
              setSelectedPatient(patientId ? Number(patientId) : '');
              if (patient) mergePatients([patient]);
            }}
            onResults={mergePatients}
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
            description={selectedPatient ? 'Este paciente no tiene evoluciones' : 'Seleccione un paciente o abra una cita para ver su historia clínica'}
            action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nueva Evolución</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {histories.map((h) => (
            <Card key={h.id} className="overflow-hidden" hover>
              <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
              <div className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">Historia #{h.id} · Cita #{h.id_cita} - {h.cita?.fecha?.split('T')[0] || h.fecha_evolucion}</p>
                    <p className="text-sm text-gray-400 mt-0.5">CIE10: {h.cie10?.codigo || h.Cie10?.codigo || '--'} - {h.cie10?.descripcion || h.Cie10?.descripcion || 'Sin diagnóstico'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {h.antecedentes_sincronizados && <Badge variant="info">Antecedentes sync</Badge>}
                    <span className="text-xs text-gray-400">{formatHistoryDate(h.created_at)}</span>
                    <Button size="sm" variant="outline" onClick={() => openEdit(h)}><Edit2 className="mr-1 h-3.5 w-3.5" />Ver/Editar</Button>
                    <Button size="sm" variant="secondary" onClick={() => downloadHistory(h)} isLoading={exportingId === h.id}><Download className="mr-1 h-3.5 w-3.5" />DOCX</Button>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-teal-50/20 rounded-xl p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{h.evolucion || h.descripcion_estado_paciente || 'Sin resumen registrado'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={modalTitle} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {quoteContext && (
            <Alert
              type="info"
              title={quoteContext.tiene_historia ? 'Historia existente encontrada' : 'Cita lista para crear historia'}
              message="La información de cita, paciente, antecedentes y diagnóstico se precargó desde GET /history/get-by-quote/:idCita."
            />
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label="Cita *"
                  value={form.id_cita || ''}
                  onChange={(e) => {
                    const appointmentId = Number(e.target.value);
                    updateField('id_cita', appointmentId);
                    hydrateBackgroundFromAppointment(appointmentId);
                  }}
                  options={appointments.map((a) => ({ value: a.id, label: appointmentLabel(a) }))}
                  error={errors.id_cita}
                />
                <Select label="Diagnóstico CIE10 *" value={form.id_cie || ''} onChange={(e) => updateField('id_cie', Number(e.target.value))} options={cie10List.map((c) => ({ value: c.id, label: `${c.codigo} - ${c.descripcion}` }))} error={errors.id_cie} />
              </div>

              {selectedAppointment && (
                <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 text-sm text-teal-900">
                  <p className="font-bold">Cita #{selectedAppointment.id} · {selectedAppointment.fecha?.split('T')[0]} {selectedAppointment.horario_inicio?.slice(0, 5)}</p>
                  <p>{selectedAppointment.paciente_nombre || selectedAppointment.paciente || 'Paciente'} · {selectedAppointment.profesional_nombre || selectedAppointment.profesional || 'Profesional'}</p>
                  <p>{selectedAppointment.tipo_paquete || selectedAppointment.package?.nombre || selectedAppointment.paquete?.nombre || 'Paquete asociado'} · Sesión #{selectedAppointment.numero_sesion || '--'}</p>
                </div>
              )}

              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <p className="mb-3 text-sm font-bold text-gray-800">Valoración y evolución de la sesión</p>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <Textarea label="Subjetivo" value={form.subjetivo || ''} onChange={(e) => updateField('subjetivo', e.target.value)} rows={5} placeholder="Lo referido por el paciente..." />
                  <Textarea label="Objetivo" value={form.objetivo || ''} onChange={(e) => updateField('objetivo', e.target.value)} rows={5} placeholder="Hallazgos observables y mediciones..." />
                  <Textarea label="Intervención" value={form.intervencion || ''} onChange={(e) => updateField('intervencion', e.target.value)} rows={5} placeholder="Tratamiento realizado..." />
                  <Textarea label="Recomendaciones" value={form.recomendaciones || ''} onChange={(e) => updateField('recomendaciones', e.target.value)} rows={5} placeholder="Plan y recomendaciones..." />
                </div>
                <Textarea className="mt-3 min-h-[130px]" label="Estado del paciente / evolución general" value={form.descripcion_estado_paciente || form.evolucion || ''} onChange={(e) => { updateField('descripcion_estado_paciente', e.target.value); updateField('evolucion', e.target.value); }} rows={5} placeholder="Resumen de evolución del paciente en esta sesión..." error={errors.evolucion} />
              </div>

              <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <input type="checkbox" id="sync-antecedentes" checked={form.antecedentes_sincronizados || false} onChange={(e) => updateField('antecedentes_sincronizados', e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  <label htmlFor="sync-antecedentes" className="text-sm font-bold text-gray-700">Antecedentes sincronizados/editables del paciente</label>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <Textarea label="Antecedentes generales" value={form.antecedentes || ''} onChange={(e) => updateField('antecedentes', e.target.value)} rows={3} />
                  <Textarea label="Personales" value={form.antecedentes_personales || ''} onChange={(e) => updateField('antecedentes_personales', e.target.value)} rows={3} />
                  <Textarea label="Patológicos" value={form.antecedentes_patologicos || ''} onChange={(e) => updateField('antecedentes_patologicos', e.target.value)} rows={3} />
                  <Textarea label="Quirúrgicos" value={form.antecedentes_quirurgicos || ''} onChange={(e) => updateField('antecedentes_quirurgicos', e.target.value)} rows={3} />
                  <Textarea label="Traumáticos" value={form.antecedentes_traumaticos || ''} onChange={(e) => updateField('antecedentes_traumaticos', e.target.value)} rows={3} />
                  <Textarea label="Farmacológicos" value={form.antecedentes_farmacologicos || ''} onChange={(e) => updateField('antecedentes_farmacologicos', e.target.value)} rows={3} />
                  <Textarea label="Familiares" value={form.antecedentes_familiares || ''} onChange={(e) => updateField('antecedentes_familiares', e.target.value)} rows={3} />
                  <Textarea label="Sociales" value={form.antecedentes_sociales || ''} onChange={(e) => updateField('antecedentes_sociales', e.target.value)} rows={3} />
                </div>
              </div>
            </div>

            <aside className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-800">Previsualización</p>
                <Button type="button" size="sm" variant="ghost" onClick={() => setPreviewOpen((value) => !value)}><Eye className="mr-1 h-3.5 w-3.5" />{previewOpen ? 'Ocultar' : 'Ver'}</Button>
              </div>
              <p className="text-xs text-gray-400">Vista rápida del contenido que alimentará el DOCX. El archivo final se descarga con el botón DOCX después de guardar.</p>
              {previewOpen && (
                <div className="max-h-[620px] space-y-3 overflow-y-auto rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                  <p><strong>Cita:</strong> #{form.id_cita || '--'}</p>
                  <p><strong>CIE10:</strong> {cie10List.find((cie) => cie.id === form.id_cie)?.codigo || '--'}</p>
                  <p><strong>Estado:</strong> {form.descripcion_estado_paciente || form.evolucion || 'Sin registrar'}</p>
                  <p><strong>Subjetivo:</strong> {form.subjetivo || 'Sin registrar'}</p>
                  <p><strong>Objetivo:</strong> {form.objetivo || 'Sin registrar'}</p>
                  <p><strong>Intervención:</strong> {form.intervencion || 'Sin registrar'}</p>
                  <p><strong>Recomendaciones:</strong> {form.recomendaciones || 'Sin registrar'}</p>
                  <p><strong>Antecedentes:</strong> {form.antecedentes || 'Sin registrar'}</p>
                </div>
              )}
              {editingHistory && (
                <Button type="button" variant="secondary" className="w-full" onClick={() => downloadHistory(editingHistory)} isLoading={exportingId === editingHistory.id}>
                  <Download className="mr-2 h-4 w-4" />Generar DOCX
                </Button>
              )}
            </aside>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" isLoading={saving}>{editingHistory ? 'Actualizar Historia' : 'Registrar Evolución'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
