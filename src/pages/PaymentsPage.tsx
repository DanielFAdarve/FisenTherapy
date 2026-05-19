// ============================================================
// FISENT - PAGOS PAGE (UI Mejorada)
// ============================================================
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { paymentService, packageService, appointmentService } from '../data-access/services';
import { Payment, PaymentCreateDTO, PaymentSummary, PaymentType, PaymentMethod } from '../domain/models';
import { paymentSchema, PaymentFormData } from '../domain/schemas';
import {
  Card, Button, Input, Select, Modal, Badge, TableSkeleton, EmptyState, StatCard, PageHeader, Alert,
} from '../components/ui/Components';
import { CreditCard, Plus, DollarSign, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PAYMENT_METHODS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'NEQUI', label: 'Nequi' },
  { value: 'DAVIPLATA', label: 'Daviplata' },
];

const emptyForm: PaymentFormData = {
  id_paquete: null,
  id_cita: null,
  valor: 0,
  metodo_pago: 'EFECTIVO' as PaymentMethod,
  fecha_pago: format(new Date(), 'yyyy-MM-dd'),
  observaciones: '',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PaymentFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>('PAQUETE');
  const [packages, setPackages] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pays, pkgs, appts] = await Promise.all([
        paymentService.getAll().catch(() => []),
        packageService.getAll().catch(() => []),
        appointmentService.getAll().catch(() => []),
      ]);
      setPayments(pays || []);
      setPackages(pkgs || []);
      setAppointments(appts || []);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar datos');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        if (paymentType === 'PAQUETE' && form.id_paquete) {
          const s = await paymentService.getSummary(Number(form.id_paquete));
          setSummary(s);
        } else if (paymentType === 'CITA' && form.id_cita) {
          const s = await paymentService.getSummary(undefined, Number(form.id_cita));
          setSummary(s);
        } else { setSummary(null); }
      } catch { setSummary(null); }
    };
    loadSummary();
  }, [paymentType, form.id_paquete, form.id_cita]);

  const openCreate = () => { setForm(emptyForm); setErrors({}); setPaymentType('PAQUETE'); setSummary(null); setModalOpen(true); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const dataWithTipo = { ...form, tipo: form.tipo || (form.id_paquete ? 'PAQUETE' : 'CITA') as PaymentType };
    const result = paymentSchema.safeParse(dataWithTipo);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => { fieldErrors[String(err.path[0])] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    if (dataWithTipo.tipo === 'PAQUETE' && summary) {
      if (summary.estado === 'PAGADO') { toast.error('Este paquete ya esta completamente pagado'); return; }
      if (form.valor > summary.saldo) { toast.error(`El valor excede el saldo pendiente ($${summary.saldo.toLocaleString()})`); return; }
    }
    setSaving(true);
    try {
      await paymentService.create(dataWithTipo as PaymentCreateDTO);
      toast.success('Pago registrado exitosamente');
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar pago');
    } finally { setSaving(false); }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CreditCard className="w-6 h-6" />}
        title="Pagos"
        subtitle="Registro y control de pagos"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Registrar Pago</Button>}
      />

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label="Total" value={`$${summary.total.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="blue" />
          <StatCard label="Abonado" value={`$${summary.abonado.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
          <StatCard label="Saldo" value={`$${summary.saldo.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color={summary.saldo > 0 ? 'amber' : 'emerald'} />
          <StatCard label="Estado" value={summary.estado} icon={<DollarSign className="w-5 h-5" />} color={summary.estado === 'PAGADO' ? 'emerald' : 'amber'} />
        </div>
      )}

      {loading ? (
        <Card className="p-6"><TableSkeleton rows={6} /></Card>
      ) : payments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CreditCard className="w-12 h-12" />}
            title="No hay pagos registrados"
            description="Registre el primer pago"
            action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Registrar Pago</Button>}
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Metodo</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Valor</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="px-5 py-3.5 text-gray-600 font-medium">{p.fecha_pago?.split('T')[0]}</td>
                    <td className="px-5 py-3.5"><Badge variant={p.tipo === 'PAQUETE' ? 'info' : 'neutral'}>{p.tipo}</Badge></td>
                    <td className="px-5 py-3.5 text-gray-600">{p.metodo_pago}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">${p.valor.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-gray-400 hidden md:table-cell truncate max-w-xs">{p.observaciones || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Pago" size="md">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setPaymentType('PAQUETE'); updateField('id_cita', null); }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${paymentType === 'PAQUETE' ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Pago por Paquete
            </button>
            <button type="button" onClick={() => { setPaymentType('CITA'); updateField('id_paquete', null); }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${paymentType === 'CITA' ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Pago por Cita
            </button>
          </div>

          {paymentType === 'PAQUETE' ? (
            <Select label="Paquete *" value={form.id_paquete || ''} onChange={(e) => updateField('id_paquete', e.target.value ? Number(e.target.value) : null)} options={packages.map((p) => ({ value: p.id, label: `${p.attentionPackage?.descripcion} - ${p.patient?.nombre || ''}` }))} error={errors.id_paquete} />
          ) : (
            <Select label="Cita *" value={form.id_cita || ''} onChange={(e) => updateField('id_cita', e.target.value ? Number(e.target.value) : null)} options={appointments.map((a) => ({ value: a.id, label: `#${a.id} - ${a.paciente?.nombres || ''} (${a.fecha?.split('T')[0]})` }))} error={errors.id_cita} />
          )}

          {summary && (
            <div className="bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-xl p-4 text-sm space-y-1.5">
              <p className="text-gray-500">Total: <strong className="text-gray-900">${summary.total.toLocaleString()}</strong></p>
              <p className="text-gray-500">Abonado: <strong className="text-emerald-600">${summary.abonado.toLocaleString()}</strong></p>
              <p className="text-gray-500">Saldo pendiente: <strong className="text-amber-600">${summary.saldo.toLocaleString()}</strong></p>
              {summary.estado === 'PAGADO' && <Alert type="success" message="Este paquete ya esta pagado" />}
            </div>
          )}

          <Input label="Valor *" type="number" min={1} value={form.valor || ''} onChange={(e) => updateField('valor', Number(e.target.value))} error={errors.valor} placeholder="0" />
          <Select label="Metodo de Pago *" value={form.metodo_pago} onChange={(e) => updateField('metodo_pago', e.target.value)} options={PAYMENT_METHODS} error={errors.metodo_pago} />
          <Input label="Fecha de Pago *" type="date" value={form.fecha_pago} onChange={(e) => updateField('fecha_pago', e.target.value)} error={errors.fecha_pago} />
          <Input label="Observaciones" value={form.observaciones || ''} onChange={(e) => updateField('observaciones', e.target.value)} />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving}>Registrar Pago</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
