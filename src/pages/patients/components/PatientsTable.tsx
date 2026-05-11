

// ============================================================
// patients/components/PatientsTable.tsx
// ============================================================

import { memo } from 'react';

import { Patient } from '../../../domain/models';

import {
  Badge,
  Avatar,
} from '../../../components/ui/Components';

import {
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';

const avatarColors = [
  'teal',
  'blue',
  'purple',
  'amber',
  'emerald',
  'rose',
] as const;

interface Props {
  patients: Patient[];

  onView: (patient: Patient) => void;

  onEdit: (patient: Patient) => void;

  onDelete: (id: number) => void;
}

function PatientsTableComponent({
  patients,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Paciente
            </th>

            <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">
              Documento
            </th>

            <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">
              Contacto
            </th>

            <th className="text-center px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Estado
            </th>

            <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {patients.map((p, i) => (
            <tr
              key={p.id}
              className="hover:bg-teal-50/30 transition-colors group"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={`${p.nombre} ${p.apellido}`}
                    color={
                      avatarColors[
                        i %
                          avatarColors.length
                      ]
                    }
                  />

                  <div>
                    <p className="font-semibold text-gray-900">
                      {p.nombre} {p.apellido}
                    </p>

                    <p className="text-xs text-gray-400 md:hidden">
                      {p.tipo_doc} {p.num_doc}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-5 py-3.5 hidden md:table-cell">
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-md text-xs font-mono font-semibold text-gray-600 mr-1.5">
                  {p.tipo_doc}
                </span>

                <span className="text-sm text-gray-700 font-medium">
                  {p.num_doc}
                </span>
              </td>

              <td className="px-5 py-3.5 hidden lg:table-cell">
                <p className="text-sm text-gray-600">
                  {p.telefono}
                </p>

                <p className="text-xs text-gray-400">
                  {p.email || '—'}
                </p>
              </td>

              <td className="px-5 py-3.5 text-center">
                <Badge
                  variant={
                    p.estado
                      ? 'success'
                      : 'danger'
                  }
                >
                  {p.estado
                    ? 'Activo'
                    : 'Inactivo'}
                </Badge>
              </td>

              <td className="px-5 py-3.5 text-right">
                <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onView(p)}
                    className="p-2 rounded-xl hover:bg-sky-50 text-sky-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onEdit(p)}
                    className="p-2 rounded-xl hover:bg-amber-50 text-amber-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      onDelete(p.id)
                    }
                    className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const PatientsTable = memo(
  PatientsTableComponent
);

