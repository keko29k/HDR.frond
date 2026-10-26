import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventarioSucursalList } from './inventario-sucursal-list';

describe('InventarioSucursalList', () => {
  let component: InventarioSucursalList;
  let fixture: ComponentFixture<InventarioSucursalList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventarioSucursalList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventarioSucursalList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
