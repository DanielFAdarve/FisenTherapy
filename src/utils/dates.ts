// utils/dates.ts
import { format } from 'date-fns';
export const formatHistoryDate = (value?: string) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, 'dd/MM/yyyy HH:mm');
};