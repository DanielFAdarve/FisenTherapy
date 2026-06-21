// ============================================================
// appointments/AppointmentsPage.tsx
// ============================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  appointmentService,
  packageService,
  cie10Service,
  professionalService,
} from '../../data-access/services';

import {
  Appointment,
  AppointmentCreateDTO,
  Cie10,
  Package as FisentPackage,
  PaginationParams,
  Patient,
  Professional,
} from '../../domain/models';

import {
  appointmentSchema,
  packageSchema,
  AppointmentFormData,
} from '../../domain/schemas';

import {
  Alert,
  Button,
  Card,
  EmptyState,
  PageHeader,
  PaginationControls,
  TableSkeleton,
} from '../../components/ui/Components';

import { usePaginatedResource } from '../../hooks/usePaginatedResource';
import { AppointmentsFilters } from './components/AppointmentsFilters';
import { AppointmentsList } from './components/AppointmentsList';
import { AppointmentFormModal } from './components/AppointmentFormModal';
import { AppointmentCancelDialog } from './components/AppointmentCancelDialog';

const today = () => format(new Date(), 'yyyy-MM-dd');

const emptyForm: AppointmentFormData = {
  id_paciente: 0,
  id_profesional: 0,
  id_paquete: null,
  fecha: today(),
  horario_inicio: '08:00',
  horario_fin: '09:00',
  observaciones: '',
};

const toMinutes = (value?: string) => {
  const [hours = '0', minutes = '0'] = (value || '').split(':');
  return Number(hours) * 60 + Number(minutes);
};

const hasScheduleCollision = (
  appointments: Appointment[],
  form: AppointmentFormData,
  editingId?: number
) => appointments.some((appointment) =>
  appointment.id_profesional === form.id_profesional &&
  appointment.fecha.split('T')[0] === form.fecha &&
  appointment.id !== editingId &&
  appointment.estado !== 'CANCELADA' &&
  toMinutes(appointment.horario_inicio) < toMinutes(form.horario_fin) &&
  toMinutes(appointment.horario_fin) > toMinutes(form.horario_inicio)
);

const getAppointmentPackageId = (appointment: Appointment) =>
  Number(appointment.id_paquete ?? appointment.id_paquetes ?? appointment.paquete?.id ?? appointment.package?.id ?? 0) || null;

const getAppointmentPackage = (appointment: Appointment) => appointment.package ?? appointment.paquete ?? null;


const buildPackageFromAppointment = (appointment: Appointment): FisentPackage | null => {
  const packageId = getAppointmentPackageId(appointment);
  if (!packageId) return null;
  const source = getAppointmentPackage(appointment);
  const total = Number(appointment.sesiones_totales_paquete ?? source?.cantidad_sesiones ?? appointment.numero_sesion ?? 1);
  const used = Number(source?.sesiones_realizadas ?? appointment.numero_sesion ?? 0);
  const name = appointment.tipo_paquete || source?.nombre || source?.attentionPackage?.descripcion || `Paquete #${packageId}`;
  return {
    ...(source ?? {}),
    id: packageId,
    id_paquete: packageId,
    id_paciente: source?.id_paciente || appointment.id_paciente,
    id_pacientes: source?.id_pacientes || appointment.id_paciente,
    id_profesional: source?.id_profesional ?? appointment.id_profesional,
    tipo_paquete: source?.tipo_paquete || name,
    nombre: name,
    cantidad_sesiones: total,
    sesiones_realizadas: used,
    sesiones_disponibles: Math.max(total - used, 0),
    estado: source?.estado || 'ACTIVO',
    fecha_inicio: source?.fecha_inicio || '',
    created_at: source?.created_at || '',
    updated_at: source?.updated_at || '',
    tiene_cita_actual: true,
  } as FisentPackage;
};

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [filterDate, setFilterDate] = useState(today());
  const [searchInput, setSearchInput] = useState('');

  const fetchAppointments = useCallback(
    (params: PaginationParams, signal?: AbortSignal) =>
      appointmentService.getPaginated(
        {
          ...params,
          filters: {
            ...(params.filters ?? {}),
            fecha: filterDate,
          },
        },
        signal
      ),
    [filterDate]
  );

  const {
    data: appointments,
    pagination,
    loading,
    error,
    page,
    limit,
    search,
    setPage,
    setLimit,
    setSearch,
    refresh: loadAppointments,
  } = usePaginatedResource<Appointment>({
    fetcher: fetchAppointments,
    paramPrefix: 'appointments_',
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [packages, setPackages] = useState<FisentPackage[]>([]);
  const [packageCatalog, setPackageCatalog] = useState<FisentPackage[]>([]);
  const [cies, setCies] = useState<Cie10[]>([]);
  const [packageLoading, setPackageLoading] = useState(false);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [newPackage, setNewPackage] = useState({
    id_paquetes_atenciones: 0,
    id_cie_secundario: 0,
  });
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState<AppointmentFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const availabilityCache = useRef(new Map<string, Appointment[]>());

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchInput, setPage, setSearch]);

  const loadCatalogs = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);

    try {
      const [pros] = await Promise.allSettled([
        professionalService.getAll(),
      ]);

      setProfessionals(pros.status === 'fulfilled' ? pros.value || [] : []);

      const failedCatalogs = [
        pros.status === 'rejected' ? 'profesionales' : null,
      ].filter(Boolean);

      if (failedCatalogs.length > 0) {
        setCatalogError(`No se pudieron cargar: ${failedCatalogs.join(', ')}`);
      }
    } catch (err: any) {
      setCatalogError(err?.message || 'Error al cargar datos de apoyo');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);



  const openCreate = useCallback(() => {
    setEditingAppt(null);
    setForm({ ...emptyForm, fecha: filterDate });
    setErrors({});
    setCollisionWarning(null);
    setPackages([]);
    setPackageError(null);
    setNewPackage({ id_paquetes_atenciones: 0, id_cie_secundario: 0 });
    setModalOpen(true);
  }, [filterDate]);

  const openEdit = useCallback((appointment: Appointment) => {
    setEditingAppt(appointment);
    const selectedPackage = getAppointmentPackage(appointment) ?? buildPackageFromAppointment(appointment);
    const selectedPackageId = getAppointmentPackageId(appointment);
    const appointmentPatient = selectedPackage?.patient ?? selectedPackage?.paciente;

    if (appointmentPatient) {
      setPatients((current) => [appointmentPatient, ...current.filter((patient) => patient.id !== appointmentPatient.id)]);
    }
    if (selectedPackage) {
      setPackages((current) => [
        {
          ...selectedPackage,
          id: selectedPackageId ?? selectedPackage.id,
          id_paquete: selectedPackageId ?? selectedPackage.id_paquete,
          id_paciente: selectedPackage.id_paciente || appointment.id_paciente,
          id_pacientes: selectedPackage.id_pacientes || appointment.id_paciente,
          tiene_cita_actual: true,
        },
        ...current.filter((pkg) => pkg.id !== selectedPackageId),
      ]);
    }
    setForm({
      id_paciente: appointment.id_paciente,
      id_profesional: appointment.id_profesional,
      id_paquete: selectedPackageId,
      fecha: appointment.fecha.split('T')[0],
      horario_inicio: appointment.horario_inicio.slice(0, 5),
      horario_fin: appointment.horario_fin.slice(0, 5),
      observaciones: appointment.observaciones || '',
    });
    setErrors({});
    setCollisionWarning(null);
    setPackageError(null);
    setModalOpen(true);
  }, []);

  const getAvailability = useCallback(async (professionalId: number, date: string) => {
    const cacheKey = `${professionalId}:${date}`;
    const cached = availabilityCache.current.get(cacheKey);
    if (cached) return cached;

    const availableAppointments = await appointmentService.checkAvailability(professionalId, date);
    availabilityCache.current.set(cacheKey, availableAppointments);
    return availableAppointments;
  }, []);

  useEffect(() => {
    setCollisionWarning(null);
  }, [form.fecha, form.horario_fin, form.horario_inicio, form.id_profesional, modalOpen]);

  const updateField = useCallback((field: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: value,
      ...(field === 'id_paciente' && prev.id_paciente !== value ? { id_paquete: null } : {}),
    }));

    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const mergePatients = useCallback((foundPatients: Patient[]) => {
    setPatients((current) => {
      const merged = [...current];
      foundPatients.forEach((patient) => {
        if (!merged.some((item) => item.id === patient.id)) merged.push(patient);
      });
      return merged;
    });
  }, []);

  const mergeCies = useCallback((foundCies: Cie10[]) => {
    setCies((current) => {
      const merged = [...current];
      foundCies.forEach((cie) => {
        if (!merged.some((item) => item.id === cie.id)) merged.push(cie);
      });
      return merged;
    });
  }, []);

  const loadPackageCreationCatalogs = useCallback(async () => {
    if (packageCatalog.length > 0 && cies.length > 0) return;
    const [catalogResult, ciesResult] = await Promise.allSettled([
      packageService.getCatalog(undefined, 1, 50),
      cie10Service.getAll(undefined, 1, 50),
    ]);
    if (catalogResult.status === 'fulfilled') setPackageCatalog(catalogResult.value || []);
    if (ciesResult.status === 'fulfilled') setCies(ciesResult.value || []);
  }, [cies.length, packageCatalog.length]);

  useEffect(() => {
    if (modalOpen) {
      loadPackageCreationCatalogs();
    }
  }, [modalOpen, loadPackageCreationCatalogs]);
  
  const loadAvailablePackages = useCallback(async (patientId: number, quoteId?: number) => {
    if (!patientId) {
      setPackages([]);
      return;
    }
    setPackageLoading(true);
    setPackageError(null);
    try {
      const available = await packageService.getAvailableByPatient(patientId, quoteId);
      const currentPackage = editingAppt ? getAppointmentPackage(editingAppt) ?? buildPackageFromAppointment(editingAppt) : null;
      const currentPackageId = editingAppt ? getAppointmentPackageId(editingAppt) : null;
      const packagesWithCurrent = currentPackage && currentPackageId && !(available || []).some((pkg) => pkg.id === currentPackageId)
        ? [
          {
            ...currentPackage,
            id: currentPackageId,
            id_paquete: currentPackageId,
            id_paciente: currentPackage.id_paciente || patientId,
            id_pacientes: currentPackage.id_pacientes || patientId,
            tiene_cita_actual: true,
          },
          ...(available || []),
        ]
        : (available || []);
      setPackages(packagesWithCurrent);
      setForm((prev) => {
        if (!prev.id_paquete || packagesWithCurrent.some((pkg) => pkg.id === prev.id_paquete)) return prev;
        return { ...prev, id_paquete: null };
      });
    } catch (err: any) {
      setPackages([]);
      setPackageError(err?.message || 'No se pudieron cargar los paquetes disponibles del paciente');
    } finally {
      setPackageLoading(false);
    }
  }, [editingAppt]);

  useEffect(() => {
    if (!modalOpen || !form.id_paciente) return;
    loadAvailablePackages(form.id_paciente, editingAppt?.id);
  }, [editingAppt?.id, form.id_paciente, loadAvailablePackages, modalOpen]);
  const patientPackages = useMemo(
    () => packages.filter((p) =>
      p.id_paciente === form.id_paciente &&
      ((p.sesiones_disponibles ?? p.resumen_sesiones?.sesiones_disponibles ?? 0) > 0 || Boolean(p.tiene_cita_actual))
    ),
    [form.id_paciente, packages]
  );

  const handleCreatePackage = useCallback(async () => {
    if (!form.id_paciente) {
      toast.error('Seleccione un paciente antes de crear el paquete');
      return;
    }
    if (!form.id_profesional) {
      toast.error('Seleccione un profesional para asociar el paquete');
      return;
    }
    const payload = {
      id_pacientes: form.id_paciente,
      id_paquetes_atenciones: newPackage.id_paquetes_atenciones,
      id_profesional: form.id_profesional,
      id_cie_secundario: newPackage.id_cie_secundario || null,
      id_estado_citas: 1,
    };
    const result = packageSchema.safeParse(payload);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || 'Complete los datos del paquete');
      return;
    }
    setPackageLoading(true);
    try {
      const created = await packageService.create(result.data);
      toast.success('Paquete creado y seleccionado');
      setPackages((current) => [created, ...current.filter((pkg) => pkg.id !== created.id)]);
      setForm((prev) => ({
        ...prev,
        id_paquete: created.id,
        id_profesional: created.id_profesional || prev.id_profesional,
      }));
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo crear el paquete');
    } finally {
      setPackageLoading(false);
    }
  }, [editingAppt?.id, form.id_paciente, form.id_profesional, newPackage]);

  const handleSubmit = useCallback(async () => {
    const result = appointmentSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        fieldErrors[String(err.path[0])] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const pkg = packages.find((p) => p.id === result.data.id_paquete);
    if (!pkg) {
      toast.error('Seleccione un paquete disponible o cree uno para continuar');
      return;
    }
    if (pkg.resumen_sesiones?.completo && !pkg.tiene_cita_actual) {
      toast.error('El paquete seleccionado no tiene sesiones disponibles');
      return;
    }

    setSaving(true);

    try {
      if (editingAppt) {
        await appointmentService.update({
          id: editingAppt.id,
          ...(result.data as AppointmentCreateDTO),
        });
        toast.success('Cita actualizada');
      } else {
        await appointmentService.create(result.data as AppointmentCreateDTO);
        toast.success('Cita agendada exitosamente');
      }

      availabilityCache.current.clear();
      setModalOpen(false);
      loadAppointments();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar cita');
    } finally {
      setSaving(false);
    }
  }, [appointments, editingAppt, form, getAvailability, loadAppointments, packages]);

  const handleCancel = useCallback(async (id: number) => {
    try {
      await appointmentService.cancel(id);
      availabilityCache.current.clear();
      toast.success('Cita cancelada');
      loadAppointments();
    } catch (err: any) {
      toast.error(err?.message || 'Error al cancelar cita');
    }
  }, [loadAppointments]);

  const totalAppointments = pagination?.total ?? appointments.length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Calendar className="w-6 h-6" />}
        title="Citas"
        subtitle={`${totalAppointments} citas para ${filterDate}`}
        action={(
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Agendar Cita
          </Button>
        )}
      />

      <AppointmentsFilters
        filterDate={filterDate}
        onFilterDateChange={(date) => {
          setFilterDate(date);
          setPage(1);
        }}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        error={error || catalogError}
      />

      <Card>
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No hay citas"
            description={
              search
                ? 'No hay resultados para la búsqueda actual'
                : 'No hay citas para la fecha seleccionada'
            }
            action={(
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Agendar Cita
              </Button>
            )}
          />
        ) : (
          <AppointmentsList
            appointments={appointments}
            onEdit={openEdit}
            onCancel={setConfirmCancel}
            onOpenHistory={(appointment) => navigate(`/history?quote=${appointment.id}`)}
          />
        )}

        {pagination && (
          <PaginationControls
            page={page}
            limit={limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            onPageChange={setPage}
            onLimitChange={setLimit}
            isLoading={loading}
          />
        )}
      </Card>

      {catalogError && !modalOpen && (
        <Alert
          type="warning"
          title="Datos de apoyo incompletos"
          message={catalogError}
        />
      )}

      <AppointmentFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingAppointment={editingAppt}
        form={form}
        errors={errors}
        saving={saving}
        collisionWarning={collisionWarning}
        catalogLoading={catalogLoading || packageLoading}
        packageError={packageError}
        patients={patients}
        professionals={professionals}
        patientPackages={patientPackages}
        packageCatalog={packageCatalog}
        cies={cies}
        newPackage={newPackage}
        onNewPackageChange={(field, value) => setNewPackage((prev) => ({ ...prev, [field]: value }))}
        // onLoadPackageCatalogs={loadPackageCreationCatalogs}
        onCreatePackage={handleCreatePackage}
        onFieldChange={updateField}
        onPatientsFound={mergePatients}
        onCiesFound={mergeCies}
        onSubmit={handleSubmit}
      />

      <AppointmentCancelDialog
        isOpen={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => confirmCancel && handleCancel(confirmCancel)}
      />
    </div>
  );
}
