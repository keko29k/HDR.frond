import { TestBed } from '@angular/core/testing';

import { InventarioSucursal } from './inventario-sucursal';

describe('InventarioSucursal', () => {
  let service: InventarioSucursal;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventarioSucursal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
