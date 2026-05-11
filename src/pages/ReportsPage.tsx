// ============================================================
// FISENT - REPORTES PAGE
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { reportService } from '../data-access/services';
import { Card, StatCard, Badge, PageHeader, ProgressBar, Avatar, Skeleton } from '../components/ui/Components';
import { BarChart3, Users, Calendar, CreditCard, Package, TrendingUp, Clock, Target, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardReport, ReportPeriod } from '../domain/models';

const emptyReport: DashboardReport = {
  patients: { active: 0, inactive: 0, total: 0 },
  appointments: { completed: 0, scheduled: 0, cancelled: 0, noShow: 0, attendanceRate: 0 },
  sessions: { completed: 0, pending: 0, total: 0, completionRate: 0 },
  revenue: { total: 0, byMonth: [], byPaymentMethod: [] },
  packages: { total: 0, byType: [], nearCompletion: [] },
  professionals: { top: [] },
  recentPayments: [],
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [report, setReport] = useState<DashboardReport>(emptyReport);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dashboard = await reportService.getDashboard({ period });
      setReport(dashboard ?? emptyReport);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar reportes');
      setReport(emptyReport);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const maxRevenue = Math.max(...report.revenue.byMonth.map((item) => item.amount), 1);
  const totalAppointments = report.appointments.completed + report.appointments.scheduled + report.appointments.cancelled + report.appointments.noShow;
  const statusDistribution = [
    { label: 'Completadas', count: report.appointments.completed, color: 'bg-emerald-500' },
    { label: 'Programadas', count: report.appointments.scheduled, color: 'bg-blue-500' },
    { label: 'Canceladas', count: report.appointments.cancelled, color: 'bg-red-500' },
    { label: 'No asistio', count: report.appointments.noShow, color: 'bg-amber-500' },
  ].map((item) => ({ ...item, pct: totalAppointments > 0 ? (item.count / totalAppointments) * 100 : 0 }));
  const avatarColors = ['teal', 'blue', 'purple', 'amber', 'emerald', 'rose'] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader icon={<BarChart3 className="w-6 h-6" />} title="Reportes y Estadisticas" subtitle="Metricas consolidadas calculadas en backend" />
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${period === p ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Trimestre'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card className="p-6"><Skeleton className="h-72" /></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Pacientes Activos" value={report.patients.active} icon={<Users className="w-5 h-5" />} color="teal" trend={report.patients.inactive > 0 ? `${report.patients.inactive} inactivos` : undefined} />
            <StatCard label="Ingresos Totales" value={`$${report.revenue.total.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="emerald" />
            <StatCard label="Tasa de Asistencia" value={`${report.appointments.attendanceRate}%`} icon={<Target className="w-5 h-5" />} color={report.appointments.attendanceRate >= 80 ? 'emerald' : report.appointments.attendanceRate >= 60 ? 'amber' : 'red'} />
            <StatCard label="Sesiones Realizadas" value={report.sessions.completed} icon={<Clock className="w-5 h-5" />} color="blue" trend={`de ${report.sessions.total} programadas`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Ingresos por Mes</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Dataset agregado por backend</p>
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-600">${report.revenue.total.toLocaleString()}</p>
                </div>
                <div className="p-6">
                  {report.revenue.byMonth.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">Sin datos de pagos registrados</div>
                  ) : (
                    <div className="space-y-4">
                      {report.revenue.byMonth.map((item) => (
                        <div key={item.month} className="flex items-center gap-4">
                          <span className="text-xs font-mono font-bold text-gray-500 w-16">{item.month}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center px-3 transition-all duration-700" style={{ width: `${Math.max((item.amount / maxRevenue) * 100, 8)}%` }}>
                              <span className="text-xs font-bold text-white whitespace-nowrap">${item.amount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <Card>
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl"><Calendar className="w-5 h-5 text-blue-600" /></div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Estado de Citas</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{totalAppointments} totales</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {statusDistribution.map((status) => (
                  <div key={status.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-700">{status.label}</span>
                      <span className="text-sm font-bold text-gray-900">{status.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-full rounded-full ${status.color} transition-all duration-700`} style={{ width: `${status.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-teal-600" />Top Profesionales</h3>
              </div>
              <div className="p-4 space-y-2">
                {report.professionals.top.length === 0 ? <p className="text-center text-sm text-gray-400 py-6">Sin datos</p> : report.professionals.top.map((professional, i) => {
                  const name = `${professional.nombres ?? professional.nombre ?? ''} ${professional.apellidos ?? professional.apellido ?? ''}`.trim() || `Profesional ${professional.id}`;
                  return (
                    <div key={professional.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-white transition-colors">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>{i + 1}</span>
                      <Avatar name={name} size="sm" color={avatarColors[i % avatarColors.length]} />
                      <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{name}</span>
                      <Badge variant="info">{professional.appointments} citas</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-blue-600" />Paquetes por Tipo</h3>
              </div>
              <div className="p-6 space-y-3">
                {report.packages.byType.length === 0 ? <p className="text-center text-sm text-gray-400 py-6">Sin paquetes registrados</p> : report.packages.byType.map((item) => (
                  <div key={item.type} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" />
                    <span className="flex-1 text-sm font-semibold text-gray-700">{item.type}</span>
                    <span className="text-lg font-extrabold text-gray-900">{item.count}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between"><span className="text-sm font-bold text-gray-500">Total</span><span className="text-lg font-extrabold text-gray-900">{report.packages.total}</span></div>
              </div>
            </Card>

            <Card>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><CreditCard className="w-5 h-5 text-purple-600" />Metodos de Pago</h3>
              </div>
              <div className="p-6 space-y-3">
                {report.revenue.byPaymentMethod.length === 0 ? <p className="text-center text-sm text-gray-400 py-6">Sin pagos registrados</p> : report.revenue.byPaymentMethod.map((item) => (
                  <div key={item.method} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{item.method}</span>
                    <span className="text-sm font-bold text-gray-900">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-600" />Paquetes por Terminar</h3>
                <p className="text-xs text-gray-400 mt-0.5">Paquetes activos con 70%+ de sesiones consumidas</p>
              </div>
              <div className="p-4 space-y-3">
                {report.packages.nearCompletion.length === 0 ? <p className="text-center text-sm text-gray-400 py-6">No hay paquetes proximos a terminar</p> : report.packages.nearCompletion.map((pkg) => (
                  <div key={pkg.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-900">{pkg.nombre}</span>
                      <Badge variant={pkg.completionPercentage >= 90 ? 'danger' : 'warning'}>{pkg.completionPercentage}%</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{pkg.paciente?.nombres ?? pkg.paciente?.nombre} {pkg.paciente?.apellidos ?? pkg.paciente?.apellido}</p>
                    <ProgressBar value={pkg.sesionesRealizadas} max={pkg.cantidadSesiones} color={pkg.completionPercentage >= 90 ? 'red' : 'amber'} />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-600" />Pagos Recientes</h3></div>
              <div className="divide-y divide-gray-50">
                {report.recentPayments.length === 0 ? <p className="text-center text-sm text-gray-400 py-10">Sin pagos registrados</p> : report.recentPayments.map((payment) => (
                  <div key={payment.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-xl"><CreditCard className="w-4 h-4 text-emerald-600" /></div>
                      <div><p className="text-sm font-semibold text-gray-900">{payment.tipo}</p><p className="text-xs text-gray-400">{payment.fecha_pago?.split('T')[0]} - {payment.metodo_pago}</p></div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">${payment.valor?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Target className="w-5 h-5 text-teal-600" />Resumen de Sesiones</h3>
              <p className="text-xs text-gray-400 mt-0.5">Progreso global calculado por backend</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-40 h-40">
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${report.sessions.completionRate * 2.64} ${264 - report.sessions.completionRate * 2.64}`} className="transition-all duration-1000" />
                    <defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#14b8a6" /><stop offset="100%" stopColor="#10b981" /></linearGradient></defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-extrabold text-gray-900">{report.sessions.completionRate}%</span><span className="text-xs text-gray-400 font-semibold">Completado</span></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-teal-50 rounded-xl"><p className="text-2xl font-extrabold text-teal-700">{report.sessions.completed}</p><p className="text-xs text-teal-500 font-semibold mt-0.5">Realizadas</p></div>
                <div className="p-3 bg-blue-50 rounded-xl"><p className="text-2xl font-extrabold text-blue-700">{report.sessions.pending}</p><p className="text-xs text-blue-500 font-semibold mt-0.5">Pendientes</p></div>
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-2xl font-extrabold text-gray-700">{report.sessions.total}</p><p className="text-xs text-gray-500 font-semibold mt-0.5">Total</p></div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
