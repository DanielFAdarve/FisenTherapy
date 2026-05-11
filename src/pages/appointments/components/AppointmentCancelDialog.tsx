import { ConfirmDialog } from '../../../components/ui/Components';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function AppointmentCancelDialog({ isOpen, onClose, onConfirm }: Props) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Cancelar Cita"
      message="¿Está seguro de cancelar esta cita?"
      confirmText="Cancelar Cita"
      confirmVariant="danger"
    />
  );
}
