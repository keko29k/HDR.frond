import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { InventarioSucursalService } from '../../services/inventario-sucursal';

import { InventarioSucursalList } from './inventario-sucursal-list';

describe('InventarioSucursalList', () => {
  let component: InventarioSucursalList;
  let fixture: ComponentFixture<InventarioSucursalList>;
  let inventarioService: jasmine.SpyObj<InventarioSucursalService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const pagina = {
    data: [],
    meta: {
      totalCount: 0,
      pageSize: 10,
      currentPage: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    }
  };
  const resumen = {
    unidadesEnInventario: 0,
    stockBajo: 0,
    sinExistencias: 0,
    lotesPorVencer: 0,
    productosStockBajo: [],
    detalleLotesPorVencer: []
  };

  beforeEach(async () => {
    inventarioService = jasmine.createSpyObj<InventarioSucursalService>(
      'InventarioSucursalService',
      ['getPaginacion', 'getResumen']
    );
    inventarioService.getPaginacion.and.returnValue(of(pagina));
    inventarioService.getResumen.and.returnValue(of(resumen));
    notificationService = jasmine.createSpyObj<NotificationService>('NotificationService', ['error']);

    await TestBed.configureTestingModule({
      imports: [InventarioSucursalList],
      providers: [
        { provide: InventarioSucursalService, useValue: inventarioService },
        { provide: SucursalService, useValue: { gets: () => of([]) } },
        { provide: NotificationService, useValue: notificationService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventarioSucursalList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the general inventory page and summary on open', () => {
    expect(inventarioService.getPaginacion).toHaveBeenCalledWith(null, 1, 10, '', null);
    expect(inventarioService.getResumen).toHaveBeenCalledWith(null);
  });

  it('shows an error instead of treating failed requests as zero inventory', () => {
    inventarioService.getPaginacion.and.returnValue(throwError(() => new Error('API error')));
    inventarioService.getResumen.and.returnValue(throwError(() => new Error('API error')));

    component.cargarInventario();

    expect(component.errorCarga).toBeTrue();
    expect(component.resumen).toBeNull();
    expect(notificationService.error).toHaveBeenCalled();
  });
});
