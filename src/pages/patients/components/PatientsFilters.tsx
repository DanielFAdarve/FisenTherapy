// ============================================================
// patients/components/PatientsFilters.tsx
// ============================================================

import { memo } from 'react';

import {
  Card,
  SearchInput,
  Alert,
} from '../../../components/ui/Components';

interface Props {
  searchInput: string;
  setSearchInput: (value: string) => void;
  error?: string | null;
}

function PatientsFiltersComponent({
  searchInput,
  setSearchInput,
  error,
}: Props) {
  return (
    <Card>
      <div className="p-4 space-y-3">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Buscar por nombre, apellido o documento..."
        />

        {error && (
          <Alert
            type="error"
            title="Error al cargar pacientes"
            message={error}
          />
        )}
      </div>
    </Card>
  );
}

export const PatientsFilters = memo(
  PatientsFiltersComponent
);
