// ============================================================
// FISENT - API SERVICES (fuertemente tipados por endpoint)
// ============================================================
import api from './api';
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
} from '../domain/models';

// --- Auth Service ---
export const authService = {
  login: async (data: LoginRequest) => {
  // const res = await api.post<BackendResponse<LoginResponse>>('/auth/login', data);
    const res = await api.post<LoginResponse>('/auth/login', data);
    return res.data;
  },
};

// --- Patient Service ---
export const patientService = {
    getAll: async (search?: string, page = 1, limit = 20) => {

    //Use for fet by PARAMS to search and pagination
    // const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    // if (search) params.set('search', search);
    // const res = await api.get<BackendResponse<Patient[]>>(`/patient?${params}`);
    
    const res = await api.get<BackendResponse<Patient[]>>(`/patient/get-patients`);
    if(search){
      return res.data.response.filter((p) =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.apellido.toLowerCase().includes(search.toLowerCase()) ||
        p.num_doc.includes(search)
      );
    }
    return res.data.response;
  },
  getById: async (id: number) => {
    const res = await api.get<BackendResponse<Patient>>(`/patient/${id}`);
    return res.data.response;
  },
  create: async (data: PatientCreateDTO) => {
    const res = await api.post<BackendResponse<Patient>>('/patient', data);
    return res.data.response;
  },
  update: async (data: PatientUpdateDTO) => {
    const { id, ...rest } = data;
    const res = await api.put<BackendResponse<Patient>>(`/patient/${id}`, rest);
    return res.data.response;
  },
  delete: async (id: number) => {
    const res = await api.delete<BackendResponse<null>>(`/patient/${id}`);
    return res.data;
  },
};

// --- Package Service ---
export const packageService = {
  getAll: async (idPaciente?: number) => {
    // const params = idPaciente ? `?id_paciente=${idPaciente}` : '';
    // const res = await api.get<BackendResponse<FisentPackage[]>>(`/packages${params}`);
    const res = await api.get<BackendResponse<FisentPackage[]>>(`/packages/get-packages`);
    return res.data.response;
  },
  getById: async (id: number) => {
    const res = await api.get<BackendResponse<FisentPackage>>(`/packages/${id}`);
    return res.data.response;
  },
  create: async (data: PackageCreateDTO) => {
    const res = await api.post<BackendResponse<FisentPackage>>('/packages', data);
    return res.data.response;
  },
  close: async (id: number) => {
    const res = await api.patch<BackendResponse<FisentPackage>>(`/packages/${id}/close`);
    return res.data.response;
  },
};

// --- Professional Service ---
export const professionalService = {
  getAll: async () => {
    const res = await api.get<BackendResponse<Professional[]>>('/professionals/get-all');
    return res.data.response;
  },
  getById: async (id: number) => {
    const res = await api.get<BackendResponse<Professional>>(`/professionals/${id}`);
    return res.data.response;
  },
};

// --- Appointment Service ---
export const appointmentService = {
  getAll: async (fecha?: string, idProfesional?: number, idPaciente?: number) => {
    // const params = new URLSearchParams();
    // if (fecha) params.set('fecha', fecha);
    // if (idProfesional) params.set('id_profesional', String(idProfesional));
    // if (idPaciente) params.set('id_paciente', String(idPaciente));
    // const res = await api.get<BackendResponse<Appointment[]>>(`/quotes?${params}`);
    const res = await api.get<BackendResponse<Appointment[]>>(`/quotes/all`);
    return res.data.response;
  },
  getById: async (id: number) => {
    const res = await api.get<BackendResponse<Appointment>>(`/quotes/${id}`);
    return res.data.response;
  },
  create: async (data: AppointmentCreateDTO) => {
    const res = await api.post<BackendResponse<Appointment>>('/quotes', data);
    return res.data.response;
  },
  update: async (data: AppointmentUpdateDTO) => {
    const { id, ...rest } = data;
    const res = await api.put<BackendResponse<Appointment>>(`/quotes/${id}`, rest);
    return res.data.response;
  },
  cancel: async (id: number) => {
    const res = await api.patch<BackendResponse<Appointment>>(`/quotes/${id}/cancel`);
    return res.data.response;
  },
  checkCollision: async (fecha: string, idProfesional: number, horarioInicio: string, horarioFin: string) => {
    const params = new URLSearchParams({ fecha, id_profesional: String(idProfesional), horario_inicio: horarioInicio, horario_fin: horarioFin });
    const res = await api.get<BackendResponse<{ collision: boolean; appointments: Appointment[] }>>(`/quotes/collision?${params}`);
    return res.data.response;
  },
};

// --- Clinical History Service ---
export const historyService = {
  getByAppointment: async (idCita: number) => {
    const res = await api.get<BackendResponse<ClinicalHistory>>(`/history/quote/${idCita}`);
    return res.data.response;
  },
  getByPatient: async (idPaciente: number) => {
    const res = await api.get<BackendResponse<ClinicalHistory[]>>(`/history/patient/${idPaciente}`);
    return res.data.response;
  },
  create: async (data: ClinicalHistoryCreateDTO) => {
    const res = await api.post<BackendResponse<ClinicalHistory>>('/history', data);
    return res.data.response;
  },
  update: async (id: number, data: Partial<ClinicalHistoryCreateDTO>) => {
    const res = await api.put<BackendResponse<ClinicalHistory>>(`/history/${id}`, data);
    return res.data.response;
  },
};

// --- CIE10 Service ---
export const cie10Service = {
  getAll: async (search?: string) => {
    // const params = search ? `?search=${encodeURIComponent(search)}` : '';
    // const res = await api.get<BackendResponse<Cie10[]>>(`/cie10${params}`);
    const res = await api.get<BackendResponse<Cie10[]>>(`/cie10/all`);
    return res.data.response;
  },
  create: async (data: Cie10CreateDTO) => {
    const res = await api.post<BackendResponse<Cie10>>('/cie10', data);
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
    const params = new URLSearchParams();
    if (idPaquete) params.set('id_paquete', String(idPaquete));
    if (idCita) params.set('id_cita', String(idCita));
    const res = await api.get<BackendResponse<Payment[]>>(`/payments?${params}`);
    return res.data.response;
  },
  create: async (data: PaymentCreateDTO) => {
    const res = await api.post<BackendResponse<Payment>>('/payments', data);
    return res.data.response;
  },
  getSummary: async (idPaquete?: number, idCita?: number) => {
    const params = new URLSearchParams();
    if (idPaquete) params.set('id_paquete', String(idPaquete));
    if (idCita) params.set('id_cita', String(idCita));
    const res = await api.get<BackendResponse<PaymentSummary>>(`/payments/summary?${params}`);
    return res.data.response;
  },
};
