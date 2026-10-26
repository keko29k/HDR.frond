import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UsuarioService } from '../../../usuarios/services/usuario';
import { CompraService } from '../../services/compra';
import { ProveedorService } from '../../../proveedores/services/proveedor';
import { ProductoService } from '../../../productos/services/producto';

import { Usuario } from '../../../usuarios/models/usuario.model';
import { Proveedor } from '../../../proveedores/models/proveedor.model';
import { Producto } from '../../../productos/models/producto.model';
import { MatDivider } from '@angular/material/divider';
import { MatToolbar } from '@angular/material/toolbar';

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
    MatDivider,
    MatToolbar
  ],
  templateUrl: './compra-form.html',
  styleUrl: './compra-form.css'
})
export class CompraFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private compraService = inject(CompraService);
  private usuarioService = inject(UsuarioService);
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // =========================
  // DATA
  // =========================
  usuarios: Usuario[] = [];
  proveedores: Proveedor[] = [];
  productos: Producto[] = [];

  detalles: any[] = [];

  loading = false;

  // =========================
  // FORM
  // =========================
  form = this.fb.group({
    fecha: [new Date(), Validators.required],
    descripcion: ['', Validators.required],
    proveedorId: [0, Validators.required],
    usuarioId: [Number(localStorage.getItem('Id')), Validators.required],
    total: [0]
  });

  ngOnInit(): void {
    this.cargarListar();
  }

  // =========================
  // CARGAR LISTAS
  // =========================
  cargarListar(): void {

    this.loading = true;

    forkJoin({
      usuarios: this.usuarioService.gets(),
      proveedores: this.proveedorService.gets(),
      productos: this.productoService.gets()
    })
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: (res) => {
        this.usuarios = res.usuarios;
        this.proveedores = res.proveedores;
        this.productos = res.productos;
      },
      error: () => {
        this.notificationService.error('Error al cargar datos');
      }
    });
  }

  // =========================
  // AGREGAR PRODUCTO (CARRITO)
  // =========================
  agregarProducto(producto: Producto, cantidad: number = 1): void {

    const existente = this.detalles.find(d => d.productoId === producto.id);

    if (existente) {
      existente.cantidad += cantidad;
      existente.subtotal = existente.cantidad * existente.precio;
    } else {
      this.detalles.push({
        productoId: producto.id,
        cantidad: cantidad,
        precio: producto.precioCompra,
        subtotal: cantidad * producto.precioCompra
      });
    }

    this.calcularTotal();
  }

  eliminarDetalle(index: number): void {
    this.detalles.splice(index, 1);
    this.calcularTotal();
  }

  limpiar(): void {
    this.detalles = [];
    this.calcularTotal();
  }

  // =========================
  // TOTAL
  // =========================
  calcularTotal(): number {
    const total = this.detalles.reduce((sum, d) => sum + d.subtotal, 0);
    this.form.patchValue({ total });
    return total;
  }

  // =========================
  // GUARDAR COMPRA
  // =========================
  guardar(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error('Formulario incompleto');
      return;
    }

    if (this.detalles.length === 0) {
      this.notificationService.error('Agrega productos a la compra');
      return;
    }

    const compra = {
      id: 0,
      fecha: new Date(),
      total: this.calcularTotal(),
      descripcion: this.form.value.descripcion!,
      proveedorId: this.form.value.proveedorId!,
      usuarioId: Number(localStorage.getItem('Id')),
      
    };

    const dto = {
      compra: compra,
      detalle: this.detalles
    };

    this.loading = true;

    this.compraService.compraDetalle(dto)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Compra registrada correctamente');
          this.limpiar();
          this.router.navigate(['/compras']);
        },
        error: () => {
          this.notificationService.error('Error al registrar compra');
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/compras']);
  }
}