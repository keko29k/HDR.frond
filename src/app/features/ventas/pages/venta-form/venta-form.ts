import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';

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

import { Cliente } from '../../../clientes/models/cliente.model';
import { Producto } from '../../../productos/models/producto.model';
import { Sucursal } from '../../../sucursales/models/sucursal.model';
import { DetalleVenta } from '../../models/detalleVenta.model';
import { VentaCreate } from '../../models/venta-create.model';
import { VentaDetalleDto } from '../../models/VentaDetalle.model';

/** Detalle + nombre del producto, solo para mostrar en el carrito */
interface ItemCarrito extends DetalleVenta {
  nombre: string;
}

const redondear = (n: number): number => Math.round(n * 100) / 100;

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
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // =========================
  // DATA
  // =========================
  clientes: Cliente[] = [];
  ventaDetalle! : VentaDetalleDto
  sucursales: Sucursal[] = [];
  productos: Producto[] = [];
  detalles: ItemCarrito[] = [];

  cargandoProductos = false;
  guardando = false;

  readonly hoy = new Date();

  // =========================
  // PAGINACIÓN PRODUCTOS
  // =========================
  pageNumber = 1;
  pageSize = 12;
  buscar = '';
  private buscar$ = new Subject<string>();

  // =========================
  // FORM
  // =========================
  form = this.fb.group({
    idSucursal: [this.leerNumero('IdSucursal'), [Validators.required, Validators.min(1)]],
    idCliente: [0, [Validators.required, Validators.min(1)]],
    acredito: [false],
    montoPagado: [{ value: 0, disabled: true }, [Validators.min(0)]],
    fechaLimitePago: [null as Date | null],
    observacion: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarSucursales();
    this.cargarProductos();

    // Búsqueda con espera de 300 ms para no disparar una petición por tecla
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

    // Contado / crédito
    this.form.controls.acredito.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(credito => this.configurarCredito(!!credito));
  }

  // =========================
  // CATÁLOGOS
  // =========================
  cargarClientes(): void {
    this.clienteService.gets().subscribe({
      next: res => this.clientes = res,
      error: () => this.notificationService.error('No se pudieron cargar los clientes.')
    });
  }

  cargarSucursales(): void {
    this.sucursalService.gets().subscribe({
      next: res => this.sucursales = res,
      error: () => this.notificationService.error('No se pudieron cargar las sucursales.')
    });
  }

  // =========================
  // PRODUCTOS (PAGINADO)
  // =========================
  cargarProductos(): void {
    this.cargandoProductos = true;

    const filter = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      buscar: this.buscar
    };

    this.productoService.getAll(filter)
      .pipe(finalize(() => this.cargandoProductos = false))
      .subscribe({
        next: res => this.productos = res.data,
        error: () => this.notificationService.error('No se pudieron cargar los productos.')
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

  /** Si la página vino llena, probablemente hay más */
  get hayMasPaginas(): boolean {
    return this.productos.length === this.pageSize;
  }

  // =========================
  // CARRITO
  // =========================
  agregarProducto(producto: Producto): void {
    const existente = this.detalles.find(d => d.productoId === producto.id);

    if (existente) {
      this.cambiarCantidad(existente, 1);
      return;
    }

    this.detalles.push({
      id: 0,
      ventaId: 0,
      productoId: producto.id!,
      nombre: producto.nombre,
      cantidad: 1,
      precioUnitario: producto.precioVenta,
      precioCompra: producto.precioCompra,
      subtotal: redondear(producto.precioVenta)
    });

    this.sincronizarMonto();
  }

  cambiarCantidad(item: ItemCarrito, delta: number): void {
    const nueva = item.cantidad + delta;
    if (nueva < 1) return;

    item.cantidad = nueva;
    item.subtotal = redondear(nueva * item.precioUnitario);
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
    return this.detalles.find(d => d.productoId === producto.id)?.cantidad ?? 0;
  }

  // =========================
  // MONTOS
  // =========================
  get total(): number {
    return redondear(this.detalles.reduce((sum, d) => sum + d.subtotal, 0));
  }

  get cantidadItems(): number {
    return this.detalles.reduce((sum, d) => sum + d.cantidad, 0);
  }

  get esCredito(): boolean {
    return !!this.form.controls.acredito.value;
  }

  get montoPagado(): number {
    return this.esCredito
      ? redondear(Number(this.form.controls.montoPagado.value ?? 0))
      : this.total;
  }

  get saldoPendiente(): number {
    return Math.max(redondear(this.total - this.montoPagado), 0);
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

  /** En contado, el monto pagado siempre es el total */
  private sincronizarMonto(): void {
    if (!this.esCredito) {
      this.form.controls.montoPagado.setValue(this.total, { emitEvent: false });
    }
  }

  // =========================
  // GUARDAR VENTA
  // =========================
  guardar(): void {

    if (this.detalles.length === 0) {
      this.notificationService.error('Agrega al menos un producto a la venta.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error('Completa los datos marcados en rojo.');
      return;
    }

    if (this.esCredito && this.montoPagado >= this.total) {
      this.notificationService.error('El cliente paga el total: regístrala como venta al contado.');
      return;
    }

    const idUsuario = this.leerNumero('Id');
    if (!idUsuario) {
      this.notificationService.error('No se encontró el usuario de la sesión. Vuelve a iniciar sesión.');
      return;
    }

    const raw = this.form.getRawValue();

    const venta: VentaCreate = {
      idSucursal: raw.idSucursal!,
      idCliente: raw.idCliente!,
      idUsuario,
      acredito: this.esCredito,
      montoPagado: this.montoPagado,
      saldoPendiente: this.saldoPendiente,
      fechaLimitePago: this.esCredito ? raw.fechaLimitePago : null,
      fechaVenta: new Date(),
      total: this.total,
      observacion: raw.observacion ?? '',
      estadoVenta: true
    };

    // Se quita "nombre", que solo sirve para la vista
    const detalle: DetalleVenta[] = this.detalles.map(({ nombre, ...d }) => d);

    this.guardando = true;


    this.ventaService.ventaDetalle({ venta, detalle })
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Venta registrada.');
          this.limpiarCarrito();
          this.router.navigate(['/ventas']);
        },
        error: (error) => {
          console.error('Error registrar venta:', error);
          const mensaje = error?.error?.mensaje || 'No se pudo registrar la venta.';
          this.notificationService.error(mensaje);
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/ventas']);
  }

  // =========================
  // UTIL
  // =========================
  private leerNumero(clave: string): number {
    const valor = Number(localStorage.getItem(clave));
    return Number.isFinite(valor) ? valor : 0;
  }
}