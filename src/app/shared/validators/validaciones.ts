import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validadores coherentes para los formularios del sistema.
 *
 * Todos devuelven { invalido: 'mensaje' }, así el formulario muestra el
 * texto con una sola línea:
 *   @if (form.get('campo')?.getError('invalido'); as msg) { <mat-error>{{ msg }}</mat-error> }
 *
 * Los campos vacíos no se validan aquí (para eso está Validators.required).
 */

const error = (mensaje: string): ValidationErrors => ({ invalido: mensaje });

const texto = (control: AbstractControl): string =>
  control.value === null || control.value === undefined ? '' : String(control.value).trim();

// =====================================================
// FECHAS
// =====================================================

/** Convierte 'AAAA-MM-DD' (input type="date") a fecha local sin hora. */
function leerFecha(valor: unknown): Date | null {
  if (!valor) return null;

  if (valor instanceof Date) {
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }

  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor));
  if (!coincidencia) return null;

  const [, a, m, d] = coincidencia.map(Number);
  const fecha = new Date(a, m - 1, d);
  return fecha.getMonth() === m - 1 ? fecha : null;
}

function hoySinHora(): Date {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

function edadEnAnios(nacimiento: Date, referencia: Date): number {
  let edad = referencia.getFullYear() - nacimiento.getFullYear();
  const aunNoCumple =
    referencia.getMonth() < nacimiento.getMonth() ||
    (referencia.getMonth() === nacimiento.getMonth() && referencia.getDate() < nacimiento.getDate());
  return aunNoCumple ? edad - 1 : edad;
}

/** 'AAAA-MM-DD' de hoy menos N años (para el atributo max/min del input). */
export function fechaHaceAnios(anios: number): string {
  const hoy = hoySinHora();
  const f = new Date(hoy.getFullYear() - anios, hoy.getMonth(), hoy.getDate());
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

/** Fecha de nacimiento: no puede ser hoy ni futura y la edad debe estar en el rango. */
export function fechaNacimientoValida(edadMinima: number, edadMaxima = 110): ValidatorFn {
  return control => {
    if (!control.value) return null;

    const fecha = leerFecha(control.value);
    if (!fecha) return error('Fecha no válida.');

    const hoy = hoySinHora();
    if (fecha >= hoy) return error('La fecha de nacimiento debe ser anterior a hoy.');

    const edad = edadEnAnios(fecha, hoy);
    if (edad < edadMinima) return error(`Debe tener al menos ${edadMinima} años.`);
    if (edad > edadMaxima) return error(`La edad no puede superar los ${edadMaxima} años.`);

    return null;
  };
}

/** La fecha no puede ser posterior a hoy (gastos, compras, fabricación...). */
export function fechaNoFutura(): ValidatorFn {
  return control => {
    const fecha = leerFecha(control.value);
    if (!control.value) return null;
    if (!fecha) return error('Fecha no válida.');
    return fecha > hoySinHora() ? error('La fecha no puede ser posterior a hoy.') : null;
  };
}

/** La fecha debe ser posterior a hoy (vencimientos de productos nuevos). */
export function fechaFutura(): ValidatorFn {
  return control => {
    const fecha = leerFecha(control.value);
    if (!control.value) return null;
    if (!fecha) return error('Fecha no válida.');
    return fecha <= hoySinHora() ? error('La fecha debe ser posterior a hoy.') : null;
  };
}

// =====================================================
// TEXTOS
// =====================================================

/** Nombres y apellidos: solo letras (con tildes y ñ), espacios, punto, apóstrofo o guion. */
export function nombrePersona(): ValidatorFn {
  return control => {
    const valor = texto(control);
    if (!valor) return null;
    if (valor.length < 2) return error('Debe tener al menos 2 letras.');
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.'-]*$/.test(valor)
      ? null
      : error('Solo se permiten letras y espacios.');
  };
}

/** Evita textos que solo tienen espacios o un único carácter (nombres de empresas, conceptos...). */
export function textoConContenido(minimo = 2): ValidatorFn {
  return control => {
    if (control.value === null || control.value === undefined || control.value === '') return null;
    const valor = texto(control);
    if (!valor) return error('No puede contener solo espacios.');
    if (valor.length < minimo) return error(`Debe tener al menos ${minimo} caracteres.`);
    if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(valor)) return error('Escribe un texto válido.');
    return null;
  };
}

/** Correo con dominio completo (usuario@dominio.com). */
export function correoValido(): ValidatorFn {
  return control => {
    const valor = texto(control);
    if (!valor) return null;
    return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(valor)
      ? null
      : error('Ingresa un correo válido, por ejemplo nombre@gmail.com.');
  };
}

/** Teléfono boliviano: fijo de 7 dígitos o celular de 8 que empieza en 6 o 7 (acepta +591). */
export function telefonoBolivia(): ValidatorFn {
  return control => {
    const valor = texto(control);
    if (!valor) return null;

    if (!/^[0-9+\s()-]+$/.test(valor)) return error('Solo números, espacios, + y -.');

    let digitos = valor.replace(/\D/g, '');
    if (digitos.startsWith('591') && digitos.length > 8) digitos = digitos.slice(3);

    if (digitos.length === 8 && /^[67]/.test(digitos)) return null;
    if (digitos.length === 7) return null;

    return error('Celular de 8 dígitos (6… o 7…) o teléfono fijo de 7 dígitos.');
  };
}

/** CI o NIT boliviano: 5 a 12 dígitos, con complemento opcional (-1A) y extensión (LP, CB...). "0" = sin NIT. */
export function ciNitBolivia(permitirCero = true): ValidatorFn {
  return control => {
    const valor = texto(control).toUpperCase();
    if (!valor) return null;
    if (valor === '0') return permitirCero ? null : error('Ingresa un número válido.');

    return /^\d{5,12}(-[0-9A-Z]{1,3})?(\s?(LP|CB|SC|OR|PT|CH|TJ|BE|PD))?$/.test(valor)
      ? null
      : error('Solo números (5 a 12 dígitos), con complemento opcional. Ej.: 4567891 o 4567891-1A LP.');
  };
}

/** NIT de empresa: solo dígitos, 7 a 13. */
export function nitEmpresa(): ValidatorFn {
  return control => {
    const valor = texto(control);
    if (!valor) return null;
    return /^\d{7,13}$/.test(valor) ? null : error('El NIT debe tener entre 7 y 13 dígitos, sin letras.');
  };
}

/** Nombre de usuario: 4 a 30 caracteres, sin espacios (letras, números, punto, guion y guion bajo). */
export function nombreUsuario(): ValidatorFn {
  return control => {
    const valor = control.value ? String(control.value) : '';
    if (!valor) return null;
    if (/\s/.test(valor)) return error('No puede tener espacios.');
    if (valor.length < 4 || valor.length > 30) return error('Debe tener entre 4 y 30 caracteres.');
    return /^[A-Za-z0-9._-]+$/.test(valor) ? null : error('Solo letras, números, punto, guion y guion bajo.');
  };
}

/** Contraseña: mínimo 6 caracteres con al menos una letra y un número. */
export function claveSegura(): ValidatorFn {
  return control => {
    const valor = control.value ? String(control.value) : '';
    if (!valor) return null;
    if (valor.length < 6) return error('Debe tener mínimo 6 caracteres.');
    if (/\s/.test(valor)) return error('No puede tener espacios.');
    return /[A-Za-z]/.test(valor) && /\d/.test(valor)
      ? null
      : error('Debe combinar letras y números.');
  };
}

/** Códigos internos o de barras: sin espacios. */
export function codigoSinEspacios(soloDigitos = false): ValidatorFn {
  return control => {
    const valor = texto(control);
    if (!valor) return null;
    if (/\s/.test(valor)) return error('No puede tener espacios.');
    if (soloDigitos && !/^\d{6,14}$/.test(valor)) return error('El código de barras debe tener de 6 a 14 dígitos.');
    if (!soloDigitos && !/^[A-Za-z0-9._-]+$/.test(valor)) return error('Solo letras, números, punto y guion.');
    return null;
  };
}

// =====================================================
// NÚMEROS
// =====================================================

/** El valor debe ser mayor que cero (precios de venta, cantidades...). */
export function mayorQueCero(mensaje = 'Debe ser mayor a 0.'): ValidatorFn {
  return control => {
    if (control.value === null || control.value === undefined || control.value === '') return null;
    return Number(control.value) > 0 ? null : error(mensaje);
  };
}

/**
 * El valor no puede ser menor que otro campo del mismo formulario
 * (ej.: precio de venta >= precio de compra).
 * Recuerda revalidar este campo cuando cambie el otro.
 */
export function noMenorQue(otroCampo: string, mensaje: string): ValidatorFn {
  return control => {
    const otro = control.parent?.get(otroCampo)?.value;
    if (control.value === null || control.value === '' || otro === null || otro === '' || otro === undefined) return null;
    return Number(control.value) >= Number(otro) ? null : error(mensaje);
  };
}

/** 'AAAA-MM-DD' de hoy (para el atributo max de los input date). */
export function hoyIso(): string {
  return fechaHaceAnios(0);
}
