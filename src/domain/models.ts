// ============================================================
// FISENT - CONTRATOS TYPESCRIPT ESTRICTOS (Domain Models)
// ============================================================

// --- Respuesta Backend Normalizada ---
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BackendResponse<T = unknown> {
  status: number;
  message: string;
  response: T;
  pagination?: Pagination;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination?: Pagination;
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
  id_paquetes?: number | null;
  id_estado_citas?: number | null;
  fecha: string;
  horario_inicio: string;
  horario_fin: string;
  hora_inicio?: string;
  hora_fin?: string;
  numero_sesion?: number | null;
  estado: AppointmentStatus;
  pagado?: boolean;
  motivo?: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
  paciente_nombre?: string;
  num_doc_paciente?: string;
  profesional_nombre?: string;
  apellido_profesional?: string;
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


// --- Reportes / Dashboard ---
export type ReportPeriod = 'week' | 'month' | 'quarter';

export interface ReportQueryParams {
  period?: ReportPeriod;
  startDate?: string;
  endDate?: string;
  limit?: number;
  threshold?: number;
}

export interface RevenueByMonth {
  month: string;
  amount: number;
}

export interface PaymentMethodRevenue {
  method: string;
  amount: number;
}

export interface AppointmentStatusDistribution {
  completed: number;
  scheduled: number;
  cancelled: number;
  noShow: number;
}

export interface SessionsSummary {
  completed: number;
  pending: number;
  total: number;
  completionRate: number;
}

export interface TopProfessionalReport {
  id: number;
  nombres?: string;
  apellidos?: string;
  nombre?: string;
  apellido?: string;
  appointments: number;
}

export interface PackageTypeReport {
  type: string;
  count: number;
}

export interface NearCompletionPackageReport {
  id: number;
  nombre: string;
  completionPercentage: number;
  sesionesRealizadas: number;
  cantidadSesiones: number;
  paciente?: {
    id: number;
    nombres?: string;
    apellidos?: string;
    nombre?: string;
    apellido?: string;
  };
}

export interface RecentPaymentReport {
  id: number;
  tipo: string;
  valor: number;
  metodo_pago: string;
  fecha_pago: string;
}

export interface DashboardReport {
  patients: { active: number; inactive: number; total: number };
  appointments: AppointmentStatusDistribution & { attendanceRate: number };
  sessions: SessionsSummary;
  revenue: {
    total: number;
    byMonth: RevenueByMonth[];
    byPaymentMethod: PaymentMethodRevenue[];
  };
  packages: {
    total: number;
    byType: PackageTypeReport[];
    nearCompletion: NearCompletionPackageReport[];
  };
  professionals: { top: TopProfessionalReport[] };
  recentPayments: RecentPaymentReport[];
}

// --- UI Helpers ---
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: Pagination;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface FormFieldError {
  field: string;
  message: string;
}
