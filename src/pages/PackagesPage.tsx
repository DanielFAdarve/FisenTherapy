// ============================================================
// FISENT - PAQUETES PAGE (UI Mejorada)
// ============================================================
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { packageService, patientService } from '../data-access/services';
import { Package as FisentPackage, PackageCreateDTO, Patient, PackageType } from '../domain/models';
import { packageSchema, PackageFormData } from '../domain/schemas';
import {
  Card, Button, Input, Select, Modal, Badge, TableSkeleton,
  EmptyState, PageHeader, SearchInput, ProgressBar, ConfirmDialog,
} from '../components/ui/Components';
import { Package, Plus, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const PACKAGE_TYPES = [
  { value: 'REHABILITACION', label: 'Rehabilitacion' },
  { value: 'TERAPIA', label: 'Terapia' },
  { value: 'EVALUACION', label: 'Evaluacion' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
];

const emptyForm: PackageFormData = {
  id_paciente: 0,
  tipo_paquete: 'REHABILITACION' as PackageType,
  nombre: '',
  cantidad_sesiones: 10,
  fecha_inicio: new Date().toISOString().split('T')[0],
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PackageFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgs, pts] = await Promise.all([
        packageService.getAll().catch(() => []),
        patientService.getAll().catch(() => []),
      ]);
      setPackages(pkgs || []);
      setPatients(pts || []);
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

  const openCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
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
    const duplicate = packages.find(
      (p) => p.id_paciente === form.id_paciente && p.tipo_paquete === form.tipo_paquete && p.estado === 'ACTIVO'
    );
    if (duplicate) {
      toast.error(`Ya existe un paquete activo de tipo "${form.tipo_paquete}" para este paciente`);
      return;
    }
    setSaving(true);
    try {
      await packageService.create(result.data as PackageCreateDTO);
      toast.success('Paquete creado exitosamente');
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear paquete');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id: number) => {
    try {
      await packageService.close(id);
      toast.success('Paquete cerrado correctamente');
      loadData();
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
              <div className={`h-1.5 bg-gradient-to-r ${
                pkg.tipo_paquete === 'REHABILITACION' ? 'from-teal-500 to-emerald-500' :
                pkg.tipo_paquete === 'TERAPIA' ? 'from-blue-500 to-sky-500' :
                pkg.tipo_paquete === 'EVALUACION' ? 'from-amber-500 to-orange-500' :
                'from-purple-500 to-violet-500'
              }`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{pkg.nombre}</h3>
                    <Badge variant={
                      pkg.tipo_paquete === 'REHABILITACION' ? 'success' :
                      pkg.tipo_paquete === 'TERAPIA' ? 'info' :
                      pkg.tipo_paquete === 'EVALUACION' ? 'warning' : 'purple'
                    }>{pkg.tipo_paquete}</Badge>
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
                    color={packageColors[pkg.tipo_paquete] || 'teal'}
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
            value={form.id_paciente || ''}
            onChange={(e) => updateField('id_paciente', Number(e.target.value))}
            options={patients.filter(p => p.estado).map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido} (${p.num_doc})` }))}
            error={errors.id_paciente}
          />
          <Select
            label="Tipo de Paquete *"
            value={form.tipo_paquete}
            onChange={(e) => updateField('tipo_paquete', e.target.value)}
            options={PACKAGE_TYPES}
            error={errors.tipo_paquete}
          />
          <Input
            label="Nombre del Paquete *"
            value={form.nombre}
            onChange={(e) => updateField('nombre', e.target.value)}
            error={errors.nombre}
            placeholder="Ej: Rehabilitacion lumbar"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cantidad Sesiones *" type="number" min={1} max={100} value={form.cantidad_sesiones} onChange={(e) => updateField('cantidad_sesiones', Number(e.target.value))} error={errors.cantidad_sesiones} />
            <Input label="Fecha Inicio *" type="date" value={form.fecha_inicio} onChange={(e) => updateField('fecha_inicio', e.target.value)} error={errors.fecha_inicio} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving}>Crear Paquete</Button>
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
