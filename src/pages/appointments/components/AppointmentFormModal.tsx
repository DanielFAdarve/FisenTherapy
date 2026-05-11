import { Alert, Button, Input, Modal, Select, Textarea } from '../../../components/ui/Components';
import { Appointment, Package as FisentPackage, Patient, Professional } from '../../../domain/models';
import { AppointmentFormData } from '../../../domain/schemas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingAppointment: Appointment | null;
  form: AppointmentFormData;
  errors: Record<string, string>;
  saving: boolean;
  collisionWarning: string | null;
  catalogLoading: boolean;
  patients: Patient[];
  professionals: Professional[];
  patientPackages: FisentPackage[];
  onFieldChange: (field: string, value: any) => void;
  onSubmit: () => void;
}

export function AppointmentFormModal({
  isOpen,
  onClose,
  editingAppointment,
  form,
  errors,
  saving,
  collisionWarning,
  catalogLoading,
  patients,
  professionals,
  patientPackages,
  onFieldChange,
  onSubmit,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAppointment ? 'Editar Cita' : 'Agendar Cita'}
      size="lg"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
        noValidate
      >
        {collisionWarning && (
          <Alert
            type="warning"
            title="Conflicto de agenda"
            message={collisionWarning}
          />
        )}

        {catalogLoading && (
          <Alert
            type="info"
            title="Cargando datos"
            message="Estamos actualizando pacientes, profesionales y paquetes disponibles."
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Paciente *"
            value={form.id_paciente || ''}
            onChange={(event) => onFieldChange('id_paciente', Number(event.target.value))}
            options={patients
              .filter((patient) => patient.estado)
              .map((patient) => ({
                value: patient.id,
                label: `${patient.nombre} ${patient.apellido}`,
              }))}
            error={errors.id_paciente}
          />

          <Select
            label="Profesional *"
            value={form.id_profesional || ''}
            onChange={(event) => onFieldChange('id_profesional', Number(event.target.value))}
            options={professionals
              .filter((professional) => professional.estado)
              .map((professional) => ({
                value: professional.id,
                label: `${professional.nombre} ${professional.apellido} - ${professional.especialidad}`,
              }))}
            error={errors.id_profesional}
          />
        </div>

        {patientPackages.length > 0 && (
          <Select
            label="Paquete (opcional)"
            value={form.id_paquete || ''}
            onChange={(event) => onFieldChange(
              'id_paquete',
              event.target.value ? Number(event.target.value) : null
            )}
            options={patientPackages.map((pkg) => ({
              value: pkg.id,
              label: `${pkg.nombre} (${pkg.sesiones_realizadas}/${pkg.cantidad_sesiones})`,
            }))}
          />
        )}

        <Input
          label="Fecha *"
          type="date"
          value={form.fecha}
          onChange={(event) => onFieldChange('fecha', event.target.value)}
          error={errors.fecha}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Hora Inicio *"
            type="time"
            value={form.horario_inicio}
            onChange={(event) => onFieldChange('horario_inicio', event.target.value)}
            error={errors.horario_inicio}
          />

          <Input
            label="Hora Fin *"
            type="time"
            value={form.horario_fin}
            onChange={(event) => onFieldChange('horario_fin', event.target.value)}
            error={errors.horario_fin}
          />
        </div>

        <Textarea
          label="Motivo / observaciones"
          value={form.observaciones || ''}
          onChange={(event) => onFieldChange('observaciones', event.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            isLoading={saving}
            disabled={catalogLoading}
          >
            {editingAppointment ? 'Actualizar Cita' : 'Agendar Cita'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
