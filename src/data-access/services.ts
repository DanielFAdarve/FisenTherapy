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
  Cie10, Cie10CreateDTO, PackageAttentionCatalog,
  Payment, PaymentCreateDTO, PaymentSummary,
  PaginationParams, PaginatedResult, ReportQueryParams, DashboardReport, RevenueByMonth,
  AppointmentStatusDistribution, TopProfessionalReport, PackageTypeReport, NearCompletionPackageReport,
  RecentPaymentReport, SessionsSummary,
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
    const res = await api.post<BackendResponse<Patient>>('/patient/create-patient', normalizePatientPayload(data));
    return res.data.response;
  },
  update: async (data: PatientUpdateDTO) => {
    const { id, ...rest } = data;
    const res = await api.put<BackendResponse<Patient>>(`/patient/update-patient/${id}`, normalizePatientPayload(rest));
    return res.data.response;
  },
  delete: async (id: number) => {
    const res = await api.delete<BackendResponse<null>>(`/patient/delete-patient/${id}`);
    return res.data;
  },
};

// --- Package Service ---
export const packageService = {
  getCatalogPaginated: async (params: PaginationParams = {}, signal?: AbortSignal): Promise<PaginatedResult<FisentPackage>> => {
    const query = buildQueryParams(params);
    const res = await api.get<BackendResponse<PackageAttentionCatalog[]>>(`/packages/get-packages?${query}`, { signal });

    return {
      data: (res.data.response ?? []).map(normalizePackageCatalog) as unknown as FisentPackage[],
      pagination: res.data.pagination ?? fallbackPagination(res.data.response, params.page, params.limit),
    };
  },
  getCatalog: async (search?: string, page = 1, limit = 20) => {
    const result = await packageService.getCatalogPaginated({ search, page, limit });
    return result.data;
  },
  getAssignedPaginated: async (params: PaginationParams = {}, signal?: AbortSignal): Promise<PaginatedResult<FisentPackage>> => {
    const query = buildQueryParams(params);
    const res = await api.get<BackendResponse<any[]>>(`/packages/get-assigned?${query}`, { signal });
    const packages = (res.data.response ?? []).map(normalizePackage);

    return {
      data: packages,
      pagination: res.data.pagination ?? fallbackPagination(packages, params.page, params.limit),
    };
  },
  // Compatibilidad: las pantallas actuales trabajan con paquetes asignados, no con el catálogo.
  getAll: async (search?: string, page = 1, limit = 20) => {
    const result = await packageService.getAssignedPaginated({ search, page, limit });
    return result.data;
  },
  getByPatient: async (idPaciente: number) => {
    const res = await api.get<BackendResponse<any[]>>(`/packages/get-by-patient/${idPaciente}`);
    return (res.data.response ?? []).map(normalizePackage);
  },
  getAvailableByPatient: async (idPaciente: number, quoteId?: number) => {
    const query = quoteId ? `?quoteId=${encodeURIComponent(String(quoteId))}` : '';
    const res = await api.get<BackendResponse<any[]>>(`/packages/get-available-by-patient/${idPaciente}${query}`);
    return (res.data.response ?? []).map((item) => {
      const normalized = normalizePackage(item);
      return {
        ...normalized,
        id_paciente: normalized.id_paciente || idPaciente,
        id_pacientes: normalized.id_pacientes || idPaciente,
      };
    });
  },
  getById: async (id: number) => {
    const res = await api.get<BackendResponse<any>>(`/packages/get/${id}`);
    return normalizePackage(res.data.response);
  },
  create: async (data: PackageCreateDTO) => {
    try {
      const res = await api.post<BackendResponse<any>>('/packages/create', normalizePackageCreatePayload(data));
      return normalizePackage(res.data.response);
    } catch (err: any) {
      const existingPackage = err?.response?.existingPackage;
      if (existingPackage) return normalizePackage(existingPackage);
      throw err;
    }
  },
  close: async (id: number) => {
    const res = await api.put<BackendResponse<any>>(`/packages/close/${id}`);
    return normalizePackage(res.data.response);
  },
};

// --- Professional Service ---
export const professionalService = {
  getPaginated: async (params: PaginationParams = {}, signal?: AbortSignal): Promise<PaginatedResult<Professional>> => {
    const query = buildQueryParams(params);
    const res = await api.get<BackendResponse<Professional[]>>(`/professionals/get-all?${query}`, { signal });

    return {
      data: res.data.response,
      pagination: res.data.pagination ?? fallbackPagination(res.data.response, params.page, params.limit),
    };
  },
  getAll: async (search?: string, page = 1, limit = 20) => {
    const result = await professionalService.getPaginated({ search, page, limit });
    return result.data;
  },
};

// --- Appointment Service ---
export const appointmentService = {
  getPaginated: async (params: PaginationParams = {}, signal?: AbortSignal): Promise<PaginatedResult<Appointment>> => {
    const query = buildQueryParams(params);
    const res = await api.get<BackendResponse<any[]>>(`/quotes/all?${query}`, { signal });
    const appointments = (res.data.response ?? []).map(normalizeAppointment);

    return {
      data: appointments,
      pagination: res.data.pagination ?? fallbackPagination(appointments, params.page, params.limit),
    };
  },
  getAll: async (fecha?: string, idProfesional?: number, idPaciente?: number, page = 1, limit = 20) => {
    const filters: PaginationParams['filters'] = {};
    if (fecha) filters.fecha = fecha;
    if (idProfesional) filters.id_profesional = idProfesional;
    if (idPaciente) filters.id_paciente = idPaciente;
    const result = await appointmentService.getPaginated({ page, limit, filters });
    return result.data;
  },
  getByPackage: async (idPackage: number) => {
    const res = await api.get<BackendResponse<any[]>>(`/quotes/get-by-package/${idPackage}`);
    return (res.data.response ?? []).map(normalizeAppointment);
  },
  create: async (data: AppointmentCreateDTO) => {
    const res = await api.post<BackendResponse<any>>('/quotes/create', normalizeAppointmentPayload(data));
    return normalizeAppointment(res.data.response?.cita ?? res.data.response);
  },
  update: async (data: AppointmentUpdateDTO) => {
    const { id, ...rest } = data;
    const res = await api.put<BackendResponse<any>>(`/quotes/update/${id}`, normalizeAppointmentPayload(rest));
    return normalizeAppointment(res.data.response?.cita ?? res.data.response);
  },
  cancel: async (id: number) => {
    const res = await api.delete<BackendResponse<Appointment>>(`/quotes/${id}`);
    return res.data.response;
  },
  checkAvailability: async (idProfesional: number, date: string) => {
    const res = await api.get<BackendResponse<any[]>>(`/quotes/availability/${idProfesional}?date=${encodeURIComponent(date)}`);
    return (res.data.response ?? []).map(normalizeAppointment);
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
    const res = await api.get<BackendResponse<any | any[]>>(`/history/get-by-quote/${idCita}`);
    const payload = Array.isArray(res.data.response) ? res.data.response : [res.data.response].filter(Boolean);
    return payload.map(normalizeClinicalHistory);
  },
  getByPatient: async (idPaciente: number, params: PaginationParams = {}) => {
    const query = buildQueryParams({ page: 1, limit: 20, ...params });
    const res = await api.get<BackendResponse<any[]>>(`/history/get-by-patient/${idPaciente}?${query}`);
    return (res.data.response ?? []).map(normalizeClinicalHistory);
  },
  create: async (data: ClinicalHistoryCreateDTO) => {
    const res = await api.post<BackendResponse<any>>('/history/create', normalizeClinicalHistoryPayload(data));
    return normalizeClinicalHistory(res.data.response);
  },
  update: async (id: number, data: Partial<ClinicalHistoryCreateDTO>) => {
    const res = await api.put<BackendResponse<any>>(`/history/update/${id}`, normalizeClinicalHistoryPayload(data));
    return normalizeClinicalHistory(res.data.response);
  },
  exportDocument: async (id: number) => {
    const res = await api.get<Blob>(`/history/export-docx/${id}`, { responseType: 'blob' });
    return res.data;
  },
};

// --- CIE10 Service ---
export const cie10Service = {
  getPaginated: async (params: PaginationParams = {}, signal?: AbortSignal): Promise<PaginatedResult<Cie10>> => {
    const { search, ...rest } = params;
    const query = buildQueryParams({ ...rest, filters: { ...(rest.filters ?? {}), ...(search?.trim() ? { q: search.trim() } : {}) } });
    const res = await api.get<BackendResponse<Cie10[]>>(`/cie10/all?${query}`, { signal });

    return {
      data: res.data.response,
      pagination: res.data.pagination ?? fallbackPagination(res.data.response, params.page, params.limit),
    };
  },
  getAll: async (search?: string, page = 1, limit = 20) => {
    const result = await cie10Service.getPaginated({ search, page, limit });
    return result.data;
  },
  getById: async (id: number) => {
    const res = await api.get<BackendResponse<Cie10>>(`/cie10/${id}`);
    return res.data.response;
  },
  getByCode: async (code: string) => {
    const res = await api.get<BackendResponse<Cie10>>(`/cie10/code/${encodeURIComponent(code)}`);
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
  getPaginated: async (params: PaginationParams = {}, signal?: AbortSignal): Promise<PaginatedResult<Payment>> => {
    const query = buildQueryParams(params);
    const res = await api.get<BackendResponse<Payment[]>>(`/payments/?${query}`, { signal });

    return {
      data: res.data.response,
      pagination: res.data.pagination ?? fallbackPagination(res.data.response, params.page, params.limit),
    };
  },
  getAll: async (idPaquete?: number, idCita?: number, page = 1, limit = 20) => {
    const filters: PaginationParams['filters'] = {};
    if (idPaquete) filters.id_paquete = idPaquete;
    if (idCita) filters.id_cita = idCita;
    const result = await paymentService.getPaginated({ page, limit, filters });
    return result.data;
  },
  getById: async (id: number) => {
    const res = await api.get<BackendResponse<Payment>>(`/payments/${id}`);
    return res.data.response;
  },
  create: async (data: PaymentCreateDTO) => {
    const res = await api.post<BackendResponse<Payment>>('/payments/', normalizePaymentPayload(data));
    return res.data.response;
  },
  update: async (id: number, data: Partial<PaymentCreateDTO>) => {
    const res = await api.put<BackendResponse<Payment>>(`/payments/${id}`, normalizePaymentPayload(data));
    return res.data.response;
  },
  delete: async (id: number) => {
    const res = await api.delete<BackendResponse<null>>(`/payments/${id}`);
    return res.data;
  },
  getSummary: async (idPaquete?: number, idCita?: number) => {
    if (idPaquete) {
      const res = await api.get<BackendResponse<PaymentSummary>>(`/payments/package-summary/${idPaquete}`);
      return normalizePaymentSummary(res.data.response);
    }

    if (idCita) {
      const res = await api.get<BackendResponse<PaymentSummary>>(`/payments/appointment-summary/${idCita}`);
      return normalizePaymentSummary(res.data.response);
    }

    return { total: 0, abonado: 0, saldo: 0, estado: 'PENDIENTE' } satisfies PaymentSummary;
  },
  getPackageAllSummary: async (idPaquete: number) => {
    const res = await api.get<BackendResponse<PaymentSummary & { pagos: Payment[] }>>(`/payments/package-all-summary/${idPaquete}`);
    return { ...res.data.response, ...normalizePaymentSummary(res.data.response) };
  },
};

function normalizePackageCatalog(data: any): PackageAttentionCatalog {
  return {
    id: Number(data?.id ?? 0),
    descripcion: data?.descripcion ?? data?.nombre ?? '',
    cantidad_sesiones: Number(data?.cantidad_sesiones ?? 0),
    valor: Number(data?.valor ?? 0),
  };
}

function normalizePackage(data: any): FisentPackage {
  const attentionPackage = data?.attentionPackage ?? data?.attention_package ?? data?.paquete_atencion ?? null;
  const resumen = data?.resumen_sesiones ?? {};
  const id = Number(data?.id_paquete ?? data?.id ?? 0);
  const sesionesTotales = Number(resumen?.sesiones_totales ?? data?.sesiones_totales ?? attentionPackage?.cantidad_sesiones ?? data?.cantidad_sesiones ?? 0);
  const sesionesUsadas = Number(resumen?.sesiones_usadas ?? data?.sesiones_usadas ?? data?.sesiones_realizadas ?? 0);
  const sesionesDisponibles = Number(resumen?.sesiones_disponibles ?? data?.sesiones_disponibles ?? Math.max(sesionesTotales - sesionesUsadas, 0));
  const patient = data?.patient ?? data?.paciente;
  const status = data?.statusPackage ?? data?.status ?? data?.estado;
  const statusText = typeof status === 'string' ? status : status?.descripcion ?? status?.nombre ?? status?.estado;
  const description = data?.tipo_paquete ?? attentionPackage?.descripcion ?? data?.nombre ?? data?.descripcion ?? `Paquete #${id}`;

  return {
    ...data,
    id,
    id_paquete: id,
    id_paciente: Number(data?.id_paciente ?? data?.id_pacientes ?? patient?.id ?? 0),
    id_pacientes: Number(data?.id_pacientes ?? data?.id_paciente ?? patient?.id ?? 0),
    id_paquetes_atenciones: Number(data?.id_paquetes_atenciones ?? data?.id_tipo_paquete ?? attentionPackage?.id ?? 0),
    id_tipo_paquete: Number(data?.id_tipo_paquete ?? data?.id_paquetes_atenciones ?? attentionPackage?.id ?? 0),
    id_profesional: data?.id_profesional ?? data?.professional?.id ?? null,
    id_cie_secundario: data?.id_cie_secundario ?? data?.secondaryDiagnosis?.id ?? null,
    tipo_paquete: description,
    tipo_paquete_nombre: description,
    nombre: data?.nombre ?? description,
    descripcion: data?.descripcion ?? description,
    cantidad_sesiones: sesionesTotales,
    sesiones_realizadas: sesionesUsadas,
    sesiones_disponibles: sesionesDisponibles,
    estado: statusText ?? (resumen?.completo ? 'CERRADO' : 'ACTIVO'),
    fecha_inicio: data?.fecha_inicio ?? data?.created_at ?? '',
    fecha_fin: data?.fecha_fin ?? null,
    created_at: data?.created_at ?? '',
    updated_at: data?.updated_at ?? '',
    paciente: patient,
    patient,
    attentionPackage: attentionPackage ? normalizePackageCatalog(attentionPackage) : data?.attentionPackage,
    resumen_sesiones: {
      sesiones_totales: sesionesTotales,
      sesiones_usadas: sesionesUsadas,
      sesiones_disponibles: sesionesDisponibles,
      completo: Boolean(resumen?.completo ?? sesionesDisponibles <= 0),
    },
  } as FisentPackage;
}

function normalizePackageCreatePayload(data: Partial<FisentPackage> | Record<string, unknown>) {
  const payload: Record<string, unknown> = { ...data };
  if (payload.id_paciente !== undefined && payload.id_pacientes === undefined) payload.id_pacientes = payload.id_paciente;
  if (payload.id_tipo_paquete !== undefined && payload.id_paquetes_atenciones === undefined) payload.id_paquetes_atenciones = payload.id_tipo_paquete;
  if (payload.id_estado_citas === undefined) payload.id_estado_citas = 1;
  delete payload.id_paciente;
  delete payload.id_tipo_paquete;
  delete payload.tipo_paquete;
  delete payload.nombre;
  delete payload.cantidad_sesiones;
  delete payload.fecha_inicio;
  return payload;
}

function normalizeAppointment(data: any): Appointment {
  data = data?.cita ?? data;
  const pacienteNombre = typeof data?.paciente === 'string'
    ? data.paciente
    : [data?.paciente?.nombre, data?.paciente?.apellido].filter(Boolean).join(' ');
  const profesionalNombre = typeof data?.profesional === 'string'
    ? [data.profesional, data?.apellido_profesional].filter(Boolean).join(' ')
    : [data?.profesional?.nombre, data?.profesional?.apellido].filter(Boolean).join(' ');
  const idPaquete = data?.id_paquete ?? data?.id_paquetes ?? data?.package?.id ?? data?.paquete?.id ?? null;
  const horarioInicio = data?.horario_inicio ?? data?.hora_inicio ?? '';
  const horarioFin = data?.horario_fin ?? data?.hora_fin ?? '';
  const observaciones = data?.observaciones ?? data?.motivo ?? '';

  return {
    ...data,
    id_paciente: Number(data?.id_paciente ?? data?.id_pacientes ?? data?.package?.id_pacientes ?? data?.package?.patient?.id ?? data?.paquete?.id_pacientes ?? data?.paquete?.patient?.id ?? 0),
    id_profesional: Number(data?.id_profesional ?? data?.professional?.id ?? data?.profesional?.id ?? data?.package?.id_profesional ?? data?.paquete?.id_profesional ?? 0),
    id_paquete: idPaquete,
    id_paquetes: data?.id_paquetes ?? idPaquete,
    paquete: data?.paquete ? normalizePackage(data.paquete) : data?.package ? normalizePackage(data.package) : data?.paquete,
    package: data?.package ? normalizePackage(data.package) : data?.paquete ? normalizePackage(data.paquete) : data?.package,
    fecha: data?.fecha ?? data?.fecha_agendamiento ?? '',
    horario_inicio: horarioInicio,
    horario_fin: horarioFin,
    hora_inicio: data?.hora_inicio ?? horarioInicio,
    hora_fin: data?.hora_fin ?? horarioFin,
    motivo: data?.motivo ?? observaciones,
    observaciones,
    estado: String(data?.estado ?? 'PROGRAMADA').toUpperCase(),
    pagado: Boolean(data?.pagado),
    paciente: pacienteNombre,
    profesional: profesionalNombre,
    paciente_nombre: data?.paciente_nombre ?? pacienteNombre,
    profesional_nombre: data?.profesional_nombre ?? profesionalNombre,
    created_at: data?.created_at ?? '',
    updated_at: data?.updated_at ?? '',
    agendamiento: data?.agendamiento,
    HistoryQuotes: data?.HistoryQuotes ?? [],
  } as Appointment;
}

function normalizePatientPayload(data: Partial<PatientCreateDTO>) {
  const payload: Record<string, unknown> = { ...data };
  if (payload.nombres !== undefined && payload.nombre === undefined) payload.nombre = payload.nombres;
  if (payload.apellidos !== undefined && payload.apellido === undefined) payload.apellido = payload.apellidos;
  delete payload.nombres;
  delete payload.apellidos;
  return payload;
}

function normalizeAppointmentPayload(data: Partial<AppointmentCreateDTO>) {
  const payload: Record<string, unknown> = { ...data };
  if (payload.fecha !== undefined && payload.fecha_agendamiento === undefined) payload.fecha_agendamiento = payload.fecha;
  if (payload.id_paquete !== undefined && payload.id_paquetes === undefined) payload.id_paquetes = payload.id_paquete;
  if (payload.observaciones !== undefined && payload.motivo === undefined) payload.motivo = payload.observaciones;
  delete payload.fecha;
  delete payload.id_paquete;
  delete payload.observaciones;
  if (payload.id_estado_citas === undefined) payload.id_estado_citas = 1;
  if (payload.recordatorio === undefined) payload.recordatorio = false;
  return payload;
}

function normalizeClinicalHistory(data: any): ClinicalHistory {
  const source = data?.historia ?? data?.history ?? data;
  const quote = source?.cita ?? source?.Quotes ?? source?.quote;
  const cie = source?.cie10 ?? source?.Cie10 ?? source?.cie10_historia;
  const descripcion = source?.descripcion_estado_paciente ?? source?.evolucion ?? '';
  const textParts = [
    source?.subjetivo ? `Subjetivo: ${source.subjetivo}` : '',
    source?.objetivo ? `Objetivo: ${source.objetivo}` : '',
    source?.intervencion ? `Intervención: ${source.intervencion}` : '',
    source?.recomendaciones ? `Recomendaciones: ${source.recomendaciones}` : '',
  ].filter(Boolean);
  const evolucion = source?.evolucion ?? [descripcion, ...textParts].filter(Boolean).join('\n\n');

  return {
    ...source,
    id: Number(source?.id ?? source?.id_historial ?? 0),
    id_cita: Number(source?.id_cita ?? quote?.id ?? 0),
    id_cie: Number(source?.id_cie ?? cie?.id ?? 0),
    evolucion,
    fecha_evolucion: source?.fecha_evolucion ?? source?.fecha ?? quote?.fecha_agendamiento,
    descripcion_estado_paciente: descripcion,
    antecedentes_sincronizados: Boolean(source?.antecedentes_sincronizados),
    created_at: source?.created_at ?? source?.fecha_evolucion ?? '',
    updated_at: source?.updated_at ?? '',
    cita: quote ? normalizeAppointment(quote) : source?.cita,
    cie10: cie,
  } as ClinicalHistory;
}

function normalizeClinicalHistoryPayload(data: Partial<ClinicalHistoryCreateDTO>) {
  const payload: Record<string, unknown> = { ...data };
  const evolucion = typeof payload.evolucion === 'string' ? payload.evolucion.trim() : '';
  if (evolucion) {
    if (!payload.descripcion_estado_paciente) payload.descripcion_estado_paciente = evolucion;
    if (!payload.recomendaciones) payload.recomendaciones = evolucion;
  }
  delete payload.evolucion;
  delete payload.antecedentes_sincronizados;
  return payload;
}

function normalizePaymentPayload(data: Partial<PaymentCreateDTO>) {
  const payload: Record<string, unknown> = { ...data };
  if (typeof payload.tipo === 'string') payload.tipo = payload.tipo.toLowerCase();
  if (payload.observaciones !== undefined && payload.observacion === undefined) payload.observacion = payload.observaciones;
  delete payload.observaciones;
  return payload;
}

function normalizePaymentSummary(summary: any): PaymentSummary {
  const total = Number(summary?.total ?? summary?.total_paquete ?? summary?.total_cita ?? 0);
  const abonado = Number(summary?.abonado ?? summary?.total_abonado ?? 0);
  const saldo = Number(summary?.saldo ?? summary?.saldo_pendiente ?? Math.max(total - abonado, 0));
  const rawStatus = String(summary?.estado ?? summary?.estado_pago ?? (saldo <= 0 && total > 0 ? 'pagado' : abonado > 0 ? 'abonado' : 'pendiente')).toUpperCase();
  const estado = rawStatus === 'PAGADO' || rawStatus === 'ABONADO' ? rawStatus : 'PENDIENTE';

  return { total, abonado, saldo, estado };
}

function buildReportQuery(params: ReportQueryParams = {}): URLSearchParams {
  const query = new URLSearchParams();
  if (params.period) query.set('period', params.period);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.threshold !== undefined) query.set('threshold', String(params.threshold));
  return query;
}

// --- Reports Service ---
export const reportService = {
  getDashboard: async (params: ReportQueryParams = {}) => {
    const query = buildReportQuery(params);
    const res = await api.get<BackendResponse<DashboardReport>>(`/reports/dashboard?${query}`);
    return res.data.response;
  },
  getRevenue: async (params: ReportQueryParams = {}) => {
    const query = buildReportQuery(params);
    const res = await api.get<BackendResponse<RevenueByMonth[]>>(`/reports/revenue?${query}`);
    return res.data.response;
  },
  getAppointmentStatusDistribution: async (params: ReportQueryParams = {}) => {
    const query = buildReportQuery(params);
    const res = await api.get<BackendResponse<AppointmentStatusDistribution>>(`/reports/appointments/status-distribution?${query}`);
    return res.data.response;
  },
  getTopProfessionals: async (params: ReportQueryParams = {}) => {
    const query = buildReportQuery(params);
    const res = await api.get<BackendResponse<TopProfessionalReport[]>>(`/reports/professionals/top?${query}`);
    return res.data.response;
  },
  getPackagesByType: async (params: ReportQueryParams = {}) => {
    const query = buildReportQuery(params);
    const res = await api.get<BackendResponse<PackageTypeReport[]>>(`/reports/packages/by-type?${query}`);
    return res.data.response;
  },
  getPackagesNearCompletion: async (params: ReportQueryParams = {}) => {
    const query = buildReportQuery(params);
    const res = await api.get<BackendResponse<NearCompletionPackageReport[]>>(`/reports/packages/near-completion?${query}`);
    return res.data.response;
  },
  getRecentPayments: async (params: ReportQueryParams = {}) => {
    const query = buildReportQuery(params);
    const res = await api.get<BackendResponse<RecentPaymentReport[]>>(`/reports/payments/recent?${query}`);
    return res.data.response;
  },
  getSessionsSummary: async (params: ReportQueryParams = {}) => {
    const query = buildReportQuery(params);
    const res = await api.get<BackendResponse<SessionsSummary>>(`/reports/sessions/summary?${query}`);
    return res.data.response;
  },
};
