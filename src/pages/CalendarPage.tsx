// ============================================================
// FISENT - CALENDARIO PAGE (Flujo completo por modales)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import {
  appointmentService, patientService, professionalService,
  packageService, paymentService,
} from '../data-access/services';
import {
  Appointment, AppointmentCreateDTO, Patient, Professional,
  Package as FisentPackage, PackageCreateDTO, PackageType,
  PaymentCreateDTO, PaymentMethod,
} from '../domain/models';
import { appointmentSchema, packageSchema } from '../domain/schemas';
import {
  Card, Button, Input, Select, Textarea, Modal, Badge, Alert,
  Avatar, ProgressBar,
} from '../components/ui/Components';
import {
  ChevronLeft, ChevronRight, Calendar, Plus, XCircle, Edit2,
  CreditCard, Package, CheckCircle, ArrowRight, ArrowLeft, AlertTriangle, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  format, addDays, subDays, startOfWeek, addWeeks, subWeeks,
  eachDayOfInterval, startOfMonth, endOfMonth,
  addMonths, subMonths, isToday, isSameMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================
// TYPES
// ============================================================
type ViewMode = 'month' | 'week' | 'day';
type ModalStep = 'closed' | 'select-action' | 'create-step1-patient' | 'create-step2-package' | 'create-step2b-new-package' | 'create-step3-details' | 'create-step4-confirm' | 'view-appointment' | 'edit-appointment' | 'edit-confirm' | 'cancel-confirm' | 'payment-step1' | 'payment-step2-confirm' | 'success';

interface CalendarState {
  step: ModalStep;
  selectedDate: string;
  selectedHour: number;
  selectedAppointment: Appointment | null;
  createData: {
    id_paciente: number;
    id_profesional: number;
    id_paquete: number | null;
    fecha: string;
    horario_inicio: string;
    horario_fin: string;
    observaciones: string;
  };
  newPackageData: {
    tipo_paquete: PackageType;
    nombre: string;
    cantidad_sesiones: number;
  };
  paymentData: {
    valor: number;
    metodo_pago: PaymentMethod;
    observaciones: string;
  };
  errors: Record<string, string | undefined>;
  collisionWarning: string | null;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const avatarColors = ['teal', 'blue', 'purple', 'amber', 'emerald', 'rose'] as const;
const PACKAGE_TYPES = [
  { value: 'REHABILITACION', label: 'Rehabilitacion' },
  { value: 'TERAPIA', label: 'Terapia' },
  { value: 'EVALUACION', label: 'Evaluacion' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
];
const PAYMENT_METHODS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'NEQUI', label: 'Nequi' },
  { value: 'DAVIPLATA', label: 'Daviplata' },
];

const emptyCreateData = {
  id_paciente: 0, id_profesional: 0, id_paquete: null as number | null,
  fecha: '', horario_inicio: '08:00', horario_fin: '09:00', observaciones: '',
};

const emptyNewPackage = { tipo_paquete: 'REHABILITACION' as PackageType, nombre: '', cantidad_sesiones: 10 };
const emptyPayment = { valor: 0, metodo_pago: 'EFECTIVO' as PaymentMethod, observaciones: '' };

// ============================================================
// COMPONENT
// ============================================================
export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [packages, setPackages] = useState<FisentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [state, setState] = useState<CalendarState>({
    step: 'closed', selectedDate: '', selectedHour: 8, selectedAppointment: null,
    createData: { ...emptyCreateData },
    newPackageData: { ...emptyNewPackage },
    paymentData: { ...emptyPayment },
    errors: {}, collisionWarning: null,
  });

  // ============================================================
  // DATA LOADING
  // ============================================================
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = viewMode === 'month'
        ? format(startOfMonth(currentDate), 'yyyy-MM-dd')
        : viewMode === 'week'
          ? format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
          : format(currentDate, 'yyyy-MM-dd');
      const endDate = viewMode === 'month'
        ? format(endOfMonth(currentDate), 'yyyy-MM-dd')
        : viewMode === 'week'
          ? format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), 'yyyy-MM-dd')
          : format(currentDate, 'yyyy-MM-dd');

      const [appts, pts, pros, pkgs] = await Promise.all([
        appointmentService.getAll().catch(() => []),
        patientService.getAll().catch(() => []),
        professionalService.getAll().catch(() => []),
        packageService.getAll().catch(() => []),
      ]);
      const filtered = (appts || []).filter((a: Appointment) => {
        const d = a.fecha.split('T')[0];
        return d >= startDate && d <= endDate;
      });
      setAppointments(filtered);
      setPatients(pts || []);
      setProfessionals(pros || []);
      setPackages(pkgs || []);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar datos');
    } finally { setLoading(false); }
  }, [currentDate, viewMode]);

  useEffect(() => { loadData(); }, [loadData]);

  // ============================================================
  // NAVIGATION
  // ============================================================
  const goNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };
  const goPrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  // ============================================================
  // HELPERS
  // ============================================================
  const getApptsForSlot = useCallback((date: string, hour: number) => {
    const hourStr = `${String(hour).padStart(2, '0')}:`;
    return appointments.filter((a) =>
      a.fecha.split('T')[0] === date && a.horario_inicio.startsWith(hourStr) && a.estado !== 'CANCELADA'
    );
  }, [appointments]);

  const getApptColor = (apt: Appointment): string => {
    if (apt.id_paquete) return 'bg-teal-100 border-teal-300 text-teal-800';
    if (apt.estado === 'CONFIRMADA') return 'bg-emerald-100 border-emerald-300 text-emerald-800';
    if (apt.estado === 'COMPLETADA') return 'bg-gray-100 border-gray-300 text-gray-600';
    return 'bg-blue-100 border-blue-300 text-blue-800';
  };

  const patientHasActivePackages = (patientId: number): FisentPackage[] => {
    return packages.filter(p => p.id_paciente === patientId && p.estado === 'ACTIVO' && p.sesiones_realizadas < p.cantidad_sesiones);
  };

  const updateCreateData = (field: string, value: any) => {
    setState(s => ({
      ...s,
      createData: { ...s.createData, [field]: value },
      errors: { ...s.errors, [field]: undefined },
    }));
  };

  const updateNewPackage = (field: string, value: any) => {
    setState(s => ({ ...s, newPackageData: { ...s.newPackageData, [field]: value } }));
  };

  const updatePayment = (field: string, value: any) => {
    setState(s => ({ ...s, paymentData: { ...s.paymentData, [field]: value } }));
  };

  const goStep = (step: ModalStep) => setState(s => ({ ...s, step }));

  // ============================================================
  // SLOT CLICK HANDLER
  // ============================================================
  const handleSlotClick = (date: string, hour: number) => {
    const slotAppts = getApptsForSlot(date, hour);
    if (slotAppts.length > 0) {
      // Has appointment(s) → show view
      setState(s => ({
        ...s, step: 'view-appointment', selectedDate: date, selectedHour: hour,
        selectedAppointment: slotAppts[0],
      }));
    } else {
      // Empty slot → start create flow
      setState(s => ({
        ...s, step: 'create-step1-patient', selectedDate: date, selectedHour: hour,
        createData: {
          ...emptyCreateData, fecha: date,
          horario_inicio: `${String(hour).padStart(2, '0')}:00`,
          horario_fin: `${String(hour + 1).padStart(2, '0')}:00`,
        },
        errors: {}, collisionWarning: null,
      }));
    }
  };

  // ============================================================
  // CREATE FLOW
  // ============================================================
  // Step 1 → Step 2: Patient selected, check packages
  const handlePatientSelected = () => {
    if (!state.createData.id_paciente) {
      setState(s => ({ ...s, errors: { id_paciente: 'Seleccione un paciente' } }));
      return;
    }
    const activePkgs = patientHasActivePackages(state.createData.id_paciente);
    if (activePkgs.length === 0) {
      // No active packages → prompt to create one
      goStep('create-step2b-new-package');
    } else {
      // Has packages → select one
      goStep('create-step2-package');
    }
  };

  // Step 2b: Create new package for patient
  const handleCreatePackage = async () => {
    const pkgData = {
      id_paciente: state.createData.id_paciente,
      ...state.newPackageData,
      fecha_inicio: state.createData.fecha,
    };
    const result = packageSchema.safeParse(pkgData);
    if (!result.success) {
      toast.error('Complete los datos del paquete');
      return;
    }
    // Check duplicate
    const duplicate = packages.find(
      p => p.id_paciente === pkgData.id_paciente && p.tipo_paquete === pkgData.tipo_paquete && p.estado === 'ACTIVO'
    );
    if (duplicate) {
      toast.error('Ya existe un paquete activo de este tipo para este paciente');
      return;
    }

    setSaving(true);
    try {
      const newPkg = await packageService.create(pkgData as PackageCreateDTO);
      toast.success('Paquete creado exitosamente');
      // Reload packages and set the new one
      const allPkgs = await packageService.getAll().catch(() => []);
      setPackages(allPkgs || []);
      setState(s => ({
        ...s,
        createData: { ...s.createData, id_paquete: newPkg.id },
        step: 'create-step3-details',
      }));
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear paquete');
    } finally { setSaving(false); }
  };

  // Step 2 → Step 3: Package selected
  const handlePackageSelected = () => {
    if (!state.createData.id_paquete) {
      toast.error('Seleccione un paquete o cree uno nuevo');
      return;
    }
    const pkg = packages.find(p => p.id === state.createData.id_paquete);
    if (pkg && pkg.sesiones_realizadas >= pkg.cantidad_sesiones) {
      toast.error('Este paquete ya tiene todas las sesiones consumidas');
      return;
    }
    goStep('create-step3-details');
  };

  // Step 3 → Step 4: Validate details
  const handleDetailsNext = () => {
    const result = appointmentSchema.safeParse(state.createData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => { fieldErrors[String(err.path[0])] = err.message; });
      setState(s => ({ ...s, errors: fieldErrors }));
      return;
    }
    // Check collision
    const collision = appointments.find((a) =>
      a.id_profesional === state.createData.id_profesional &&
      a.fecha.split('T')[0] === state.createData.fecha &&
      a.estado !== 'CANCELADA' &&
      a.horario_inicio < state.createData.horario_fin &&
      a.horario_fin > state.createData.horario_inicio
    );
    if (collision) {
      setState(s => ({
        ...s,
        collisionWarning: `Colision: cita con ${collision.paciente?.nombre} ${collision.paciente?.apellido} a las ${collision.horario_inicio}`,
      }));
      return;
    }
    setState(s => ({ ...s, collisionWarning: null }));
    goStep('create-step4-confirm');
  };

  // Step 4: Confirm & save
  const handleCreateConfirm = async () => {
    setSaving(true);
    try {
      await appointmentService.create(state.createData as AppointmentCreateDTO);
      goStep('success');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear cita');
    } finally { setSaving(false); }
  };

  // ============================================================
  // EDIT FLOW
  // ============================================================
  const startEdit = () => {
    if (!state.selectedAppointment) return;
    const apt = state.selectedAppointment;
    setState(s => ({
      ...s, step: 'edit-appointment',
      createData: {
        id_paciente: apt.id_paciente, id_profesional: apt.id_profesional,
        id_paquete: apt.id_paquete || null, fecha: apt.fecha.split('T')[0],
        horario_inicio: apt.horario_inicio, horario_fin: apt.horario_fin,
        observaciones: apt.observaciones || '',
      },
      errors: {}, collisionWarning: null,
    }));
  };

  const handleEditConfirm = async () => {
    if (!state.selectedAppointment) return;
    const result = appointmentSchema.safeParse(state.createData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => { fieldErrors[String(err.path[0])] = err.message; });
      setState(s => ({ ...s, errors: fieldErrors }));
      return;
    }
    setSaving(true);
    try {
      await appointmentService.update({ id: state.selectedAppointment.id, ...state.createData as AppointmentCreateDTO });
      goStep('success');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar cita');
    } finally { setSaving(false); }
  };

  // ============================================================
  // CANCEL FLOW
  // ============================================================
  const handleCancelConfirm = async () => {
    if (!state.selectedAppointment) return;
    setSaving(true);
    try {
      await appointmentService.cancel(state.selectedAppointment.id);
      goStep('success');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al cancelar cita');
    } finally { setSaving(false); }
  };

  // ============================================================
  // PAYMENT FLOW
  // ============================================================
  const startPayment = () => {
    if (!state.selectedAppointment) return;
    setState(s => ({
      ...s, step: 'payment-step1',
      paymentData: {
        valor: 0,
        metodo_pago: 'EFECTIVO' as PaymentMethod,
        observaciones: '',
      },
    }));
  };

  const handlePaymentConfirm = async () => {
    if (!state.selectedAppointment) return;
    if (state.paymentData.valor <= 0) {
      toast.error('El valor debe ser mayor a 0');
      return;
    }
    const isPackagePayment = !!state.selectedAppointment.id_paquete;
    const paymentPayload: PaymentCreateDTO = {
      id_paquete: isPackagePayment ? state.selectedAppointment.id_paquete : null,
      id_cita: !isPackagePayment ? state.selectedAppointment.id : null,
      tipo: isPackagePayment ? 'PAQUETE' : 'CITA',
      valor: state.paymentData.valor,
      metodo_pago: state.paymentData.metodo_pago,
      fecha_pago: format(new Date(), 'yyyy-MM-dd'),
      observaciones: state.paymentData.observaciones,
    };
    setSaving(true);
    try {
      await paymentService.create(paymentPayload);
      toast.success('Pago registrado exitosamente');
      goStep('success');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar pago');
    } finally { setSaving(false); }
  };

  // ============================================================
  // RENDER: MONTH VIEW
  // ============================================================
  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startDate = startOfWeek(start, { weekStartsOn: 1 as const });
    const endDate = endOfWeek(end);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

    return (
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {dayNames.map((d) => (
            <div key={d} className="py-2 md:py-3 text-center text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayAppts = appointments.filter((a) => a.fecha.split('T')[0] === dateStr && a.estado !== 'CANCELADA');
            const isCurrentMonth = isSameMonth(day, currentDate);
            return (
              <div
                key={i}
                className={`min-h-[70px] md:min-h-[100px] border-r border-b border-gray-100 p-1 md:p-1.5 cursor-pointer transition-colors ${
                  isCurrentMonth ? 'bg-white hover:bg-teal-50/30' : 'bg-gray-50/50'
                } ${i % 7 === 6 ? 'border-r-0' : ''}`}
                onClick={() => { setCurrentDate(day); setViewMode('day'); }}
              >
                <div className={`text-xs md:text-sm font-semibold mb-1 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${
                  isToday(day) ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                }`}>{format(day, 'd')}</div>
                <div className="space-y-0.5">
                  {dayAppts.slice(0, window.innerWidth < 640 ? 2 : 3).map((apt) => (
                    <div key={apt.id} className={`text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded-md border truncate font-medium ${getApptColor(apt)}`}
                      onClick={(e) => { e.stopPropagation(); setState(s => ({ ...s, step: 'view-appointment', selectedAppointment: apt, selectedDate: dateStr })); }}>
                      {apt.horario_inicio} {apt.paciente?.nombre?.split(' ')[0]}
                    </div>
                  ))}
                  {dayAppts.length > 3 && <div className="text-[9px] md:text-[10px] text-gray-400 font-semibold px-1">+{dayAppts.length - (window.innerWidth < 640 ? 2 : 3)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  // ============================================================
  // RENDER: WEEK VIEW
  // ============================================================
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 as const });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    return (
      <Card className="overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-100">
          <div className="py-3 px-1 md:px-2 text-center text-[10px] md:text-xs font-bold text-gray-400 uppercase border-r border-gray-100">Hora</div>
          {weekDays.map((day, i) => (
            <div key={i} className={`py-2 md:py-3 text-center border-r border-gray-100 last:border-r-0 ${isToday(day) ? 'bg-teal-50/50' : ''}`}>
              <div className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase">{dayNames[i]}</div>
              <div className={`text-base md:text-lg font-extrabold mt-0.5 w-7 h-7 md:w-9 md:h-9 flex items-center justify-center mx-auto rounded-full ${
                isToday(day) ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white' : 'text-gray-800'
              }`}>{format(day, 'd')}</div>
            </div>
          ))}
        </div>
        <div className="overflow-y-auto max-h-[500px] md:max-h-[600px]">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-50">
              <div className="py-2 px-1 md:px-2 text-right text-[10px] md:text-xs font-mono text-gray-400 border-r border-gray-100 bg-gray-50/30">
                {`${String(hour).padStart(2, '0')}:00`}
              </div>
              {weekDays.map((day, dayIdx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const slotAppts = getApptsForSlot(dateStr, hour);
                return (
                  <div key={dayIdx}
                    className={`py-1 px-0.5 md:px-1 min-h-[44px] md:min-h-[48px] border-r border-gray-50 last:border-r-0 cursor-pointer transition-colors hover:bg-teal-50/40 ${isToday(day) ? 'bg-teal-50/20' : ''}`}
                    onClick={() => handleSlotClick(dateStr, hour)}>
                    {slotAppts.map((apt) => (
                      <div key={apt.id}
                        className={`text-[9px] md:text-[11px] px-1 md:px-2 py-0.5 md:py-1 rounded-lg border mb-0.5 font-medium truncate ${getApptColor(apt)}`}
                        onClick={(e) => { e.stopPropagation(); setState(s => ({ ...s, step: 'view-appointment', selectedAppointment: apt, selectedDate: dateStr })); }}>
                        <span className="hidden md:inline">{apt.horario_inicio} </span>{apt.paciente?.nombre?.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // ============================================================
  // RENDER: DAY VIEW
  // ============================================================
  const renderDayView = () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayAppts = appointments.filter((a) => a.fecha.split('T')[0] === dateStr && a.estado !== 'CANCELADA');
    return (
      <Card className="overflow-hidden">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-emerald-50/30">
          <h3 className="text-base md:text-lg font-extrabold text-gray-900">{format(currentDate, "EEEE, d 'de' MMMM", { locale: es })}</h3>
          <p className="text-xs md:text-sm text-gray-400 mt-0.5">{dayAppts.length} citas programadas</p>
        </div>
        <div className="overflow-y-auto max-h-[500px] md:max-h-[600px]">
          {HOURS.map((hour) => {
            const slotAppts = getApptsForSlot(dateStr, hour);
            return (
              <div key={hour} className="flex border-b border-gray-50">
                <div className="w-14 md:w-20 py-3 px-2 md:px-3 text-right text-[10px] md:text-xs font-mono text-gray-400 flex-shrink-0 bg-gray-50/30">
                  {`${String(hour).padStart(2, '0')}:00`}
                </div>
                <div className="flex-1 py-2 px-2 md:px-3 min-h-[52px] md:min-h-[56px] cursor-pointer transition-colors hover:bg-teal-50/40"
                  onClick={() => handleSlotClick(dateStr, hour)}>
                  {slotAppts.map((apt) => (
                    <div key={apt.id}
                      className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-xl border mb-1.5 cursor-pointer hover:shadow-md transition-all ${getApptColor(apt)}`}
                      onClick={(e) => { e.stopPropagation(); setState(s => ({ ...s, step: 'view-appointment', selectedAppointment: apt, selectedDate: dateStr })); }}>
                      <Avatar name={`${apt.paciente?.nombre || ''} ${apt.paciente?.apellido || ''}`} size="sm" color={avatarColors[apt.id % avatarColors.length]} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-bold truncate">{apt.paciente?.nombre} {apt.paciente?.apellido}</p>
                        <p className="text-[10px] md:text-xs opacity-70">{apt.profesional?.nombre} {apt.profesional?.apellido}</p>
                      </div>
                      <Badge variant={apt.estado === 'CONFIRMADA' ? 'success' : apt.estado === 'COMPLETADA' ? 'neutral' : 'info'}>{apt.estado}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  // ============================================================
  // RENDER: MODALS
  // ============================================================
  const renderModals = () => {
    const apt = state.selectedAppointment;
    const patient = patients.find(p => p.id === state.createData.id_paciente);
    const professional = professionals.find(p => p.id === state.createData.id_profesional);
    const pkg = packages.find(p => p.id === state.createData.id_paquete);
    const activePkgs = patient ? patientHasActivePackages(patient.id) : [];

    switch (state.step) {
      // ---- SUCCESS ----
      case 'success':
        return (
          <Modal isOpen onClose={() => goStep('closed')} title="Operacion Exitosa" size="sm">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-gray-700 font-medium mb-6">La operacion se completo exitosamente</p>
              <Button onClick={() => goStep('closed')} className="w-full">Cerrar</Button>
            </div>
          </Modal>
        );

      // ---- VIEW APPOINTMENT ----
      case 'view-appointment':
        if (!apt) return null;
        return (
          <Modal isOpen onClose={() => goStep('closed')} title="Detalle de Cita" size="md">
            <div className="space-y-4">
              <div className="flex items-center gap-3 md:gap-4 pb-4 border-b border-gray-100">
                <Avatar name={`${apt.paciente?.nombre || ''} ${apt.paciente?.apellido || ''}`} size="lg" color="teal" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">{apt.paciente?.nombre} {apt.paciente?.apellido}</h3>
                  <p className="text-sm text-gray-400">{apt.fecha?.split('T')[0]}</p>
                </div>
                <Badge variant={apt.estado === 'CONFIRMADA' ? 'success' : apt.estado === 'COMPLETADA' ? 'success' : apt.estado === 'CANCELADA' ? 'danger' : 'info'}>{apt.estado}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Horario</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{apt.horario_inicio} - {apt.horario_fin}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Profesional</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{apt.profesional?.nombre} {apt.profesional?.apellido}</p>
                </div>
                {apt.numero_sesion && (
                  <div className="bg-teal-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-teal-500 uppercase tracking-wider">Sesion</p>
                    <p className="text-sm font-bold text-teal-700 mt-0.5">#{apt.numero_sesion}</p>
                  </div>
                )}
                {apt.paquete && (
                  <div className="bg-teal-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-teal-500 uppercase tracking-wider">Paquete</p>
                    <p className="text-sm font-bold text-teal-700 mt-0.5 truncate">{apt.paquete.nombre}</p>
                    <ProgressBar value={apt.paquete.sesiones_realizadas} max={apt.paquete.cantidad_sesiones} color="teal" />
                  </div>
                )}
              </div>

              {apt.observaciones && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Observaciones</p>
                  <p className="text-sm text-gray-700">{apt.observaciones}</p>
                </div>
              )}

              {/* Action Buttons */}
              {apt.estado !== 'CANCELADA' && apt.estado !== 'COMPLETADA' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <Button variant="outline" onClick={startEdit} className="w-full">
                    <Edit2 className="w-4 h-4 mr-2" />Editar
                  </Button>
                  <Button variant="secondary" onClick={startPayment} className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />Pagar
                  </Button>
                  <Button variant="danger" onClick={() => goStep('cancel-confirm')} className="w-full">
                    <XCircle className="w-4 h-4 mr-2" />Cancelar
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        );

      // ---- CREATE STEP 1: Select Patient ----
      case 'create-step1-patient':
        return (
          <Modal isOpen onClose={() => goStep('closed')} title="Agendar Cita - Paso 1 de 3" size="md">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                <span className="text-sm font-semibold text-gray-700">Seleccionar Paciente</span>
              </div>
              <div className="bg-teal-50 rounded-xl p-3 text-sm text-teal-700">
                <p><strong>Fecha:</strong> {state.selectedDate}</p>
                <p><strong>Hora:</strong> {state.createData.horario_inicio} - {state.createData.horario_fin}</p>
              </div>
              <Select
                label="Paciente *"
                value={state.createData.id_paciente || ''}
                onChange={(e) => updateCreateData('id_paciente', Number(e.target.value))}
                options={patients.filter(p => p.estado).map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido} (${p.num_doc})` }))}
                error={state.errors.id_paciente}
              />
              {state.createData.id_paciente > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 text-sm">
                  <p className="font-semibold text-gray-700 mb-1">Paquetes activos:</p>
                  {patientHasActivePackages(state.createData.id_paciente).length > 0 ? (
                    patientHasActivePackages(state.createData.id_paciente).map(p => (
                      <div key={p.id} className="flex items-center gap-2 text-gray-600">
                        <Package className="w-3.5 h-3.5 text-teal-600" />
                        <span>{p.nombre} ({p.sesiones_realizadas}/{p.cantidad_sesiones})</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-amber-600 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />Sin paquetes activos - se creara uno
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => goStep('closed')}>Cancelar</Button>
                <Button onClick={handlePatientSelected}>Siguiente <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          </Modal>
        );

      // ---- CREATE STEP 2: Select Package ----
      case 'create-step2-package':
        return (
          <Modal isOpen onClose={() => goStep('closed')} title="Agendar Cita - Paso 2 de 3" size="md">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                <span className="text-sm font-semibold text-gray-700">Seleccionar Paquete</span>
              </div>
              <div className="space-y-2">
                {activePkgs.map(p => (
                  <div key={p.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      state.createData.id_paquete === p.id ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => updateCreateData('id_paquete', p.id)}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{p.nombre}</h4>
                      <Badge variant="success">{p.tipo_paquete}</Badge>
                    </div>
                    <ProgressBar value={p.sesiones_realizadas} max={p.cantidad_sesiones} color="teal" />
                  </div>
                ))}
              </div>
              <button onClick={() => goStep('create-step2b-new-package')}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Crear nuevo paquete
              </button>
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button variant="ghost" onClick={() => goStep('create-step1-patient')}><ArrowLeft className="w-4 h-4 mr-1" />Atras</Button>
                <Button onClick={handlePackageSelected}>Siguiente <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          </Modal>
        );

      // ---- CREATE STEP 2b: New Package ----
      case 'create-step2b-new-package':
        return (
          <Modal isOpen onClose={() => goStep('closed')} title="Crear Paquete" size="md">
            <div className="space-y-4">
              <Alert type="info" title="Paquete requerido" message={`${patient?.nombre} ${patient?.apellido} no tiene paquetes activos. Cree uno para continuar.`} />
              <Select label="Tipo de Paquete *" value={state.newPackageData.tipo_paquete} onChange={(e) => updateNewPackage('tipo_paquete', e.target.value)} options={PACKAGE_TYPES} />
              <Input label="Nombre del Paquete *" value={state.newPackageData.nombre} onChange={(e) => updateNewPackage('nombre', e.target.value)} placeholder="Ej: Rehabilitacion lumbar" />
              <Input label="Cantidad de Sesiones *" type="number" min={1} max={100} value={state.newPackageData.cantidad_sesiones} onChange={(e) => updateNewPackage('cantidad_sesiones', Number(e.target.value))} />
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button variant="ghost" onClick={() => activePkgs.length > 0 ? goStep('create-step2-package') : goStep('create-step1-patient')}>
                  <ArrowLeft className="w-4 h-4 mr-1" />Atras
                </Button>
                <Button onClick={handleCreatePackage} isLoading={saving}>
                  <Package className="w-4 h-4 mr-2" />Crear Paquete
                </Button>
              </div>
            </div>
          </Modal>
        );

      // ---- CREATE STEP 3: Details ----
      case 'create-step3-details':
        return (
          <Modal isOpen onClose={() => goStep('closed')} title="Agendar Cita - Paso 3 de 3" size="lg">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                <span className="text-sm font-semibold text-gray-700">Detalles de la Cita</span>
              </div>

              {state.collisionWarning && <Alert type="warning" title="Conflicto de agenda" message={state.collisionWarning} />}

              <div className="bg-teal-50 rounded-xl p-3 text-sm">
                <p><strong>Paciente:</strong> {patient?.nombre} {patient?.apellido}</p>
                <p><strong>Paquete:</strong> {pkg?.nombre} ({pkg?.sesiones_realizadas}/{pkg?.cantidad_sesiones} sesiones)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Profesional *" value={state.createData.id_profesional || ''} onChange={(e) => updateCreateData('id_profesional', Number(e.target.value))}
                  options={professionals.filter(p => p.estado).map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido} - ${p.especialidad}` }))}
                  error={state.errors.id_profesional} />
                <Input label="Fecha *" type="date" value={state.createData.fecha} onChange={(e) => updateCreateData('fecha', e.target.value)} error={state.errors.fecha} />
                <Input label="Hora Inicio *" type="time" value={state.createData.horario_inicio} onChange={(e) => updateCreateData('horario_inicio', e.target.value)} error={state.errors.horario_inicio} />
                <Input label="Hora Fin *" type="time" value={state.createData.horario_fin} onChange={(e) => updateCreateData('horario_fin', e.target.value)} error={state.errors.horario_fin} />
              </div>
              <Textarea label="Observaciones" value={state.createData.observaciones} onChange={(e) => updateCreateData('observaciones', e.target.value)} rows={2} />
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button variant="ghost" onClick={() => goStep('create-step2-package')}><ArrowLeft className="w-4 h-4 mr-1" />Atras</Button>
                <Button onClick={handleDetailsNext}>Revisar <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          </Modal>
        );

      // ---- CREATE STEP 4: Confirm ----
      case 'create-step4-confirm':
        return (
          <Modal isOpen onClose={() => goStep('closed')} title="Confirmar Cita" size="md">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <span className="text-sm font-semibold text-gray-700">Revise los datos antes de confirmar</span>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-gray-400 font-semibold">Paciente</p><p className="font-bold text-gray-800">{patient?.nombre} {patient?.apellido}</p></div>
                  <div><p className="text-xs text-gray-400 font-semibold">Profesional</p><p className="font-bold text-gray-800">{professional?.nombre} {professional?.apellido}</p></div>
                  <div><p className="text-xs text-gray-400 font-semibold">Fecha</p><p className="font-bold text-gray-800">{state.createData.fecha}</p></div>
                  <div><p className="text-xs text-gray-400 font-semibold">Horario</p><p className="font-bold text-gray-800">{state.createData.horario_inicio} - {state.createData.horario_fin}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-400 font-semibold">Paquete</p><p className="font-bold text-teal-700">{pkg?.nombre} (Sesion #{(pkg?.sesiones_realizadas || 0) + 1})</p></div>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button variant="ghost" onClick={() => goStep('create-step3-details')}><ArrowLeft className="w-4 h-4 mr-1" />Atras</Button>
                <Button onClick={handleCreateConfirm} isLoading={saving}>
                  <CheckCircle className="w-4 h-4 mr-2" />Confirmar Cita
                </Button>
              </div>
            </div>
          </Modal>
        );

      // ---- EDIT APPOINTMENT ----
      case 'edit-appointment':
        return (
          <Modal isOpen onClose={() => goStep('view-appointment')} title="Editar Cita" size="lg">
            <div className="space-y-4">
              {state.collisionWarning && <Alert type="warning" title="Conflicto de agenda" message={state.collisionWarning} />}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Profesional *" value={state.createData.id_profesional || ''} onChange={(e) => updateCreateData('id_profesional', Number(e.target.value))}
                  options={professionals.filter(p => p.estado).map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido} - ${p.especialidad}` }))}
                  error={state.errors.id_profesional} />
                <Input label="Fecha *" type="date" value={state.createData.fecha} onChange={(e) => updateCreateData('fecha', e.target.value)} error={state.errors.fecha} />
                <Input label="Hora Inicio *" type="time" value={state.createData.horario_inicio} onChange={(e) => updateCreateData('horario_inicio', e.target.value)} error={state.errors.horario_inicio} />
                <Input label="Hora Fin *" type="time" value={state.createData.horario_fin} onChange={(e) => updateCreateData('horario_fin', e.target.value)} error={state.errors.horario_fin} />
              </div>
              <Textarea label="Observaciones" value={state.createData.observaciones} onChange={(e) => updateCreateData('observaciones', e.target.value)} rows={2} />
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => goStep('view-appointment')}>Cancelar</Button>
                <Button onClick={() => goStep('edit-confirm')}>Guardar Cambios</Button>
              </div>
            </div>
          </Modal>
        );

      // ---- EDIT CONFIRM ----
      case 'edit-confirm':
        return (
          <Modal isOpen onClose={() => goStep('edit-appointment')} title="Confirmar Cambios" size="sm">
            <p className="text-sm text-gray-600 mb-6">¿Desea guardar los cambios realizados en esta cita?</p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button variant="secondary" onClick={() => goStep('edit-appointment')} className="w-full sm:w-auto">Volver</Button>
              <Button onClick={handleEditConfirm} isLoading={saving} className="w-full sm/w-auto">
                <CheckCircle className="w-4 h-4 mr-2" />Confirmar
              </Button>
            </div>
          </Modal>
        );

      // ---- CANCEL CONFIRM ----
      case 'cancel-confirm':
        return (
          <Modal isOpen onClose={() => goStep('view-appointment')} title="Cancelar Cita" size="sm">
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <p className="text-sm text-gray-700 mb-2">¿Esta seguro de cancelar esta cita?</p>
              {apt && (
                <p className="text-xs text-gray-400 mb-6">{apt.paciente?.nombre} {apt.paciente?.apellido} - {apt.fecha?.split('T')[0]} {apt.horario_inicio}</p>
              )}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button variant="secondary" onClick={() => goStep('view-appointment')} className="w-full sm:w-auto">No, volver</Button>
                <Button variant="danger" onClick={handleCancelConfirm} isLoading={saving} className="w-full sm:w-auto">
                  <XCircle className="w-4 h-4 mr-2" />Si, cancelar
                </Button>
              </div>
            </div>
          </Modal>
        );

      // ---- PAYMENT STEP 1 ----
      case 'payment-step1':
        return (
          <Modal isOpen onClose={() => goStep('view-appointment')} title="Registrar Pago" size="md">
            <div className="space-y-4">
              {apt && (
                <div className="bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-xl p-4 text-sm">
                  <p><strong>Cita:</strong> #{apt.id} - {apt.fecha?.split('T')[0]} {apt.horario_inicio}</p>
                  <p><strong>Paciente:</strong> {apt.paciente?.nombre} {apt.paciente?.apellido}</p>
                  {apt.paquete && <p><strong>Paquete:</strong> {apt.paquete.nombre}</p>}
                </div>
              )}
              <Input label="Valor *" type="number" min={1} value={state.paymentData.valor || ''} onChange={(e) => updatePayment('valor', Number(e.target.value))} placeholder="0" />
              <Select label="Metodo de Pago *" value={state.paymentData.metodo_pago} onChange={(e) => updatePayment('metodo_pago', e.target.value)} options={PAYMENT_METHODS} />
              <Input label="Observaciones" value={state.paymentData.observaciones} onChange={(e) => updatePayment('observaciones', e.target.value)} />
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button variant="ghost" onClick={() => goStep('view-appointment')}><ArrowLeft className="w-4 h-4 mr-1" />Atras</Button>
                <Button onClick={() => {
                  if (state.paymentData.valor <= 0) { toast.error('El valor debe ser mayor a 0'); return; }
                  goStep('payment-step2-confirm');
                }}>Revisar <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          </Modal>
        );

      // ---- PAYMENT CONFIRM ----
      case 'payment-step2-confirm':
        return (
          <Modal isOpen onClose={() => goStep('payment-step1')} title="Confirmar Pago" size="sm">
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-500">Revise los datos del pago:</p>
              <div className="bg-gradient-to-r from-gray-50 to-emerald-50/30 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Valor:</span><span className="font-bold text-gray-900">${state.paymentData.valor.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Metodo:</span><span className="font-bold text-gray-900">{state.paymentData.metodo_pago}</span></div>
                {state.paymentData.observaciones && <div className="flex justify-between"><span className="text-gray-500">Obs:</span><span className="text-gray-700">{state.paymentData.observaciones}</span></div>}
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button variant="secondary" onClick={() => goStep('payment-step1')} className="w-full sm:w-auto">Volver</Button>
              <Button onClick={handlePaymentConfirm} isLoading={saving} className="w-full sm:w-auto">
                <DollarSign className="w-4 h-4 mr-2" />Confirmar Pago
              </Button>
            </div>
          </Modal>
        );

      default:
        return null;
    }
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="space-y-3 md:space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="p-2 md:p-2.5 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl md:rounded-2xl text-white shadow-lg shadow-teal-500/20">
            <Calendar className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Calendario</h1>
            <p className="text-xs md:text-sm text-gray-400">
              {viewMode === 'month' ? format(currentDate, 'MMMM yyyy', { locale: es }) :
                viewMode === 'week' ? `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 as const }), 'd MMM', { locale: es })}` :
                  format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1">
            <button onClick={goPrev} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><ChevronLeft className="w-5 h-5" /></button>
            <Button variant="secondary" size="sm" onClick={goToday} className="font-bold text-xs">Hoy</Button>
            <button onClick={goNext} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="flex gap-0.5 bg-gray-100 rounded-xl p-0.5 ml-auto sm:ml-0">
            {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-semibold transition-all ${viewMode === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
          <Button onClick={() => handleSlotClick(format(currentDate, 'yyyy-MM-dd'), 8)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /><span className="hidden sm:inline">Nueva Cita</span>
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 md:gap-4 text-[10px] md:text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-teal-100 border border-teal-300" />Con paquete</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />Confirmada</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />Programada</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />Completada</div>
      </div>

      {/* Calendar Views */}
      {loading ? (
        <Card className="p-10"><div className="animate-pulse bg-gray-200 rounded-2xl h-96" /></Card>
      ) : (
        <>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </>
      )}

      {/* Modals */}
      {renderModals()}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function endOfWeek(date: Date): Date {
  const start = startOfWeek(date, { weekStartsOn: 1 as const });
  return addDays(start, 6);
}
