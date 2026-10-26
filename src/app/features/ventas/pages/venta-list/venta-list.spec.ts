import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentaList } from './venta-list';

describe('VentaList', () => {
  let component: VentaList;
  let fixture: ComponentFixture<VentaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentaList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentaList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
