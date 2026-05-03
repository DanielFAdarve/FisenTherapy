// ============================================================
// FISENT - CONTRATOS TYPESCRIPT ESTRICTOS (Domain Models)
// ============================================================

// --- Respuesta Backend Normalizada ---
export interface BackendResponse<T = unknown> {
  status: number;
  message: string;
  response: T;
}

// --- Auth ---
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  nombre: string;
  rol: string;
}

// --- Pacientes ---
export type TipoDocumento = 'CC' | 'TI' | 'CE' | 'PA' | 'NIT';

export interface Patient {
  id: number;
  tipo_doc: TipoDocumento;
  num_doc: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  telefono: string;
  email: string;
  direccion: string;
  antecedentes: string;
  id_cie?: number | null;
  estado: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientCreateDTO {
  tipo_doc: TipoDocumento;
  num_doc: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  telefono: string;
  email?: string;
  direccion?: string;
  antecedentes?: string;
  id_cie?: number | null;
}

export interface PatientUpdateDTO extends Partial<PatientCreateDTO> {
  id: number;
}

// --- Paquetes ---
export type PackageType = 'REHABILITACION' | 'TERAPIA' | 'EVALUACION' | 'MANTENIMIENTO';
export type PackageStatus = 'ACTIVO' | 'CERRADO' | 'CANCELADO';

export interface Package {
  id: number;
  id_paciente: number;
  tipo_paquete: PackageType;
  nombre: string;
  cantidad_sesiones: number;
  sesiones_realizadas: number;
  estado: PackageStatus;
  fecha_inicio: string;
  fecha_fin?: string | null;
  created_at: string;
  updated_at: string;
  paciente?: Patient;
}

export interface PackageCreateDTO {
  id_paciente: number;
  tipo_paquete: PackageType;
  nombre: string;
  cantidad_sesiones: number;
  fecha_inicio: string;
}

// --- Profesionales ---
export interface Professional {
  id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  telefono: string;
  email: string;
  estado: boolean;
}

// --- Citas ---
export type AppointmentStatus = 'PROGRAMADA' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';

export interface Appointment {
  id: number;
  id_paciente: number;
  id_profesional: number;
  id_paquete?: number | null;
  fecha: string;
  horario_inicio: string;
  horario_fin: string;
  numero_sesion?: number | null;
  estado: AppointmentStatus;
  observaciones: string;
  created_at: string;
  updated_at: string;
  paciente?: Patient;
  profesional?: Professional;
  paquete?: Package;
}

export interface AppointmentCreateDTO {
  id_paciente: number;
  id_profesional: number;
  id_paquete?: number | null;
  fecha: string;
  horario_inicio: string;
  horario_fin: string;
  observaciones?: string;
}

export interface AppointmentUpdateDTO extends Partial<AppointmentCreateDTO> {
  id: number;
}

// --- Historia Clínica ---
export interface ClinicalHistory {
  id: number;
  id_cita: number;
  id_cie: number;
  evolucion: string;
  antecedentes_sincronizados: boolean;
  created_at: string;
  updated_at: string;
  cita?: Appointment;
  cie10?: Cie10;
}

export interface ClinicalHistoryCreateDTO {
  id_cita: number;
  id_cie: number;
  evolucion: string;
  antecedentes_sincronizados?: boolean;
}

// --- CIE10 ---
export interface Cie10 {
  id: number;
  codigo: string;
  descripcion: string;
  estado: boolean;
}

export interface Cie10CreateDTO {
  codigo: string;
  descripcion: string;
}

// --- Pagos ---
export type PaymentType = 'PAQUETE' | 'CITA';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'NEQUI' | 'DAVIPLATA';

export interface Payment {
  id: number;
  id_paquete?: number | null;
  id_cita?: number | null;
  tipo: PaymentType;
  valor: number;
  metodo_pago: PaymentMethod;
  fecha_pago: string;
  observaciones: string;
  created_at: string;
}

export interface PaymentCreateDTO {
  id_paquete?: number | null;
  id_cita?: number | null;
  tipo?: PaymentType;
  valor: number;
  metodo_pago: PaymentMethod;
  fecha_pago: string;
  observaciones?: string;
}

export interface PaymentSummary {
  total: number;
  abonado: number;
  saldo: number;
  estado: 'PAGADO' | 'PENDIENTE' | 'ABONADO';
}

// --- UI Helpers ---
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface FormFieldError {
  field: string;
  message: string;
}
