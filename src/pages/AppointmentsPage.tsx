// ============================================================
// FISENT - CITAS PAGE (UI Mejorada)
// ============================================================
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { appointmentService, patientService, professionalService, packageService } from '../data-access/services';
import { Appointment, AppointmentCreateDTO, Patient, Professional, Package as FisentPackage } from '../domain/models';
import { appointmentSchema, AppointmentFormData } from '../domain/schemas';
import {
  Card, Button, Input, Select, Textarea, Modal, Badge, TableSkeleton,
  EmptyState, PageHeader, Alert, ConfirmDialog, Avatar,
} from '../components/ui/Components';
import { Calendar, Plus, Edit2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const emptyForm: AppointmentFormData = {
  id_paciente: 0,
  id_profesional: 0,
  id_paquete: null,
  fecha: format(new Date(), 'yyyy-MM-dd'),
  horario_inicio: '08:00',
  horario_fin: '09:00',
  observaciones: '',
};

const avatarColors = ['teal', 'blue', 'purple', 'amber', 'emerald', 'rose'] as const;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [packages, setPackages] = useState<FisentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState<AppointmentFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appts, pts, pros, pkgs] = await Promise.all([
        appointmentService.getAll(filterDate).catch(() => []),
        patientService.getAll().catch(() => []),
        professionalService.getAll().catch(() => []),
        packageService.getAll().catch(() => []),
      ]);
      setAppointments(appts || []);
      setPatients(pts || []);
      setProfessionals(pros || []);
      setPackages(pkgs || []);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingAppt(null);
    setForm({ ...emptyForm, fecha: filterDate });
    setErrors({});
    setCollisionWarning(null);
    setModalOpen(true);
  };

  const openEdit = (apt: Appointment) => {
    setEditingAppt(apt);
    setForm({
      id_paciente: apt.id_paciente,
      id_profesional: apt.id_profesional,
      id_paquete: apt.id_paquete || null,
      fecha: apt.fecha.split('T')[0],
      horario_inicio: apt.horario_inicio,
      horario_fin: apt.horario_fin,
      observaciones: apt.observaciones || '',
    });
    setErrors({});
    setCollisionWarning(null);
    setModalOpen(true);
  };

  const checkCollision = useCallback(async () => {
    if (!form.id_profesional || !form.fecha || !form.horario_inicio || !form.horario_fin) return;
    try {
      const result = await appointmentService.checkCollision(form.fecha, form.id_profesional, form.horario_inicio, form.horario_fin);
      if (result.collision) {
        setCollisionWarning('El profesional ya tiene citas en ese horario');
      } else {
        setCollisionWarning(null);
      }
    } catch {
      const collision = appointments.find((a) =>
        a.id_profesional === form.id_profesional &&
        a.fecha.split('T')[0] === form.fecha &&
        a.id !== editingAppt?.id &&
        a.estado !== 'CANCELADA' &&
        a.horario_inicio < form.horario_fin &&
        a.horario_fin > form.horario_inicio
      );
      if (collision) {
        setCollisionWarning(`Colision: cita con ${collision.paciente?.nombre} a las ${collision.horario_inicio}`);
      } else {
        setCollisionWarning(null);
      }
    }
  }, [form, appointments, editingAppt]);

  useEffect(() => { if (modalOpen) checkCollision(); }, [form.fecha, form.horario_inicio, form.horario_fin, form.id_profesional, modalOpen, checkCollision]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = appointmentSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => { fieldErrors[String(err.path[0])] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    const collision = appointments.find((a) =>
      a.id_profesional === form.id_profesional && a.fecha.split('T')[0] === form.fecha &&
      a.id !== editingAppt?.id && a.estado !== 'CANCELADA' &&
      a.horario_inicio < form.horario_fin && a.horario_fin > form.horario_inicio
    );
    if (collision) {
      toast.error('Conflicto de agenda: el profesional ya tiene una cita en ese horario');
      return;
    }
    if (form.id_paquete) {
      const pkg = packages.find((p) => p.id === form.id_paquete);
      if (!pkg) { toast.error('Paquete no encontrado'); return; }
      if (pkg.estado !== 'ACTIVO') { toast.error('El paquete debe estar activo'); return; }
      if (pkg.sesiones_realizadas >= pkg.cantidad_sesiones) { toast.error('Sesiones consumidas'); return; }
    }
    setSaving(true);
    try {
      if (editingAppt) {
        await appointmentService.update({ id: editingAppt.id, ...result.data as AppointmentCreateDTO });
        toast.success('Cita actualizada');
      } else {
        await appointmentService.create(result.data as AppointmentCreateDTO);
        toast.success('Cita agendada exitosamente');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar cita');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await appointmentService.cancel(id);
      toast.success('Cita cancelada');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al cancelar cita');
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const patientPackages = packages.filter((p) => p.id_paciente === form.id_paciente && p.estado === 'ACTIVO');

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Calendar className="w-6 h-6" />}
        title="Citas"
        subtitle={`${appointments.length} citas para esta fecha`}
        action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Agendar Cita</Button>}
      />

      <Card>
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="max-w-xs" />
        </div>
      </Card>

      {loading ? (
        <Card className="p-6"><TableSkeleton rows={6} /></Card>
      ) : appointments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No hay citas para esta fecha"
            description="Agende una nueva cita para comenzar"
            action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Agendar Cita</Button>}
          />
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-gray-50">
            {appointments.map((apt, i) => (
              <div key={apt.id} className="px-5 py-4 flex items-center justify-between hover:bg-teal-50/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[64px] bg-gray-50 rounded-xl p-2">
                    <p className="text-lg font-extrabold text-gray-900">{apt.horario_inicio}</p>
                    <p className="text-[10px] text-gray-400 font-semibold">{apt.horario_fin}</p>
                  </div>
                  <Avatar name={`${apt.paciente?.nombre || ''} ${apt.paciente?.apellido || ''}`} color={avatarColors[i % avatarColors.length]} />
                  <div>
                    <p className="font-semibold text-gray-900">{apt.paciente?.nombre} {apt.paciente?.apellido}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {apt.profesional?.nombre} {apt.profesional?.apellido}
                      {apt.numero_sesion && <span className="ml-2 text-teal-600 font-semibold">Sesion #{apt.numero_sesion}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    apt.estado === 'CONFIRMADA' ? 'success' :
                    apt.estado === 'PROGRAMADA' ? 'info' :
                    apt.estado === 'COMPLETADA' ? 'success' :
                    apt.estado === 'CANCELADA' ? 'danger' : 'warning'
                  }>{apt.estado}</Badge>
                  {apt.estado !== 'CANCELADA' && apt.estado !== 'COMPLETADA' && (
                    <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(apt)} className="p-2 rounded-xl hover:bg-amber-50 text-amber-600" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmCancel(apt.id)} className="p-2 rounded-xl hover:bg-red-50 text-red-500" title="Cancelar">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingAppt ? 'Editar Cita' : 'Agendar Cita'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {collisionWarning && <Alert type="warning" title="Conflicto de agenda" message={collisionWarning} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Paciente *" value={form.id_paciente || ''} onChange={(e) => updateField('id_paciente', Number(e.target.value))} options={patients.filter(p => p.estado).map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido}` }))} error={errors.id_paciente} />
            <Select label="Profesional *" value={form.id_profesional || ''} onChange={(e) => updateField('id_profesional', Number(e.target.value))} options={professionals.filter(p => p.estado).map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido} - ${p.especialidad}` }))} error={errors.id_profesional} />
          </div>
          {patientPackages.length > 0 && (
            <Select label="Paquete (opcional)" value={form.id_paquete || ''} onChange={(e) => updateField('id_paquete', e.target.value ? Number(e.target.value) : null)} options={patientPackages.map((p) => ({ value: p.id, label: `${p.nombre} (${p.sesiones_realizadas}/${p.cantidad_sesiones})` }))} />
          )}
          <Input label="Fecha *" type="date" value={form.fecha} onChange={(e) => updateField('fecha', e.target.value)} error={errors.fecha} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Hora Inicio *" type="time" value={form.horario_inicio} onChange={(e) => updateField('horario_inicio', e.target.value)} error={errors.horario_inicio} />
            <Input label="Hora Fin *" type="time" value={form.horario_fin} onChange={(e) => updateField('horario_fin', e.target.value)} error={errors.horario_fin} />
          </div>
          <Textarea label="Observaciones" value={form.observaciones || ''} onChange={(e) => updateField('observaciones', e.target.value)} rows={2} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving}>{editingAppt ? 'Actualizar Cita' : 'Agendar Cita'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => confirmCancel && handleCancel(confirmCancel)}
        title="Cancelar Cita"
        message="Esta seguro de cancelar esta cita?"
        confirmText="Cancelar Cita"
        confirmVariant="danger"
      />
    </div>
  );
}
