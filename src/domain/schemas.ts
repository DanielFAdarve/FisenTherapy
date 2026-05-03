// ============================================================
// FISENT - ZOD VALIDATION SCHEMAS (sincronizados con reglas de negocio)
// ============================================================
import { z } from 'zod';

// --- Auth ---
export const loginSchema = z.object({
  username: z.string().min(3, 'Usuario mínimo 3 caracteres'),
  password: z.string().min(4, 'Contraseña mínimo 4 caracteres'),
});

// --- Paciente ---
export const patientSchema = z.object({
  tipo_doc: z.enum(['CC', 'TI', 'CE', 'PA', 'NIT'] as const, { message: 'Tipo de documento obligatorio' }),
  num_doc: z.string().min(4, 'Documento mínimo 4 caracteres').max(20, 'Documento máximo 20 caracteres'),
  nombres: z.string().min(2, 'Nombres obligatorios (mín. 2)').max(100),
  apellidos: z.string().min(2, 'Apellidos obligatorios (mín. 2)').max(100),
  fecha_nacimiento: z.string().refine((val) => {
    const d = new Date(val);
    return d instanceof Date && !isNaN(d.getTime()) && d < new Date();
  }, 'Fecha de nacimiento inválida o futura'),
  telefono: z.string().min(7, 'Teléfono mínimo 7 dígitos').max(15),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional(),
  direccion: z.string().max(200).optional().or(z.literal('')),
  antecedentes: z.string().optional().default('Sin antecedentes registrados'),
  id_cie: z.number().nullable().optional(),
});

// --- Paquete ---
export const packageSchema = z.object({
  id_paciente: z.number().min(1, 'Seleccione un paciente'),
  tipo_paquete: z.enum(['REHABILITACION', 'TERAPIA', 'EVALUACION', 'MANTENIMIENTO'] as const, { message: 'Tipo de paquete obligatorio' }),
  nombre: z.string().min(3, 'Nombre del paquete obligatorio').max(100),
  cantidad_sesiones: z.number().min(1, 'Mínimo 1 sesión').max(100, 'Máximo 100 sesiones'),
  fecha_inicio: z.string().refine((val) => {
    const d = new Date(val);
    return d instanceof Date && !isNaN(d.getTime());
  }, 'Fecha de inicio inválida'),
});

// --- Cita ---
export const appointmentSchema = z.object({
  id_paciente: z.number().min(1, 'Seleccione un paciente'),
  id_profesional: z.number().min(1, 'Seleccione un profesional'),
  id_paquete: z.number().nullable().optional(),
  fecha: z.string().refine((val) => {
    const d = new Date(val);
    return d instanceof Date && !isNaN(d.getTime()) && d >= new Date(new Date().toDateString());
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
  evolucion: z.string().min(10, 'Evolución mínimo 10 caracteres').max(2000),
  antecedentes_sincronizados: z.boolean().optional(),
});

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
