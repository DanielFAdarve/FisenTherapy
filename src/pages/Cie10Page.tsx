// ============================================================
// FISENT - CIE10 PAGE (UI Mejorada)
// ============================================================
import { useState, useEffect, FormEvent } from 'react';
import { cie10Service } from '../data-access/services';
import { Cie10, Cie10CreateDTO } from '../domain/models';
import { cie10Schema, Cie10FormData } from '../domain/schemas';
import {
  Card, Button, Input, Textarea, Modal, TableSkeleton, EmptyState, PageHeader, SearchInput, PaginationControls,
} from '../components/ui/Components';
import { BookOpen, Plus, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePaginatedResource } from '../hooks/usePaginatedResource';

const emptyForm: Cie10FormData = { codigo: '', descripcion: '' };

export default function Cie10Page() {
  const {
    data: cie10List,
    pagination,
    loading,
    error,
    page,
    limit,
    search,
    setPage,
    setLimit,
    setSearch,
    refresh: loadCie10,
  } = usePaginatedResource<Cie10>({
    fetcher: cie10Service.getPaginated,
    paramPrefix: 'cie10_',
  });
  const [searchInput, setSearchInput] = useState(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Cie10 | null>(null);
  const [form, setForm] = useState<Cie10FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput, setPage, setSearch]);

  const openCreate = () => { setEditingItem(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
  const openEdit = (item: Cie10) => { setEditingItem(item); setForm({ codigo: item.codigo, descripcion: item.descripcion }); setErrors({}); setModalOpen(true); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = cie10Schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => { fieldErrors[String(err.path[0])] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await cie10Service.update(editingItem.id, result.data as Partial<Cie10CreateDTO>);
        toast.success('CIE10 actualizado');
      } else {
        await cie10Service.create(result.data as Cie10CreateDTO);
        toast.success('CIE10 creado exitosamente');
      }
      setModalOpen(false);
      loadCie10();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar CIE10');
    } finally { setSaving(false); }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BookOpen className="w-6 h-6" />}
        title="Catalogo CIE10"
        subtitle={`${pagination?.total ?? cie10List.length} diagnosticos registrados`}
        action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Diagnostico</Button>}
      />

      <Card>
        <div className="p-4">
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Buscar por codigo o descripcion..." />
          {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
        </div>
      </Card>

      {loading ? (
        <Card className="p-6"><TableSkeleton rows={8} /></Card>
      ) : cie10List.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="w-12 h-12" />}
            title="No hay diagnosticos CIE10"
            description="Agregue diagnosticos al catalogo"
            action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Diagnostico</Button>}
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Codigo</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Descripcion</th>
                  {/* <th className="text-center px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estado</th> */}
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cie10List.map((c) => (
                  <tr key={c.id} className="hover:bg-teal-50/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg text-sm font-mono font-bold text-teal-700 border border-teal-100">{c.codigo}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">{c.descripcion}</td>
                    {/* <td className="px-5 py-3.5 text-center">
                      <Badge variant={c.estado ? 'success' : 'danger'}>{c.estado ? 'Activo' : 'Inactivo'}</Badge>
                    </td> */}
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => openEdit(c)} className="p-2 rounded-xl hover:bg-amber-50 text-amber-600 transition-colors opacity-60 group-hover:opacity-100" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Editar CIE10' : 'Nuevo Diagnostico CIE10'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input label="Codigo CIE10 *" value={form.codigo} onChange={(e) => updateField('codigo', e.target.value.toUpperCase())} error={errors.codigo} placeholder="Ej: M54.5" hint="Formato: A00.0 o A00" />
          <Textarea label="Descripcion *" value={form.descripcion} onChange={(e) => updateField('descripcion', e.target.value)} error={errors.descripcion} rows={3} placeholder="Ej: Lumbalgia inespecifica" />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving}>{editingItem ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
