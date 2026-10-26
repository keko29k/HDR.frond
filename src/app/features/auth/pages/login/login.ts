import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth';
import { NotificationService } from '../../../../core/services/notification.service';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  loading = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    clave: ['', [Validators.required]]
  });

  iniciarSesion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error('Complete correctamente el formulario.');
      return;
    }

    const data = {
      email: this.form.value.email!,
      clave: this.form.value.clave!
    };

    this.loading = true;

    this.authService.login(data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Inicio de sesión correcto.');
          this.router.navigate(['/cajas']);
        },
        error: (error) => {
          const mensaje = error?.error?.mensaje || 'No se pudo iniciar sesión.';
          this.notificationService.error(mensaje);
        }
      });
  }
}
