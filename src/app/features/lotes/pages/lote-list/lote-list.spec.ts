import { afterEach, ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { LoteList } from './lote-list';
import { NotificationService } from '../../../../core/services/notification.service';
import { Producto } from '../../../productos/models/producto.model';
import { ProductoService } from '../../../productos/services/producto';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { UsuarioService } from '../../../usuarios/services/usuario';
import { Lote } from '../../models/lote.model';
import { LoteService } from '../../services/lote';

describe('LoteList', () => {
  let component: LoteList;
  let fixture: ComponentFixture<LoteList>;

  afterEach(() => localStorage.removeItem('Id'));

  beforeEach(async () => {
    localStorage.setItem('Id', '10');

    await TestBed.configureTestingModule({
      imports: [LoteList],
      providers: [
        provideRouter([]),
        {
          provide: LoteService,
          useValue: {
            gets: () => of([crearLote({ id: 1, idSucursal: 3 }), crearLote({ id: 2, idSucursal: 4 })]),
            delete: () => of(void 0)
          }
        },
        { provide: ProductoService, useValue: { gets: () => of([]) } },
        { provide: SucursalService, useValue: { getById: () => of({ id: 3, nombre: 'Sucursal de prueba' }) } },
        { provide: UsuarioService, useValue: { getById: () => of({ id: 10, idSucursal: 3 }) } },
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

  it('only shows lots from the authenticated user branch', () => {
    expect(component.lotes.map(lote => lote.id)).toEqual([1]);
    expect(component.sucursalActual?.nombre).toBe('Sucursal de prueba');
  });

  it('does not mark a non-expiring product lot as expired', () => {
    component.productos = [crearProducto({
      id: 1,
      tieneVencimiento: false
    })];

    expect(component.estadoLote({
      id: 1,
      idSucursal: 1,
      idProducto: 1,
      numeroLote: 'LOT-1',
      fechaFabricacion: '2020-01-01',
      fechaVencimiento: '2020-02-01',
      cantidadInicial: 5,
      cantidadDisponible: 2,
      costoCompra: 10
    })).toBe('VIGENTE');
  });

  it('classifies expired lots only when the product has expiry enabled', () => {
    component.productos = [crearProducto({
      id: 1,
      tieneVencimiento: true
    })];

    expect(component.estadoLote({
      id: 1,
      idSucursal: 1,
      idProducto: 1,
      numeroLote: 'LOT-1',
      fechaFabricacion: '2020-01-01',
      fechaVencimiento: '2020-02-01',
      cantidadInicial: 5,
      cantidadDisponible: 2,
      costoCompra: 10
    })).toBe('VENCIDO');
  });

  function crearProducto(
    datos: Pick<Producto, 'id' | 'tieneVencimiento'>
  ): Producto {
    return {
      ...datos,
      idCategoria: 1,
      idMarca: null,
      codigo: 'PROD-1',
      codigoBarras: null,
      nombre: 'Producto de prueba',
      nombreGenerico: null,
      descripcion: null,
      precioCompra: 10,
      precioVenta: 15,
      peso: null,
      controlaInventario: true,
      manejaLotes: true,
      permiteVenta: true
    };
  }

  function crearLote(datos: Pick<Lote, 'id' | 'idSucursal'>): Lote {
    return {
      ...datos,
      idProducto: 1,
      numeroLote: `LOT-${datos.id}`,
      fechaFabricacion: '2026-01-01',
      fechaVencimiento: '2027-01-01',
      cantidadInicial: 5,
      cantidadDisponible: 5,
      costoCompra: 10
    };
  }
});
