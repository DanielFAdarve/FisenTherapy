// ============================================================
// patients/components/PatientDetailModal.tsx
// ============================================================

import {
  Modal,
  Avatar,
  Badge,
} from '../../../components/ui/Components';

import { Patient } from '../../../domain/models';

interface Props {
  patient: Patient | null;
  onClose: () => void;
}

export function PatientDetailModal({
  patient,
  onClose,
}: Props) {
  return (
    <Modal
      isOpen={!!patient}
      onClose={onClose}
      title="Detalle del Paciente"
      size="md"
    >
      {patient && (
        <div className="space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <Avatar
              name={`${patient.nombre} ${patient.apellido}`}
              size="lg"
              color="teal"
            />

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {patient.nombre}{' '}
                {patient.apellido}
              </h3>

              <p className="text-sm text-gray-400">
                {patient.tipo_doc}{' '}
                {patient.num_doc}
              </p>
            </div>

            <div className="ml-auto">
              <Badge
                variant={
                  patient.estado
                    ? 'success'
                    : 'danger'
                }
              >
                {patient.estado
                  ? 'Activo'
                  : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}