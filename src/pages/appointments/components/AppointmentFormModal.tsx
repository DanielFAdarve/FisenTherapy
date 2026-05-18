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
  packageError: string | null;
  patients: Patient[];
  professionals: Professional[];
  patientPackages: FisentPackage[];
  packageCatalog: FisentPackage[];
  cies: any[];
  newPackage: { id_paquetes_atenciones: number; id_cie_secundario: number };
  onNewPackageChange: (field: 'id_paquetes_atenciones' | 'id_cie_secundario', value: number) => void;
  onLoadPackageCatalogs: () => void;
  onCreatePackage: () => void;
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
  packageError,
  patients,
  professionals,
  patientPackages,
  packageCatalog,
  cies,
  newPackage,
  onNewPackageChange,
  onLoadPackageCatalogs,
  onCreatePackage,
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

        {packageError && (
          <Alert
            type="warning"
            title="Paquetes no disponibles"
            message={packageError}
          />
        )}

        <Select
          label="Paquete disponible *"
          value={form.id_paquete || ''}
          onChange={(event) => {
            const packageId = event.target.value ? Number(event.target.value) : null;
            const selectedPackage = patientPackages.find((pkg) => pkg.id === packageId);
            onFieldChange('id_paquete', packageId);
            if (selectedPackage?.id_profesional) {
              onFieldChange('id_profesional', selectedPackage.id_profesional);
            }
          }}
          options={patientPackages.map((pkg) => ({
            value: pkg.id,
            label: `${pkg.nombre} (${pkg.sesiones_realizadas}/${pkg.cantidad_sesiones} usadas · ${pkg.sesiones_disponibles ?? pkg.resumen_sesiones?.sesiones_disponibles ?? 0} disponibles${pkg.tiene_cita_actual ? ' · cita actual' : ''})`,
          }))}
          error={errors.id_paquete}
        />

        {form.id_paciente && patientPackages.length === 0 && (
          <Alert
            type="info"
            title="Paquete requerido"
            message="Este paciente no tiene paquetes con cupo disponible. Cree uno para continuar con la cita."
          />
        )}

        {form.id_paciente && (
          <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">Crear paquete para esta cita</p>
                <p className="text-xs text-gray-500">Solo carga catálogo y CIE10 cuando lo necesitas.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={onLoadPackageCatalogs}>
                Cargar catálogo
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                label="Tipo de paquete"
                value={newPackage.id_paquetes_atenciones || ''}
                onChange={(event) => onNewPackageChange('id_paquetes_atenciones', Number(event.target.value))}
                options={packageCatalog.map((pkg) => ({
                  value: pkg.id,
                  label: `${pkg.descripcion || pkg.nombre} (${pkg.cantidad_sesiones} sesiones)`,
                }))}
              />
              <Select
                label="CIE secundario"
                value={newPackage.id_cie_secundario || ''}
                onChange={(event) => onNewPackageChange('id_cie_secundario', Number(event.target.value))}
                options={cies.map((cie) => ({
                  value: cie.id,
                  label: `${cie.codigo} - ${cie.descripcion}`,
                }))}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              onClick={onCreatePackage}
              disabled={catalogLoading}
            >
              Crear y seleccionar paquete
            </Button>
          </div>
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
