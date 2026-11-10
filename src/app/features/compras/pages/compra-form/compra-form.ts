
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';

import { CompraService } from '../../services/compra';
import { ProveedorService } from '../../../proveedores/services/proveedor';
import { ProductoService } from '../../../productos/services/producto';

import { Proveedor } from '../../../proveedores/models/proveedor.model';
import { Producto } from '../../../productos/models/producto.model';
import { RegistrarCompraDto } from '../../models/registrar-compra.model';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface DetalleCompraFormulario {
  idProducto: number;
  nombreProducto: string;
  codigo: string;
  cantidad: number;
  precioCompra: number;
  descuento: number;
  impuesto: number;
  subtotal: number;

  manejaLotes: boolean;
  tieneVencimiento: boolean;

  numeroLote: string;
  fechaFabricacion: string;
  fechaVencimiento: string;
}

@Component({
  selector: 'app-compra-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './compra-form.html',
  styleUrls: [
    '../../../../shared/styles/operaciones.css',
    './compra-form.css'
  ]
})
export class CompraFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private compraService = inject(CompraService);
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // =========================
  // DATOS
  // =========================

  proveedores: Proveedor[] = [];
  productos: Producto[] = [];

  detalles: DetalleCompraFormulario[] = [];

  loading = false;
  buscarProducto = '';

  // =========================
  // FORMULARIO
  // =========================

  form = this.fb.group({
    idProveedor: [null as number | null, Validators.required],
    tipoDocumento: ['Factura', Validators.required],
    numeroDocumento: [''],
    fechaCompra: [this.obtenerFechaActual(), Validators.required],
    observacion: ['']
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  // =========================
  // FECHA ACTUAL
  // =========================

  private obtenerFechaActual(): string {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  // =========================
  // CARGAR PROVEEDORES Y PRODUCTOS
  // =========================

  cargarDatos(): void {
    this.loading = true;

    forkJoin({
      proveedores: this.proveedorService.gets(),
      productos: this.productoService.gets()
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: res => {
          this.proveedores = res.proveedores;
          this.productos = res.productos;
        },
        error: error => {
          console.error('Error al cargar datos:', error);

          this.notificationService.error(
            'Error al cargar proveedores y productos'
          );
        }
      });
  }

  // =========================
  // BUSCAR PRODUCTOS
  // =========================

  get productosFiltrados(): Producto[] {
    const busqueda = this.buscarProducto.trim().toLowerCase();

    if (!busqueda) {
      return this.productos;
    }

    return this.productos.filter(producto =>
      producto.nombre?.toLowerCase().includes(busqueda) ||
      producto.codigo?.toLowerCase().includes(busqueda)
    );
  }

  // =========================
  // COLUMNAS DINÁMICAS
  // =========================

  get tieneProductosConLotes(): boolean {
    return this.detalles.some(d => d.manejaLotes);
  }

  get tieneProductosConFabricacion(): boolean {
    return this.detalles.some(
      d => d.manejaLotes || d.tieneVencimiento
    );
  }

  get tieneProductosConVencimiento(): boolean {
    return this.detalles.some(d => d.tieneVencimiento);
  }

  // =========================
  // RESUMEN
  // =========================

  get totalUnidades(): number {
    return this.detalles.reduce((total, d) => total + d.cantidad, 0);
  }

  get nombreProveedorSeleccionado(): string {
    const id = this.form.controls.idProveedor.value;

    return this.proveedores.find(p => p.id === id)?.nombre ?? 'Sin seleccionar';
  }

  enDetalle(producto: Producto): number {
    return this.detalles.find(d => d.idProducto === producto.id)?.cantidad ?? 0;
  }

  // =========================
  // AGREGAR PRODUCTO
  // =========================

  agregarProducto(producto: Producto): void {

    const existente = this.detalles.find(
      d => d.idProducto === producto.id
    );

    if (existente) {
      existente.cantidad++;
      this.actualizarSubtotal(existente);
    } else {
      this.detalles.push({
        idProducto: producto.id,
        nombreProducto: producto.nombre,
        codigo: producto.codigo,
        cantidad: 1,
        precioCompra: producto.precioCompra,
        descuento: 0,
        impuesto: 0,
        subtotal: producto.precioCompra,

        manejaLotes: producto.manejaLotes,
        tieneVencimiento: producto.tieneVencimiento,

        numeroLote: '',
        fechaFabricacion: '',
        fechaVencimiento: ''
      });
    }

    this.calcularTotal();
  }

  // =========================
  // ACTUALIZAR CANTIDAD
  // =========================

  actualizarCantidad(index: number, valor: string): void {
    const cantidad = Number(valor);

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return;
    }

    this.detalles[index].cantidad = cantidad;

    this.actualizarSubtotal(this.detalles[index]);
    this.calcularTotal();
  }

  // =========================
  // ACTUALIZAR PRECIO
  // =========================

  actualizarPrecio(index: number, valor: string): void {
    const precio = Number(valor);

    if (!Number.isFinite(precio) || precio <= 0) {
      return;
    }

    this.detalles[index].precioCompra = precio;

    this.actualizarSubtotal(this.detalles[index]);
    this.calcularTotal();
  }

  // =========================
  // ACTUALIZAR DATOS DEL LOTE
  // =========================

  // Genera el número de lote: L + fecha (AAMMDD) + 4 caracteres aleatorios.
  // Ej.: L251110-7KQ3. No se repite dentro de la misma compra.
  generarNumeroLote(index: number): void {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I
    const hoy = new Date();
    const fecha =
      String(hoy.getFullYear()).slice(-2) +
      String(hoy.getMonth() + 1).padStart(2, '0') +
      String(hoy.getDate()).padStart(2, '0');

    let codigo: string;
    do {
      let sufijo = '';
      for (let i = 0; i < 4; i++) {
        sufijo += caracteres[Math.floor(Math.random() * caracteres.length)];
      }
      codigo = `L${fecha}-${sufijo}`;
    } while (this.detalles.some((d, i) => i !== index && d.numeroLote === codigo));

    this.detalles[index].numeroLote = codigo;
  }

  actualizarFechaFabricacion(index: number, valor: string): void {
    this.detalles[index].fechaFabricacion = valor;
  }

  actualizarFechaVencimiento(index: number, valor: string): void {
    this.detalles[index].fechaVencimiento = valor;
  }

  // =========================
  // SUBTOTAL
  // =========================

  private actualizarSubtotal(detalle: DetalleCompraFormulario): void {
    detalle.subtotal =
      (detalle.cantidad * detalle.precioCompra)
      - detalle.descuento
      + detalle.impuesto;
  }

  // =========================
  // ELIMINAR PRODUCTO
  // =========================

  eliminarDetalle(index: number): void {
    this.detalles.splice(index, 1);
    this.calcularTotal();
  }

  // =========================
  // LIMPIAR DETALLES
  // =========================

  limpiarDetalles(): void {
    this.detalles = [];
    this.calcularTotal();
  }

  // =========================
  // CALCULAR TOTAL
  // =========================

  calcularTotal(): number {
    return this.detalles.reduce(
      (total, detalle) => total + detalle.subtotal,
      0
    );
  }

  // =========================
  // CONVERTIR FECHAS
  // =========================

  private convertirFecha(fecha: string): string | null {
    if (!fecha) {
      return null;
    }

    return new Date(`${fecha}T12:00:00`).toISOString();
  }

  // =========================
  // VALIDAR COMPRA
  // =========================

  private validarDetalles(): boolean {

    for (const detalle of this.detalles) {

      if (detalle.cantidad <= 0) {
        this.notificationService.error(
          `La cantidad de ${detalle.nombreProducto} no es válida`
        );
        return false;
      }

      if (detalle.precioCompra <= 0) {
        this.notificationService.error(
          `El precio de ${detalle.nombreProducto} debe ser mayor a cero`
        );
        return false;
      }

      if (detalle.descuento < 0 || detalle.impuesto < 0) {
        this.notificationService.error(
          `El descuento o impuesto de ${detalle.nombreProducto} no es válido`
        );
        return false;
      }

      if (
        detalle.manejaLotes &&
        !detalle.numeroLote.trim()
      ) {
        this.notificationService.error(
          `Genera el número de lote de ${detalle.nombreProducto}`
        );
        return false;
      }

      if (
        detalle.tieneVencimiento &&
        !detalle.fechaVencimiento
      ) {
        this.notificationService.error(
          `Ingresa la fecha de vencimiento de ${detalle.nombreProducto}`
        );
        return false;
      }

      if (
        detalle.fechaFabricacion &&
        detalle.fechaVencimiento &&
        detalle.fechaFabricacion > detalle.fechaVencimiento
      ) {
        this.notificationService.error(
          `Las fechas de ${detalle.nombreProducto} no son válidas`
        );
        return false;
      }
    }

    return true;
  }

  // =========================
  // REGISTRAR COMPRA
  // =========================

  guardar(): void {

    if (this.loading) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.notificationService.error(
        'Completa los datos de la compra'
      );

      return;
    }

    if (this.detalles.length === 0) {
      this.notificationService.error(
        'Agrega al menos un producto'
      );

      return;
    }

    if (!this.validarDetalles()) {
      return;
    }

    const valores = this.form.getRawValue();

    const dto: RegistrarCompraDto = {
      idProveedor: valores.idProveedor!,
      tipoDocumento: valores.tipoDocumento!,
      numeroDocumento: valores.numeroDocumento || null,
      fechaCompra: this.convertirFecha(valores.fechaCompra!)!,
      observacion: valores.observacion || null,

      detalles: this.detalles.map(detalle => ({
        idProducto: detalle.idProducto,
        cantidad: detalle.cantidad,
        precioCompra: detalle.precioCompra,
        descuento: detalle.descuento,
        impuesto: detalle.impuesto,

        numeroLote: detalle.manejaLotes
          ? detalle.numeroLote.trim()
          : null,

        fechaFabricacion: this.convertirFecha(
          detalle.fechaFabricacion
        ),

        fechaVencimiento: this.convertirFecha(
          detalle.fechaVencimiento
        )
      }))
    };

    this.loading = true;

    this.compraService.registrar(dto)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success(
            'Compra y lotes registrados correctamente'
          );

          this.router.navigate(['/compras']);
        },
        error: error => {
          console.error('Error al registrar compra:', error);

          const mensaje =
            error?.error?.mensaje ||
            error?.error?.message ||
            'No se pudo registrar la compra';

          this.notificationService.error(mensaje);
        }
      });
  }

  // =========================
  // CANCELAR
  // =========================

  cancelar(): void {
    this.router.navigate(['/compras']);
  }
}
