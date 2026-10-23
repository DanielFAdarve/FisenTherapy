import { FormEvent, useEffect, useRef, useState } from 'react';
import { Activity, Download, Dumbbell, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Appointment,
  Cie10,
  ClinicalHistory,
  TrainingExercise,
  TrainingExerciseGroup,
  TrainingSessionHistory,
  TrainingSessionHistoryDTO,
} from '../../../domain/models';
import { trainingSessionHistoryService } from '../../../data-access/services';
import { Alert, Badge, Button, Input, Textarea } from '../../../components/ui/Components';
import { Cie10SearchField } from '../../../components/Cie10SearchField';

interface AgentsBiofisicos {
  tens: {
    convencional: boolean;
    burst: boolean;
    fortalecimiento: boolean;
    intensidad_ma: number | null;
  };
  ultrasonido: {
    continuo: boolean;
    pulsado: boolean;
    porcentaje: number | null;
    w_cm2: number | null;
    tiempo_min: number | null;
  };
  termoterapia: {
    calor_superficial: boolean;
    crioterapia: boolean;
    tiempo_min: number | null;
  };
  otros: {
    laser: boolean;
    magneto: boolean;
    ondas_choque: boolean;
  };
}

interface TrainingSessionFormState {
  id_cie: number | '';
  fecha_evolucion: string;
  objetivo_sesion: string;
  grupos_ejercicios: TrainingExerciseGroup[];
  agentes_biofisicos: AgentsBiofisicos;
  notas_ejercicios: string;
  notas_agentes_biofisicos: string;
  tiempo_total_ejercicio_minutos: number | null;
  carga_total_levantada_kg: number | null;
  dolor_pre_sesion: number | null;
  dolor_post_sesion: number | null;
  respuesta_inmediata: {
    fatiga_controlada: boolean;
    dolor_durante_ejecucion: boolean;
    mejora_tecnica: boolean;
  };
  recomendaciones_sesion: string[];
  observaciones_generales: string;
}

interface TrainingSessionFormProps {
  isOpen: boolean;
  appointment: Appointment;
  initialHistory: ClinicalHistory | null;
  initialCie: Cie10 | null;
  onCieResults: (cies: Cie10[]) => void;
  onChangeAppointment: () => void;
  onCancel: () => void;
  onSave: (history: TrainingSessionHistory) => void;
}

const emptyAgents: AgentsBiofisicos = {
  tens: { convencional: false, burst: false, fortalecimiento: false, intensidad_ma: null },
  ultrasonido: { continuo: false, pulsado: false, porcentaje: null, w_cm2: null, tiempo_min: null },
  termoterapia: { calor_superficial: false, crioterapia: false, tiempo_min: null },
  otros: { laser: false, magneto: false, ondas_choque: false },
};

const emptyExercise = (): TrainingExercise => ({
  ejercicio: '',
  series: null,
  repeticiones: null,
  carga_kg: null,
  observaciones: '',
});

const emptyForm = (cieId: number | '' = ''): TrainingSessionFormState => ({
  id_cie: cieId,
  fecha_evolucion: '',
  objetivo_sesion: '',
  grupos_ejercicios: [],
  agentes_biofisicos: emptyAgents,
  notas_ejercicios: '',
  notas_agentes_biofisicos: '',
  tiempo_total_ejercicio_minutos: null,
  carga_total_levantada_kg: null,
  dolor_pre_sesion: null,
  dolor_post_sesion: null,
  respuesta_inmediata: {
    fatiga_controlada: false,
    dolor_durante_ejecucion: false,
    mejora_tecnica: false,
  },
  recomendaciones_sesion: [],
  observaciones_generales: '',
});

const toOptionalNumber = (value: string): number | null => {
  if (value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asBoolean = (value: unknown) => value === true;

function normalizeAgents(value: Record<string, unknown> | undefined): AgentsBiofisicos {
  const tens = (value?.tens ?? {}) as Record<string, unknown>;
  const ultrasound = (value?.ultrasonido ?? {}) as Record<string, unknown>;
  const thermal = (value?.termoterapia ?? {}) as Record<string, unknown>;
  const others = (value?.otros ?? {}) as Record<string, unknown>;

  return {
    tens: {
      convencional: asBoolean(tens.convencional),
      burst: asBoolean(tens.burst),
      fortalecimiento: asBoolean(tens.fortalecimiento),
      intensidad_ma: toOptionalNumber(String(tens.intensidad_ma ?? '')),
    },
    ultrasonido: {
      continuo: asBoolean(ultrasound.continuo),
      pulsado: asBoolean(ultrasound.pulsado),
      porcentaje: toOptionalNumber(String(ultrasound.porcentaje ?? '')),
      w_cm2: toOptionalNumber(String(ultrasound.w_cm2 ?? '')),
      tiempo_min: toOptionalNumber(String(ultrasound.tiempo_min ?? '')),
    },
    termoterapia: {
      calor_superficial: asBoolean(thermal.calor_superficial),
      crioterapia: asBoolean(thermal.crioterapia),
      tiempo_min: toOptionalNumber(String(thermal.tiempo_min ?? '')),
    },
    otros: {
      laser: asBoolean(others.laser),
      magneto: asBoolean(others.magneto),
      ondas_choque: asBoolean(others.ondas_choque),
    },
  };
}

function historyToForm(history: TrainingSessionHistory, fallbackCie: number | ''): TrainingSessionFormState {
  return {
    ...emptyForm(history.id_cie || fallbackCie),
    id_cie: history.id_cie || fallbackCie,
    fecha_evolucion: history.fecha_evolucion?.slice(0, 10) ?? '',
    objetivo_sesion: history.objetivo_sesion ?? '',
    grupos_ejercicios: history.grupos_ejercicios.map((group) => ({
      grupo: group.grupo ?? '',
      ejercicios: (group.ejercicios ?? []).map((exercise) => ({
        ejercicio: exercise.ejercicio ?? '',
        series: exercise.series ?? null,
        repeticiones: exercise.repeticiones ?? null,
        carga_kg: exercise.carga_kg ?? null,
        observaciones: exercise.observaciones ?? '',
      })),
    })),
    agentes_biofisicos: normalizeAgents(history.agentes_biofisicos),
    notas_ejercicios: history.notas_ejercicios ?? '',
    notas_agentes_biofisicos: history.notas_agentes_biofisicos ?? '',
    tiempo_total_ejercicio_minutos: history.tiempo_total_ejercicio_minutos ?? null,
    carga_total_levantada_kg: history.carga_total_levantada_kg ?? null,
    dolor_pre_sesion: history.dolor_pre_sesion ?? null,
    dolor_post_sesion: history.dolor_post_sesion ?? null,
    respuesta_inmediata: {
      fatiga_controlada: asBoolean(history.respuesta_inmediata.fatiga_controlada),
      dolor_durante_ejecucion: asBoolean(history.respuesta_inmediata.dolor_durante_ejecucion),
      mejora_tecnica: asBoolean(history.respuesta_inmediata.mejora_tecnica),
    },
    recomendaciones_sesion: history.recomendaciones_sesion.filter(Boolean),
    observaciones_generales: history.observaciones_generales ?? '',
  };
}

export function TrainingSessionForm({
  isOpen,
  appointment,
  initialHistory,
  initialCie,
  onCieResults,
  onChangeAppointment,
  onCancel,
  onSave,
}: TrainingSessionFormProps) {
  const [form, setForm] = useState<TrainingSessionFormState>(() => emptyForm(initialCie?.id ?? ''));
  const [history, setHistory] = useState<TrainingSessionHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const initializationKey = useRef('');

  useEffect(() => {
    if (!isOpen) {
      initializationKey.current = '';
      return;
    }

    const key = `${appointment.id}:${initialHistory?.id ?? 'new'}`;
    if (initializationKey.current === key) return;
    initializationKey.current = key;
    const fallbackCie = initialHistory?.id_cie || initialCie?.id || '';

    if (!initialHistory?.id) {
      setHistory(null);
      setForm(emptyForm(fallbackCie));
      setError('');
      return;
    }

    setLoadingHistory(true);
    setError('');
    trainingSessionHistoryService.getById(initialHistory.id)
      .then((loaded) => {
        setHistory(loaded);
        setForm(historyToForm(loaded, fallbackCie));
        const cie = loaded.cie10 ?? loaded.Cie10;
        if (cie) onCieResults([cie]);
      })
      .catch((err: any) => setError(err?.message || 'No se pudo cargar la sesión de entrenamiento.'))
      .finally(() => setLoadingHistory(false));
  }, [appointment.id, initialCie?.id, initialHistory?.id, isOpen, onCieResults]);

  const updateForm = <K extends keyof TrainingSessionFormState>(field: K, value: TrainingSessionFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const updateGroup = (groupIndex: number, field: 'grupo', value: string) => {
    setForm((current) => ({
      ...current,
      grupos_ejercicios: current.grupos_ejercicios.map((group, index) => (
        index === groupIndex ? { ...group, [field]: value } : group
      )),
    }));
  };

  const updateExercise = (groupIndex: number, exerciseIndex: number, field: keyof TrainingExercise, value: string | number | null) => {
    setForm((current) => ({
      ...current,
      grupos_ejercicios: current.grupos_ejercicios.map((group, currentGroupIndex) => {
        if (currentGroupIndex !== groupIndex) return group;
        return {
          ...group,
          ejercicios: group.ejercicios.map((exercise, currentExerciseIndex) => (
            currentExerciseIndex === exerciseIndex ? { ...exercise, [field]: value } : exercise
          )),
        };
      }),
    }));
  };

  const addGroup = () => updateForm('grupos_ejercicios', [
    ...form.grupos_ejercicios,
    { grupo: '', ejercicios: [emptyExercise()] },
  ]);

  const removeGroup = (groupIndex: number) => updateForm(
    'grupos_ejercicios',
    form.grupos_ejercicios.filter((_, index) => index !== groupIndex),
  );

  const addExercise = (groupIndex: number) => {
    setForm((current) => ({
      ...current,
      grupos_ejercicios: current.grupos_ejercicios.map((group, index) => (
        index === groupIndex ? { ...group, ejercicios: [...group.ejercicios, emptyExercise()] } : group
      )),
    }));
  };

  const removeExercise = (groupIndex: number, exerciseIndex: number) => {
    setForm((current) => ({
      ...current,
      grupos_ejercicios: current.grupos_ejercicios.map((group, index) => (
        index === groupIndex
          ? { ...group, ejercicios: group.ejercicios.filter((_, itemIndex) => itemIndex !== exerciseIndex) }
          : group
      )),
    }));
  };

  const updateAgents = (section: keyof AgentsBiofisicos, field: string, value: boolean | number | null) => {
    setForm((current) => ({
      ...current,
      agentes_biofisicos: {
        ...current.agentes_biofisicos,
        [section]: { ...current.agentes_biofisicos[section], [field]: value },
      },
    }));
  };

  const updateResponse = (field: keyof TrainingSessionFormState['respuesta_inmediata'], value: boolean) => {
    updateForm('respuesta_inmediata', { ...form.respuesta_inmediata, [field]: value });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const groups = form.grupos_ejercicios.map((group) => ({
      ...group,
      grupo: group.grupo.trim(),
      ejercicios: group.ejercicios.map((exercise) => ({
        ...exercise,
        ejercicio: exercise.ejercicio.trim(),
        observaciones: exercise.observaciones?.trim() || null,
      })),
    }));

    const invalidGroup = groups.some((group) => !group.grupo || group.ejercicios.length === 0 || group.ejercicios.some((exercise) => !exercise.ejercicio));
    if (invalidGroup) {
      setError('Cada grupo debe tener un nombre y al menos un ejercicio identificado.');
      return;
    }

    const painOutOfRange = [form.dolor_pre_sesion, form.dolor_post_sesion].some((value) => value !== null && (value < 0 || value > 10));
    if (painOutOfRange) {
      setError('La escala de dolor debe estar entre 0 y 10.');
      return;
    }

    const payload: TrainingSessionHistoryDTO = {
      id_cita: appointment.id,
      ...(form.id_cie ? { id_cie: form.id_cie } : {}),
      ...(form.fecha_evolucion ? { fecha_evolucion: form.fecha_evolucion } : {}),
      objetivo_sesion: form.objetivo_sesion.trim(),
      grupos_ejercicios: groups,
      agentes_biofisicos: form.agentes_biofisicos as unknown as Record<string, unknown>,
      notas_ejercicios: form.notas_ejercicios.trim(),
      notas_agentes_biofisicos: form.notas_agentes_biofisicos.trim(),
      tiempo_total_ejercicio_minutos: form.tiempo_total_ejercicio_minutos,
      carga_total_levantada_kg: form.carga_total_levantada_kg,
      dolor_pre_sesion: form.dolor_pre_sesion,
      dolor_post_sesion: form.dolor_post_sesion,
      respuesta_inmediata: form.respuesta_inmediata,
      recomendaciones_sesion: form.recomendaciones_sesion.map((item) => item.trim()).filter(Boolean),
      observaciones_generales: form.observaciones_generales.trim(),
    };

    setSaving(true);
    setError('');
    try {
      const saved = history
        ? await trainingSessionHistoryService.update(history.id, payload)
        : await trainingSessionHistoryService.create(payload);
      toast.success(history ? 'Sesión de entrenamiento actualizada' : 'Sesión de entrenamiento registrada');
      onSave(saved);
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar la sesión de entrenamiento.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!history?.id) return;
    setExporting(true);
    try {
      const blob = await trainingSessionHistoryService.exportDocument(history.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sesion-entrenamiento-${history.id}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Documento DOCX generado');
    } catch (err: any) {
      setError(err?.message || 'No se pudo generar el DOCX.');
    } finally {
      setExporting(false);
    }
  };

  const initialSelectedCie = history?.cie10 ?? history?.Cie10 ?? initialHistory?.cie10 ?? initialHistory?.Cie10 ?? initialCie;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && <Alert type="error" title="No se pudo continuar" message={error} />}

      <section className="border border-indigo-100 bg-indigo-50/50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-indigo-950">
            <Dumbbell className="h-5 w-5" />
            <div>
              <p className="font-bold">Cita #{appointment.id} · Sesión #{appointment.numero_sesion || '--'}</p>
              <p className="text-sm text-indigo-800">{appointment.paciente_nombre || appointment.paciente || 'Paciente'} · {appointment.profesional_nombre || appointment.profesional || 'Profesional'}</p>
            </div>
          </div>
          {history && <Badge variant="info">Sesión existente</Badge>}
          {!initialHistory && <Button type="button" variant="ghost" size="sm" onClick={onChangeAppointment}>Cambiar cita</Button>}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label="Fecha de evolución"
            type="date"
            value={form.fecha_evolucion}
            onChange={(event) => updateForm('fecha_evolucion', event.target.value)}
          />
          <Cie10SearchField
            label="Diagnóstico CIE10"
            value={form.id_cie}
            initialCie={initialSelectedCie}
            onChange={(cieId) => updateForm('id_cie', cieId)}
            onResults={onCieResults}
          />
        </div>
      </section>

      {loadingHistory ? (
        <div className="py-12 text-center text-sm text-gray-500">Cargando sesión de entrenamiento...</div>
      ) : (
        <>
          <Textarea
            label="Objetivo de la sesión"
            value={form.objetivo_sesion}
            onChange={(event) => updateForm('objetivo_sesion', event.target.value)}
            rows={3}
          />

          <section className="border border-gray-200 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-gray-900"><Dumbbell className="h-4 w-4 text-indigo-600" /><h3 className="font-bold">Ejercicios realizados</h3></div>
              <Button type="button" size="sm" variant="outline" onClick={addGroup}><Plus className="mr-1 h-3.5 w-3.5" />Agregar grupo</Button>
            </div>

            <div className="space-y-4">
              {form.grupos_ejercicios.map((group, groupIndex) => (
                <div key={groupIndex} className="border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-3 flex items-end gap-2">
                    <Input label="Grupo de ejercicios" value={group.grupo} onChange={(event) => updateGroup(groupIndex, 'grupo', event.target.value)} />
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeGroup(groupIndex)} title="Eliminar grupo"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-3">
                    {group.ejercicios.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="grid grid-cols-1 gap-2 border-l-2 border-indigo-200 pl-3 md:grid-cols-12">
                        <div className="md:col-span-4"><Input label="Ejercicio" value={exercise.ejercicio} onChange={(event) => updateExercise(groupIndex, exerciseIndex, 'ejercicio', event.target.value)} /></div>
                        <div className="md:col-span-2"><Input label="Series" type="number" min="0" value={exercise.series ?? ''} onChange={(event) => updateExercise(groupIndex, exerciseIndex, 'series', toOptionalNumber(event.target.value))} /></div>
                        <div className="md:col-span-2"><Input label="Repeticiones" type="number" min="0" value={exercise.repeticiones ?? ''} onChange={(event) => updateExercise(groupIndex, exerciseIndex, 'repeticiones', toOptionalNumber(event.target.value))} /></div>
                        <div className="md:col-span-2"><Input label="Carga kg" type="number" min="0" step="0.1" value={exercise.carga_kg ?? ''} onChange={(event) => updateExercise(groupIndex, exerciseIndex, 'carga_kg', toOptionalNumber(event.target.value))} /></div>
                        <div className="flex items-end md:col-span-2"><Button type="button" size="sm" variant="ghost" onClick={() => removeExercise(groupIndex, exerciseIndex)} title="Eliminar ejercicio"><Trash2 className="h-4 w-4" /></Button></div>
                        <div className="md:col-span-12"><Input label="Observaciones" value={exercise.observaciones ?? ''} onChange={(event) => updateExercise(groupIndex, exerciseIndex, 'observaciones', event.target.value)} /></div>
                      </div>
                    ))}
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => addExercise(groupIndex)} className="mt-3"><Plus className="mr-1 h-3.5 w-3.5" />Agregar ejercicio</Button>
                </div>
              ))}
              {form.grupos_ejercicios.length === 0 && <p className="text-sm text-gray-500">Sin grupos de ejercicios registrados.</p>}
            </div>
            <Textarea className="mt-4" label="Notas de ejercicios" value={form.notas_ejercicios} onChange={(event) => updateForm('notas_ejercicios', event.target.value)} rows={3} />
          </section>

          <section className="border border-gray-200 p-4">
            <div className="mb-4 flex items-center gap-2 text-gray-900"><Activity className="h-4 w-4 text-indigo-600" /><h3 className="font-bold">Agentes biofísicos</h3></div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <AgentPanel title="TENS">
                <CheckField label="Convencional" checked={form.agentes_biofisicos.tens.convencional} onChange={(checked) => updateAgents('tens', 'convencional', checked)} />
                <CheckField label="Burst" checked={form.agentes_biofisicos.tens.burst} onChange={(checked) => updateAgents('tens', 'burst', checked)} />
                <CheckField label="Fortalecimiento" checked={form.agentes_biofisicos.tens.fortalecimiento} onChange={(checked) => updateAgents('tens', 'fortalecimiento', checked)} />
                <Input label="Intensidad mA" type="number" min="0" step="0.1" value={form.agentes_biofisicos.tens.intensidad_ma ?? ''} onChange={(event) => updateAgents('tens', 'intensidad_ma', toOptionalNumber(event.target.value))} />
              </AgentPanel>
              <AgentPanel title="Ultrasonido">
                <CheckField label="Continuo" checked={form.agentes_biofisicos.ultrasonido.continuo} onChange={(checked) => updateAgents('ultrasonido', 'continuo', checked)} />
                <CheckField label="Pulsado" checked={form.agentes_biofisicos.ultrasonido.pulsado} onChange={(checked) => updateAgents('ultrasonido', 'pulsado', checked)} />
                <Input label="Porcentaje" type="number" min="0" max="100" value={form.agentes_biofisicos.ultrasonido.porcentaje ?? ''} onChange={(event) => updateAgents('ultrasonido', 'porcentaje', toOptionalNumber(event.target.value))} />
                <Input label="W/cm²" type="number" min="0" step="0.1" value={form.agentes_biofisicos.ultrasonido.w_cm2 ?? ''} onChange={(event) => updateAgents('ultrasonido', 'w_cm2', toOptionalNumber(event.target.value))} />
                <Input label="Tiempo min" type="number" min="0" value={form.agentes_biofisicos.ultrasonido.tiempo_min ?? ''} onChange={(event) => updateAgents('ultrasonido', 'tiempo_min', toOptionalNumber(event.target.value))} />
              </AgentPanel>
              <AgentPanel title="Termoterapia y otros">
                <CheckField label="Calor superficial" checked={form.agentes_biofisicos.termoterapia.calor_superficial} onChange={(checked) => updateAgents('termoterapia', 'calor_superficial', checked)} />
                <CheckField label="Crioterapia" checked={form.agentes_biofisicos.termoterapia.crioterapia} onChange={(checked) => updateAgents('termoterapia', 'crioterapia', checked)} />
                <Input label="Tiempo min" type="number" min="0" value={form.agentes_biofisicos.termoterapia.tiempo_min ?? ''} onChange={(event) => updateAgents('termoterapia', 'tiempo_min', toOptionalNumber(event.target.value))} />
                <CheckField label="Láser" checked={form.agentes_biofisicos.otros.laser} onChange={(checked) => updateAgents('otros', 'laser', checked)} />
                <CheckField label="Magneto" checked={form.agentes_biofisicos.otros.magneto} onChange={(checked) => updateAgents('otros', 'magneto', checked)} />
                <CheckField label="Ondas de choque" checked={form.agentes_biofisicos.otros.ondas_choque} onChange={(checked) => updateAgents('otros', 'ondas_choque', checked)} />
              </AgentPanel>
            </div>
            <Textarea className="mt-4" label="Notas de agentes biofísicos" value={form.notas_agentes_biofisicos} onChange={(event) => updateForm('notas_agentes_biofisicos', event.target.value)} rows={3} />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="border border-gray-200 p-4">
              <h3 className="mb-3 font-bold text-gray-900">Carga y dolor</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Tiempo total min" type="number" min="0" value={form.tiempo_total_ejercicio_minutos ?? ''} onChange={(event) => updateForm('tiempo_total_ejercicio_minutos', toOptionalNumber(event.target.value))} />
                <Input label="Carga total kg" type="number" min="0" step="0.1" value={form.carga_total_levantada_kg ?? ''} onChange={(event) => updateForm('carga_total_levantada_kg', toOptionalNumber(event.target.value))} />
                <Input label="Dolor pre sesión" type="number" min="0" max="10" step="0.1" value={form.dolor_pre_sesion ?? ''} onChange={(event) => updateForm('dolor_pre_sesion', toOptionalNumber(event.target.value))} />
                <Input label="Dolor post sesión" type="number" min="0" max="10" step="0.1" value={form.dolor_post_sesion ?? ''} onChange={(event) => updateForm('dolor_post_sesion', toOptionalNumber(event.target.value))} />
              </div>
            </div>
            <div className="border border-gray-200 p-4">
              <h3 className="mb-3 font-bold text-gray-900">Respuesta inmediata</h3>
              <div className="space-y-2">
                <CheckField label="Fatiga controlada" checked={form.respuesta_inmediata.fatiga_controlada} onChange={(checked) => updateResponse('fatiga_controlada', checked)} />
                <CheckField label="Dolor durante la ejecución" checked={form.respuesta_inmediata.dolor_durante_ejecucion} onChange={(checked) => updateResponse('dolor_durante_ejecucion', checked)} />
                <CheckField label="Mejora técnica" checked={form.respuesta_inmediata.mejora_tecnica} onChange={(checked) => updateResponse('mejora_tecnica', checked)} />
              </div>
            </div>
          </section>

          <section className="border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-bold text-gray-900">Recomendaciones</h3><Button type="button" size="sm" variant="outline" onClick={() => updateForm('recomendaciones_sesion', [...form.recomendaciones_sesion, ''])}><Plus className="mr-1 h-3.5 w-3.5" />Agregar</Button></div>
            <div className="space-y-2">
              {form.recomendaciones_sesion.map((recommendation, index) => (
                <div key={index} className="flex gap-2"><Input value={recommendation} onChange={(event) => updateForm('recomendaciones_sesion', form.recomendaciones_sesion.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /><Button type="button" size="sm" variant="ghost" onClick={() => updateForm('recomendaciones_sesion', form.recomendaciones_sesion.filter((_, itemIndex) => itemIndex !== index))} title="Eliminar recomendación"><Trash2 className="h-4 w-4" /></Button></div>
              ))}
            </div>
          </section>

          <Textarea label="Observaciones generales" value={form.observaciones_generales} onChange={(event) => updateForm('observaciones_generales', event.target.value)} rows={4} />
        </>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        {history?.id && <Button type="button" variant="outline" onClick={handleExport} isLoading={exporting}><Download className="mr-2 h-4 w-4" />Exportar DOCX</Button>}
        <Button type="submit" isLoading={saving} disabled={loadingHistory || Boolean(initialHistory?.id && !history)}>{history ? 'Actualizar sesión' : 'Registrar sesión'}</Button>
      </div>
    </form>
  );
}

function AgentPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2 border border-gray-100 bg-gray-50 p-3"><h4 className="text-sm font-bold text-gray-800">{title}</h4>{children}</div>;
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-teal-600" />
      {label}
    </label>
  );
}
