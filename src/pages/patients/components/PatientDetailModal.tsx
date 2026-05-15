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
               <Avatar name={`${patient.nombre} ${patient.apellido}`} size="lg" color="teal" />
               <div>
                 <h3 className="text-lg font-bold text-gray-900">{patient.nombre} {patient.apellido}</h3>
                 <p className="text-sm text-gray-400">{patient.tipo_doc} {patient.num_doc}</p>
               </div>
               <div className="ml-auto"><Badge variant={patient.estado ? 'success' : 'danger'}>{patient.estado ? 'Activo' : 'Inactivo'}</Badge></div>
             </div>
             <div className="grid grid-cols-2 gap-4 text-sm">
               {[
                { label: 'Telefono', value: patient.telefono },
                { label: 'Email', value: patient.email || '—' },
                { label: 'Direccion', value: patient.direccion || '—' },
                { label: 'Nacimiento', value: patient.fecha_nacimiento?.split('T')[0] },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Antecedentes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{patient.antecedentes || 'Sin antecedentes'}</p>
            </div>
          </div>
      )}
    </Modal>
  );
}