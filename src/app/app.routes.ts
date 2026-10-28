import { Routes } from '@angular/router';

const loadLoginComponent = () =>
import('./features/auth/pages/login/login')
.then(m => m.LoginComponent);

/* =========================================================
USUARIOS
========================================================= */

const loadUsuarioListComponent = () =>
import('./features/usuarios/pages/usuario-list/usuario-list')
.then(m => m.UsuarioListComponent);

const loadUsuarioFormComponent = () =>
import('./features/usuarios/pages/usuario-form/usuario-form')
.then(m => m.UsuarioFormComponent);

/* =========================================================
SUCURSALES
========================================================= */

const loadSucursalListComponent = () =>
import('./features/sucursales/pages/sucursal-list/sucursal-list')
.then(m => m.SucursalListComponent);

const loadSucursalFormComponent = () =>
import('./features/sucursales/pages/sucursal-form/sucursal-form')
.then(m => m.SucursalFormComponent);

/* =========================================================
MARCAS
========================================================= */

const loadMarcaListComponent = () =>
import('./features/marcas/pages/marca-list/marca-list')
.then(m => m.MarcaListComponent);

const loadMarcaFormComponent = () =>
import('./features/marcas/pages/marca-form/marca-form')
.then(m => m.MarcaFormComponent);

/* =========================================================
CATEGORÍAS
========================================================= */

const loadCategoriaListComponent = () =>
import('./features/categorias/pages/categoria-list/categoria-list')
.then(m => m.CategoriaListComponent);

const loadCategoriaFormComponent = () =>
import('./features/categorias/pages/categoria-form/categoria-form')
.then(m => m.CategoriaFormComponent);

/* =========================================================
GASTOS
========================================================= */

const loadGastoListComponent = () =>
import('./features/gastos/pages/gasto-list/gasto-list')
.then(m => m.GastoListComponent);

const loadGastoFormComponent = () =>
import('./features/gastos/pages/gasto-form/gasto-form')
.then(m => m.GastoFormComponent);

/* =========================================================
CAJAS
========================================================= */

const loadCajaListComponent = () =>
import('./features/cajas/pages/caja-list/caja-list')
.then(m => m.CajaListComponent);

const loadCajaFormComponent = () =>
import('./features/cajas/pages/caja-form/caja-form')
.then(m => m.CajaFormComponent);

/* =========================================================
PROVEEDORES
========================================================= */

const loadProveedorListComponent = () =>
import('./features/proveedores/pages/proveedor-list/proveedor-list')
.then(m => m.ProveedorListComponent);

const loadProveedorFormComponent = () =>
import('./features/proveedores/pages/proveedor-form/proveedor-form')
.then(m => m.ProveedorFormComponent);

/* =========================================================
PRODUCTOS
========================================================= */

const loadProductoListComponent = () =>
import('./features/productos/pages/producto-list/producto-list')
.then(m => m.ProductoListComponent);

const loadProductoFormComponent = () =>
import('./features/productos/pages/producto-form/producto-form')
.then(m => m.ProductoFormComponent);

/* =========================================================
LOTES
========================================================= */

const loadLoteListComponent = () =>
import('./features/lotes/pages/lote-list/lote-list')
.then(m => m.LoteList);

const loadLoteFormComponent = () =>
import('./features/lotes/pages/lote-form/lote-form')
.then(m => m.LoteForm);

/* =========================================================
CLIENTES
========================================================= */

const loadClienteListComponent = () =>
import('./features/clientes/pages/cliente-list/cliente-list')
.then(m => m.ClienteListComponent);

const loadClienteFormComponent = () =>
import('./features/clientes/pages/cliente-form/cliente-form')
.then(m => m.ClienteFormComponent);

/* =========================================================
VENTAS
========================================================= */

const loadVentaListComponent = () =>
import('./features/ventas/pages/venta-list/venta-list')
.then(m => m.VentaListComponent);

const loadVentaFormComponent = () =>
import('./features/ventas/pages/venta-form/venta-form')
.then(m => m.VentaFormComponent);

/* =========================================================
COMPRAS
========================================================= */

const loadCompraListComponent = () =>
import('./features/compras/pages/compra-list/compra-list')
.then(m => m.CompraListComponent);

const loadCompraFormComponent = () =>
import('./features/compras/pages/compra-form/compra-form')
.then(m => m.CompraFormComponent);

/* =========================================================
REPORTES
========================================================= */

const loadReporteListComponent = () =>
import('./features/reportes/pages/reporte-list/reporte-list')
.then(m => m.ReporteListComponent);

/* =========================================================
RUTAS
========================================================= */

export const routes: Routes = [

{
path: 'login',
loadComponent: loadLoginComponent
},

/* =======================================================
PRODUCTOS
======================================================= */

{
path: 'productos',
children: [
{
path: '',
loadComponent: loadProductoListComponent
},
{
path: 'nuevo',
loadComponent: loadProductoFormComponent
},
{
path: 'editar/:id',
loadComponent: loadProductoFormComponent
}
]
},

{
path: 'lotes',
children: [
{
path: '',
loadComponent: loadLoteListComponent
},
{
path: 'nuevo',
loadComponent: loadLoteFormComponent
},
{
path: 'editar/:id',
loadComponent: loadLoteFormComponent
}
]
},

/* =======================================================
CATEGORÍAS
======================================================= */

{
path: 'categorias',
children: [
{
path: '',
loadComponent: loadCategoriaListComponent
},
{
path: 'nuevo',
loadComponent: loadCategoriaFormComponent
},
{
path: 'editar/:id',
loadComponent: loadCategoriaFormComponent
}
]
},

/* =======================================================
MARCAS
======================================================= */

{
path: 'marcas',
children: [
{
path: '',
loadComponent: loadMarcaListComponent
},
{
path: 'nuevo',
loadComponent: loadMarcaFormComponent
},
{
path: 'editar/:id',
loadComponent: loadMarcaFormComponent
}
]
},

/* =======================================================
PROVEEDORES
======================================================= */

{
path: 'proveedores',
children: [
{
path: '',
loadComponent: loadProveedorListComponent
},
{
path: 'nuevo',
loadComponent: loadProveedorFormComponent
},
{
path: 'editar/:id',
loadComponent: loadProveedorFormComponent
}
]
},

/* =======================================================
VENTAS
======================================================= */

{
path: 'ventas',
children: [
{
path: '',
loadComponent: loadVentaListComponent
},
{
path: 'nuevo',
loadComponent: loadVentaFormComponent
},
{
path: 'editar/:id',
loadComponent: loadVentaFormComponent
}
]
},

/* =======================================================
COMPRAS
======================================================= */

{
path: 'compras',
children: [
{
path: '',
loadComponent: loadCompraListComponent
},
{
path: 'nuevo',
loadComponent: loadCompraFormComponent
},
{
path: 'editar/:id',
loadComponent: loadCompraFormComponent
}
]
},

/* =======================================================
CAJAS
======================================================= */

{
path: 'cajas',
children: [
{
path: '',
loadComponent: loadCajaListComponent
},
{
path: 'nuevo',
loadComponent: loadCajaFormComponent
},
{
path: 'editar/:id',
loadComponent: loadCajaFormComponent
}
]
},

/* =======================================================
CLIENTES
======================================================= */

{
path: 'clientes',
children: [
{
path: '',
loadComponent: loadClienteListComponent
},
{
path: 'nuevo',
loadComponent: loadClienteFormComponent
},
{
path: 'editar/:id',
loadComponent: loadClienteFormComponent
}
]
},

/* =======================================================
USUARIOS
======================================================= */

{
path: 'usuarios',
children: [
{
path: '',
loadComponent: loadUsuarioListComponent
},
{
path: 'nuevo',
loadComponent: loadUsuarioFormComponent
},
{
path: 'editar/:id',
loadComponent: loadUsuarioFormComponent
}
]
},

/* =======================================================
SUCURSALES
======================================================= */

{
path: 'sucursales',
children: [
{
path: '',
loadComponent: loadSucursalListComponent
},
{
path: 'nuevo',
loadComponent: loadSucursalFormComponent
},
{
path: 'editar/:id',
loadComponent: loadSucursalFormComponent
}
]
},

/* =======================================================
GASTOS
======================================================= */

{
path: 'gastos',
children: [
{
path: '',
loadComponent: loadGastoListComponent
},
{
path: 'nuevo',
loadComponent: loadGastoFormComponent
},
{
path: 'editar/:id',
loadComponent: loadGastoFormComponent
}
]
},

/* =======================================================
REPORTES
======================================================= */

{
path: 'reportes',
children: [
{
path: '',
loadComponent: loadReporteListComponent
}
]
},

/* =======================================================
RUTA PRINCIPAL

 Al entrar a:
 http://localhost:4200/

 irá automáticamente a productos.

======================================================= */

{
path: '',
redirectTo: 'productos',
pathMatch: 'full'
},

/* =======================================================
RUTA NO ENCONTRADA
======================================================= */

{
path: '**',
redirectTo: 'productos'
}

];