import { useState } from 'react';
import { Button, Textarea } from '../../../components/ui/Components';
import { ClinicalHistoryFormData } from '../../../domain/schemas';

interface AntecedentsSectionProps {
  values: ClinicalHistoryFormData;
  onChange: (field: string, value: any) => void;
  loading: boolean;
}

const FIELDS: { key: keyof ClinicalHistoryFormData; label: string }[] = [
  { key: 'antecedentes', label: 'Antecedentes generales' },
  { key: 'antecedentes_personales', label: 'Personales' },
  { key: 'antecedentes_patologicos', label: 'Patológicos' },
  { key: 'antecedentes_quirurgicos', label: 'Quirúrgicos' },
  { key: 'antecedentes_traumaticos', label: 'Traumáticos' },
  { key: 'antecedentes_farmacologicos', label: 'Farmacológicos' },
  { key: 'antecedentes_familiares', label: 'Familiares' },
  { key: 'antecedentes_sociales', label: 'Sociales' },
];

export function AntecedentsSection({ values, onChange, loading }: AntecedentsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            id="sync-antecedentes"
            checked={values.antecedentes_sincronizados || false}
            onChange={(e) => onChange('antecedentes_sincronizados', e.target.checked)}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm font-bold text-gray-700">Antecedentes sincronizados/editables del paciente</span>
        </label>
        <div className="flex items-center gap-2">
          {loading && <span className="text-xs text-teal-600 animate-pulse">Cargando antecedentes...</span>}
          <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {FIELDS.map(({ key, label }) => (
            <Textarea
              key={key}
              label={label}
              value={(values as any)[key] || ''}
              onChange={(e) => onChange(key, e.target.value)}
              rows={3}
            />
          ))}
        </div>
      )}
    </div>
  );
}