import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Input, Select } from '../../../components/ui/Components';
import { appointmentService, professionalService } from '../../../data-access/services';
import { Appointment, Professional, Pagination } from '../../../domain/models';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface AppointmentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (appointment: Appointment) => void;
  defaultPatientId?: number;
  defaultProfessionalId?: number;
}

export function AppointmentSearchModal({
  isOpen,
  onClose,
  onSelect,
  defaultPatientId,
  defaultProfessionalId,
}: AppointmentSearchModalProps) {
  const [search, setSearch] = useState('');
  const [fecha, setFecha] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [idProfesional, setIdProfesional] = useState<number | ''>('');
  const [idPaciente, setIdPaciente] = useState<number | ''>('');

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setFecha('');
      setFechaInicio('');
      setFechaFin('');
      setIdProfesional(defaultProfessionalId ?? '');
      setIdPaciente(defaultPatientId ?? '');
      setAppointments([]);
      setPagination(null);
      setPage(1);

      professionalService.getAll('', 1, 100)
        .then(setProfessionals)
        .catch(() => { });
    }
  }, [isOpen, defaultPatientId, defaultProfessionalId]);

  const fetchAppointments = useCallback(async (pageNumber: number) => {
    setLoading(true);
    try {
      const filters: Record<string, any> = {};
      if (search.trim()) filters.search = search.trim();
      if (fecha) filters.fecha = fecha;
      if (fechaInicio) filters.fechaInicio = fechaInicio;
      if (fechaFin) filters.fechaFin = fechaFin;
      if (idProfesional !== '') filters.id_profesional = Number(idProfesional);
      if (idPaciente !== '') filters.id_paciente = Number(idPaciente);

      const result = await appointmentService.getPaginated({
        page: pageNumber,
        limit,
        filters,
      });

      setAppointments(result.data);
      setPagination(result.pagination ?? null);
      setPage(pageNumber);
    } catch (err: any) {
      toast.error(err?.message || 'Error al buscar citas');
    } finally {
      setLoading(false);
    }
  }, [search, fecha, fechaInicio, fechaFin, idProfesional, idPaciente]);

  const handleSearch = () => fetchAppointments(1);
  const handlePageChange = (newPage: number) => fetchAppointments(newPage);

  const professionalOptions = [
    { value: '', label: 'Todos' },
    ...professionals.map(p => ({
      value: p.id,
      label: `${p.nombre} ${p.apellido}`,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buscar Cita" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda general</label>
            <Input
              placeholder="Nombre, documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha exacta</label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
            <Select
              value={idProfesional}
              onChange={(value) => setIdProfesional(value ? Number(value) : '')}
              options={professionalOptions}
            />
          </div>
          {!defaultPatientId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente (ID)</label>
              <Input
                type="number"
                placeholder="ID paciente"
                value={idPaciente}
                onChange={(e) => setIdPaciente(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSearch} isLoading={loading}>
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Cargando...</div>
          ) : appointments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {pagination ? 'No se encontraron citas con esos filtros.' : 'Presione "Buscar" para ver citas.'}
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {/* {appointments.map((appt) => (
                <button
                  key={appt.id}
                  onClick={() => {
                    onSelect(appt);
                    onClose();
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      #{appt.id} – {appt.paciente_nombre || appt.paciente}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appt.fecha} {appt.horario_inicio?.slice(0, 5)} – {appt.profesional_nombre || appt.profesional}
                    </p>
                  </div>
                  <span className="text-xs text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
                    {appt.estado}
                  </span>
                </button>
              ))} */}

              {appointments.map((appt) => (
                <button
                  key={appt.id}
                  onClick={() => {
                    onSelect(appt);
                    onClose();
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      #{appt.id} – {appt.paciente_nombre || appt.paciente}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appt.fecha} {appt.horario_inicio?.slice(0, 5)} – {appt.profesional_nombre || appt.profesional}
                    </p>
                    {/* 🔽 NUEVA LÍNEA: Paquete y sesión */}
                    {appt.tipo_paquete && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {appt.tipo_paquete} · Sesión {appt.numero_sesion || '--'}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
                    {appt.estado}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm self-center text-gray-600">
              Pág. {page} de {pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}