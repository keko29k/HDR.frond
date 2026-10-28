import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { LoteForm } from './lote-form';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProductoService } from '../../../productos/services/producto';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { LoteService } from '../../services/lote';

describe('LoteForm', () => {
  let component: LoteForm;
  let fixture: ComponentFixture<LoteForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoteForm],
      providers: [
        provideRouter([]),
        { provide: LoteService, useValue: { gets: () => of([]), getById: () => of(null) } },
        { provide: ProductoService, useValue: { gets: () => of([]) } },
        { provide: SucursalService, useValue: { gets: () => of([]) } },
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
});
