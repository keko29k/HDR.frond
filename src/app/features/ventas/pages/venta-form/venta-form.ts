
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EMPTY,
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
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

/** Elemento del carrito. Solo se utiliza en el frontend. */
interface ItemCarrito {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  nombre: string;
  manejaLotes: boolean;
}

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
  cajasAbiertas: Caja[] = [];
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
  // PAGINACIÓN Y BÚSQUEDA DE PRODUCTOS
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

    montoPagado: [
      { value: 0, disabled: true },
      [Validators.min(0)]
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

    this.cargarProductos();

    this.cargarSucursalDeSesion();

    // Búsqueda de productos con espera de 300 ms.
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

    // Detectar cambios entre contado y crédito.
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

          console.error(
            'Error al cargar clientes:',
            error
          );

          this.notificationService.error(
            'No se pudieron cargar los clientes.'
          );
        }
      });
  }

  // =====================================
  // SUCURSAL DEL USUARIO
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

          this.cargarCajasAbiertas();
        },

        error: error => {

          this.errorSucursal = true;
          this.sucursalActual = null;

          console.error(
            'Error al consultar la sucursal:',
            error
          );

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
    this.cajasAbiertas = [];

    this.errorCaja = false;

    this.form.controls.idCaja.setValue(0);

    this.cargarSucursalDeSesion();
  }

  // =====================================
  // CAJAS ABIERTAS
  // =====================================

  cargarCajasAbiertas(pagina = 1): void {

    if (!this.sucursalId) {
      this.errorCaja = true;
      return;
    }

    this.cargandoCaja = true;
    this.errorCaja = false;

    this.buscarCajasAbiertas(pagina)
      .pipe(
        finalize(() => this.cargandoCaja = false)
      )
      .subscribe({
        next: abiertas => {

          this.cajasAbiertas = abiertas;

          if (this.cajasAbiertas.length) {

            const cajaSeleccionada =
              this.cajasAbiertas.some(
                caja =>
                  caja.id === this.form.controls.idCaja.value
              );

            if (!cajaSeleccionada) {
              this.form.controls.idCaja.setValue(
                this.cajasAbiertas[0].id
              );
            }

          } else {

            this.form.controls.idCaja.setValue(0);
          }
        },

        error: error => {

          this.errorCaja = true;

          console.error(
            'Error al buscar cajas abiertas:',
            error
          );

          this.notificationService.error(
            'No se pudo consultar la caja abierta de la sucursal.'
          );
        }
      });
  }

  private buscarCajasAbiertas(
    pagina: number
  ): Observable<Caja[]> {

    return this.cajaService.getAll({
      pageNumber: pagina,
      pageSize: 50,
      buscar: ''
    })
    .pipe(
      switchMap(response => {

        const abiertas = response.data.filter(caja =>
          caja.idSucursal === this.sucursalId &&
          (caja.estadoCaja ?? '')
            .trim()
            .toUpperCase() === 'ABIERTA'
        );

        if (
          abiertas.length ||
          pagina >= response.meta.totalPages
        ) {
          return of(abiertas);
        }

        return this.buscarCajasAbiertas(pagina + 1);
      })
    );
  }

  // =====================================
  // PRODUCTOS
  // =====================================

  cargarProductos(): void {

    this.cargandoProductos = true;

    const filter = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      buscar: this.buscar
    };

    this.productoService.getAll(filter)
      .pipe(
        finalize(() => this.cargandoProductos = false)
      )
      .subscribe({
        next: res => {

          this.errorProductos = false;

          this.productos = res.data;

          this.productosHasNextPage =
            res.meta.hasNextPage;
        },

        error: error => {

          this.errorProductos = true;

          console.error(
            'Error al cargar productos:',
            error
          );

          this.notificationService.error(
            'No se pudieron cargar los productos.'
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

      manejaLotes: producto.manejaLotes
    });

    this.sincronizarMonto();
  }

  cambiarCantidad(
    item: ItemCarrito,
    delta: number
  ): void {

    const nueva = item.cantidad + delta;

    if (nueva < 1) return;

    item.cantidad = nueva;

    item.subtotal = redondear(
      nueva * item.precioUnitario
    );

    // El backend validará el stock real de la sucursal
    // y distribuirá la cantidad entre los lotes disponibles.

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
          Number(
            this.form.controls.montoPagado.value ?? 0
          )
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

      fecha.setValidators([
        Validators.required
      ]);

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

    // Validar carrito.
    if (this.detalles.length === 0) {

      this.notificationService.error(
        'Agrega al menos un producto a la venta.'
      );

      return;
    }

    // Validar formulario.
    if (this.form.invalid) {

      this.form.markAllAsTouched();

      this.notificationService.error(
        'Completa los datos marcados en rojo.'
      );

      return;
    }

    // Validar clientes.
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

    // Validar crédito.
    if (
      this.esCredito &&
      this.montoPagado >= this.total
    ) {

      this.notificationService.error(
        'El cliente paga el total: regístrala como venta al contado.'
      );

      return;
    }

    // Validar sesión.
    if (!localStorage.getItem('token')) {

      this.notificationService.error(
        'Inicia sesión nuevamente para registrar la venta.'
      );

      return;
    }

    // Validar sucursal.
    if (
      this.cargandoSucursal ||
      this.errorSucursal ||
      !this.sucursalId
    ) {

      this.notificationService.error(
        'No se pudo determinar la sucursal de la sesión. Recarga la pantalla o inicia sesión nuevamente.'
      );

      return;
    }

    // Validar monto pagado.
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

    // Validar caja cuando existe un pago.
    const idCaja = Number(
      this.form.controls.idCaja.value
    );

    if (
      this.montoPagado > 0 &&
      (
        this.errorCaja ||
        this.cargandoCaja ||
        !this.cajasAbiertas.some(
          caja => caja.id === idCaja
        )
      )
    ) {

      this.notificationService.error(
        'Selecciona una caja abierta de la sucursal para registrar el pago.'
      );

      return;
    }

    const raw = this.form.getRawValue();

    // =================================
    // CABECERA DE LA VENTA
    // =================================

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

    // =================================
    // DETALLE DE LA VENTA
    // =================================

    const detalle: VentaDetalleDto['detalle'] =
      this.detalles.map(item => ({

        idProducto: item.productoId,

        cantidad: item.cantidad
      }));

    // =================================
    // PAGOS
    // =================================

    const pagos: VentaDetalleDto['pagos'] =
      this.montoPagado > 0
        ? [
            {
              idCaja,

              metodoPago: 'EFECTIVO',

              monto: this.montoPagado,

              referencia: null,

              observacion: null
            }
          ]
        : [];

    // =================================
    // OBJETO COMPLETO
    // =================================

    const dto: VentaDetalleDto = {
      venta,
      detalle,
      pagos
    };

    // =================================
    // ENVIAR AL BACKEND
    // =================================

    this.guardando = true;

    this.ventaService.ventaDetalle(dto)
      .pipe(
        finalize(() => this.guardando = false)
      )
      .subscribe({

        next: response => {

          this.notificationService.success(
            response.message || 'Venta registrada.'
          );

          this.limpiarCarrito();

          this.router.navigate(['/ventas']);
        },

        error: error => {

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
  // CANCELAR
  // =====================================

  cancelar(): void {

    this.router.navigate(['/ventas']);
  }

  // =====================================
  // UTILIDADES
  // =====================================

  private leerNumero(clave: string): number {

    const valor = Number(
      localStorage.getItem(clave)
    );

    return Number.isInteger(valor) && valor > 0
      ? valor
      : 0;
  }

  private fechaLocal(fecha: Date): string {

    const año = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }
}
