// ============================================================
// patients/PatientsPage.tsx
// ============================================================

import {
  useState,
  useEffect,
  useCallback,
  useDeferredValue,
} from 'react';

import toast from 'react-hot-toast';

import {
  patientService,
  cie10Service,
} from '../../data-access/services';

import {
  Patient,
  PatientCreateDTO,
  Cie10,
  PaginationParams,
} from '../../domain/models';

import {
  patientSchema,
  PatientFormData,
} from '../../domain/schemas';

import {
  Card,
  TableSkeleton,
  EmptyState,
  PageHeader,
  PaginationControls,
  Button,
} from '../../components/ui/Components';

import {
  Users,
  Plus,
} from 'lucide-react';

import { usePaginatedResource } from '../../hooks/usePaginatedResource';

import { PatientsFilters } from './components/PatientsFilters';
import { PatientsTable } from './components/PatientsTable';
import { PatientFormModal } from './components/PatientFormModal';
import { PatientDetailModal } from './components/PatientDetailModal';
import { PatientDeleteDialog } from './components/PatientDeleteDialog';

const emptyForm: PatientFormData = {
  tipo_doc: 'CC',

  num_doc: '',

  nombre: '',
  apellido: '',

  fecha_nacimiento: '',

  telefono: '',
  telefono_secundario: '',

  email: '',

  direccion: '',

  genero: 'O',

  zona: 'U',

  procedencia: '',

  ocupacion: '',

  eps: '',

  regimen: '',

  modalidad_deportiva: '',

  red_apoyo: false,

  antecedentes: 'Sin antecedentes registrados',

  antecedentes_personales: '',

  antecedentes_patologicos: '',

  antecedentes_quirurgicos: '',

  antecedentes_traumaticos: '',

  antecedentes_farmacologicos: '',

  antecedentes_familiares: '',

  antecedentes_sociales: '',

  id_cie: null,
};


export default function PatientsPage() {
  const fetchPatients = useCallback(
    (params: PaginationParams, signal?: AbortSignal) =>
      patientService.getPaginated(params, signal),
    []
  );

  const {
    data: patients,
    pagination,
    loading,
    error,
    page,
    limit,
    search,
    setPage,
    setLimit,
    setSearch,
    refresh: loadPatients,
  } = usePaginatedResource<Patient>({
    fetcher: fetchPatients,
  });

  // ============================================================
  // State
  // ============================================================

  const [modalOpen, setModalOpen] = useState(false);

  const [editingPatient, setEditingPatient] =
    useState<Patient | null>(null);

  const [viewingPatient, setViewingPatient] =
    useState<Patient | null>(null);

  const [confirmDelete, setConfirmDelete] =
    useState<number | null>(null);

  const [saving, setSaving] = useState(false);

  const [cie10List, setCie10List] = useState<Cie10[]>([]);

  const [form, setForm] =
    useState<PatientFormData>(emptyForm);

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [searchInput, setSearchInput] =
    useState(search);

  const deferredSearch =
    useDeferredValue(searchInput);

  // ============================================================
  // Effects
  // ============================================================

  const loadCie10 = useCallback(async () => {
    try {
      const data = await cie10Service.getAll();
      setCie10List(data || []);
    } catch { }
  }, []);

  useEffect(() => {
    loadCie10();
  }, [loadCie10]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== deferredSearch) {
        setPage(1);
        setSearch(deferredSearch);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [deferredSearch, search]);

  // ============================================================
  // Handlers
  // ============================================================

  const openCreate = useCallback(() => {
    setEditingPatient(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((patient: Patient) => {
    setEditingPatient(patient);

    setForm({
      tipo_doc: patient.tipo_doc,

      num_doc: patient.num_doc,

      nombre: patient.nombre,

      apellido: patient.apellido,

      fecha_nacimiento:
        patient.fecha_nacimiento.split('T')[0],

      telefono: patient.telefono,

      telefono_secundario:
        patient.telefono_secundario || '',

      email: patient.email || '',

      direccion: patient.direccion || '',

      genero: patient.genero || 'O',

      zona: patient.zona || 'U',

      procedencia:
        patient.procedencia || '',

      ocupacion:
        patient.ocupacion || '',

      eps: patient.eps || '',

      regimen:
        patient.regimen || '',

      modalidad_deportiva:
        patient.modalidad_deportiva || '',

      red_apoyo:
        patient.red_apoyo || false,

      antecedentes:
        patient.antecedentes ||
        '',

      antecedentes_personales:
        patient.antecedentes_personales || '',

      antecedentes_patologicos:
        patient.antecedentes_patologicos || '',

      antecedentes_quirurgicos:
        patient.antecedentes_quirurgicos || '',

      antecedentes_traumaticos:
        patient.antecedentes_traumaticos || '',

      antecedentes_farmacologicos:
        patient.antecedentes_farmacologicos || '',

      antecedentes_familiares:
        patient.antecedentes_familiares || '',

      antecedentes_sociales:
        patient.antecedentes_sociales || '',

      id_cie: patient.id_cie || null,
    });

    setErrors({});
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await patientService.delete(id);

        toast.success(
          'Paciente desactivado correctamente'
        );

        loadPatients();
      } catch (err: any) {
        toast.error(
          err?.message ||
          'Error al desactivar paciente'
        );
      }
    },
    [loadPatients]
  );

  const handleSubmit = useCallback(async () => {
    const result =
      patientSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Record<
        string,
        string
      > = {};

      result.error.issues.forEach(
        (err: any) => {
          fieldErrors[String(err.path[0])] =
            err.message;
        }
      );

      setErrors(fieldErrors);
      return;
    }

    setSaving(true);

    try {
      if (editingPatient) {
        await patientService.update({
          id: editingPatient.id,
          ...result.data,
        });

        toast.success(
          'Paciente actualizado'
        );
      } else {
        await patientService.create(
          result.data as PatientCreateDTO
        );

        toast.success(
          'Paciente creado exitosamente'
        );
      }

      setModalOpen(false);
      loadPatients();
    } catch (err: any) {
      toast.error(
        err?.message ||
        'Error al guardar paciente'
      );
    } finally {
      setSaving(false);
    }
  }, [
    form,
    editingPatient,
    loadPatients,
  ]);

  const updateField = useCallback(
    (field: string, value: any) => {
      setForm((prev: any) => ({
        ...prev,
        [field]: value,
      }));

      if (errors[field]) {
        setErrors((prev: any) => {
          const n = { ...prev };
          delete n[field];
          return n;
        });
      }
    },
    [errors]
  );

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users className="w-6 h-6" />}
        title="Pacientes"
        subtitle={`${pagination?.total ??
          patients.length
          } pacientes registrados`}
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Paciente
          </Button>
        }
      />

      <PatientsFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        error={error}
      />

      <Card>
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={
              <Users className="w-12 h-12" />
            }
            title="No hay pacientes"
            description={
              search
                ? 'No hay resultados para la búsqueda actual'
                : 'Comience registrando su primer paciente'
            }
            action={
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Paciente
              </Button>
            }
          />
        ) : (
          <PatientsTable
            patients={patients}
            onView={setViewingPatient}
            onEdit={openEdit}
            onDelete={setConfirmDelete}
          />
        )}

        {pagination && (
          <PaginationControls
            page={page}
            limit={limit}
            total={pagination.total}
            totalPages={
              pagination.totalPages
            }
            hasNextPage={
              pagination.hasNextPage
            }
            hasPreviousPage={
              pagination.hasPreviousPage
            }
            onPageChange={setPage}
            onLimitChange={setLimit}
            isLoading={loading}
          />
        )}
      </Card>

      <PatientFormModal
        isOpen={modalOpen}
        onClose={() =>
          setModalOpen(false)
        }
        editingPatient={editingPatient}
        form={form}
        errors={errors}
        saving={saving}
        cie10List={cie10List}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
      />

      <PatientDetailModal
        patient={viewingPatient}
        onClose={() =>
          setViewingPatient(null)
        }
      />

      <PatientDeleteDialog
        isOpen={!!confirmDelete}
        onClose={() =>
          setConfirmDelete(null)
        }
        onConfirm={() =>
          confirmDelete &&
          handleDelete(confirmDelete)
        }
      />
    </div>
  );
}

