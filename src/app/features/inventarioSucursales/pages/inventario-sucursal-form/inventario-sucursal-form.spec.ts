import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventarioSucursalForm } from './inventario-sucursal-form';

describe('InventarioSucursalForm', () => {
  let component: InventarioSucursalForm;
  let fixture: ComponentFixture<InventarioSucursalForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventarioSucursalForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventarioSucursalForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
