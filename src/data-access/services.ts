// ============================================================
// FISENT - API SERVICES (fuertemente tipados por endpoint)
// ============================================================
import api from './api';
import { buildQueryParams, fallbackPagination } from './pagination';
import {
  BackendResponse,
  LoginRequest, LoginResponse,
  Patient, PatientCreateDTO, PatientUpdateDTO,
  Package as FisentPackage, PackageCreateDTO,
  Professional,
  Appointment, AppointmentCreateDTO, AppointmentUpdateDTO,
  ClinicalHistory, ClinicalHistoryCreateDTO,
  Cie10, Cie10CreateDTO,
  Payment, PaymentCreateDTO, PaymentSummary,
  PaginationParams, PaginatedResult,
} from '../domain/models';

// --- Auth Service ---
export const authService = {
  login: async (data: LoginRequest) => {
    // Login es una excepción documentada: retorna { token } sin envelope BackendResponse.
    const res = await api.post<LoginResponse>('/auth/login', data);
    return res.data;
  },
};

// --- Patient Service ---
export const patientService = {
  getPaginated: async (params: PaginationParams = {}, signal?: AbortSignal): Promise<PaginatedResult<Patient>> => {
    const query = buildQueryParams(params);
    const res = await api.get<BackendResponse<Patient[]>>(`/patient/get-patients?${query}`, { signal });

    return {
      data: res.data.response,
      pagination: res.data.pagination ?? fallbackPagination(res.data.response, params.page, params.limit),
    };
  },
  getAll: async (search?: string, page = 1, limit = 20) => {
    const result = await patientService.getPaginated({ search, page, limit });
    return result.data;
  },
  getById: async (id: number) => {
    const res = await api.get<BackendResponse<Patient>>(`/patient/get-patient/${id}`);
    return res.data.response;
  },
  getByDocument: async (documentNumber: string) => {
    const res = await api.get<BackendResponse<Patient>>(`/patient/get-patient-by-doc/${documentNumber}`);
    return res.data.response;
  },
  create: async (data: PatientCreateDTO) => {
    const res = await api.post<BackendResponse<Patient>>('/patient/create-patient', data);
    return res.data.response;
  },
  update: async (data: PatientUpdateDTO) => {
    const { id, ...rest } = data;
    const res = await api.put<BackendResponse<Patient>>(`/patient/update-patient/${id}`, rest);
    return res.data.response;
  },
  delete: async (id: number) => {
    const res = await api.delete<BackendResponse<null>>(`/patient/delete-patient/${id}`);
    return res.data;
  },
};

// --- Package Service ---
export const packageService = {
  getAll: async () => {
    const res = await api.get<BackendResponse<FisentPackage[]>>('/packages/get-packages');
    return res.data.response;
  },
  getByPatient: async (idPaciente: number) => {
    const res = await api.get<BackendResponse<FisentPackage[]>>(`/packages/get-by-patient/${idPaciente}`);
    return res.data.response;
  },
  getById: async (id: number) => {
    const res = await api.get<BackendResponse<FisentPackage>>(`/packages/get/${id}`);
    return res.data.response;
  },
  create: async (data: PackageCreateDTO) => {
    const res = await api.post<BackendResponse<FisentPackage>>('/packages/create', data);
    return res.data.response;
  },
  close: async (id: number) => {
    const res = await api.put<BackendResponse<FisentPackage>>(`/packages/close/${id}`);
    return res.data.response;
  },
};

// --- Professional Service ---
export const professionalService = {
  getAll: async () => {
    const res = await api.get<BackendResponse<Professional[]>>('/professionals/get-all');
    return res.data.response;
  },
};

// --- Appointment Service ---
export const appointmentService = {
  getAll: async (fecha?: string, idProfesional?: number, idPaciente?: number) => {
    const res = await api.get<BackendResponse<Appointment[]>>('/quotes/all');
    const appointments = res.data.response;

    return appointments.filter((appointment) => {
      const appointmentDate = appointment.fecha?.split('T')[0] ?? (appointment as any).fecha_agendamiento?.split('T')[0];
      const byDate = !fecha || appointmentDate === fecha;
      const byProfessional = !idProfesional || appointment.id_profesional === idProfesional;
      const byPatient = !idPaciente || appointment.id_paciente === idPaciente;
      return byDate && byProfessional && byPatient;
    });
  },
  getByPackage: async (idPackage: number) => {
    const res = await api.get<BackendResponse<Appointment[]>>(`/quotes/get-by-package/${idPackage}`);
    return res.data.response;
  },
  create: async (data: AppointmentCreateDTO) => {
    const res = await api.post<BackendResponse<Appointment>>('/quotes/create', data);
    return res.data.response;
  },
  update: async (data: AppointmentUpdateDTO) => {
    const { id, ...rest } = data;
    const res = await api.put<BackendResponse<Appointment>>(`/quotes/${id}`, rest);
    return res.data.response;
  },
  cancel: async (id: number) => {
    const res = await api.delete<BackendResponse<Appointment>>(`/quotes/${id}`);
    return res.data.response;
  },
  checkAvailability: async (idProfesional: number, date: string) => {
    const res = await api.get<BackendResponse<Appointment[]>>(`/quotes/availability/${idProfesional}?date=${encodeURIComponent(date)}`);
    return res.data.response;
  },
  checkCollision: async (fecha: string, idProfesional: number, horarioInicio: string, horarioFin: string) => {
    const appointments = await appointmentService.checkAvailability(idProfesional, fecha);
    return {
      collision: appointments.some((appointment) => appointment.horario_inicio < horarioFin && appointment.horario_fin > horarioInicio),
      appointments,
    };
  },
};

// --- Clinical History Service ---
export const historyService = {
  getByAppointment: async (idCita: number) => {
    const res = await api.get<BackendResponse<ClinicalHistory[]>>(`/history/get-by-quote/${idCita}`);
    return res.data.response;
  },
  getByPatient: async (idPaciente: number) => {
    const appointments = await appointmentService.getAll(undefined, undefined, idPaciente);
    const histories = await Promise.all(
      appointments.map((appointment) => historyService.getByAppointment(appointment.id).catch(() => []))
    );
    return histories.flat();
  },
  create: async (data: ClinicalHistoryCreateDTO) => {
    const res = await api.post<BackendResponse<ClinicalHistory>>('/history/create', data);
    return res.data.response;
  },
  update: async (id: number, data: Partial<ClinicalHistoryCreateDTO>) => {
    const res = await api.put<BackendResponse<ClinicalHistory>>(`/history/update/${id}`, data);
    return res.data.response;
  },
  exportDocument: async (id: number) => {
    const res = await api.get<Blob>(`/history/export-pdf/${id}`, { responseType: 'blob' });
    return res.data;
  },
};

// --- CIE10 Service ---
export const cie10Service = {
  getAll: async (search?: string) => {
    const params = new URLSearchParams();
    if (search?.trim()) params.set('q', search.trim());
    const query = params.toString();
    const res = await api.get<BackendResponse<Cie10[]>>(`/cie10/all${query ? `?${query}` : ''}`);
    return res.data.response;
  },
  create: async (data: Cie10CreateDTO) => {
    const res = await api.post<BackendResponse<Cie10>>('/cie10/create', data);
    return res.data.response;
  },
  update: async (id: number, data: Partial<Cie10CreateDTO>) => {
    const res = await api.put<BackendResponse<Cie10>>(`/cie10/${id}`, data);
    return res.data.response;
  },
};

// --- Payment Service ---
export const paymentService = {
  getAll: async (idPaquete?: number, idCita?: number) => {
    const res = await api.get<BackendResponse<Payment[]>>('/payments/');
    return res.data.response.filter((payment) => {
      const byPackage = !idPaquete || payment.id_paquete === idPaquete;
      const byAppointment = !idCita || payment.id_cita === idCita;
      return byPackage && byAppointment;
    });
  },
  create: async (data: PaymentCreateDTO) => {
    const res = await api.post<BackendResponse<Payment>>('/payments/', data);
    return res.data.response;
  },
  getSummary: async (idPaquete?: number, idCita?: number) => {
    if (idPaquete) {
      const res = await api.get<BackendResponse<PaymentSummary>>(`/payments/package-summary/${idPaquete}`);
      return res.data.response;
    }

    const payments = await paymentService.getAll(undefined, idCita);
    const abonado = payments.reduce((sum, payment) => sum + Number(payment.valor || 0), 0);
    return {
      total: abonado,
      abonado,
      saldo: 0,
      estado: abonado > 0 ? 'PAGADO' : 'PENDIENTE',
    } satisfies PaymentSummary;
  },
  getPackageAllSummary: async (idPaquete: number) => {
    const res = await api.get<BackendResponse<PaymentSummary & { pagos: Payment[] }>>(`/payments/package-all-summary/${idPaquete}`);
    return res.data.response;
  },
};
