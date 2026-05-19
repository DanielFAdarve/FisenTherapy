// ============================================================
// FISENT - ZOD VALIDATION SCHEMAS (sincronizados con reglas de negocio)
// ============================================================
import { z } from 'zod';

const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());

// --- Auth ---
export const loginSchema = z.object({
  username: z.string().min(3, 'Usuario mínimo 3 caracteres'),
  password: z.string().min(4, 'Contraseña mínimo 4 caracteres'),
});


export const patientSchema = z.object({
  tipo_doc: z.enum(['CC', 'TI', 'CE', 'PA', 'NIT'] as const, {
    message: 'Tipo de documento obligatorio',
  }),

  num_doc: z
    .string()
    .min(4, 'Documento mínimo 4 caracteres')
    .max(20, 'Documento máximo 20 caracteres'),

  nombre: z
    .string()
    .min(2, 'Nombres obligatorios (mín. 2)')
    .max(100, 'Máximo 100 caracteres'),

  apellido: z
    .string()
    .min(2, 'Apellidos obligatorios (mín. 2)')
    .max(100, 'Máximo 100 caracteres'),

  fecha_nacimiento: z.string().refine((val) => {
    const d = new Date(val);
    return d instanceof Date && !isNaN(d.getTime()) && d < new Date();
  }, 'Fecha de nacimiento inválida o futura'),

  telefono: z
    .string()
    .min(7, 'Teléfono mínimo 7 dígitos')
    .max(15, 'Teléfono máximo 15 dígitos'),

  telefono_secundario: z
    .string()
    .min(7, 'Teléfono secundario mínimo 7 dígitos')
    .max(15, 'Teléfono secundario máximo 15 dígitos')
    .optional()
    .or(z.literal('')),

  email: z
    .union([
      z.string().email('Email inválido'),
      z.literal(''),
    ])
    .optional(),

  direccion: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),

  genero: z
    .enum(['M', 'F', 'O'] as const, {
      message: 'Género inválido',
    })
    .optional()
    .default('O'),

  zona: z
    .enum(['U', 'R'] as const, {
      message: 'Zona inválida',
    })
    .optional()
    .default('U'),

  procedencia: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional()
    .or(z.literal('')),

  ocupacion: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional()
    .or(z.literal('')),

  eps: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional()
    .or(z.literal('')),

  regimen: z
    .string()
    .max(50, 'Máximo 50 caracteres')
    .optional()
    .or(z.literal('')),

  modalidad_deportiva: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional()
    .or(z.literal('')),

  red_apoyo: z.boolean().optional(),

  antecedentes: z
    .string()
    .optional()
    .default('Sin antecedentes registrados'),

  antecedentes_personales: z
    .string()
    .optional()
    .or(z.literal('')),

  antecedentes_patologicos: z
    .string()
    .optional()
    .or(z.literal('')),

  antecedentes_quirurgicos: z
    .string()
    .optional()
    .or(z.literal('')),

  antecedentes_traumaticos: z
    .string()
    .optional()
    .or(z.literal('')),

  antecedentes_farmacologicos: z
    .string()
    .optional()
    .or(z.literal('')),

  antecedentes_familiares: z
    .string()
    .optional()
    .or(z.literal('')),

  antecedentes_sociales: z
    .string()
    .optional()
    .or(z.literal('')),

  id_cie: z.number().nullable().optional(),
});

// --- Paquete asignado al paciente ---
export const packageSchema = z.object({
  id_pacientes: z.number().min(1, 'Seleccione un paciente'),
  id_paquetes_atenciones: z.number().min(1, 'Seleccione un tipo de paquete'),
  id_profesional: z.number().min(1, 'Seleccione un profesional'),
  id_cie_secundario: z.number().nullable().optional(),
  id_estado_citas: z.number().optional().default(1),
});

// --- Cita ---
export const appointmentSchema = z.object({
  id_paciente: z.number().min(1, 'Seleccione un paciente'),
  id_profesional: z.number().min(1, 'Seleccione un profesional'),
  id_paquete: z.number().nullable().refine((value) => Boolean(value), 'Seleccione o cree un paquete para la cita'),
  fecha: z.string().refine((val) => {
    return isValidDateOnly(val) && val >= localDateString();
  }, 'La fecha debe ser hoy o posterior'),
  horario_inicio: z.string().refine(
    (val) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(val),
    'Horario inválido (HH:MM)'
  ),
  horario_fin: z.string().refine(
    (val) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(val),
    'Horario inválido (HH:MM)'
  ),
  observaciones: z.string().max(500).optional().or(z.literal('')),
}).refine((data) => {
  const start = data.horario_inicio;
  const end = data.horario_fin;
  return end > start;
}, { message: 'Horario fin debe ser posterior a inicio', path: ['horario_fin'] });

// --- Historia Clínica ---
export const clinicalHistorySchema = z.object({
  id_cita: z.number().min(1, 'Seleccione una cita'),
  id_cie: z.number().min(1, 'Seleccione un diagnóstico CIE10'),
  evolucion: z.string().max(2000).optional().or(z.literal('')),
  descripcion_estado_paciente: z.string().max(2000).optional().or(z.literal('')),
  subjetivo: z.string().max(2000).optional().or(z.literal('')),
  objetivo: z.string().max(2000).optional().or(z.literal('')),
  intervencion: z.string().max(2000).optional().or(z.literal('')),
  recomendaciones: z.string().max(2000).optional().or(z.literal('')),
  antecedentes: z.string().max(2000).optional().or(z.literal('')),
  antecedentes_personales: z.string().max(2000).optional().or(z.literal('')),
  antecedentes_patologicos: z.string().max(2000).optional().or(z.literal('')),
  antecedentes_quirurgicos: z.string().max(2000).optional().or(z.literal('')),
  antecedentes_traumaticos: z.string().max(2000).optional().or(z.literal('')),
  antecedentes_farmacologicos: z.string().max(2000).optional().or(z.literal('')),
  antecedentes_familiares: z.string().max(2000).optional().or(z.literal('')),
  antecedentes_sociales: z.string().max(2000).optional().or(z.literal('')),
  antecedentes_sincronizados: z.boolean().optional(),
}).refine((data) => (
  Boolean(data.evolucion?.trim()) ||
  Boolean(data.descripcion_estado_paciente?.trim()) ||
  Boolean(data.subjetivo?.trim()) ||
  Boolean(data.objetivo?.trim()) ||
  Boolean(data.intervencion?.trim()) ||
  Boolean(data.recomendaciones?.trim())
), { message: 'Registre al menos una evolución o campo clínico', path: ['evolucion'] });

// --- CIE10 ---
export const cie10Schema = z.object({
  codigo: z.string().min(3, 'Código CIE10 mínimo 3 caracteres').max(10).regex(
    /^[A-Z]\d{2}(\.\d{1,2})?$/,
    'Formato CIE10: A00.0 o A00'
  ),
  descripcion: z.string().min(5, 'Descripción mínimo 5 caracteres').max(300),
});

// --- Pago ---
export const paymentSchema = z.object({
  id_paquete: z.number().nullable().optional(),
  id_cita: z.number().nullable().optional(),
  tipo: z.enum(['PAQUETE', 'CITA'] as const).optional(),
  valor: z.number().min(1, 'El valor debe ser mayor a 0'),
  metodo_pago: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA'] as const, { message: 'Método de pago obligatorio' }),
  fecha_pago: z.string().refine((val) => {
    const d = new Date(val);
    return d instanceof Date && !isNaN(d.getTime());
  }, 'Fecha de pago inválida'),
  observaciones: z.string().max(500).optional().or(z.literal('')),
}).refine((data) => {
  if (data.tipo === 'PAQUETE' && !data.id_paquete) return false;
  if (data.tipo === 'CITA' && !data.id_cita) return false;
  if (!data.tipo && !data.id_paquete && !data.id_cita) return false;
  return true;
}, { message: 'Debe seleccionar paquete o cita coherente con el tipo de pago' });

// --- Infer types ---
export type LoginFormData = z.infer<typeof loginSchema>;
export type PatientFormData = z.infer<typeof patientSchema>;
export type PackageFormData = z.infer<typeof packageSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type ClinicalHistoryFormData = z.infer<typeof clinicalHistorySchema>;
export type Cie10FormData = z.infer<typeof cie10Schema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
