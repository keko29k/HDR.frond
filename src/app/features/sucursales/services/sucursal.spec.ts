import { TestBed } from '@angular/core/testing';

import { Sucursal } from './sucursal';

describe('Sucursal', () => {
  let service: Sucursal;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sucursal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
