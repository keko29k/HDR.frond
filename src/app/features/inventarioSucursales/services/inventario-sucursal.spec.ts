import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  InventarioSucursal,
  InventarioSucursalResumen
} from '../models/inventarioSucursal.model';

import { InventarioSucursalService } from './inventario-sucursal';

describe('InventarioSucursalService', () => {
  let service: InventarioSucursalService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(InventarioSucursalService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests a filtered inventory page using the API query contract', () => {
    const response: ApiResponse<InventarioSucursal[]> = {
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

    service.getPaginacion(3, 1, 10, 'azucar', 'NORMAL').subscribe(result => {
      expect(result).toEqual(response);
    });

    const request = http.expectOne(
      request => request.url === 'https://localhost:44361/api/InventarioSucursal/Paginacion'
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('idSucursal')).toBe('3');
    expect(request.request.params.get('pageNumber')).toBe('1');
    expect(request.request.params.get('pageSize')).toBe('10');
    expect(request.request.params.get('buscar')).toBe('azucar');
    expect(request.request.params.get('estadoStock')).toBe('NORMAL');
    request.flush(response);
  });

  it('omits the branch parameter for the general inventory page', () => {
    service.getPaginacion(null, 2, 20, '', null).subscribe();

    const request = http.expectOne(
      request => request.url === 'https://localhost:44361/api/InventarioSucursal/Paginacion'
    );
    expect(request.request.params.has('idSucursal')).toBeFalse();
    expect(request.request.params.has('buscar')).toBeFalse();
    expect(request.request.params.has('estadoStock')).toBeFalse();
    expect(request.request.params.get('pageNumber')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('20');
    request.flush({
      data: [],
      meta: {
        totalCount: 0,
        pageSize: 20,
        currentPage: 2,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: true
      }
    });
  });

  it('requests the summary for the selected branch', () => {
    const response: InventarioSucursalResumen = {
      unidadesEnInventario: 0,
      stockBajo: 0,
      sinExistencias: 0,
      lotesPorVencer: 0,
      productosStockBajo: [],
      detalleLotesPorVencer: []
    };

    service.getResumen(3).subscribe(result => expect(result).toEqual(response));

    const request = http.expectOne(
      request => request.url === 'https://localhost:44361/api/InventarioSucursal/Resumen'
    );
    expect(request.request.params.get('idSucursal')).toBe('3');
    request.flush(response);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
