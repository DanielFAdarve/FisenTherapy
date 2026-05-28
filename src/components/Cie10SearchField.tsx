import { useEffect, useMemo, useRef, useState } from 'react';
import { cie10Service } from '../data-access/services';
import { Cie10 } from '../domain/models';

interface Cie10SearchFieldProps {
  label?: string;
  value: number | '';
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  initialCie?: Cie10 | null;
  onChange: (cieId: number | '', cie?: Cie10) => void;
  onResults?: (cies: Cie10[]) => void;
}

const cieLabel = (cie: Cie10) => `${cie.codigo} - ${cie.descripcion}`;

export function Cie10SearchField({
  label = 'Diagnostico CIE10',
  value,
  error,
  placeholder = 'Escriba codigo o diagnostico...',
  disabled = false,
  className = '',
  initialCie,
  onChange,
  onResults,
}: Cie10SearchFieldProps) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Cie10[]>(initialCie ? [initialCie] : []);
  const [selectedCie, setSelectedCie] = useState<Cie10 | null>(initialCie ?? null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const requestIdRef = useRef(0);

  const inputId = useMemo(() => label.toLowerCase().replace(/\s+/g, '-'), [label]);

  useEffect(() => {
    if (!initialCie) return;
    setSelectedCie(initialCie);
    setOptions((current) => [initialCie, ...current.filter((cie) => cie.id !== initialCie.id)]);
  }, [initialCie]);

  useEffect(() => {
    if (!value) {
      setSelectedCie(null);
      if (!open) setQuery('');
      return;
    }

    if (selectedCie?.id === value) return;
    const localMatch = options.find((cie) => cie.id === value);
    if (localMatch) {
      setSelectedCie(localMatch);
      return;
    }

    let cancelled = false;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    cie10Service.getById(Number(value))
      .then((cie) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setSelectedCie(cie);
        setOptions((current) => [cie, ...current.filter((item) => item.id !== cie.id)]);
        onResults?.([cie]);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled && requestId === requestIdRef.current) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [onResults, open, options, selectedCie?.id, value]);

  useEffect(() => {
    if (!open && !touched) return;

    const requestId = ++requestIdRef.current;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      cie10Service.getAll(query, 1, 20)
        .then((cies) => {
          if (requestId !== requestIdRef.current) return;
          const activeCies = (cies || []).filter((cie) => cie.estado !== false);
          setOptions((current) => {
            const merged = [...activeCies];
            if (selectedCie && !merged.some((cie) => cie.id === selectedCie.id)) merged.unshift(selectedCie);
            current.forEach((cie) => {
              if (cie.id === value && !merged.some((item) => item.id === cie.id)) merged.unshift(cie);
            });
            return merged;
          });
          onResults?.(activeCies);
        })
        .catch(() => undefined)
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false);
        });
    }, query.trim() ? 350 : 0);

    return () => window.clearTimeout(timeout);
  }, [onResults, open, query, selectedCie, touched, value]);

  const visibleOptions = options.filter((cie) => cie.estado !== false);

  const selectCie = (cie: Cie10) => {
    setSelectedCie(cie);
    setQuery(cieLabel(cie));
    setOpen(false);
    onChange(cie.id, cie);
  };

  const clearCie = () => {
    setSelectedCie(null);
    setQuery('');
    setOpen(true);
    onChange('');
  };

  const displayValue = open ? query : selectedCie ? cieLabel(selectedCie) : '';

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
            setQuery(selectedCie ? cieLabel(selectedCie) : query);
          }}
          onChange={(event) => {
            setTouched(true);
            setOpen(true);
            setQuery(event.target.value);
            if (selectedCie) {
              setSelectedCie(null);
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
            onClick={clearCie}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700"
          >
            Limpiar
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{error}</p>}
      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {loading && <div className="px-3 py-2 text-sm text-gray-500">Buscando CIE10...</div>}
          {!loading && visibleOptions.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">Sin resultados. Escriba para buscar en el servidor.</div>
          )}
          {!loading && visibleOptions.map((cie) => (
            <button
              key={cie.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectCie(cie)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-teal-50 focus:bg-teal-50 focus:outline-none"
            >
              <span className="font-semibold text-gray-800">{cie.codigo}</span>
              <span className="block text-xs text-gray-500">{cie.descripcion}</span>
            </button>
          ))}
        </div>
      )}
      {!error && <p className="mt-1.5 text-xs text-gray-400">La busqueda consulta CIE10 al escribir.</p>}
    </div>
  );
}
