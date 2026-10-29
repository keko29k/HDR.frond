import { afterEach, ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { LoteForm } from './lote-form';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProductoService } from '../../../productos/services/producto';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { UsuarioService } from '../../../usuarios/services/usuario';
import { LoteService } from '../../services/lote';

describe('LoteForm', () => {
  let component: LoteForm;
  let fixture: ComponentFixture<LoteForm>;

  afterEach(() => localStorage.removeItem('Id'));

  beforeEach(async () => {
    localStorage.setItem('Id', '10');

    await TestBed.configureTestingModule({
      imports: [LoteForm],
      providers: [
        provideRouter([]),
        { provide: LoteService, useValue: { gets: () => of([]), getById: () => of(null) } },
        { provide: ProductoService, useValue: { gets: () => of([]) } },
        { provide: SucursalService, useValue: { getById: () => of({ id: 3, nombre: 'Sucursal de prueba' }) } },
        { provide: UsuarioService, useValue: { getById: () => of({ id: 10, idSucursal: 3 }) } },
        { provide: NotificationService, useValue: { success: () => {}, error: () => {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoteForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the branch assigned to the authenticated user', () => {
    expect(component.sucursalId).toBe(3);
    expect(component.sucursalActual?.nombre).toBe('Sucursal de prueba');
    expect(component.form.contains('idSucursal')).toBeFalse();
  });
});
