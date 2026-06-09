// ============================================================
// components/history/HistoryFormModal.tsx
// ============================================================
import { useState, useEffect, FormEvent, useCallback, useMemo, useRef } from 'react';
import { ClinicalHistory, Appointment, Cie10, Patient, HistoryQuoteContext } from '../../../domain/models';
import { clinicalHistorySchema, ClinicalHistoryFormData } from '../../../domain/schemas';
import { historyService, patientService, appointmentService } from '../../../data-access/services';
import { Modal, Button, Textarea, Alert, Badge } from '../../../components/ui/Components';
import { AntecedentsSection } from './AntecedentsSection';
import { Cie10SearchField } from '../../../components/Cie10SearchField';
import toast from 'react-hot-toast';
import { Download, Search } from 'lucide-react';
import { AppointmentSearchModal } from './AppointmentSearchModal';

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
  mergeCies: (cies: Cie10[]) => void;
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
  mergeCies,
  onSave,
}: HistoryFormModalProps) {
  const [form, setForm] = useState<ClinicalHistoryFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingBackground, setLoadingBackground] = useState(false);
  const [loadedHistory, setLoadedHistory] = useState<ClinicalHistory | null>(null);
  const [appointmentQuery, setAppointmentQuery] = useState('');
  const [appointmentPickerOpen, setAppointmentPickerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [appointmentSearchOpen, setAppointmentSearchOpen] = useState(false);
  const initKeyRef = useRef('');
  const activeHistory = editingHistory ?? loadedHistory;
  const [selectedAppointmentState, setSelectedAppointmentState] = useState<Appointment | null>(null);

  // Inicializar formulario al abrir
  useEffect(() => {
    if (!isOpen) {
      initKeyRef.current = '';
      return;
    }

    const initKey = editingHistory
      ? `edit:${editingHistory.id}`
      : quoteContext?.cita?.id
        ? `quote:${quoteContext.cita.id}:${quoteContext.historia?.id ?? 'new'}`
        : 'create';

    if (initKeyRef.current === initKey) return;
    initKeyRef.current = initKey;

    const init = async () => {
      setSelectedAppointmentState(null);
      setLoadedHistory(null);
      setAppointmentQuery('');
      setAppointmentPickerOpen(false);
      // setLoadedHistory(null);
      // setAppointmentQuery('');
      // setAppointmentPickerOpen(!editingHistory && !quoteContext?.cita);

      if (editingHistory) {
        setForm(historyToForm(editingHistory));

        let fullAppointment: Appointment | null = editingHistory.cita ?? editingHistory.Quotes ?? null;
        try {
          fullAppointment = await appointmentService.getById(editingHistory.id_cita);
        } catch { }
        mergeAppointment(fullAppointment);
        setSelectedAppointmentState(fullAppointment);

        if (editingHistory.cie10) mergeCies([editingHistory.cie10]);
        if (editingHistory.Cie10) mergeCies([editingHistory.Cie10]);

        // Usar la cita completa para obtener el paciente y cargar antecedentes
        const patientId = fullAppointment?.id_paciente;
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
        setSelectedAppointmentState(fullAppointment);
      } else if (quoteContext) {
        // Modo creación desde contexto de cita (URL)
        const ctx = quoteContext;
        mergeAppointment(ctx.cita);
        setSelectedAppointmentState(ctx.cita);
        if (ctx.cie10_historia) mergeCies([ctx.cie10_historia]);
        if (ctx.cie10_paciente) mergeCies([ctx.cie10_paciente]);
        const initialForm: ClinicalHistoryFormData = {
          ...emptyForm,
          id_cita: ctx.cita?.id ?? 0,
          id_cie: ctx.historia?.id_cie || ctx.cie10_historia?.id || ctx.cie10_paciente?.id || ctx.paciente?.id_cie || 0,
          ...(ctx.historia ? historyToForm(ctx.historia) : patientBackgroundToForm(ctx.paciente)),
          antecedentes_sincronizados: Boolean(ctx.paciente),
        };
        if (ctx.historia) setLoadedHistory(ctx.historia);
        setForm(initialForm);
        setSelectedAppointmentState(ctx.cita ?? null);
      } else {
        // Modo creación manual
        setForm(emptyForm);
      }
      setErrors({});
    };

    init();
  }, [isOpen, editingHistory, quoteContext, appointments, patients, mergePatients, mergeAppointment, mergeCies]);

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
      if (context.cie10_historia) mergeCies([context.cie10_historia]);
      if (context.cie10_paciente) mergeCies([context.cie10_paciente]);

      if (context.historia) {
        // Ya existe historia: cargar formulario completo de esa historia
        setLoadedHistory(context.historia);
        setForm(historyToForm(context.historia));
      } else {
        // Sin historia, precargar antecedentes y diagnóstico del paciente
        setLoadedHistory(null);
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
  }, [appointments, mergeAppointment, mergePatients, mergeCies]);

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
      const saved = activeHistory
        ? await historyService.update(activeHistory.id, dto)
        : await historyService.create(dto);
      toast.success(activeHistory ? 'Historia actualizada' : 'Evolución registrada');
      onSave(saved);
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!activeHistory?.id) return;
    setExporting(true);
    try {
      const blob = await historyService.exportDocument(activeHistory.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historia-clinica-${activeHistory.id}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Documento DOCX generado');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo generar el DOCX');
    } finally {
      setExporting(false);
    }
  };


  const filteredAppointments = useMemo(() => {
    const normalizedQuery = appointmentQuery.trim().toLowerCase();
    if (!normalizedQuery) return appointments.slice(0, 8);
    return appointments.filter((appointment) => {
      const label = [
        appointment.id,
        appointment.paciente_nombre,
        appointment.paciente,
        appointment.num_doc_paciente,
        appointment.profesional_nombre,
        appointment.profesional,
        appointment.fecha,
        appointment.motivo,
        appointment.observaciones,
      ].filter(Boolean).join(' ').toLowerCase();
      return label.includes(normalizedQuery);
    }).slice(0, 12);
  }, [appointmentQuery, appointments]);

  // const selectAppointment = (appointmentId: number) => {
  //   updateField('id_cita', appointmentId);
  //   setAppointmentPickerOpen(false);
  //   if (!editingHistory) hydrateBackgroundFromAppointment(appointmentId);
  // };

  const selectedAppointment = selectedAppointmentState;
  // appointments.find(a => a.id === form.id_cita)
  //   ?? quoteContext?.cita
  //   ?? editingHistory?.cita
  //   ?? editingHistory?.Quotes
  //   ?? loadedHistory?.cita
  //   ?? loadedHistory?.Quotes
  //   ?? null;

  // Pre-cargar filtros para el modal de búsqueda
  const selectedPatientId = selectedAppointment?.id_paciente ?? undefined;
  const selectedProfessionalId = selectedAppointment?.id_profesional ?? undefined;


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={activeHistory ? 'Editar Historia Clínica' : 'Nueva Evolución'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {quoteContext && (
          <Alert
            type="info"
            title={quoteContext.tiene_historia ? 'Historia existente encontrada' : 'Cita lista para crear historia'}
            message="Información precargada desde la cita"
          />
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Cita *</label>
                {selectedAppointment ? (
                  <div className="flex items-center gap-2 p-2 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex-1">
                      <p className="font-bold text-teal-900">#{selectedAppointment.id} - {selectedAppointment.paciente}-  {selectedAppointment.num_doc_paciente}</p>
                      <p className="text-xs text-teal-700">{selectedAppointment.fecha} {selectedAppointment.horario_inicio?.slice(0, 5)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setAppointmentSearchOpen(true)}>Cambiar</Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setAppointmentSearchOpen(true)} className="w-full">
                    <Search className="w-4 h-4 mr-2" /> Buscar cita
                  </Button>
                )}
                {errors.id_cita && <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{errors.id_cita}</p>}
              </div>
              <Cie10SearchField
                label="Diagnostico CIE10 *"
                value={form.id_cie || ''}
                initialCie={cie10List.find(c => c.id === form.id_cie) ?? quoteContext?.cie10_historia ?? quoteContext?.cie10_paciente ?? null}
                onChange={(cieId) => updateField('id_cie', cieId ? Number(cieId) : 0)}
                onResults={mergeCies}
                error={errors.id_cie}
              />
            </div>

            {selectedAppointment && (
              <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 text-sm text-teal-900">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-bold">Cita #{selectedAppointment.id} - {selectedAppointment.fecha?.split('T')[0]} {selectedAppointment.horario_inicio?.slice(0, 5)}</p>
                  {activeHistory && <Badge variant="info">Historia existente</Badge>}
                </div>
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
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          {activeHistory?.id && (
            <Button type="button" variant="outline" onClick={handleExport} isLoading={exporting}>
              <Download className="mr-2 h-4 w-4" />
              Exportar DOCX
            </Button>
          )}
          <Button type="submit" isLoading={saving}>{activeHistory ? 'Actualizar Historia' : 'Registrar Evolución'}</Button>
        </div>
      </form>

      {/* ✅ Ahora SÍ está dentro del Modal pero fuera del form */}
      <AppointmentSearchModal
        isOpen={appointmentSearchOpen}
        onClose={() => setAppointmentSearchOpen(false)}
        onSelect={(appointment) => {
          mergeAppointment(appointment);
          setSelectedAppointmentState(appointment); 
          updateField('id_cita', appointment.id);
          if (!editingHistory) hydrateBackgroundFromAppointment(appointment.id);
          setAppointmentSearchOpen(false);
        }}
        defaultPatientId={selectedPatientId}
        defaultProfessionalId={selectedProfessionalId}
      />
    </Modal>
  );
}
