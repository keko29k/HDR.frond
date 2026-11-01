
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EMPTY,
  Subject,
  debounceTime,
  distinctUntilChanged,
  finalize,
  switchMap
} from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideNativeDateAdapter } from '@angular/material/core';

import { NotificationService } from '../../../../core/services/notification.service';

import { VentaService } from '../../services/venta';
import { ClienteService } from '../../../clientes/services/cliente';
import { ProductoService } from '../../../productos/services/producto';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { CajaService } from '../../../cajas/services/caja';
import { UsuarioService } from '../../../usuarios/services/usuario';

import { Cliente } from '../../../clientes/models/cliente.model';
import { Producto } from '../../../productos/models/producto.model';
import { Sucursal } from '../../../sucursales/models/sucursal.model';
import { Caja } from '../../../cajas/models/caja.model';

import { VentaDetalleDto } from '../../models/VentaDetalle.model';

interface ItemCarrito {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  nombre: string;
  manejaLotes: boolean;
  stockDisponible: number
}

type MetodoPago = 'EFECTIVO' | 'QR';

const redondear = (n: number): number =>
  Math.round(n * 100) / 100;

@Component({
  selector: 'app-venta-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './venta-form.html',
  styleUrl: './venta-form.css'
})
export class VentaFormComponent implements OnInit {

  private fb = inject(FormBuilder);

  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private sucursalService = inject(SucursalService);
  private cajaService = inject(CajaService);
  private usuarioService = inject(UsuarioService);

  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // =====================================
  // DATOS
  // =====================================

  clientes: Cliente[] = [];

  sucursalActual: Sucursal | null = null;

  cajaActual: Caja | null = null;

  productos: Producto[] = [];

  detalles: ItemCarrito[] = [];

  sucursalId = 0;

  errorClientes = false;
  cargandoClientes = false;

  cargandoSucursal = false;
  errorSucursal = false;

  cargandoProductos = false;
  errorProductos = false;

  cargandoCaja = false;
  errorCaja = false;

  guardando = false;

  readonly hoy = new Date();

  // =====================================
  // PAGINACIÓN Y BÚSQUEDA
  // =====================================

  pageNumber = 1;
  pageSize = 12;
  buscar = '';

  productosHasNextPage = false;

  private buscar$ = new Subject<string>();

  // =====================================
  // FORMULARIO
  // =====================================

  form = this.fb.group({

    idCliente: [0, [
      Validators.required,
      Validators.min(1)
    ]],

    idCaja: [0],

    acredito: [false],

    metodoPago: [
      'EFECTIVO' as MetodoPago,
      Validators.required
    ],

    montoPagado: [
      { value: 0, disabled: true },
      [Validators.required, Validators.min(0)]
    ],

    fechaLimitePago: [null as Date | null],

    observacion: ['', [
      Validators.maxLength(500)
    ]]
  });

  // =====================================
  // INICIALIZACIÓN
  // =====================================

  ngOnInit(): void {

    this.cargarClientes();

    // Primero se obtiene la sucursal.
    // Los productos se cargarán después de conocerla.
    this.cargarSucursalDeSesion();

    this.cargarMiCajaAbierta();

    this.buscar$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(valor => {

        this.buscar = valor;

        this.pageNumber = 1;

        this.cargarProductos();
      });

    this.form.controls.acredito.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(credito => {

        this.configurarCredito(!!credito);
      });
  }

  // =====================================
  // CLIENTES
  // =====================================

  cargarClientes(): void {

    this.cargandoClientes = true;

    this.clienteService.gets()
      .pipe(
        finalize(() => this.cargandoClientes = false)
      )
      .subscribe({

        next: res => {

          this.errorClientes = false;

          this.clientes = res;
        },

        error: error => {

          this.errorClientes = true;

          console.error('Error al cargar clientes:', error);

          this.notificationService.error(
            'No se pudieron cargar los clientes.'
          );
        }
      });
  }

  get nombreClienteSeleccionado(): string {

    const id = this.form.controls.idCliente.value;

    const cliente = this.clientes.find(c => c.id === id);

    return cliente
      ? `${cliente.nombres} ${cliente.apellidos}`
      : 'Cliente no identificado';
  }

  // =====================================
  // SUCURSAL
  // =====================================

  cargarSucursalDeSesion(): void {

    const usuarioId = this.leerNumero('Id');

    if (!usuarioId) {

      this.errorSucursal = true;

      this.notificationService.error(
        'No se encontró el usuario de la sesión. Inicia sesión nuevamente.'
      );

      return;
    }

    this.cargandoSucursal = true;

    this.errorSucursal = false;

    this.usuarioService.getById(usuarioId)
      .pipe(

        switchMap(usuario => {

          if (
            !Number.isInteger(usuario.idSucursal) ||
            usuario.idSucursal <= 0
          ) {

            this.errorSucursal = true;

            this.notificationService.error(
              'El usuario no tiene una sucursal asignada.'
            );

            return EMPTY;
          }

          this.sucursalId = usuario.idSucursal;

          return this.sucursalService.getById(
            this.sucursalId
          );
        }),

        finalize(() => this.cargandoSucursal = false)

      )
      .subscribe({

        next: sucursal => {

          this.errorSucursal = false;

          this.sucursalActual = sucursal;

          // Ya conocemos la sucursal.
          // Ahora cargamos solamente sus productos.
          this.pageNumber = 1;

          this.cargarProductos();
        },

        error: error => {

          this.errorSucursal = true;

          this.sucursalActual = null;

          this.sucursalId = 0;

          this.productos = [];

          console.error('Error al consultar la sucursal:', error);

          this.notificationService.error(
            'No se pudo consultar la sucursal asignada a tu usuario.'
          );
        }
      });
  }

  get nombreSucursalSesion(): string {

    if (this.cargandoSucursal) {
      return 'Cargando sucursal...';
    }

    if (this.errorSucursal) {
      return 'Sucursal no disponible';
    }

    return this.sucursalActual?.nombre ??
      `Sucursal ${this.sucursalId}`;
  }

  reintentarCargaSucursal(): void {

    this.sucursalActual = null;

    this.sucursalId = 0;

    this.productos = [];

    this.errorSucursal = false;

    this.cargarSucursalDeSesion();
  }

  // =====================================
  // CAJA ABIERTA
  // =====================================

  cargarMiCajaAbierta(): void {

    this.cargandoCaja = true;

    this.errorCaja = false;

    this.cajaActual = null;

    this.form.controls.idCaja.setValue(0);

    this.cajaService.obtenerMiCajaAbierta()
      .pipe(
        finalize(() => this.cargandoCaja = false)
      )
      .subscribe({

        next: caja => {

          const estado = (caja.estadoCaja ?? '')
            .trim()
            .toUpperCase();

          if (estado !== 'ABIERTA') {

            this.cajaActual = null;

            this.form.controls.idCaja.setValue(0);

            this.notificationService.error(
              'No tienes una caja abierta. Serás dirigido al módulo de cajas.'
            );

            this.router.navigate(['/cajas']);

            return;
          }

          this.errorCaja = false;

          this.cajaActual = caja;

          this.form.controls.idCaja.setValue(caja.id);
        },

        error: error => {

          this.cajaActual = null;

          this.form.controls.idCaja.setValue(0);

          console.error('Error al consultar mi caja:', error);

          if (error.status === 404) {

            this.notificationService.error(
              'No tienes una caja abierta. Serás dirigido al módulo de cajas.'
            );

            this.router.navigate(['/cajas']);

            return;
          }

          this.errorCaja = true;

          this.notificationService.error(
            'No se pudo consultar tu caja. Intenta nuevamente.'
          );
        }
      });
  }

  // =====================================
  // PRODUCTOS POR SUCURSAL
  // =====================================

  cargarProductos(): void {

    // No consultar productos si todavía no conocemos
    // la sucursal del usuario.
    if (!this.sucursalId || this.sucursalId <= 0) {

      this.productos = [];

      this.productosHasNextPage = false;

      this.cargandoProductos = false;

      return;
    }

    this.cargandoProductos = true;

    this.errorProductos = false;

    const filter = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      buscar: this.buscar
    };

    this.productoService
      .getBySucursal(this.sucursalId, filter)
      .pipe(
        finalize(() => this.cargandoProductos = false)
      )
      .subscribe({

        next: res => {

          this.errorProductos = false;

          this.productos = res.data;

          this.productosHasNextPage = res.meta.hasNextPage;
        },

        error: error => {

          this.errorProductos = true;

          this.productos = [];

          this.productosHasNextPage = false;

          console.error(
            'Error al cargar productos de la sucursal:',
            error
          );

          this.notificationService.error(
            'No se pudieron cargar los productos de esta sucursal.'
          );
        }
      });
  }

  onBuscar(valor: string): void {

    this.buscar$.next(valor.trim());
  }

  cambiarPagina(delta: number): void {

    const nueva = this.pageNumber + delta;

    if (nueva < 1) return;

    this.pageNumber = nueva;

    this.cargarProductos();
  }

  get hayMasPaginas(): boolean {

    return this.productosHasNextPage;
  }

  // =====================================
  // CARRITO
  // =====================================

  agregarProducto(producto: Producto): void {

    if (!producto.permiteVenta) {

      this.notificationService.error(
        `${producto.nombre} no está habilitado para la venta.`
      );

      return;
    }

    const stockDisponible = Number(producto.stockActual ?? 0);

    if (stockDisponible <= 0) {

      this.notificationService.error(
        `${producto.nombre} no tiene stock disponible en esta sucursal.`
      );

      return;
    }

    const existente = this.detalles.find(
      d => d.productoId === producto.id
    );

    if (existente) {

      this.cambiarCantidad(existente, 1);

      return;
    }

    this.detalles.push({

      productoId: producto.id,

      nombre: producto.nombre,

      cantidad: 1,

      precioUnitario: producto.precioVenta,

      subtotal: redondear(producto.precioVenta),

      manejaLotes: producto.manejaLotes,

      stockDisponible
    });

    this.sincronizarMonto();
  }

  cambiarCantidad(item: ItemCarrito, delta: number): void {

    const nueva = item.cantidad + delta;

    if (nueva < 1) return;

    if (nueva > item.stockDisponible) {

      this.notificationService.error(
        `Stock insuficiente para ${item.nombre}. Disponible: ${item.stockDisponible}.`
      );

      return;
    }

    item.cantidad = nueva;

    item.subtotal = redondear(
      nueva * item.precioUnitario
    );

    this.sincronizarMonto();
  }

  eliminarDetalle(index: number): void {

    this.detalles.splice(index, 1);

    this.sincronizarMonto();
  }

  limpiarCarrito(): void {

    this.detalles = [];

    this.sincronizarMonto();
  }

  enCarrito(producto: Producto): number {

    return this.detalles.find(
      d => d.productoId === producto.id
    )?.cantidad ?? 0;
  }

  // =====================================
  // MONTOS
  // =====================================

  get total(): number {

    return redondear(
      this.detalles.reduce(
        (sum, d) => sum + d.subtotal,
        0
      )
    );
  }

  get cantidadItems(): number {

    return this.detalles.reduce(
      (sum, d) => sum + d.cantidad,
      0
    );
  }

  get esCredito(): boolean {

    return !!this.form.controls.acredito.value;
  }

  get montoPagado(): number {

    return this.esCredito
      ? redondear(
          Number(this.form.controls.montoPagado.value ?? 0)
        )
      : this.total;
  }

  get saldoPendiente(): number {

    return Math.max(
      redondear(this.total - this.montoPagado),
      0
    );
  }

  setCredito(valor: boolean): void {

    this.form.controls.acredito.setValue(valor);
  }

  private configurarCredito(credito: boolean): void {

    const monto = this.form.controls.montoPagado;

    const fecha = this.form.controls.fechaLimitePago;

    if (credito) {

      monto.enable({ emitEvent: false });

      monto.setValue(0);

      fecha.setValidators([Validators.required]);

    } else {

      monto.disable({ emitEvent: false });

      monto.setValue(this.total);

      fecha.clearValidators();

      fecha.setValue(null);
    }

    fecha.updateValueAndValidity();
  }

  private sincronizarMonto(): void {

    if (!this.esCredito) {

      this.form.controls.montoPagado.setValue(
        this.total,
        { emitEvent: false }
      );
    }
  }

  // =====================================
  // REGISTRAR VENTA
  // =====================================

  guardar(): void {

    if (this.guardando) return;

    if (this.detalles.length === 0) {

      this.notificationService.error(
        'Agrega al menos un producto a la venta.'
      );

      return;
    }

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      this.notificationService.error(
        'Completa los datos marcados en rojo.'
      );

      return;
    }

    if (
      this.cargandoClientes ||
      this.errorClientes ||
      !this.clientes.length
    ) {

      this.notificationService.error(
        'Espera a que se carguen correctamente los clientes.'
      );

      return;
    }

    if (this.esCredito && this.montoPagado >= this.total) {

      this.notificationService.error(
        'El cliente paga el total: regístrala como venta al contado.'
      );

      return;
    }

    if (!localStorage.getItem('token')) {

      this.notificationService.error(
        'Inicia sesión nuevamente para registrar la venta.'
      );

      return;
    }

    if (
      this.cargandoSucursal ||
      this.errorSucursal ||
      !this.sucursalId
    ) {

      this.notificationService.error(
        'No se pudo determinar la sucursal de la sesión.'
      );

      return;
    }

    if (
      !Number.isFinite(this.montoPagado) ||
      this.montoPagado < 0 ||
      this.montoPagado > this.total
    ) {

      this.notificationService.error(
        'El monto pagado debe estar entre cero y el total de la venta.'
      );

      return;
    }

    // Validación interna de caja.
    // No es necesario mostrar sus datos en pantalla.

    if (
      this.cargandoCaja ||
      this.errorCaja ||
      !this.cajaActual ||
      this.cajaActual.estadoCaja?.trim().toUpperCase() !== 'ABIERTA'
    ) {

      this.notificationService.error(
        'Debes tener una caja abierta para registrar una venta.'
      );

      return;
    }

    const idCaja = this.cajaActual.id;

    const raw = this.form.getRawValue();

    const metodoPago = raw.metodoPago as MetodoPago;

    // CABECERA

    const venta: VentaDetalleDto['venta'] = {

      idCliente: raw.idCliente && raw.idCliente > 0
        ? raw.idCliente
        : null,

      acredito: this.esCredito,

      fechaLimitePago:
        this.esCredito && raw.fechaLimitePago
          ? this.fechaLocal(raw.fechaLimitePago)
          : null,

      observacion: raw.observacion ?? '',

      estadoVenta: 'COMPLETADA'
    };

    // DETALLE

    const detalle: VentaDetalleDto['detalle'] =
      this.detalles.map(item => ({

        idProducto: item.productoId,

        cantidad: item.cantidad
      }));

    // PAGOS

    const pagos: VentaDetalleDto['pagos'] =
      this.montoPagado > 0
        ? [
            {
              idCaja,

              metodoPago,

              monto: this.montoPagado,

              referencia: null,

              observacion: null
            }
          ]
        : [];

    const dto: VentaDetalleDto = {

      venta,

      detalle,

      pagos
    };

    // Guardamos una copia para imprimirla después.

    const datosComprobante = {
      idCliente: raw.idCliente,
      cliente: this.nombreClienteSeleccionado,
      sucursal: this.nombreSucursalSesion,
      fecha: new Date(),
      detalles: this.detalles.map(item => ({ ...item })),
      total: this.total,
      cantidadItems: this.cantidadItems,
      acredito: this.esCredito,
      metodoPago,
      montoPagado: this.montoPagado,
      saldoPendiente: this.saldoPendiente,
      fechaLimitePago: raw.fechaLimitePago
        ? new Date(raw.fechaLimitePago)
        : null,
      observacion: raw.observacion ?? ''
    };

    // Reservar la ventana de impresión antes de la petición
    // para reducir el riesgo de bloqueo de ventanas emergentes.

    const ventana = window.open(
      '',
      '_blank',
      'width=420,height=700'
    );

    this.guardando = true;

    this.ventaService.ventaDetalle(dto)
      .pipe(
        finalize(() => this.guardando = false)
      )
      .subscribe({

        next: response => {

          this.notificationService.success(
            response.message || 'Venta registrada correctamente.'
          );

          if (response.idVenta) {

            this.imprimirComprobante(
              ventana,
              response.idVenta,
              datosComprobante
            );

          } else {

            ventana?.close();

            this.notificationService.error(
              'La venta se registró, pero el backend no devolvió el ID necesario para el comprobante.'
            );
          }

          this.limpiarCarrito();

          this.form.reset({

            idCliente: 0,

            idCaja,

            acredito: false,

            metodoPago: 'EFECTIVO',

            montoPagado: {
              value: 0,
              disabled: true
            },

            fechaLimitePago: null,

            observacion: ''
          });
        },

        error: error => {

          ventana?.close();

          console.error(
            'Error al registrar la venta:',
            error
          );

          const body = error?.error;

          const validationErrors =
            body?.errors &&
            typeof body.errors === 'object'
              ? Object.values(body.errors)
                  .flat()
                  .join(' ')
              : '';

          const mensaje =
            error?.status === 401
              ? 'La sesión no es válida o expiró. Inicia sesión nuevamente.'
              : typeof body === 'string'
                ? body
                : body?.message ||
                  body?.mensaje ||
                  body?.title ||
                  validationErrors ||
                  'No se pudo registrar la venta.';

          this.notificationService.error(mensaje);
        }
      });
  }

  // =====================================
  // COMPROBANTE E IMPRESIÓN
  // =====================================

  private imprimirComprobante(
    ventana: Window | null,
    idVenta: number,
    datos: {
      cliente: string;
      sucursal: string;
      fecha: Date;
      detalles: ItemCarrito[];
      total: number;
      cantidadItems: number;
      acredito: boolean;
      metodoPago: MetodoPago;
      montoPagado: number;
      saldoPendiente: number;
      fechaLimitePago: Date | null;
      observacion: string;
    }
  ): void {

    if (!ventana || ventana.closed) {

      this.notificationService.error(
        'La venta se registró, pero el navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para imprimir el comprobante.'
      );

      return;
    }

    const moneda = (valor: number) =>
      `Bs ${valor.toFixed(2)}`;

    const escapar = (valor: string) =>
      valor
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const filas = datos.detalles.map(item => `
      <tr>
        <td class="producto">
          ${escapar(item.nombre)}
          <small>${item.cantidad} x ${moneda(item.precioUnitario)}</small>
        </td>
        <td class="importe">${moneda(item.subtotal)}</td>
      </tr>
    `).join('');

    const fecha = datos.fecha.toLocaleDateString('es-BO');

    const hora = datos.fecha.toLocaleTimeString('es-BO', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const creditoHtml = datos.acredito
      ? `
        <div class="linea">
          <span>Pagado ahora</span>
          <strong>${moneda(datos.montoPagado)}</strong>
        </div>
        <div class="linea">
          <span>Saldo pendiente</span>
          <strong>${moneda(datos.saldoPendiente)}</strong>
        </div>
        <div class="linea">
          <span>Fecha límite</span>
          <strong>
            ${datos.fechaLimitePago
              ? datos.fechaLimitePago.toLocaleDateString('es-BO')
              : '-'}
          </strong>
        </div>
      `
      : `
        <div class="linea">
          <span>Pagado</span>
          <strong>${moneda(datos.montoPagado)}</strong>
        </div>
      `;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Comprobante de venta #${idVenta}</title>

        <style>
          @page {
            size: 80mm auto;
            margin: 4mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            width: 72mm;
            margin: 0 auto;
            padding: 0;
            color: #111;
            background: #fff;
            font-family: Arial, sans-serif;
            font-size: 11px;
          }

          .center {
            text-align: center;
          }

          h1 {
            margin: 0 0 4px;
            font-size: 19px;
            letter-spacing: 1px;
          }

          .subtitulo {
            margin-bottom: 10px;
            font-size: 10px;
          }

          .separador {
            margin: 9px 0;
            border-top: 1px dashed #555;
          }

          .datos {
            line-height: 1.6;
          }

          .linea {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin: 5px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th {
            padding: 5px 0;
            border-bottom: 1px solid #333;
            text-align: left;
          }

          td {
            padding: 6px 0;
            vertical-align: top;
          }

          .producto {
            width: 65%;
            overflow-wrap: anywhere;
          }

          .producto small {
            display: block;
            margin-top: 3px;
            font-size: 9px;
          }

          .importe {
            text-align: right;
            white-space: nowrap;
          }

          .total {
            margin-top: 8px;
            font-size: 17px;
            font-weight: bold;
          }

          .mensaje {
            margin-top: 15px;
            text-align: center;
            font-size: 10px;
          }

          .observacion {
            margin-top: 8px;
            overflow-wrap: anywhere;
          }
        </style>
      </head>

      <body>

        <div class="center">
          <h1>HEREDEROS DEL REY</h1>
          <div class="subtitulo">COMPROBANTE DE VENTA</div>
        </div>

        <div class="separador"></div>

        <div class="datos">
          <div class="linea">
            <span>Venta:</span>
            <strong>#${idVenta}</strong>
          </div>

          <div class="linea">
            <span>Fecha:</span>
            <strong>${fecha} ${hora}</strong>
          </div>

          <div class="linea">
            <span>Sucursal:</span>
            <strong>${escapar(datos.sucursal)}</strong>
          </div>

          <div class="linea">
            <span>Cliente:</span>
            <strong>${escapar(datos.cliente)}</strong>
          </div>
        </div>

        <div class="separador"></div>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align:right">Importe</th>
            </tr>
          </thead>

          <tbody>
            ${filas}
          </tbody>
        </table>

        <div class="separador"></div>

        <div class="linea">
          <span>Unidades:</span>
          <strong>${datos.cantidadItems}</strong>
        </div>

        <div class="linea total">
          <span>TOTAL</span>
          <strong>${moneda(datos.total)}</strong>
        </div>

        <div class="separador"></div>

        <div class="linea">
          <span>Tipo de venta:</span>
          <strong>${datos.acredito ? 'CRÉDITO' : 'CONTADO'}</strong>
        </div>

        <div class="linea">
          <span>Método de pago:</span>
          <strong>${datos.metodoPago}</strong>
        </div>

        ${creditoHtml}

        ${datos.observacion
          ? `<div class="observacion">
              <strong>Observación:</strong>
              ${escapar(datos.observacion)}
            </div>`
          : ''}

        <div class="separador"></div>

        <div class="mensaje">
          ¡Gracias por su compra!
          <br>
          HEREDEROS DEL REY
        </div>

      </body>
      </html>
    `;

    ventana.document.open();

    ventana.document.write(html);

    ventana.document.close();

    // Esperar a que el documento esté listo antes de imprimir.
    setTimeout(() => {

      if (!ventana.closed) {

        ventana.focus();

        ventana.print();
      }

    }, 300);

    this.router.navigate(['/ventas']);
  }

  // =====================================
  // CANCELAR
  // =====================================

  cancelar(): void {

    this.router.navigate(['/ventas']);
  }

  // =====================================
  // UTILIDADES
  // =====================================

  private leerNumero(clave: string): number {

    const valor = Number(localStorage.getItem(clave));

    return Number.isInteger(valor) && valor > 0
      ? valor
      : 0;
  }

  private fechaLocal(fecha: Date): string {

    const año = fecha.getFullYear();

    const mes = String(fecha.getMonth() + 1)
      .padStart(2, '0');

    const dia = String(fecha.getDate())
      .padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }
}

