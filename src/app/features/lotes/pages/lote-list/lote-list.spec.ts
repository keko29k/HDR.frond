import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { LoteList } from './lote-list';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProductoService } from '../../../productos/services/producto';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { LoteService } from '../../services/lote';

describe('LoteList', () => {
  let component: LoteList;
  let fixture: ComponentFixture<LoteList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoteList],
      providers: [
        provideRouter([]),
        { provide: LoteService, useValue: { gets: () => of([]), delete: () => of(void 0) } },
        { provide: ProductoService, useValue: { gets: () => of([]) } },
        { provide: SucursalService, useValue: { gets: () => of([]) } },
        { provide: NotificationService, useValue: { success: () => {}, error: () => {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoteList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
