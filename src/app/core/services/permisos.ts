/**
 * Permisos por rol.
 *
 * El sistema maneja dos roles:
 *  - Administrador: ve todo.
 *  - Vendedor: ventas, compras, cajas, clientes, consulta de productos,
 *    inventario de su sucursal y vencimientos.
 *
 * Cualquier otro rol que exista en la base de datos se trata como Vendedor.
 */

/** Rutas del vendedor con todas sus subrutas (listar, nuevo, editar). */
const VENDEDOR_COMPLETO = ['/ventas', '/compras', '/cajas', '/clientes'];

/** Rutas del vendedor de solo consulta (sin /nuevo ni /editar). */
const VENDEDOR_SOLO_LISTA = [
  '/dashboard',
  '/productos',
  '/lotes',
  '/inventario',
  '/vencimientos'
];

/** Rol guardado al iniciar sesión ('' si no hay sesión). */
export function rolDeSesion(): string {
  try {
    const datos = JSON.parse(localStorage.getItem('usuario') ?? 'null') as { rol?: unknown } | null;
    return typeof datos?.rol === 'string' ? datos.rol : '';
  } catch {
    return '';
  }
}

export function esAdministrador(rol: string = rolDeSesion()): boolean {
  const valor = rol.trim().toUpperCase();
  return valor === 'ADMINISTRADOR' || valor === 'ADMIN';
}

/** Hay sesión y el rol no es administrador. */
export function esVendedor(rol: string = rolDeSesion()): boolean {
  return rol.trim() !== '' && !esAdministrador(rol);
}

/** ¿El rol puede abrir esta URL? */
export function puedeVerRuta(url: string, rol: string = rolDeSesion()): boolean {
  if (!esVendedor(rol)) {
    return true;
  }

  const ruta = url.split(/[?#]/)[0].replace(/\/+$/, '') || '/';

  if (ruta === '/' || ruta.startsWith('/login')) {
    return true;
  }

  if (VENDEDOR_COMPLETO.some(base => ruta === base || ruta.startsWith(base + '/'))) {
    return true;
  }

  return VENDEDOR_SOLO_LISTA.includes(ruta);
}
