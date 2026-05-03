// ============================================================
// FISENT - PROFESIONALES PAGE (UI Mejorada)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { professionalService } from '../data-access/services';
import { Professional } from '../domain/models';
import { Card, Badge, TableSkeleton, EmptyState, PageHeader, SearchInput, Avatar } from '../components/ui/Components';
import { Stethoscope, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const avatarColors = ['teal', 'blue', 'purple', 'amber', 'emerald', 'rose'] as const;

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await professionalService.getAll();
      setProfessionals(data || []);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar profesionales');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProfessionals(); }, [loadProfessionals]);

  const filtered = professionals.filter((p) =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.apellido.toLowerCase().includes(search.toLowerCase()) ||
    p.especialidad.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Stethoscope className="w-6 h-6" />}
        title="Profesionales"
        subtitle={`${professionals.length} profesionales registrados`}
      />

      <Card>
        <div className="p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o especialidad..." />
        </div>
      </Card>

      {loading ? (
        <Card className="p-6"><TableSkeleton rows={5} /></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Stethoscope className="w-12 h-12" />}
            title="No hay profesionales"
            description="No se encontraron profesionales registrados"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pro, i) => (
            <Card key={pro.id} className="p-0 overflow-hidden" hover>
              <div className={`h-1.5 bg-gradient-to-r ${
                i % 4 === 0 ? 'from-teal-500 to-emerald-500' :
                i % 4 === 1 ? 'from-blue-500 to-sky-500' :
                i % 4 === 2 ? 'from-purple-500 to-violet-500' :
                'from-amber-500 to-orange-500'
              }`} />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar name={`${pro.nombre} ${pro.apellido}`} size="lg" color={avatarColors[i % avatarColors.length]} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{pro.nombre} {pro.apellido}</h3>
                    <Badge variant="info">{pro.especialidad}</Badge>
                  </div>
                  <Badge variant={pro.estado ? 'success' : 'danger'}>{pro.estado ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{pro.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{pro.email}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
