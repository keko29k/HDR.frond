/** Utilidades para generar documentos imprimibles en una ventana nueva. */

export const escaparHtml = (valor: string | null | undefined): string =>
  (valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const bs = (valor: number): string =>
  `Bs ${(valor ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** 'yyyy-MM-dd' o ISO → 'dd/MM/yyyy' sin desfase de zona horaria. */
export const fechaCorta = (valor: string | null | undefined): string => {
  if (!valor) return '—';
  const [anio, mes, dia] = valor.substring(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

export const fechaHora = (valor: string): string => {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? fechaCorta(valor)
    : `${fecha.toLocaleDateString('es-BO')} ${fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`;
};

/**
 * Abre una ventana, escribe el HTML y lanza la impresión.
 * Devuelve false si el navegador bloqueó la ventana emergente.
 */
export function imprimirHtml(html: string, ancho = 900, alto = 700): boolean {
  const ventana = window.open('', '_blank', `width=${ancho},height=${alto}`);

  if (!ventana) {
    return false;
  }

  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();

  setTimeout(() => {
    if (!ventana.closed) {
      ventana.focus();
      ventana.print();
    }
  }, 300);

  return true;
}
