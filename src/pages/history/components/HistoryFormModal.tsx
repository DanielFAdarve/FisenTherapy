// ============================================================
// components/history/HistoryFormModal.tsx
// ============================================================
import { useState, useEffect, FormEvent, useCallback } from 'react';
import { ClinicalHistory, Appointment, Cie10, Patient, HistoryQuoteContext } from '../../../domain/models';
import { clinicalHistorySchema, ClinicalHistoryFormData } from '../../../domain/schemas';
import { historyService, patientService, appointmentService } from '../../../data-access/services';
import { Modal, Button, Select, Textarea, Alert } from '../../../components/ui/Components';
import { AntecedentsSection } from './AntecedentsSection';
import { HistoryFormPreview } from './HistoryFormPreview';
import { Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface HistoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingHistory: ClinicalHistory | null;
  quoteContext: HistoryQuoteContext | null;
  appointments: Appointment[];
  cie10List: Cie10[];
  patients: Patient[];
  mergePatients: (patients: Patient[]) => void;
  mergeAppointment: (appointment?: Appointment | null) => void;
  onSave: (saved: ClinicalHistory) => void;
}

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
  // Si el backend llegara a devolver estos campos en un futuro
  antecedentes: (history as any).antecedentes || '',
  antecedentes_personales: (history as any).antecedentes_personales || '',
  antecedentes_patologicos: (history as any).antecedentes_patologicos || '',
  antecedentes_quirurgicos: (history as any).antecedentes_quirurgicos || '',
  antecedentes_traumaticos: (history as any).antecedentes_traumaticos || '',
  antecedentes_farmacologicos: (history as any).antecedentes_farmacologicos || '',
  antecedentes_familiares: (history as any).antecedentes_familiares || '',
  antecedentes_sociales: (history as any).antecedentes_sociales || '',
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

const appointmentLabel = (a: Appointment) =>
  `#${a.id} - ${a.paciente_nombre || a.paciente || 'Paciente'} (${a.fecha?.split('T')[0] || 'sin fecha'})`;

export function HistoryFormModal({
  isOpen,
  onClose,
  editingHistory,
  quoteContext,
  appointments,
  cie10List,
  patients,
  mergePatients,
  mergeAppointment,
  onSave,
}: HistoryFormModalProps) {
  const [form, setForm] = useState<ClinicalHistoryFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingBackground, setLoadingBackground] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Inicializar formulario al abrir
  useEffect(() => {
    if (!isOpen) return;

    const init = async () => {
      if (editingHistory) {
        // Modo edición: cargar datos del historial
        setForm(historyToForm(editingHistory));

        // Cargar antecedentes frescos del paciente asociado a la cita
        const appointment = appointments.find(a => a.id === editingHistory.id_cita);
        const patientId = appointment?.id_paciente;
        if (patientId) {
          const patient = patients.find(p => p.id === patientId) ?? await patientService.getById(patientId).catch(() => null);
          if (patient) {
            mergePatients([patient]);
            setForm(prev => ({
              ...prev,
              ...patientBackgroundToForm(patient),
            }));
          }
        }
      } else if (quoteContext) {
        // Modo creación desde contexto de cita (URL)
        const ctx = quoteContext;
        const initialForm: ClinicalHistoryFormData = {
          ...emptyForm,
          id_cita: ctx.cita?.id ?? 0,
          id_cie: ctx.historia?.id_cie || ctx.cie10_historia?.id || ctx.cie10_paciente?.id || ctx.paciente?.id_cie || 0,
          ...(ctx.historia ? historyToForm(ctx.historia) : patientBackgroundToForm(ctx.paciente)),
          antecedentes_sincronizados: Boolean(ctx.paciente),
        };
        setForm(initialForm);
      } else {
        // Modo creación manual
        setForm(emptyForm);
      }
      setErrors({});
    };

    init();
  }, [isOpen, editingHistory, quoteContext, appointments, patients, mergePatients]);

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const hydrateBackgroundFromAppointment = useCallback(async (appointmentId: number) => {
    if (!appointmentId) return;
    setLoadingBackground(true);
    try {
      const context = await historyService.getQuoteContext(appointmentId);
      mergeAppointment(context.cita);
      if (context.paciente) mergePatients([context.paciente]);

      if (context.historia) {
        // Ya existe historia: cargar formulario completo de esa historia
        setForm(historyToForm(context.historia));
      } else {
        // Sin historia, precargar antecedentes y diagnóstico del paciente
        setForm(prev => ({
          ...prev,
          id_cita: appointmentId,
          id_cie: context.cie10_historia?.id || context.cie10_paciente?.id || context.paciente?.id_cie || prev.id_cie,
          ...patientBackgroundToForm(context.paciente),
        }));
      }
      toast.success('Datos de la cita precargados');
    } catch {
      // Fallback: cargar paciente manualmente
      const appointment = appointments.find(a => a.id === appointmentId)
        ?? await appointmentService.getById(appointmentId).catch(() => null);
      mergeAppointment(appointment);
      const patientId = appointment?.id_paciente;
      if (patientId) {
        const patient = await patientService.getById(patientId).catch(() => null);
        if (patient) {
          mergePatients([patient]);
          setForm(prev => ({
            ...prev,
            id_cita: appointmentId,
            id_cie: patient.id_cie || prev.id_cie,
            ...patientBackgroundToForm(patient),
          }));
        }
      }
    } finally {
      setLoadingBackground(false);
    }
  }, [appointments, mergeAppointment, mergePatients]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = clinicalHistorySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue: any) => {
        fieldErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    try {
      const dto = result.data;
      const saved = editingHistory
        ? await historyService.update(editingHistory.id, dto)
        : await historyService.create(dto);
      toast.success(editingHistory ? 'Historia actualizada' : 'Evolución registrada');
      onSave(saved);
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const selectedAppointment = appointments.find(a => a.id === form.id_cita);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingHistory ? 'Editar Historia Clínica' : 'Nueva Evolución'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {quoteContext && (
          <Alert
            type="info"
            title={quoteContext.tiene_historia ? 'Historia existente encontrada' : 'Cita lista para crear historia'}
            message="Información precargada desde la cita"
          />
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Cita *"
                value={form.id_cita || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  updateField('id_cita', id);
                  // Solo precargar antecedentes si NO estamos editando (para no sobrescribir)
                  if (!editingHistory) {
                    hydrateBackgroundFromAppointment(id);
                  }
                }}
                options={appointments.map(a => ({ value: a.id, label: appointmentLabel(a) }))}
                error={errors.id_cita}
              />
              <Select
                label="Diagnóstico CIE10 *"
                value={form.id_cie || ''}
                onChange={(e) => updateField('id_cie', Number(e.target.value))}
                options={cie10List.map(c => ({ value: c.id, label: `${c.codigo} - ${c.descripcion}` }))}
                error={errors.id_cie}
              />
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
                <Textarea label="Subjetivo" value={form.subjetivo} onChange={(e) => updateField('subjetivo', e.target.value)} rows={5} placeholder="Lo referido por el paciente..." />
                <Textarea label="Objetivo" value={form.objetivo} onChange={(e) => updateField('objetivo', e.target.value)} rows={5} placeholder="Hallazgos observables y mediciones..." />
                <Textarea label="Intervención" value={form.intervencion} onChange={(e) => updateField('intervencion', e.target.value)} rows={5} placeholder="Tratamiento realizado..." />
                <Textarea label="Recomendaciones" value={form.recomendaciones} onChange={(e) => updateField('recomendaciones', e.target.value)} rows={5} placeholder="Plan y recomendaciones..." />
              </div>
              <Textarea
                className="mt-3 min-h-[130px]"
                label="Estado del paciente / evolución general"
                value={form.descripcion_estado_paciente || form.evolucion}
                onChange={(e) => {
                  updateField('descripcion_estado_paciente', e.target.value);
                  updateField('evolucion', e.target.value);
                }}
                rows={5}
                placeholder="Resumen de evolución del paciente en esta sesión..."
                error={errors.evolucion}
              />
            </div>

            <AntecedentsSection
              values={form}
              onChange={updateField}
              loading={loadingBackground}
            />
          </div>

          <aside className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-800">Previsualización</p>
              <Button type="button" size="sm" variant="ghost" onClick={() => setPreviewOpen(!previewOpen)}>
                <Eye className="mr-1 h-3.5 w-3.5" />{previewOpen ? 'Ocultar' : 'Ver'}
              </Button>
            </div>
            <p className="text-xs text-gray-400">Vista rápida del DOCX. Descarga real tras guardar.</p>
            {previewOpen && (
              <HistoryFormPreview form={form} cie10List={cie10List} />
            )}
            {editingHistory && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => historyService.exportDocument(editingHistory.id)
                  .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `historia-${editingHistory.id}.docx`;
                    link.click();
                    URL.revokeObjectURL(url);
                  })
                  .catch(() => toast.error('No se pudo generar el DOCX'))}
              >
                <Download className="mr-2 h-4 w-4" />Generar DOCX
              </Button>
            )}
          </aside>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={saving}>{editingHistory ? 'Actualizar Historia' : 'Registrar Evolución'}</Button>
        </div>
      </form>
    </Modal>
  );
}