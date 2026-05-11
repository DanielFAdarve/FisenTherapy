import { Alert, Card, Input, SearchInput } from '../../../components/ui/Components';

interface Props {
  filterDate: string;
  onFilterDateChange: (value: string) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  error?: string | null;
}

export function AppointmentsFilters({
  filterDate,
  onFilterDateChange,
  searchInput,
  onSearchInputChange,
  error,
}: Props) {
  return (
    <Card>
      <div className="p-4 space-y-4">
        {error && (
          <Alert
            type="error"
            title="No pudimos cargar las citas"
            message={error}
          />
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr] md:items-end">
          <Input
            label="Fecha"
            type="date"
            value={filterDate}
            onChange={(event) => onFilterDateChange(event.target.value)}
          />

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Buscar
            </label>
            <SearchInput
              value={searchInput}
              onChange={onSearchInputChange}
              placeholder="Paciente, documento, profesional o motivo..."
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
