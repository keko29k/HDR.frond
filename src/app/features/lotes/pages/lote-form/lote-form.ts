import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, finalize, forkJoin, map, of, switchMap } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';
import { Producto } from '../../../productos/models/producto.model';
import { ProductoService } from '../../../productos/services/producto';
import { Sucursal } from '../../../sucursales/models/sucursal.model';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { UsuarioService } from '../../../usuarios/services/usuario';
import { Lote as LoteModel } from '../../models/lote.model';
import { LoteCreate } from '../../models/lote-create.model';
import { LoteUpdate } from '../../models/lote-update.model';
import { LoteService } from '../../services/lote';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

const fechaVencimientoPosteriorAElaboracion: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const fabricacion = control.get('fechaFabricacion')?.value as string | null;
  const vencimiento = control.get('fechaVencimiento')?.value as string | null;

  if (fabricacion && vencimiento && vencimiento < fabricacion) {
    return { fechaVencimientoAnterior: true };
  }

  return null;
};

@Component({
  selector: 'app-lote-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './lote-form.html',
  styleUrl: './lote-form.css'
})
export class LoteForm implements OnInit {
  private fb = inject(FormBuilder);
  private loteService = inject(LoteService);
  private productoService = inject(ProductoService);
  private sucursalService = inject(SucursalService);
  private usuarioService = inject(UsuarioService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  productos: Producto[] = [];
  sucursalActual: Sucursal | null = null;
  sucursalId = 0;
  loteId = 0;
  editando = false;
  loading = false;
  errorCarga = false;
  titulo = 'Registrar lote';

  form = this.fb.group({
    idProducto: [0, [Validators.required, Validators.min(1)]],
    numeroLote: ['', [Validators.required, Validators.maxLength(100)]],
    fechaFabricacion: ['', Validators.required],
    fechaVencimiento: ['', Validators.required],
    cantidadInicial: [0, [Validators.required, Validators.min(0.01)]],
    cantidadDisponible: [0, [Validators.required, Validators.min(0)]],
    costoCompra: [0, [Validators.required, Validators.min(0)]]
  }, { validators: fechaVencimientoPosteriorAElaboracion });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.editando = Boolean(id);

    if (id) {
      this.loteId = Number(id);
      this.titulo = 'Editar lote';
    }

    this.cargarDatos(this.editando ? this.loteId : null);
  }

  cargarDatos(id: number | null): void {
    const usuarioId = Number(localStorage.getItem('Id'));
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      this.errorCarga = true;
      this.notificationService.error('No se encontró el usuario de la sesión. Inicia sesión nuevamente.');
      return;
    }

    this.loading = true;
    this.errorCarga = false;

    forkJoin({
      usuario: this.usuarioService.getById(usuarioId),
      productos: this.productoService.gets(),
      lote: id ? this.loteService.getById(id) : of(null)
    })
      .pipe(
        switchMap(({ usuario, productos, lote }) => {
          if (!Number.isInteger(Number(usuario.idSucursal)) || Number(usuario.idSucursal) <= 0) {
            this.errorCarga = true;
            this.notificationService.error('El usuario no tiene una sucursal asignada.');
            return EMPTY;
          }

          this.sucursalId = Number(usuario.idSucursal);
          if (lote && Number(lote.idSucursal) !== this.sucursalId) {
            this.errorCarga = true;
            this.notificationService.error('No puedes gestionar lotes de otra sucursal.');
            return EMPTY;
          }

          return this.sucursalService.getById(this.sucursalId).pipe(
            map(sucursal => ({ productos, lote, sucursal }))
          );
        }),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: ({ productos, lote, sucursal }) => {
          this.productos = productos.filter(producto =>
            producto.manejaLotes || Number(producto.id) === Number(lote?.idProducto)
          );
          this.sucursalActual = sucursal;

          if (lote) {
            this.cargarLoteEnFormulario(lote);
          }
        },
        error: (error) => {
          this.errorCarga = true;
          console.error('Error al cargar los datos del formulario de lotes:', error);
          this.notificationService.error(
            id
              ? 'No se pudieron cargar los datos del lote o la sucursal del usuario.'
              : 'No se pudieron cargar los productos o la sucursal del usuario.'
          );
        }
      });
  }

  private cargarLoteEnFormulario(lote: LoteModel): void {
    this.form.patchValue({
      idProducto: lote.idProducto,
      numeroLote: lote.numeroLote,
      fechaFabricacion: this.normalizarFecha(lote.fechaFabricacion),
      fechaVencimiento: this.normalizarFecha(lote.fechaVencimiento),
      cantidadInicial: lote.cantidadInicial,
      cantidadDisponible: lote.cantidadDisponible,
      costoCompra: lote.costoCompra
    });
  }

  private normalizarFecha(fecha: Date | string): string {
    const valor = typeof fecha === 'string' ? fecha : fecha.toISOString();
    return valor.slice(0, 10);
  }

  guardar(): void {
    if (!this.sucursalId || !this.sucursalActual) {
      this.notificationService.error('No se puede guardar el lote sin la sucursal asignada al usuario.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error('Complete correctamente el formulario del lote.');
      return;
    }

    if (this.editando) {
      this.actualizar();
    } else {
      this.crear();
    }
  }

  private crear(): void {
    const valores = this.form.getRawValue();
    const data: LoteCreate = {
      idSucursal: this.sucursalId,
      idProducto: valores.idProducto!,
      numeroLote: valores.numeroLote!.trim(),
      fechaFabricacion: valores.fechaFabricacion!,
      fechaVencimiento: valores.fechaVencimiento!,
      cantidadInicial: valores.cantidadInicial!,
      cantidadDisponible: valores.cantidadDisponible!,
      costoCompra: valores.costoCompra!
    };

    this.loading = true;
    this.loteService.create(data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Lote registrado correctamente.');
          this.router.navigate(['/lotes']);
        },
        error: (error) => {
          console.error('Error al registrar el lote:', error);
          this.notificationService.error(
            error?.error?.mensaje || 'No se pudo registrar el lote.'
          );
        }
      });
  }

  private actualizar(): void {
    const valores = this.form.getRawValue();
    const data: LoteUpdate = {
      idProducto: valores.idProducto!,
      numeroLote: valores.numeroLote!.trim(),
      fechaFabricacion: valores.fechaFabricacion!,
      fechaVencimiento: valores.fechaVencimiento!,
      cantidadInicial: valores.cantidadInicial!,
      cantidadDisponible: valores.cantidadDisponible!,
      costoCompra: valores.costoCompra!
    };

    this.loading = true;
    this.loteService.update(this.loteId, data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Lote actualizado correctamente.');
          this.router.navigate(['/lotes']);
        },
        error: (error) => {
          console.error('Error al actualizar el lote:', error);
          this.notificationService.error(
            error?.error?.mensaje || 'No se pudo actualizar el lote.'
          );
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/lotes']);
  }
}
