// ============================================================
// patients/components/PatientFormModal.tsx
// ============================================================
import {
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

import { useState } from 'react';

import {
    Modal,
    Input,
    Select,
    Textarea,
    Button,
} from '../../../components/ui/Components';
import { Cie10SearchField } from '../../../components/Cie10SearchField';

import {
    Patient,
    Cie10,
    TipoDocumento,
    GENERO_OPTIONS,
    ZONA_OPTIONS,
    RED_APOYO_OPTIONS,
    Genero,
    Zona
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

    onCiesFound: (cies: Cie10[]) => void;

    onFieldChange: <
        K extends keyof PatientFormData
    >(
        field: K,
        value: PatientFormData[K]
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
    onCiesFound,
    onFieldChange,
    onSubmit,

}: Props) {

    const [openAntecedente, setOpenAntecedente] =
        useState<string[]>(['generales']);


    const renderAntecedente = (
        key: string,
        title: string,
        value: string | undefined,
        field:
            | 'antecedentes'
            | 'antecedentes_personales'
            | 'antecedentes_patologicos'
            | 'antecedentes_quirurgicos'
            | 'antecedentes_traumaticos'
            | 'antecedentes_farmacologicos'
            | 'antecedentes_familiares'
            | 'antecedentes_sociales'
    ) => {
        const isOpen = openAntecedente.includes(key);

        return (
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                <button
                    type="button"
                    onClick={() =>
                        setOpenAntecedente(
                            isOpen ? openAntecedente.filter((k) => k !== key) : [...openAntecedente, key]
                        )
                    }
                    className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                    <div>
                        <p className="text-sm font-semibold text-gray-800">
                            {title}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                            {
                                value?.trim()
                                    ? value
                                        .replace(/\n/g, ' ')
                                        .trim()
                                        .substring(0, 80) +
                                    (value.length > 80 ? '...' : '')
                                    : 'No reporta'
                            }
                        </p>
                    </div>

                    <div className="text-gray-400">
                        {isOpen
                            ? <ChevronUp size={18} />
                            : <ChevronDown size={18} />}
                    </div>
                </button>

                <div
                    className={`
        transition-all
        duration-300
        overflow-hidden
        ${isOpen
                            ? 'max-h-[800px] opacity-100'
                            : 'max-h-0 opacity-0'
                        }
    `}
                >
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/40">

                        <div className="flex items-center justify-between pt-4 mb-3">

                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                {title}
                            </p>

                            <span
                                className={`
                    text-[10px]
                    font-semibold
                    px-2
                    py-1
                    rounded-full
                    ${value?.trim()
                                        ? 'bg-teal-100 text-teal-700'
                                        : 'bg-gray-100 text-gray-500'
                                    }
                `}
                            >
                                {value?.trim()
                                    ? 'Registrado'
                                    : 'Vacío'}
                            </span>

                        </div>

                        <Textarea
                            label=""
                            value={value || ''}
                            placeholder="No reporta"
                            onChange={(e) =>
                                onFieldChange(
                                    field,
                                    e.target.value
                                )
                            }
                        />

                    </div>
                </div>
            </div>
        );
    };

    return (

        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                editingPatient
                    ? 'Editar Paciente'
                    : 'Nuevo Paciente'
            }
            size="xl"
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
                className="flex flex-col max-h-[85vh]"
            >
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">

                    {/* ====================================================== */}
                    {/* HEADER PACIENTE */}
                    {/* ====================================================== */}

                    <div className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 bg-gradient-to-r from-teal-50/60 to-white">
                        <div className="h-14 w-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                            {form.nombre?.charAt(0) || 'P'}
                        </div>

                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingPatient
                                    ? 'Editar Información del Paciente'
                                    : 'Registro de Nuevo Paciente'}
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                Completa la información clínica y personal del paciente.
                            </p>
                        </div>
                    </div>

                    {/* ====================================================== */}
                    {/* DATOS PERSONALES */}
                    {/* ====================================================== */}

                    <section className="rounded-2xl border border-gray-100 bg-white p-5">
                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Datos Personales
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
                                label="Número Documento *"
                                value={form.num_doc}
                                onChange={(e) =>
                                    onFieldChange('num_doc', e.target.value)
                                }
                                error={errors.num_doc}
                            />

                            <Input
                                label="Nombres *"
                                value={form.nombre}
                                onChange={(e) =>
                                    onFieldChange('nombre', e.target.value)
                                }
                                error={errors.nombre}
                            />

                            <Input
                                label="Apellidos *"
                                value={form.apellido}
                                onChange={(e) =>
                                    onFieldChange('apellido', e.target.value)
                                }
                                error={errors.apellido}
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
                                error={errors.fecha_nacimiento}
                            />

                            <Select
                                label="Género"
                                value={form.genero || 'O'}
                                onChange={(e) =>
                                    onFieldChange(
                                        'genero',
                                        e.target.value as Genero
                                    )
                                }
                                options={GENERO_OPTIONS}
                            />

                            <Select
                                label="Zona"
                                value={form.zona || 'U'}
                                onChange={(e) =>
                                    onFieldChange(
                                        'zona',
                                        e.target.value as Zona
                                    )
                                }
                                options={ZONA_OPTIONS}
                            />

                            <Input
                                label="Procedencia"
                                value={form.procedencia || ''}
                                onChange={(e) =>
                                    onFieldChange(
                                        'procedencia',
                                        e.target.value
                                    )
                                }
                            />

                        </div>
                    </section>

                    {/* ====================================================== */}
                    {/* CONTACTO */}
                    {/* ====================================================== */}

                    <section className="rounded-2xl border border-gray-100 bg-white p-5">
                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Contacto
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <Input
                                label="Teléfono *"
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
                                label="Teléfono Secundario"
                                value={form.telefono_secundario || ''}
                                onChange={(e) =>
                                    onFieldChange(
                                        'telefono_secundario',
                                        e.target.value
                                    )
                                }
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
                                label="Dirección"
                                value={form.direccion || ''}
                                onChange={(e) =>
                                    onFieldChange(
                                        'direccion',
                                        e.target.value
                                    )
                                }
                            />

                        </div>
                    </section>

                    {/* ====================================================== */}
                    {/* INFORMACIÓN CLÍNICA */}
                    {/* ====================================================== */}

                    <section className="rounded-2xl border border-gray-100 bg-white p-5">
                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Información Clínica
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <Input
                                label="EPS"
                                value={form.eps || ''}
                                onChange={(e) =>
                                    onFieldChange('eps', e.target.value)
                                }
                            />

                            <Input
                                label="Régimen"
                                value={form.regimen || ''}
                                onChange={(e) =>
                                    onFieldChange(
                                        'regimen',
                                        e.target.value
                                    )
                                }
                            />

                            <Input
                                label="Ocupación"
                                value={form.ocupacion || ''}
                                onChange={(e) =>
                                    onFieldChange(
                                        'ocupacion',
                                        e.target.value
                                    )
                                }
                            />

                            <Input
                                label="Modalidad Deportiva"
                                value={form.modalidad_deportiva || ''}
                                onChange={(e) =>
                                    onFieldChange(
                                        'modalidad_deportiva',
                                        e.target.value
                                    )
                                }
                            />

                            <Select
                                label="Red de Apoyo"
                                value={String(form.red_apoyo || false)}
                                onChange={(e) =>
                                    onFieldChange(
                                        'red_apoyo',
                                        e.target.value === 'true'
                                    )
                                }
                                options={RED_APOYO_OPTIONS}
                            />

                            <Cie10SearchField
                                label="Diagnostico CIE10"
                                value={form.id_cie || ''}
                                initialCie={cie10List.find((c) => c.id === form.id_cie) ?? null}
                                onChange={(cieId) =>
                                    onFieldChange(
                                        'id_cie',
                                        cieId ? Number(cieId) : null
                                    )
                                }
                                onResults={onCiesFound}
                            />

                        </div>
                    </section>

                    {/* ====================================================== */}
                    {/* ANTECEDENTES */}
                    {/* ====================================================== */}

                    <section className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5">

                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Antecedentes Clínicos
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                                Información médica relevante del paciente.
                            </p>
                        </div>

                        <div className="space-y-3">

                            {renderAntecedente(
                                'generales',
                                'Antecedentes Generales',
                                form.antecedentes,
                                'antecedentes'
                            )}

                            {renderAntecedente(
                                'personales',
                                'Antecedentes Personales',
                                form.antecedentes_personales,
                                'antecedentes_personales'
                            )}

                            {renderAntecedente(
                                'patologicos',
                                'Antecedentes Patológicos',
                                form.antecedentes_patologicos,
                                'antecedentes_patologicos'
                            )}

                            {renderAntecedente(
                                'quirurgicos',
                                'Antecedentes Quirúrgicos',
                                form.antecedentes_quirurgicos,
                                'antecedentes_quirurgicos'
                            )}

                            {renderAntecedente(
                                'traumaticos',
                                'Antecedentes Traumáticos',
                                form.antecedentes_traumaticos,
                                'antecedentes_traumaticos'
                            )}

                            {renderAntecedente(
                                'farmacologicos',
                                'Antecedentes Farmacológicos',
                                form.antecedentes_farmacologicos,
                                'antecedentes_farmacologicos'
                            )}

                            {renderAntecedente(
                                'familiares',
                                'Antecedentes Familiares',
                                form.antecedentes_familiares,
                                'antecedentes_familiares'
                            )}

                            {renderAntecedente(
                                'sociales',
                                'Antecedentes Sociales',
                                form.antecedentes_sociales,
                                'antecedentes_sociales'
                            )}

                        </div>
                    </section>
                </div>

                {/* ====================================================== */}
                {/* FOOTER */}
                {/* ====================================================== */}

                <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100 bg-white">
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
                            ? 'Actualizar Paciente'
                            : 'Crear Paciente'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

