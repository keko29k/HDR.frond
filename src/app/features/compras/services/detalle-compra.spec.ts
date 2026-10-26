import { TestBed } from '@angular/core/testing';

import { DetalleCompra } from './detalle-compra';

describe('DetalleCompra', () => {
  let service: DetalleCompra;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetalleCompra);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
