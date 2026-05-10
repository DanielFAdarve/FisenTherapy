// ============================================================
// FISENT - PACIENTES PAGE (UI Mejorada)
// ============================================================
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { patientService, cie10Service } from '../data-access/services';
import { Patient, PatientCreateDTO, Cie10, TipoDocumento, PaginationParams } from '../domain/models';
import { patientSchema, PatientFormData } from '../domain/schemas';
import {
  Card, Button, Input, Select, Textarea, Modal, Badge, TableSkeleton,
  EmptyState, ConfirmDialog, PageHeader, SearchInput, Avatar, PaginationControls, Alert,
} from '../components/ui/Components';
import { Users, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePaginatedResource } from '../hooks/usePaginatedResource';

const TIPO_DOC_OPTIONS = [
  { value: 'CC', label: 'Cedula de Ciudadania' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cedula de Extranjeria' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
];

const emptyForm: PatientFormData = {
  tipo_doc: 'CC' as TipoDocumento,
  num_doc: '',
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  telefono: '',
  email: '',
  direccion: '',
  antecedentes: 'Sin antecedentes registrados',
  id_cie: null,
};

const avatarColors = ['teal', 'blue', 'purple', 'amber', 'emerald', 'rose'] as const;

export default function PatientsPage() {
  const fetchPatients = useCallback((params: PaginationParams, signal?: AbortSignal) => patientService.getPaginated(params, signal), []);
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
  } = usePaginatedResource<Patient>({ fetcher: fetchPatients });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<PatientFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cie10List, setCie10List] = useState<Cie10[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const loadCie10 = useCallback(async () => {
    try {
      const data = await cie10Service.getAll();
      setCie10List(data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadCie10(); }, [loadCie10]);

  const openCreate = () => {
    setEditingPatient(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setForm({
      tipo_doc: patient.tipo_doc,
      num_doc: patient.num_doc,
      nombres: patient.nombre,
      apellidos: patient.apellido,
      fecha_nacimiento: patient.fecha_nacimiento.split('T')[0],
      telefono: patient.telefono,
      email: patient.email || '',
      direccion: patient.direccion || '',
      antecedentes: patient.antecedentes || 'Sin antecedentes registrados',
      id_cie: patient.id_cie || null,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await patientService.delete(id);
      toast.success('Paciente desactivado correctamente');
      loadPatients();
    } catch (err: any) {
      toast.error(err?.message || 'Error al desactivar paciente');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = patientSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        fieldErrors[String(err.path[0])] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    try {
      if (editingPatient) {
        await patientService.update({ id: editingPatient.id, ...result.data });
        toast.success('Paciente actualizado');
      } else {
        await patientService.create(result.data as PatientCreateDTO);
        toast.success('Paciente creado exitosamente');
      }
      setModalOpen(false);
      loadPatients();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar paciente');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users className="w-6 h-6" />}
        title="Pacientes"
        subtitle={`${pagination?.total ?? patients.length} pacientes registrados`}
        action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Paciente</Button>}
      />

      <Card>
        <div className="p-4 space-y-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, apellido o documento..." />
          {error && <Alert type="error" title="Error al cargar pacientes" message={error} />}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="p-6"><TableSkeleton rows={8} /></div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title="No hay pacientes"
            description={search ? 'No hay resultados para la búsqueda actual' : 'Comience registrando su primer paciente'}
            action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Paciente</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Paciente</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Documento</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Contacto</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patients.map((p, i) => (
                  <tr key={p.id} className="hover:bg-teal-50/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${p.nombre} ${p.apellido}`} color={avatarColors[i % avatarColors.length]} />
                        <div>
                          <p className="font-semibold text-gray-900">{p.nombre} {p.apellido}</p>
                          <p className="text-xs text-gray-400 md:hidden">{p.tipo_doc} {p.num_doc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-md text-xs font-mono font-semibold text-gray-600 mr-1.5">{p.tipo_doc}</span>
                      <span className="text-sm text-gray-700 font-medium">{p.num_doc}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <p className="text-sm text-gray-600">{p.telefono}</p>
                      <p className="text-xs text-gray-400">{p.email || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant={p.estado ? 'success' : 'danger'}>
                        {p.estado ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewingPatient(p)} className="p-2 rounded-xl hover:bg-sky-50 text-sky-600 transition-colors" title="Ver detalle" aria-label="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(p)} className="p-2 rounded-xl hover:bg-amber-50 text-amber-600 transition-colors" title="Editar" aria-label="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(p.id)} className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors" title="Desactivar" aria-label="Desactivar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Tipo Documento *" value={form.tipo_doc} onChange={(e) => updateField('tipo_doc', e.target.value)} options={TIPO_DOC_OPTIONS} error={errors.tipo_doc} />
            <Input label="Numero Documento *" value={form.num_doc} onChange={(e) => updateField('num_doc', e.target.value)} error={errors.num_doc} />
            <Input label="Nombres *" value={form.nombres} onChange={(e) => updateField('nombres', e.target.value)} error={errors.nombres} />
            <Input label="Apellidos *" value={form.apellidos} onChange={(e) => updateField('apellidos', e.target.value)} error={errors.apellidos} />
            <Input label="Fecha Nacimiento *" type="date" value={form.fecha_nacimiento} onChange={(e) => updateField('fecha_nacimiento', e.target.value)} error={errors.fecha_nacimiento} />
            <Input label="Telefono *" value={form.telefono} onChange={(e) => updateField('telefono', e.target.value)} error={errors.telefono} />
            <Input label="Email" type="email" value={form.email || ''} onChange={(e) => updateField('email', e.target.value)} error={errors.email} />
            <Input label="Direccion" value={form.direccion || ''} onChange={(e) => updateField('direccion', e.target.value)} />
            <Select label="Diagnostico CIE10 (opcional)" value={form.id_cie || ''} onChange={(e) => updateField('id_cie', e.target.value ? Number(e.target.value) : null)} options={cie10List.map((c) => ({ value: c.id, label: `${c.codigo} - ${c.descripcion}` }))} className="sm:col-span-2" />
          </div>
          <Textarea label="Antecedentes" value={form.antecedentes} onChange={(e) => updateField('antecedentes', e.target.value)} rows={3} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving}>{editingPatient ? 'Actualizar' : 'Crear Paciente'}</Button>
          </div>
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal isOpen={!!viewingPatient} onClose={() => setViewingPatient(null)} title="Detalle del Paciente" size="md">
        {viewingPatient && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <Avatar name={`${viewingPatient.nombre} ${viewingPatient.apellido}`} size="lg" color="teal" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewingPatient.nombre} {viewingPatient.apellido}</h3>
                <p className="text-sm text-gray-400">{viewingPatient.tipo_doc} {viewingPatient.num_doc}</p>
              </div>
              <div className="ml-auto"><Badge variant={viewingPatient.estado ? 'success' : 'danger'}>{viewingPatient.estado ? 'Activo' : 'Inactivo'}</Badge></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Telefono', value: viewingPatient.telefono },
                { label: 'Email', value: viewingPatient.email || '—' },
                { label: 'Direccion', value: viewingPatient.direccion || '—' },
                { label: 'Nacimiento', value: viewingPatient.fecha_nacimiento?.split('T')[0] },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Antecedentes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{viewingPatient.antecedentes || 'Sin antecedentes'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title="Desactivar Paciente"
        message="Esta seguro de desactivar este paciente? Se realizara un borrado logico (estado=false)."
        confirmText="Desactivar"
        confirmVariant="danger"
      />
    </div>
  );
}
