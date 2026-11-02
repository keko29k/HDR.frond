import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth';
import { NotificationService } from '../../../../core/services/notification.service';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  loading = false;
  mostrarClave = false;
  mayusculasActivas = false;
  errorLogin = '';

  readonly anio = new Date().getFullYear();

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    clave: ['', [Validators.required]]
  });

  campoInvalido(campo: 'email' | 'clave'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  detectarMayusculas(event: KeyboardEvent): void {
    this.mayusculasActivas = event.getModifierState?.('CapsLock') ?? false;
  }

  iniciarSesion(): void {
    if (this.loading) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error('Complete correctamente el formulario.');
      return;
    }

    const data = {
      email: this.form.value.email!.trim(),
      clave: this.form.value.clave!
    };

    this.loading = true;
    this.errorLogin = '';

    this.authService.login(data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Inicio de sesión correcto.');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          const mensaje = error?.status === 0
            ? 'No se pudo conectar con el servidor.'
            : error?.error?.mensaje || 'No se pudo iniciar sesión.';

          this.errorLogin = mensaje;
          this.notificationService.error(mensaje);
        }
      });
  }
}
