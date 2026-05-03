// ============================================================
// FISENT - REPORTES PAGE
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { patientService, packageService, appointmentService, paymentService, professionalService } from '../data-access/services';
import {
  Card, StatCard, Badge, PageHeader, ProgressBar, Avatar,
} from '../components/ui/Components';
import {
  BarChart3, Users, Calendar, CreditCard, Package, TrendingUp, Clock, Target, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [_loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  // Data
  const [patients, setPatients] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [_professionals, setProfessionals] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pts, pkgs, appts, pays, pros] = await Promise.all([
        patientService.getAll().catch(() => []),
        packageService.getAll().catch(() => []),
        appointmentService.getAll().catch(() => []),
        paymentService.getAll().catch(() => []),
        professionalService.getAll().catch(() => []),
      ]);
      setPatients(pts || []);
      setPackages(pkgs || []);
      setAppointments(appts || []);
      setPayments(pays || []);
      setProfessionals(pros || []);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar datos');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // --- Computed metrics ---
  const activePatients = patients.filter(p => p.estado).length;
  const inactivePatients = patients.filter(p => !p.estado).length;
  // Package metrics (used in future reports)
  void packages.filter(p => p.estado === 'ACTIVO').length;
  void packages.filter(p => p.estado === 'CERRADO').length;
  const totalSessions = packages.reduce((sum: number, p: any) => sum + (p.sesiones_realizadas || 0), 0);
  const totalSessionsCapacity = packages.reduce((sum: number, p: any) => sum + (p.cantidad_sesiones || 0), 0);
  const sessionCompletionRate = totalSessionsCapacity > 0 ? Math.round((totalSessions / totalSessionsCapacity) * 100) : 0;

  // Appointments metrics
  const completedAppts = appointments.filter(a => a.estado === 'COMPLETADA').length;
  const scheduledAppts = appointments.filter(a => a.estado === 'PROGRAMADA' || a.estado === 'CONFIRMADA').length;
  const cancelledAppts = appointments.filter(a => a.estado === 'CANCELADA').length;
  const noShowAppts = appointments.filter(a => a.estado === 'NO_ASISTIO').length;
  const attendanceRate = (completedAppts + cancelledAppts + noShowAppts) > 0
    ? Math.round((completedAppts / (completedAppts + cancelledAppts + noShowAppts)) * 100) : 0;

  // Payments metrics
  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
  const paymentsByMethod: Record<string, number> = {};
  payments.forEach((p: any) => {
    paymentsByMethod[p.metodo_pago] = (paymentsByMethod[p.metodo_pago] || 0) + (p.valor || 0);
  });

  // Packages by type
  const packagesByType: Record<string, number> = {};
  packages.forEach((p: any) => {
    packagesByType[p.tipo_paquete] = (packagesByType[p.tipo_paquete] || 0) + 1;
  });

  // Appointments by professional
  const apptsByProfessional: Record<string, number> = {};
  appointments.forEach((a: any) => {
    const name = `${a.profesional?.nombres || 'Sin'} ${a.profesional?.apellidos || 'profesional'}`;
    apptsByProfessional[name] = (apptsByProfessional[name] || 0) + 1;
  });
  const topProfessionals = Object.entries(apptsByProfessional)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Recent activity (last 7 days worth of data simulation)
  const recentPayments = [...payments].sort((a: any, b: any) =>
    new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime()
  ).slice(0, 5);

  // Packages nearing completion
  const packagesNearCompletion = packages
    .filter((p: any) => p.estado === 'ACTIVO' && p.cantidad_sesiones > 0)
    .map((p: any) => ({ ...p, pct: Math.round((p.sesiones_realizadas / p.cantidad_sesiones) * 100) }))
    .filter((p: any) => p.pct >= 70)
    .sort((a: any, b: any) => b.pct - a.pct)
    .slice(0, 5);

  // Revenue by month (group payments)
  const revenueByMonth: Record<string, number> = {};
  payments.forEach((p: any) => {
    const month = p.fecha_pago?.substring(0, 7) || 'Desconocido';
    revenueByMonth[month] = (revenueByMonth[month] || 0) + (p.valor || 0);
  });
  const months = Object.entries(revenueByMonth).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  const maxRevenue = Math.max(...months.map(m => m[1]), 1);

  // Appointment status distribution
  const statusDistribution = [
    { label: 'Completadas', count: completedAppts, color: 'bg-emerald-500', pct: appointments.length > 0 ? (completedAppts / appointments.length * 100) : 0 },
    { label: 'Programadas', count: scheduledAppts, color: 'bg-blue-500', pct: appointments.length > 0 ? (scheduledAppts / appointments.length * 100) : 0 },
    { label: 'Canceladas', count: cancelledAppts, color: 'bg-red-500', pct: appointments.length > 0 ? (cancelledAppts / appointments.length * 100) : 0 },
    { label: 'No asistio', count: noShowAppts, color: 'bg-amber-500', pct: appointments.length > 0 ? (noShowAppts / appointments.length * 100) : 0 },
  ];

  const avatarColors = ['teal', 'blue', 'purple', 'amber', 'emerald', 'rose'] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader
          icon={<BarChart3 className="w-6 h-6" />}
          title="Reportes y Estadisticas"
          subtitle="Analisis integral del consultorio"
        />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([
            { id: 'week' as const, label: 'Semana' },
            { id: 'month' as const, label: 'Mes' },
            { id: 'quarter' as const, label: 'Trimestre' },
          ]).map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                period === p.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pacientes Activos" value={activePatients} icon={<Users className="w-5 h-5" />} color="teal" trend={inactivePatients > 0 ? `${inactivePatients} inactivos` : undefined} />
        <StatCard label="Ingresos Totales" value={`$${totalRevenue.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="emerald" />
        <StatCard label="Tasa de Asistencia" value={`${attendanceRate}%`} icon={<Target className="w-5 h-5" />} color={attendanceRate >= 80 ? 'emerald' : attendanceRate >= 60 ? 'amber' : 'red'} />
        <StatCard label="Sesiones Realizadas" value={totalSessions} icon={<Clock className="w-5 h-5" />} color="blue" trend={`de ${totalSessionsCapacity} programadas`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Ingresos por Mes</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Evolucion de ingresos</p>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-6">
              {months.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">Sin datos de pagos registrados</div>
              ) : (
                <div className="space-y-4">
                  {months.map(([month, revenue]) => (
                    <div key={month} className="flex items-center gap-4">
                      <span className="text-xs font-mono font-bold text-gray-500 w-16">{month}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center px-3 transition-all duration-700"
                          style={{ width: `${Math.max((revenue / maxRevenue) * 100, 8)}%` }}
                        >
                          <span className="text-xs font-bold text-white whitespace-nowrap">${revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Appointment Status */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl"><Calendar className="w-5 h-5 text-blue-600" /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Estado de Citas</h3>
                <p className="text-xs text-gray-400 mt-0.5">{appointments.length} totales</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {statusDistribution.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-700">{s.label}</span>
                  <span className="text-sm font-bold text-gray-900">{s.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-full rounded-full ${s.color} transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Professionals */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              Top Profesionales
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {topProfessionals.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Sin datos</p>
            ) : (
              topProfessionals.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-white transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-700'
                  }`}>{i + 1}</span>
                  <Avatar name={name} size="sm" color={avatarColors[i % avatarColors.length]} />
                  <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{name}</span>
                  <Badge variant="info">{count} citas</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Packages by Type */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Paquetes por Tipo
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {Object.keys(packagesByType).length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Sin paquetes registrados</p>
            ) : (
              Object.entries(packagesByType).map(([type, count]) => {
                const colors: Record<string, string> = {
                  REHABILITACION: 'from-teal-500 to-emerald-500',
                  TERAPIA: 'from-blue-500 to-sky-500',
                  EVALUACION: 'from-amber-500 to-orange-500',
                  MANTENIMIENTO: 'from-purple-500 to-violet-500',
                };
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors[type] || 'from-gray-400 to-gray-500'}`} />
                    <span className="flex-1 text-sm font-semibold text-gray-700">{type}</span>
                    <span className="text-lg font-extrabold text-gray-900">{count}</span>
                  </div>
                );
              })
            )}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">Total</span>
              <span className="text-lg font-extrabold text-gray-900">{packages.length}</span>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Metodos de Pago
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {Object.keys(paymentsByMethod).length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Sin pagos registrados</p>
            ) : (
              Object.entries(paymentsByMethod)
                .sort((a, b) => b[1] - a[1])
                .map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{method}</span>
                    <span className="text-sm font-bold text-gray-900">${(amount as number).toLocaleString()}</span>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>

      {/* Alerts & Packages Near Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Paquetes por Terminar
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Paquetes activos con 70%+ de sesiones consumidas</p>
          </div>
          <div className="p-4 space-y-3">
            {packagesNearCompletion.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No hay paquetes proximos a terminar</p>
            ) : (
              packagesNearCompletion.map((p: any) => (
                <div key={p.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">{p.nombre}</span>
                    <Badge variant={p.pct >= 90 ? 'danger' : 'warning'}>{p.pct}%</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{p.paciente?.nombres} {p.paciente?.apellidos}</p>
                  <ProgressBar value={p.sesiones_realizadas} max={p.cantidad_sesiones} color={p.pct >= 90 ? 'red' : 'amber'} />
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Payments */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Pagos Recientes
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentPayments.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">Sin pagos registrados</p>
            ) : (
              recentPayments.map((p: any) => (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.tipo}</p>
                      <p className="text-xs text-gray-400">{p.fecha_pago?.split('T')[0]} - {p.metodo_pago}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">${p.valor?.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Session Completion Overview */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            Resumen de Sesiones
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Progreso global de todos los paquetes activos</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${sessionCompletionRate * 2.64} ${264 - sessionCompletionRate * 2.64}`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-gray-900">{sessionCompletionRate}%</span>
                <span className="text-xs text-gray-400 font-semibold">Completado</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-teal-50 rounded-xl">
              <p className="text-2xl font-extrabold text-teal-700">{totalSessions}</p>
              <p className="text-xs text-teal-500 font-semibold mt-0.5">Realizadas</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-2xl font-extrabold text-blue-700">{totalSessionsCapacity - totalSessions}</p>
              <p className="text-xs text-blue-500 font-semibold mt-0.5">Pendientes</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-extrabold text-gray-700">{totalSessionsCapacity}</p>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Total</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
