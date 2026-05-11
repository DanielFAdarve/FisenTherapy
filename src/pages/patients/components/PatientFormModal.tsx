// ============================================================
// patients/components/PatientFormModal.tsx
// ============================================================

import {
  Modal,
  Input,
  Select,
  Textarea,
  Button,
} from '../../../components/ui/Components';

import {
  Patient,
  Cie10,
  TipoDocumento,
} from '../../../domain/models';

import {
  PatientFormData,
} from '../../../domain/schemas';

interface Props {
  isOpen: boolean;

  onClose: () => void;

  editingPatient: Patient | null;

  form: PatientFormData;

  errors: Record<string, string>;

  saving: boolean;

  cie10List: Cie10[];

  onFieldChange: (
    field: string,
    value: any
  ) => void;

  onSubmit: () => void;
}

const TIPO_DOC_OPTIONS = [
  {
    value: 'CC',
    label: 'Cedula de Ciudadania',
  },
  {
    value: 'TI',
    label: 'Tarjeta de Identidad',
  },
  {
    value: 'CE',
    label: 'Cedula de Extranjeria',
  },
  {
    value: 'PA',
    label: 'Pasaporte',
  },
  {
    value: 'NIT',
    label: 'NIT',
  },
];

export function PatientFormModal({
  isOpen,
  onClose,
  editingPatient,
  form,
  errors,
  saving,
  cie10List,
  onFieldChange,
  onSubmit,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingPatient
          ? 'Editar Paciente'
          : 'Nuevo Paciente'
      }
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Tipo Documento *"
            value={form.tipo_doc}
            onChange={(e) =>
              onFieldChange(
                'tipo_doc',
                e.target.value as TipoDocumento
              )
            }
            options={TIPO_DOC_OPTIONS}
            error={errors.tipo_doc}
          />

          <Input
            label="Numero Documento *"
            value={form.num_doc}
            onChange={(e) =>
              onFieldChange(
                'num_doc',
                e.target.value
              )
            }
            error={errors.num_doc}
          />

          <Input
            label="Nombres *"
            value={form.nombres}
            onChange={(e) =>
              onFieldChange(
                'nombres',
                e.target.value
              )
            }
            error={errors.nombres}
          />

          <Input
            label="Apellidos *"
            value={form.apellidos}
            onChange={(e) =>
              onFieldChange(
                'apellidos',
                e.target.value
              )
            }
            error={errors.apellidos}
          />

          <Input
            label="Fecha Nacimiento *"
            type="date"
            value={form.fecha_nacimiento}
            onChange={(e) =>
              onFieldChange(
                'fecha_nacimiento',
                e.target.value
              )
            }
            error={
              errors.fecha_nacimiento
            }
          />

          <Input
            label="Telefono *"
            value={form.telefono}
            onChange={(e) =>
              onFieldChange(
                'telefono',
                e.target.value
              )
            }
            error={errors.telefono}
          />

          <Input
            label="Email"
            type="email"
            value={form.email || ''}
            onChange={(e) =>
              onFieldChange(
                'email',
                e.target.value
              )
            }
            error={errors.email}
          />

          <Input
            label="Direccion"
            value={form.direccion || ''}
            onChange={(e) =>
              onFieldChange(
                'direccion',
                e.target.value
              )
            }
          />

          <Select
            label="Diagnostico CIE10"
            value={form.id_cie || ''}
            onChange={(e) =>
              onFieldChange(
                'id_cie',
                e.target.value
                  ? Number(
                      e.target.value
                    )
                  : null
              )
            }
            options={cie10List.map(
              (c) => ({
                value: c.id,
                label: `${c.codigo} - ${c.descripcion}`,
              })
            )}
            className="sm:col-span-2"
          />
        </div>

        <Textarea
          label="Antecedentes"
          value={form.antecedentes}
          onChange={(e) =>
            onFieldChange(
              'antecedentes',
              e.target.value
            )
          }
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
          >
            {editingPatient
              ? 'Actualizar'
              : 'Crear Paciente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

