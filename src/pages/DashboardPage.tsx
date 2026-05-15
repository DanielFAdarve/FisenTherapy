// ============================================================
// FISENT - DASHBOARD PAGE (Redisenado)
// ============================================================
import { useEffect, useState } from 'react';
import { Users, Package, Calendar, CreditCard, Clock, ArrowRight, Activity } from 'lucide-react';
import { Card, StatCard, Skeleton, CardHeader, Avatar, Badge, getStatusBadge } from '../components/ui/Components';
import { patientService, appointmentService, reportService } from '../data-access/services';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState({ patients: 0, activePackages: 0, todayAppointments: 0, totalRevenue: 0 });
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [report, patients, appointments] = await Promise.all([
          reportService.getDashboard({ period: 'month' }).catch(() => null),
          patientService.getAll(undefined, 1, 5).catch(() => []),
          appointmentService.getAll(format(new Date(), 'yyyy-MM-dd'), undefined, undefined, 1, 5).catch(() => []),
        ]);
        setStats({
          patients: report?.patients.active ?? patients.filter((p: any) => p.estado).length,
          activePackages: report?.packages.total ?? 0,
          todayAppointments: appointments.length,
          totalRevenue: report?.revenue.total ?? 0,
        });
        setTodayAppointments(appointments.slice(0, 5));
        setRecentPatients(patients.slice(0, 5));
      } catch {
        // Silent fail for demo
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const avatarColors = ['teal', 'blue', 'purple', 'amber', 'emerald', 'rose'] as const;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 rounded-3xl p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Bienvenido a FisenT</h1>
          <p className="text-teal-100/80 mt-2 text-sm md:text-base">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy")} - Resumen del dia
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 right-20 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-5"><Skeleton className="h-20" /></Card>)
        ) : (
          <>
            <StatCard label="Pacientes Activos" value={stats.patients} icon={<Users className="w-5 h-5" />} color="teal" />
            <StatCard label="Paquetes Activos" value={stats.activePackages} icon={<Package className="w-5 h-5" />} color="blue" />
            <StatCard label="Citas Hoy" value={stats.todayAppointments} icon={<Calendar className="w-5 h-5" />} color="amber" />
            <StatCard label="Ingresos Mes" value={`$${stats.totalRevenue.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="emerald" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Citas de Hoy"
              subtitle={todayAppointments.length > 0 ? `${todayAppointments.length} citas programadas` : 'Sin citas hoy'}
              icon={<Clock className="w-5 h-5" />}
              action={
                <a href="#/appointments" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors">
                  Ver todas <ArrowRight className="w-3.5 h-3.5" />
                </a>
              }
            />
            {loading ? (
              <div className="p-6"><Skeleton className="h-40" /></div>
            ) : todayAppointments.length === 0 ? (
              <div className="p-10 text-center">
                <div className="inline-flex p-4 bg-gray-50 rounded-2xl mb-4">
                  <Calendar className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">No hay citas programadas para hoy</p>
                <a href="#/appointments" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Agendar nueva cita
                </a>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {todayAppointments.map((apt: any, i: number) => (
                  <div key={apt.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={`${apt.paciente || ''} `}
                        color={avatarColors[i % avatarColors.length]}
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {apt.paciente} 
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {apt.profesional?.nombres} {apt.profesional?.apellidos}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-gray-600">{apt.horario_inicio}</span>
                      <Badge variant={getStatusBadge(apt.estado)}>{apt.estado}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions + Recent Patients */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader title="Acciones Rapidas" icon={<Activity className="w-5 h-5" />} />
            <div className="p-4 grid grid-cols-2 gap-2">
              {[
                { label: 'Nuevo Paciente', path: '#/patients', icon: Users, color: 'from-teal-500 to-emerald-500' },
                { label: 'Agendar Cita', path: '#/appointments', icon: Calendar, color: 'from-blue-500 to-sky-500' },
                { label: 'Nuevo Paquete', path: '#/packages', icon: Package, color: 'from-amber-500 to-orange-500' },
                { label: 'Registrar Pago', path: '#/payments', icon: CreditCard, color: 'from-purple-500 to-violet-500' },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.path}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 transition-all duration-200 group"
                >
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 text-center">{action.label}</span>
                </a>
              ))}
            </div>
          </Card>

          {/* Recent Patients */}
          <Card>
            <CardHeader
              title="Pacientes Recientes"
              icon={<Users className="w-5 h-5" />}
              action={
                <a href="/patients" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors">
                  Ver todos <ArrowRight className="w-3.5 h-3.5" />
                </a>
              }
            />
            {loading ? (
              <div className="p-6"><Skeleton className="h-32" /></div>
            ) : recentPatients.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">Sin pacientes registrados</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentPatients.map((p: any, i: number) => (
                  <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <Avatar name={`${p.nombres} ${p.apellidos}`} size="sm" color={avatarColors[i % avatarColors.length]} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.nombres} {p.apellidos}</p>
                      <p className="text-xs text-gray-400">{p.tipo_doc} {p.num_doc}</p>
                    </div>
                    <Badge variant={p.estado ? 'success' : 'danger'}>{p.estado ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
