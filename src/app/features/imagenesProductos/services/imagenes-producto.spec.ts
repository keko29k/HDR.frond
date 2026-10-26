import { TestBed } from '@angular/core/testing';

import { ImagenesProducto } from './imagenes-producto';

describe('ImagenesProducto', () => {
  let service: ImagenesProducto;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImagenesProducto);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
