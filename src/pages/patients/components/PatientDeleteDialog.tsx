


// ============================================================
// patients/components/PatientDeleteDialog.tsx
// ============================================================

import { ConfirmDialog } from '../../../components/ui/Components';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PatientDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
}: Props) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Desactivar Paciente"
      message="Esta seguro de desactivar este paciente? Se realizara un borrado logico (estado=false)."
      confirmText="Desactivar"
      confirmVariant="danger"
    />
  );
}

