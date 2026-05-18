import { useEffect, useMemo, useRef, useState } from 'react';
import { patientService } from '../data-access/services';
import { Patient } from '../domain/models';

interface PatientSearchFieldProps {
  label?: string;
  value: number | '';
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  initialPatient?: Patient | null;
  onChange: (patientId: number | '', patient?: Patient) => void;
  onResults?: (patients: Patient[]) => void;
}

const patientLabel = (patient: Patient) => (
  `${patient.nombre} ${patient.apellido}${patient.num_doc ? ` (${patient.num_doc})` : ''}`
);

export function PatientSearchField({
  label = 'Paciente',
  value,
  error,
  placeholder = 'Escriba nombre, apellido o documento...',
  disabled = false,
  className = '',
  initialPatient,
  onChange,
  onResults,
}: PatientSearchFieldProps) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Patient[]>(initialPatient ? [initialPatient] : []);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient ?? null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const requestIdRef = useRef(0);

  const inputId = useMemo(() => label.toLowerCase().replace(/\s+/g, '-'), [label]);

  useEffect(() => {
    if (!initialPatient) return;
    setSelectedPatient(initialPatient);
    setOptions((current) => [initialPatient, ...current.filter((patient) => patient.id !== initialPatient.id)]);
  }, [initialPatient]);

  useEffect(() => {
    if (!value) {
      setSelectedPatient(null);
      if (!open) setQuery('');
      return;
    }

    if (selectedPatient?.id === value) return;
    const localMatch = options.find((patient) => patient.id === value);
    if (localMatch) {
      setSelectedPatient(localMatch);
      return;
    }

    let cancelled = false;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    patientService.getById(Number(value))
      .then((patient) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setSelectedPatient(patient);
        setOptions((current) => [patient, ...current.filter((item) => item.id !== patient.id)]);
        onResults?.([patient]);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled && requestId === requestIdRef.current) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [onResults, open, options, selectedPatient?.id, value]);

  useEffect(() => {
    if (!open && !touched) return;

    const requestId = ++requestIdRef.current;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      patientService.getAll(query, 1, 20)
        .then((patients) => {
          if (requestId !== requestIdRef.current) return;
          const activePatients = (patients || []).filter((patient) => patient.estado !== false);
          setOptions((current) => {
            const merged = [...activePatients];
            if (selectedPatient && !merged.some((patient) => patient.id === selectedPatient.id)) merged.unshift(selectedPatient);
            current.forEach((patient) => {
              if (patient.id === value && !merged.some((item) => item.id === patient.id)) merged.unshift(patient);
            });
            return merged;
          });
          onResults?.(activePatients);
        })
        .catch(() => undefined)
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false);
        });
    }, query.trim() ? 350 : 0);

    return () => window.clearTimeout(timeout);
  }, [onResults, open, query, selectedPatient, touched, value]);

  const visibleOptions = options.filter((patient) => patient.estado !== false);

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setQuery(patientLabel(patient));
    setOpen(false);
    onChange(patient.id, patient);
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setQuery('');
    setOpen(true);
    onChange('');
  };

  const displayValue = open ? query : selectedPatient ? patientLabel(selectedPatient) : '';

  return (
    <div className={`relative w-full ${className}`}>
      {label && <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={displayValue}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => {
            setTouched(true);
            setOpen(true);
            setQuery(selectedPatient ? patientLabel(selectedPatient) : query);
          }}
          onChange={(event) => {
            setTouched(true);
            setOpen(true);
            setQuery(event.target.value);
            if (selectedPatient) {
              setSelectedPatient(null);
              onChange('');
            }
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          className={`w-full rounded-xl border-2 px-3 py-2.5 pr-20 text-base md:text-sm transition-all duration-200 focus:outline-none focus:ring-0 bg-white ${
            error
              ? 'border-red-300 bg-red-50/50 focus:border-red-500'
              : 'border-gray-200 hover:border-gray-300 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/10'
          }`}
          aria-invalid={!!error}
        />
        {value && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearPatient}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700"
          >
            Limpiar
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{error}</p>}
      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {loading && <div className="px-3 py-2 text-sm text-gray-500">Buscando pacientes...</div>}
          {!loading && visibleOptions.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">Sin resultados. Escriba para buscar en el servidor.</div>
          )}
          {!loading && visibleOptions.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectPatient(patient)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-teal-50 focus:bg-teal-50 focus:outline-none"
            >
              <span className="font-semibold text-gray-800">{patient.nombre} {patient.apellido}</span>
              <span className="block text-xs text-gray-500">{patient.tipo_doc} {patient.num_doc}</span>
            </button>
          ))}
        </div>
      )}
      {!error && <p className="mt-1.5 text-xs text-gray-400">La búsqueda consulta el endpoint de pacientes al escribir.</p>}
    </div>
  );
}
