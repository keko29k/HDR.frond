
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GastoService } from '../../services/gasto';
import { MatIconModule } from '@angular/material/icon';
import { CajaService } from '../../../cajas/services/caja';
import { Caja } from '../../../cajas/models/caja.model';

@Component({
  selector: 'app-gasto-form',
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
    MatTooltipModule,
    MatIconModule
  ],
  templateUrl: './gasto-form.html',
  styleUrls: [
    '../../../../shared/styles/operaciones.css',
    './gasto-form.css'
  ]
})
export class GastoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private gastoService = inject(GastoService);
  private cajaService = inject(CajaService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editando = false;
  gastoId = 0;
  titulo = 'Nuevo gasto';
  loading = false;

  // Caja abierta del usuario (solo al registrar)
  cajaActual: Caja | null = null;
  cargandoCaja = false;
  sinCajaAbierta = false;
  errorCaja = false;

  readonly hoy = new Date();

  /** Conceptos frecuentes para completar con un clic. */
  readonly conceptosSugeridos: { texto: string; icono: string }[] = [
    { texto: 'Servicios básicos', icono: 'bolt' },
    { texto: 'Transporte', icono: 'local_shipping' },
    { texto: 'Alquiler', icono: 'home_work' },
    { texto: 'Sueldos', icono: 'badge' },
    { texto: 'Insumos', icono: 'inventory' },
    { texto: 'Mantenimiento', icono: 'build' },
    { texto: 'Alimentación', icono: 'restaurant' },
    { texto: 'Impuestos', icono: 'account_balance' }
  ];

  form = this.fb.group({
    idCaja: [0, [Validators.required, Validators.min(1)]],
    idUsuario: [0, [Validators.required, Validators.min(1)]],
    concepto: ['', [Validators.required, Validators.maxLength(150)]],
    numeroComprobante: ['', [Validators.maxLength(100)]],
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
    observacion: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.editando = true;
      this.gastoId = Number(id);
      this.titulo = 'Editar gasto';
      this.form.get('idCaja')?.disable();
      this.form.get('idUsuario')?.disable();
      this.cargarGasto(this.gastoId);
      return;
    }

    // Al registrar, la caja y el usuario se toman de la sesión.
    this.form.controls.idUsuario.setValue(this.leerUsuarioSesion());
    this.cargarCajaAbierta();
  }

  // =========================
  // CAJA ABIERTA
  // =========================

  cargarCajaAbierta(): void {
    this.cargandoCaja = true;
    this.sinCajaAbierta = false;
    this.errorCaja = false;

    this.cajaService.obtenerMiCajaAbierta()
      .pipe(finalize(() => this.cargandoCaja = false))
      .subscribe({
        next: caja => {
          const abierta = (caja?.estadoCaja ?? '').trim().toUpperCase() === 'ABIERTA';

          this.cajaActual = abierta ? caja : null;
          this.sinCajaAbierta = !abierta;
          this.form.controls.idCaja.setValue(abierta ? caja.id : 0);
        },
        error: error => {
          this.cajaActual = null;
          this.form.controls.idCaja.setValue(0);

          if (error?.status === 404) {
            this.sinCajaAbierta = true;
          } else {
            this.errorCaja = true;
          }
        }
      });
  }

  abrirCaja(): void {
    this.router.navigate(['/cajas/nuevo']);
  }

  usarConcepto(texto: string): void {
    this.form.controls.concepto.setValue(texto);
    this.form.controls.concepto.markAsDirty();
  }

  get montoActual(): number {
    return Number(this.form.controls.monto.value) || 0;
  }

  get puedeGuardar(): boolean {
    return !this.loading && (this.editando || (!!this.cajaActual && !this.cargandoCaja));
  }

  // =========================
  // CARGA Y GUARDADO
  // =========================

  cargarGasto(id: number): void {
    this.loading = true;

    this.gastoService.getById(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (gasto) => {
          this.form.patchValue({
            idCaja: gasto.idCaja,
            idUsuario: gasto.idUsuario,
            concepto: gasto.concepto ?? '',
            numeroComprobante: gasto.numeroComprobante ?? '',
            monto: gasto.monto,
            observacion: gasto.observacion ?? ''
          });
        },
        error: () => {
          this.notificationService.error('No se pudo cargar el gasto.');
          this.router.navigate(['/gastos']);
        }
      });
  }

  guardar(): void {
    if (this.loading) {
      return;
    }

    if (!this.editando && !this.cajaActual) {
      this.notificationService.error('Necesitas una caja abierta para registrar un gasto.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error('Complete correctamente el formulario.');
      return;
    }

    if (this.editando) {
      this.actualizar();
    } else {
      this.crear();
    }
  }

  crear(): void {
    const valores = this.form.getRawValue();

    const data = {
      idCaja: valores.idCaja!,
      idUsuario: valores.idUsuario!,
      concepto: valores.concepto!.trim(),
      numeroComprobante: valores.numeroComprobante?.trim() || '',
      monto: Number(valores.monto),
      observacion: valores.observacion?.trim() || ''
    };

    this.loading = true;

    this.gastoService.create(data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Gasto creado correctamente.');
          this.router.navigate(['/gastos']);
        },
        error: (error) => {
          const mensaje = error?.error?.mensaje || 'No se pudo crear el gasto.';
          this.notificationService.error(mensaje);
        }
      });
  }

  actualizar(): void {
    const valores = this.form.getRawValue();

    const data = {
      concepto: valores.concepto!.trim(),
      numeroComprobante: valores.numeroComprobante?.trim() || '',
      monto: Number(valores.monto),
      observacion: valores.observacion?.trim() || ''
    };

    this.loading = true;

    this.gastoService.update(this.gastoId, data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Gasto actualizado correctamente.');
          this.router.navigate(['/gastos']);
        },
        error: (error) => {
          const mensaje = error?.error?.mensaje || 'No se pudo actualizar el gasto.';
          this.notificationService.error(mensaje);
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/gastos']);
  }

  private leerUsuarioSesion(): number {
    const valor = Number(localStorage.getItem('Id'));
    return Number.isInteger(valor) && valor > 0 ? valor : 0;
  }
}
