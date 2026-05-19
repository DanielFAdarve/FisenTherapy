import { ClinicalHistory } from '../../../domain/models';
import { Card, Badge, Button } from '../../../components/ui/Components';
import { Edit2, Download } from 'lucide-react';
import { formatHistoryDate } from '../../../utils/dates'; // Puedes mover la función auxiliar aquí

interface HistoryListProps {
  histories: ClinicalHistory[];
  exportingId: number | null;
  onEdit: (history: ClinicalHistory) => void;
  onDownload: (history: ClinicalHistory) => void;
}

export function HistoryList({ histories, exportingId, onEdit, onDownload }: HistoryListProps) {
  return (
    <div className="space-y-4">
      {histories.map((h) => (
        <Card key={h.id} className="overflow-hidden" hover>
          <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
          <div className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">
                  Historia #{h.id} · Cita #{h.id_cita} - {h.cita?.fecha?.split('T')[0] || h.fecha_evolucion}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
                  CIE10: {h.cie10?.codigo || h.Cie10?.codigo || '--'} - {h.cie10?.descripcion || h.Cie10?.descripcion || 'Sin diagnóstico'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {h.antecedentes_sincronizados && <Badge variant="info">Antecedentes sync</Badge>}
                <span className="text-xs text-gray-400">{formatHistoryDate(h.created_at)}</span>
                <Button size="sm" variant="outline" onClick={() => onEdit(h)}>
                  <Edit2 className="mr-1 h-3.5 w-3.5" />Ver/Editar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onDownload(h)} isLoading={exportingId === h.id}>
                  <Download className="mr-1 h-3.5 w-3.5" />DOCX
                </Button>
              </div>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-teal-50/20 rounded-xl p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {h.evolucion || h.descripcion_estado_paciente || 'Sin resumen registrado'}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}