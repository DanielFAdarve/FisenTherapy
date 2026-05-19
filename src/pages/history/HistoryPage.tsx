// ============================================================
// FISENT - HISTORIA CLINICA PAGE (Refactorizada)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { historyService, appointmentService, cie10Service, patientService } from '../../data-access/services';
import { ClinicalHistory, Appointment, Cie10, Patient, HistoryQuoteContext } from '../../domain/models';
import { Card, Button, TableSkeleton, EmptyState, PageHeader } from '../../components/ui/Components';
import { PatientSearchField } from '../../components/PatientSearchField';
import { FileText, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { HistoryList } from './components/HistoryList';
import { HistoryFormModal } from './components/HistoryFormModal';

export default function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const quoteParam = searchParams.get('quote');
  const [histories, setHistories] = useState<ClinicalHistory[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cie10List, setCie10List] = useState<Cie10[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<number | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHistory, setEditingHistory] = useState<ClinicalHistory | null>(null);
  const [quoteContext, setQuoteContext] = useState<HistoryQuoteContext | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);

  const mergePatients = useCallback((foundPatients: Patient[]) => {
    setPatients((current) => {
      const merged = [...current];
      foundPatients.forEach((patient) => {
        if (!merged.some((item) => item.id === patient.id)) merged.push(patient);
      });
      return merged;
    });
  }, []);

  const mergeAppointment = useCallback((appointment?: Appointment | null) => {
    if (!appointment) return;
    setAppointments((current) => [appointment, ...current.filter((item) => item.id !== appointment.id)]);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appts, cies] = await Promise.all([
        selectedPatient ? appointmentService.getAll(undefined, undefined, Number(selectedPatient), 1, 100).catch(() => []) : Promise.resolve([]),
        cie10Service.getAll(undefined, 1, 100).catch(() => []),
      ]);
      setAppointments(appts || []);
      setCie10List(cies || []);
      if (selectedPatient) {
        const hists = await historyService.getByPatient(Number(selectedPatient), { page: 1, limit: 50 }).catch(() => []);
        setHistories(hists || []);
      } else {
        setHistories([]);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [selectedPatient]);

  useEffect(() => { loadData(); }, [loadData]);

  // Precarga desde parámetro URL (cita)
  useEffect(() => {
    const quoteId = Number(quoteParam || 0);
    if (!quoteId) return;
    historyService.getQuoteContext(quoteId)
      .then((context) => {
        setQuoteContext(context);
        mergeAppointment(context.cita);
        if (context.paciente) {
          mergePatients([context.paciente]);
          setSelectedPatient(context.paciente.id);
        } else if (context.cita?.id_paciente) {
          setSelectedPatient(context.cita.id_paciente);
        }
        setEditingHistory(context.historia);
        setModalOpen(true);
      })
      .catch(() => toast.error('No se pudo cargar la cita para historia clínica'));
  }, [quoteParam, mergeAppointment, mergePatients]);

  const openCreate = () => {
    setEditingHistory(null);
    setQuoteContext(null);
    setModalOpen(true);
  };

  const openEdit = (history: ClinicalHistory) => {
    setEditingHistory(history);
    setQuoteContext(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setQuoteContext(null);
    if (quoteParam) setSearchParams({});
  };

  const handleSave = async (savedHistory: ClinicalHistory) => {
    setHistories((current) => {
      const filtered = current.filter((h) => h.id !== savedHistory.id);
      return [savedHistory, ...filtered];
    });
    closeModal();
    loadData();
  };

  const downloadHistory = async (history: ClinicalHistory) => {
    setExportingId(history.id);
    try {
      const blob = await historyService.exportDocument(history.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historia-clinica-${history.id}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Documento DOCX generado');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo generar el DOCX');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FileText className="w-6 h-6" />}
        title="Historia Clínica"
        subtitle="Evoluciones por cita con antecedentes precargados"
        action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nueva Evolución</Button>}
      />

      <Card>
        <div className="p-4">
          <PatientSearchField
            label="Filtrar por Paciente"
            value={selectedPatient}
            initialPatient={patients.find((patient) => patient.id === selectedPatient) ?? null}
            onChange={(patientId, patient) => {
              setSelectedPatient(patientId ? Number(patientId) : '');
              if (patient) mergePatients([patient]);
            }}
            onResults={mergePatients}
            className="max-w-md"
          />
        </div>
      </Card>

      {loading ? (
        <Card className="p-6"><TableSkeleton rows={5} /></Card>
      ) : histories.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="No hay evoluciones registradas"
            description={selectedPatient ? 'Este paciente no tiene evoluciones' : 'Seleccione un paciente o abra una cita para ver su historia clínica'}
            action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nueva Evolución</Button>}
          />
        </Card>
      ) : (
        <HistoryList
          histories={histories}
          exportingId={exportingId}
          onEdit={openEdit}
          onDownload={downloadHistory}
        />
      )}

      <HistoryFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        editingHistory={editingHistory}
        quoteContext={quoteContext}
        appointments={appointments}
        cie10List={cie10List}
        patients={patients}
        mergePatients={mergePatients}
        mergeAppointment={mergeAppointment}
        onSave={handleSave}
      />
    </div>
  );
}