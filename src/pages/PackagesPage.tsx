// ============================================================
// FISENT - PAQUETES PAGE (UI Mejorada)
// ============================================================
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { packageService, patientService, professionalService, cie10Service } from '../data-access/services';
import { Package as FisentPackage, PackageCreateDTO, Patient, Professional, Cie10 } from '../domain/models';
import { packageSchema, PackageFormData } from '../domain/schemas';
import {
  Card, Button, Select, Modal, Badge, TableSkeleton,
  EmptyState, PageHeader, SearchInput, ProgressBar, ConfirmDialog,
} from '../components/ui/Components';
import { Package, Plus, Lock } from 'lucide-react';
import toast from 'react-hot-toast';


const emptyForm: PackageFormData = {
  id_pacientes: 0,
  id_paquetes_atenciones: 0,
  id_profesional: 0,
  id_cie_secundario: null,
  id_estado_citas: 1,
};

const packageColors: Record<string, string> = {
  REHABILITACION: 'teal',
  TERAPIA: 'blue',
  EVALUACION: 'amber',
  MANTENIMIENTO: 'purple',
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<FisentPackage[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [catalog, setCatalog] = useState<FisentPackage[]>([]);
  const [cies, setCies] = useState<Cie10[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PackageFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const pkgs = await packageService.getAll().catch(() => []);
      setPackages(pkgs || []);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredPackages = packages.filter((p) =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.paciente?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    p.paciente?.num_doc?.includes(search)
  );

  const loadCreationSupport = useCallback(async () => {
    if (patients.length > 0 && professionals.length > 0 && catalog.length > 0 && cies.length > 0) return;
    setSupportLoading(true);
    try {
      const [pts, pros, catalogItems, ciesList] = await Promise.allSettled([
        patients.length > 0 ? Promise.resolve(patients) : patientService.getAll(),
        professionals.length > 0 ? Promise.resolve(professionals) : professionalService.getAll(),
        catalog.length > 0 ? Promise.resolve(catalog) : packageService.getCatalog(undefined, 1, 50),
        cies.length > 0 ? Promise.resolve(cies) : cie10Service.getAll(undefined, 1, 50),
      ]);
      if (pts.status === 'fulfilled') setPatients(pts.value || []);
      if (pros.status === 'fulfilled') setProfessionals(pros.value || []);
      if (catalogItems.status === 'fulfilled') setCatalog(catalogItems.value || []);
      if (ciesList.status === 'fulfilled') setCies(ciesList.value || []);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar datos de apoyo');
    } finally {
      setSupportLoading(false);
    }
  }, [catalog, cies, patients, professionals]);

  const openCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
    loadCreationSupport();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = packageSchema.safeParse(form);
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
      const created = await packageService.create(result.data as PackageCreateDTO);
      toast.success('Paquete creado exitosamente');
      setPackages((current) => [created, ...current.filter((pkg) => pkg.id !== created.id)]);
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear paquete');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id: number) => {
    try {
      const closed = await packageService.close(id);
      toast.success('Paquete cerrado correctamente');
      setPackages((current) => current.map((pkg) => (pkg.id === id ? closed : pkg)));
      setConfirmClose(null);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cerrar paquete');
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Package className="w-6 h-6" />}
        title="Paquetes de Atencion"
        subtitle={`${packages.length} paquetes registrados`}
        action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Paquete</Button>}
      />

      <Card>
        <div className="p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o paciente..." />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Card key={i} className="p-5"><TableSkeleton rows={2} /></Card>)
        ) : filteredPackages.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <EmptyState
                icon={<Package className="w-12 h-12" />}
                title="No hay paquetes"
                description="Asigne un paquete de atencion a un paciente"
                action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Paquete</Button>}
              />
            </Card>
          </div>
        ) : (
          filteredPackages.map((pkg) => (
            <Card key={pkg.id} className="p-0 overflow-hidden" hover>
              {/* Color bar top */}
              <div className="h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{pkg.nombre}</h3>
                    <Badge variant="info">{pkg.tipo_paquete_nombre || pkg.tipo_paquete}</Badge>
                  </div>
                  <Badge variant={pkg.estado === 'ACTIVO' ? 'success' : pkg.estado === 'CERRADO' ? 'neutral' : 'danger'}>
                    {pkg.estado}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Paciente</p>
                    <p className="text-sm font-semibold text-gray-800">{pkg.paciente?.nombre} {pkg.paciente?.apellido}</p>
                  </div>
                  <ProgressBar
                    value={pkg.sesiones_realizadas}
                    max={pkg.cantidad_sesiones}
                    color={packageColors[String(pkg.tipo_paquete)] || 'teal'}
                  />
                  <p className="text-xs text-gray-400">Inicio: {pkg.fecha_inicio?.split('T')[0]}</p>
                </div>
                {pkg.estado === 'ACTIVO' && (
                  <Button size="sm" variant="secondary" onClick={() => setConfirmClose(pkg.id)} className="w-full mt-4">
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    Cerrar Paquete
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Paquete" size="md">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Select
            label="Paciente *"
            value={form.id_pacientes || ''}
            onChange={(e) => updateField('id_pacientes', Number(e.target.value))}
            options={patients.filter(p => p.estado).map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido} (${p.num_doc})` }))}
            error={errors.id_pacientes}
          />
          <Select
            label="Tipo de paquete *"
            value={form.id_paquetes_atenciones || ''}
            onChange={(e) => updateField('id_paquetes_atenciones', Number(e.target.value))}
            options={catalog.map((pkg) => ({ value: pkg.id, label: `${pkg.descripcion || pkg.nombre} (${pkg.cantidad_sesiones} sesiones)` }))}
            error={errors.id_paquetes_atenciones}
          />
          <Select
            label="Profesional *"
            value={form.id_profesional || ''}
            onChange={(e) => updateField('id_profesional', Number(e.target.value))}
            options={professionals.filter(p => p.estado).map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido} - ${p.especialidad}` }))}
            error={errors.id_profesional}
          />
          <Select
            label="CIE secundario"
            value={form.id_cie_secundario || ''}
            onChange={(e) => updateField('id_cie_secundario', e.target.value ? Number(e.target.value) : null)}
            options={cies.map((cie) => ({ value: cie.id, label: `${cie.codigo} - ${cie.descripcion}` }))}
            error={errors.id_cie_secundario}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving || supportLoading}>Crear Paquete</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmClose}
        onClose={() => setConfirmClose(null)}
        onConfirm={() => confirmClose && handleClose(confirmClose)}
        title="Cerrar Paquete"
        message="Esta seguro de cerrar este paquete? No se podran agendar mas sesiones."
        confirmText="Cerrar"
        confirmVariant="danger"
      />
    </div>
  );
}
