import { TestBed } from '@angular/core/testing';

import { CajaService } from './caja';

describe('Caja', () => {
  let service: CajaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CajaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
