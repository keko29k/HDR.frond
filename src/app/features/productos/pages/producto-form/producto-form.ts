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

import { ProductoService } from '../../services/producto';

import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria';

import { MarcaService } from '../../../marcas/services/marca';
import { Marca } from '../../../marcas/models/marca.model';

import { ProductoCreate } from '../../models/producto-create.model';
import { ProductoUpdate } from '../../models/producto-update.model';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css'
})
export class ProductoFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private marcaService = inject(MarcaService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  categorias: Categoria[] = [];
  marcas: Marca[] = [];

  editando = false;
  productoId = 0;
  titulo = 'Nuevo producto';
  loading = false;

  form = this.fb.group({
    idCategoria: [0, [
      Validators.required,
      Validators.min(1)
    ]],

    idMarca: [null as number | null],

    codigo: ['', [
      Validators.required,
      Validators.maxLength(50)
    ]],

    codigoBarras: [null as string | null, [
      Validators.maxLength(50)
    ]],

    nombre: ['', [
      Validators.required,
      Validators.maxLength(100)
    ]],

    nombreGenerico: [null as string | null, [
      Validators.maxLength(100)
    ]],

    descripcion: [null as string | null],

    precioCompra: [0, [
      Validators.required,
      Validators.min(0)
    ]],

    precioVenta: [0, [
      Validators.required,
      Validators.min(0)
    ]],

    peso: [null as number | null, [
      Validators.min(0)
    ]],

    controlaInventario: [true, [
      Validators.required
    ]],

    manejaLotes: [false, [
      Validators.required
    ]],

    tieneVencimiento: [false, [
      Validators.required
    ]],

    permiteVenta: [true, [
      Validators.required
    ]]
  });

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {

      this.editando = true;
      this.productoId = Number(id);
      this.titulo = 'Editar producto';

      this.cargarProducto(this.productoId);

    }

    this.cargarListar();
  }

  cargarListar(): void {

    this.loading = true;

    forkJoin({
      categorias: this.categoriaService.gets(),
      marcas: this.marcaService.gets()
    })
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: (response) => {

          this.categorias = response.categorias;
          this.marcas = response.marcas;

          console.log('categorias', this.categorias);
          console.log('marcas', this.marcas);

        },

        error: () => {

          this.notificationService.error(
            'No se pudo cargar categorías o marcas.'
          );

        }

      });
  }

  cargarProducto(id: number): void {

    this.loading = true;

    this.productoService.getById(id)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: (producto) => {

          this.form.patchValue({

            idCategoria: producto.idCategoria,
            idMarca: producto.idMarca,

            codigo: producto.codigo,
            codigoBarras: producto.codigoBarras,

            nombre: producto.nombre,
            nombreGenerico: producto.nombreGenerico,
            descripcion: producto.descripcion,

            precioCompra: producto.precioCompra,
            precioVenta: producto.precioVenta,

            peso: producto.peso,

            controlaInventario: producto.controlaInventario,
            manejaLotes: producto.manejaLotes,
            tieneVencimiento: producto.tieneVencimiento,
            permiteVenta: producto.permiteVenta

          });

        },

        error: () => {

          this.notificationService.error(
            'No se pudo cargar el producto.'
          );

          this.router.navigate(['/productos']);

        }

      });
  }

  guardar(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      this.notificationService.error(
        'Complete correctamente el formulario.'
      );

      return;
    }

    if (this.editando) {

      this.actualizar();

    } else {

      this.crear();

    }
  }

  crear(): void {

    const data: ProductoCreate = {

      idCategoria: this.form.value.idCategoria!,

      idMarca: this.form.value.idMarca ?? null,

      codigo: this.form.value.codigo!,

      codigoBarras: this.form.value.codigoBarras ?? null,

      nombre: this.form.value.nombre!,

      nombreGenerico: this.form.value.nombreGenerico ?? null,

      descripcion: this.form.value.descripcion ?? null,

      precioCompra: this.form.value.precioCompra!,

      precioVenta: this.form.value.precioVenta!,

      peso: this.form.value.peso ?? null,

      controlaInventario: this.form.value.controlaInventario!,

      manejaLotes: this.form.value.manejaLotes!,

      tieneVencimiento: this.form.value.tieneVencimiento!,

      permiteVenta: this.form.value.permiteVenta!

    };

    console.log('DATA CREAR PRODUCTO:', data);

    this.loading = true;

    this.productoService.create(data)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Producto creado correctamente.'
          );

          this.router.navigate(['/productos']);

        },

        error: (error) => {

          console.error('Error crear producto:', error);

          const mensaje =
            error?.error?.mensaje ||
            'No se pudo crear el producto.';

          this.notificationService.error(mensaje);

        }

      });
  }

  actualizar(): void {

    const data: ProductoUpdate = {

      idCategoria: this.form.value.idCategoria!,

      idMarca: this.form.value.idMarca ?? null,

      codigo: this.form.value.codigo!,

      codigoBarras: this.form.value.codigoBarras ?? null,

      nombre: this.form.value.nombre!,

      nombreGenerico: this.form.value.nombreGenerico ?? null,

      descripcion: this.form.value.descripcion ?? null,

      precioCompra: this.form.value.precioCompra!,

      precioVenta: this.form.value.precioVenta!,

      peso: this.form.value.peso ?? null,

      controlaInventario: this.form.value.controlaInventario!,

      manejaLotes: this.form.value.manejaLotes!,

      tieneVencimiento: this.form.value.tieneVencimiento!,

      permiteVenta: this.form.value.permiteVenta!

    };

    console.log('DATA ACTUALIZAR PRODUCTO:', data);

    this.loading = true;

    this.productoService.update(this.productoId, data)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Producto actualizado correctamente.'
          );

          this.router.navigate(['/productos']);

        },

        error: (error) => {

          console.error('Error actualizar producto:', error);

          const mensaje =
            error?.error?.mensaje ||
            'No se pudo actualizar el producto.';

          this.notificationService.error(mensaje);

        }

      });
  }

  cancelar(): void {

    this.router.navigate(['/productos']);

  }
}