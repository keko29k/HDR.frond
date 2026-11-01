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
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';

interface DetalleCompraFormulario {
  idProducto: number;
  nombreProducto: string;
  codigo: string;
  cantidad: number;
  precioCompra: number;
  descuento: number;
  impuesto: number;
  subtotal: number;
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
    MatDividerModule,
    MatToolbarModule
  ],
  templateUrl: './compra-form.html',
  styleUrl: './compra-form.css'
})
export class CompraFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private compraService = inject(CompraService);
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  proveedores: Proveedor[] = [];
  productos: Producto[] = [];
  detalles: DetalleCompraFormulario[] = [];

  loading = false;

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

  private obtenerFechaActual(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  cargarDatos(): void {
    this.loading = true;

    forkJoin({
      proveedores: this.proveedorService.gets(),
      productos: this.productoService.gets()
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.proveedores = res.proveedores;
          this.productos = res.productos;
        },
        error: () => {
          this.notificationService.error('Error al cargar proveedores y productos');
        }
      });
  }

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
        subtotal: producto.precioCompra
      });
    }

    this.calcularTotal();
  }

  actualizarCantidad(index: number, valor: string): void {
    const cantidad = Number(valor);

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return;
    }

    this.detalles[index].cantidad = cantidad;
    this.actualizarSubtotal(this.detalles[index]);
    this.calcularTotal();
  }

  actualizarPrecio(index: number, valor: string): void {
    const precio = Number(valor);

    if (!Number.isFinite(precio) || precio < 0) {
      return;
    }

    this.detalles[index].precioCompra = precio;
    this.actualizarSubtotal(this.detalles[index]);
    this.calcularTotal();
  }

  private actualizarSubtotal(detalle: DetalleCompraFormulario): void {
    detalle.subtotal =
      (detalle.cantidad * detalle.precioCompra)
      - detalle.descuento
      + detalle.impuesto;
  }

  eliminarDetalle(index: number): void {
    this.detalles.splice(index, 1);
    this.calcularTotal();
  }

  limpiarDetalles(): void {
    this.detalles = [];
    this.calcularTotal();
  }

  calcularTotal(): number {
    return this.detalles.reduce(
      (total, detalle) => total + detalle.subtotal,
      0
    );
  }

  guardar(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error('Completa los datos de la compra');
      return;
    }

    if (this.detalles.length === 0) {
      this.notificationService.error('Agrega al menos un producto');
      return;
    }

    const valores = this.form.getRawValue();

    const dto: RegistrarCompraDto = {
      idProveedor: valores.idProveedor!,
      tipoDocumento: valores.tipoDocumento!,
      numeroDocumento: valores.numeroDocumento || null,
      fechaCompra: new Date(`${valores.fechaCompra}T12:00:00`).toISOString(),
      observacion: valores.observacion || null,
      detalles: this.detalles.map(detalle => ({
        idProducto: detalle.idProducto,
        cantidad: detalle.cantidad,
        precioCompra: detalle.precioCompra,
        descuento: detalle.descuento,
        impuesto: detalle.impuesto,
        numeroLote: null,
        fechaFabricacion: null,
        fechaVencimiento: null
      }))
    };

    this.loading = true;

    this.compraService.registrar(dto)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Compra registrada correctamente');
          this.router.navigate(['/compras']);
        },
        error: (error) => {
          console.error('Error al registrar compra:', error);

          const mensaje =
            error?.error?.message ||
            error?.error?.mensaje ||
            'No se pudo registrar la compra';

          this.notificationService.error(mensaje);
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/compras']);
  }
}