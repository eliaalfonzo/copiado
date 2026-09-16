/**
 * Utilidades de fecha centralizadas. Evita repetir formateos de fecha
 * por toda la aplicacion y facilita cambiar la libreria (date-fns) en un
 * unico lugar si fuera necesario.
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function getMonthlyPeriodKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getMonthlyPeriodLabel(periodKey: string): string {
  const [year, month] = periodKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const label = format(date, 'MMMM yyyy', { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy');
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm");
}

export function getDayKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * El BCV (Venezuela) no publica una tasa nueva los sabados, domingos ni
 * feriados bancarios. Se usa para evitar dar a entender que "hoy" hubo
 * una tasa nueva cuando en realidad sigue vigente la del ultimo dia
 * habil. Solo cubre fines de semana; los feriados especificos deben
 * verificarse manualmente si se requiere precision total.
 */
export function isWeekend(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Compara si dos fechas caen en el mismo dia calendario (ignora hora).
 * Se usa para distinguir "el BCV publico una tasa nueva hoy" de
 * "sigue vigente la ultima que publico", sin depender de que ese dia
 * sea especificamente fin de semana (tambien cubre el caso normal de
 * un dia habil en el que el BCV aun no ha publicado la tasa del dia).
 */
export function isSameCalendarDay(a: Date | string, b: Date | string): boolean {
  return getDayKey(a) === getDayKey(b);
}