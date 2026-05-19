import { ClinicalHistoryFormData } from '../../../domain/schemas';
import { Cie10 } from '../../../domain/models';

interface HistoryFormPreviewProps {
  form: ClinicalHistoryFormData;
  cie10List: Cie10[];
}

export function HistoryFormPreview({ form, cie10List }: HistoryFormPreviewProps) {
  const cieCode = cie10List.find((cie) => cie.id === form.id_cie)?.codigo || '--';

  return (
    <div className="max-h-[620px] space-y-3 overflow-y-auto rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
      <p><strong>Cita:</strong> #{form.id_cita || '--'}</p>
      <p><strong>CIE10:</strong> {cieCode}</p>
      <p><strong>Estado:</strong> {form.descripcion_estado_paciente || form.evolucion || 'Sin registrar'}</p>
      <p><strong>Subjetivo:</strong> {form.subjetivo || 'Sin registrar'}</p>
      <p><strong>Objetivo:</strong> {form.objetivo || 'Sin registrar'}</p>
      <p><strong>Intervención:</strong> {form.intervencion || 'Sin registrar'}</p>
      <p><strong>Recomendaciones:</strong> {form.recomendaciones || 'Sin registrar'}</p>
      <p><strong>Antecedentes:</strong> {form.antecedentes || 'Sin registrar'}</p>
    </div>
  );
}