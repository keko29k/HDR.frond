import { Injectable } from '@angular/core';
import { DateAdapter, MatDateFormats } from '@angular/material/core';

/**
 * Adaptador del calendario (mat-datepicker) que trabaja con textos
 * 'AAAA-MM-DD', el mismo formato que usaban los <input type="date">.
 * Así los formularios guardan y envían las fechas igual que antes, sin
 * problemas de zona horaria, y en pantalla se ven como dd/mm/aaaa.
 *
 * Al escribir a mano acepta dd/mm/aaaa, dd-mm-aaaa o aaaa-mm-dd.
 */

const INVALIDA = 'fecha-invalida';
const LOCALE = 'es-BO';

const pad = (n: number) => String(n).padStart(2, '0');

function aIso(anio: number, mes: number, dia: number): string {
  return `${anio}-${pad(mes + 1)}-${pad(dia)}`;
}

function desdeDate(d: Date): string {
  return aIso(d.getFullYear(), d.getMonth(), d.getDate());
}

function partes(fecha: string): [number, number, number] {
  const [a, m, d] = fecha.slice(0, 10).split('-').map(Number);
  return [a, m - 1, d];
}

function esFechaReal(anio: number, mes: number, dia: number): boolean {
  if (anio < 1 || mes < 0 || mes > 11 || dia < 1) return false;
  const f = new Date(anio, mes, dia);
  return f.getFullYear() === anio && f.getMonth() === mes && f.getDate() === dia;
}

function utc(fecha: string): Date {
  const [a, m, d] = partes(fecha);
  return new Date(Date.UTC(a, m, d));
}

export const FORMATOS_FECHA: MatDateFormats = {
  parse: { dateInput: null },
  display: {
    dateInput: 'dd/mm/aaaa',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' }
  }
};

@Injectable()
export class FechaIsoAdapter extends DateAdapter<string> {

  constructor() {
    super();
    this.setLocale(LOCALE);
  }

  getYear(date: string): number { return partes(date)[0]; }
  getMonth(date: string): number { return partes(date)[1]; }
  getDate(date: string): number { return partes(date)[2]; }

  getDayOfWeek(date: string): number {
    const [a, m, d] = partes(date);
    return new Date(a, m, d).getDay();
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    const fmt = new Intl.DateTimeFormat(LOCALE, { month: style, timeZone: 'UTC' });
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2017, i, 1))));
  }

  getDateNames(): string[] {
    return Array.from({ length: 31 }, (_, i) => String(i + 1));
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    const fmt = new Intl.DateTimeFormat(LOCALE, { weekday: style, timeZone: 'UTC' });
    // 1 de enero de 2017 fue domingo.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2017, 0, i + 1))));
  }

  getYearName(date: string): string { return String(this.getYear(date)); }

  /** La semana empieza el lunes. */
  getFirstDayOfWeek(): number { return 1; }

  getNumDaysInMonth(date: string): number {
    const [a, m] = partes(date);
    return new Date(a, m + 1, 0).getDate();
  }

  clone(date: string): string { return date; }

  createDate(year: number, month: number, date: number): string {
    if (!esFechaReal(year, month, date)) {
      throw Error(`Fecha no válida: ${year}-${month + 1}-${date}`);
    }
    return aIso(year, month, date);
  }

  today(): string { return desdeDate(new Date()); }

  parse(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? INVALIDA : desdeDate(value);

    const texto = String(value).trim();
    if (!texto) return null;

    let anio: number, mes: number, dia: number;
    let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(texto);
    if (m) {
      [dia, mes, anio] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
    } else if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(texto))) {
      [anio, mes, dia] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
    } else {
      return INVALIDA;
    }

    return esFechaReal(anio, mes, dia) ? aIso(anio, mes, dia) : INVALIDA;
  }

  format(date: string, displayFormat: unknown): string {
    if (!this.isValid(date)) return '';
    if (displayFormat === FORMATOS_FECHA.display.dateInput) {
      const [a, m, d] = partes(date);
      return `${pad(d)}/${pad(m + 1)}/${a}`;
    }
    return new Intl.DateTimeFormat(LOCALE, {
      ...(displayFormat as Intl.DateTimeFormatOptions),
      timeZone: 'UTC'
    }).format(utc(date));
  }

  addCalendarYears(date: string, years: number): string {
    return this.addCalendarMonths(date, years * 12);
  }

  addCalendarMonths(date: string, months: number): string {
    const [a, m, d] = partes(date);
    const destino = new Date(a, m + months, 1);
    const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
    return aIso(destino.getFullYear(), destino.getMonth(), Math.min(d, ultimoDia));
  }

  addCalendarDays(date: string, days: number): string {
    const [a, m, d] = partes(date);
    return desdeDate(new Date(a, m, d + days));
  }

  toIso8601(date: string): string { return date.slice(0, 10); }

  /** Acepta 'AAAA-MM-DD' y también 'AAAA-MM-DDTHH:mm:ss' que manda el backend. */
  override deserialize(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? INVALIDA : desdeDate(value);
    if (typeof value === 'string') {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
      if (m && esFechaReal(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) return m[0];
    }
    return INVALIDA;
  }

  isDateInstance(obj: unknown): boolean { return typeof obj === 'string'; }

  isValid(date: string): boolean {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
    return !!m && esFechaReal(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  invalid(): string { return INVALIDA; }
}
