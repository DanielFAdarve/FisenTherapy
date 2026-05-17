import { CreditCard, Edit2, FileText, UserRound, XCircle } from 'lucide-react';

import { Appointment } from '../../../domain/models';
import { Avatar, Badge, getStatusBadge } from '../../../components/ui/Components';

interface Props {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onCancel: (id: number) => void;
}

const avatarColors = ['teal', 'blue', 'purple', 'amber', 'emerald', 'rose'] as const;

const formatTime = (value?: string) => (value ? value.slice(0, 5) : '--:--');

const patientName = (appointment: Appointment) =>
  appointment.paciente ||
  'Paciente sin nombre';

const professionalName = (appointment: Appointment) =>
  appointment.profesional_nombre ||
  [appointment.profesional, appointment.apellido_profesional]
    .filter(Boolean)
    .join(' ') ||
  'Profesional sin asignar';

export function AppointmentsList({ appointments, onEdit, onCancel }: Props) {
  return (
    <div className="divide-y divide-gray-50">
      {appointments.map((appointment, index) => {
        const isClosed = appointment.estado === 'CANCELADA' || appointment.estado === 'COMPLETADA';
        const name = patientName(appointment);
        console.log(appointment);
        return (
          <div
            key={appointment.id}
            className="group px-5 py-4 transition-colors hover:bg-teal-50/30"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="min-w-[72px] rounded-xl bg-gray-50 p-2 text-center">
                  <p className="text-lg font-extrabold text-gray-900">
                    {formatTime(appointment.horario_inicio)}
                  </p>
                  <p className="text-[10px] font-semibold text-gray-400">
                    {formatTime(appointment.horario_fin)}
                  </p>
                </div>

                <Avatar
                  name={name}
                  color={avatarColors[index % avatarColors.length]}
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-gray-900">
                      {name}
                    </p>
                    <Badge variant={appointment.pagado ? 'success' : 'warning'}>
                      {appointment.pagado ? 'Pagada' : 'Pendiente de pago'}
                    </Badge>
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    {appointment.num_doc_paciente && (
                      <span className="inline-flex items-center gap-1">
                        <UserRound className="h-3.5 w-3.5" />
                        {appointment.num_doc_paciente}
                      </span>
                    )}
                    <span>{professionalName(appointment)}</span>
                    {appointment.numero_sesion && (
                      <span className="font-semibold text-teal-600">
                        Sesión #{appointment.numero_sesion}
                      </span>
                    )}
                  </div>

                  {appointment.observaciones && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
                      <FileText className="h-3.5 w-3.5" />
                      {appointment.observaciones}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 lg:justify-end">
                <Badge variant={getStatusBadge(appointment.estado)}>
                  {appointment.estado}
                </Badge>

                <div className="inline-flex items-center gap-1 opacity-100 transition-opacity lg:opacity-60 lg:group-hover:opacity-100">
                  <span
                    className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold text-gray-500"
                    title="Estado de pago"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    {appointment.pagado ? 'OK' : 'Por pagar'}
                  </span>

                  {!isClosed && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(appointment)}
                        className="rounded-xl p-2 text-amber-600 hover:bg-amber-50"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(appointment.id)}
                        className="rounded-xl p-2 text-red-500 hover:bg-red-50"
                        title="Cancelar"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
