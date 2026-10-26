import { TestBed } from '@angular/core/testing';

import { DetalleVentaService } from './detalle-venta';

describe('DetalleVenta', () => {
  let service: DetalleVentaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetalleVentaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
