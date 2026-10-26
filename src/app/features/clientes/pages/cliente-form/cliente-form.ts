
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClienteService } from '../../services/cliente';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.css'
})
export class ClienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  editando = false;
  clienteId = 0;
  titulo = 'Nuevo cliente';
  loading = false;
  form = this.fb.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    nitCi: ['', [Validators.required, Validators.maxLength(20)]],
    telefono: ['', [Validators.required, Validators.maxLength(20)]],
    correo: ['', [Validators.email, Validators.maxLength(150)]],
    direccion: ['', [Validators.maxLength(250)]],
    fechaNacimiento: [''],
    observacion: ['', [Validators.maxLength(500)]]
  });
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editando = true;
      this.clienteId = Number(id);
      this.titulo = 'Editar cliente';
      this.cargarCliente(this.clienteId);
    }
  }
  cargarCliente(id: number): void {
    this.loading = true;
    this.clienteService.getById(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (cliente) => {
          this.form.patchValue({
            nombres: cliente.nombres,
            apellidos: cliente.apellidos,
            nitCi: cliente.nitCi,
            telefono: cliente.telefono ?? '',
            correo: cliente.correo ?? '',
            direccion: cliente.direccion ?? '',
            fechaNacimiento: cliente.fechaNacimiento ? this.formatearFecha(cliente.fechaNacimiento) : '',
            observacion: cliente.observacion ?? ''
          });
        },
        error: () => {
          this.notificationService.error('No se pudo cargar el cliente.');
          this.router.navigate(['/clientes']);
        }
      });
  }
  private formatearFecha(fecha: Date | string): string {
    if (!fecha) {
      return '';
    }
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return fecha;
    }
    const date = new Date(fecha);
    if (isNaN(date.getTime())) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  guardar(): void {
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
    const data = {
      nombres: this.form.value.nombres!,
      apellidos: this.form.value.apellidos!,
      nitCi: this.form.value.nitCi!,
      telefono: this.form.value.telefono!,
      correo: this.form.value.correo || '',
      direccion: this.form.value.direccion || '',
      fechaNacimiento: this.form.value.fechaNacimiento || null,
      observacion: this.form.value.observacion || ''
    };
    this.loading = true;
    this.clienteService.create(data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Cliente creado correctamente.');
          this.router.navigate(['/clientes']);
        },
        error: (error) => {
          const mensaje = error?.error?.mensaje || 'No se pudo crear el cliente.';
          this.notificationService.error(mensaje);
        }
      });
  }
  actualizar(): void {
    const data = {
      nombres: this.form.value.nombres!,
      apellidos: this.form.value.apellidos!,
      nitCi: this.form.value.nitCi!,
      telefono: this.form.value.telefono!,
      correo: this.form.value.correo || '',
      direccion: this.form.value.direccion || '',
      fechaNacimiento: this.form.value.fechaNacimiento || null,
      observacion: this.form.value.observacion || ''
    };
    this.loading = true;
    this.clienteService.update(this.clienteId, data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Cliente actualizado correctamente.');
          this.router.navigate(['/clientes']);
        },
        error: (error) => {
          const mensaje = error?.error?.mensaje || 'No se pudo actualizar el cliente.';
          this.notificationService.error(mensaje);
        }
      });
  }
  cancelar(): void {
    this.router.navigate(['/clientes']);
  }
}

