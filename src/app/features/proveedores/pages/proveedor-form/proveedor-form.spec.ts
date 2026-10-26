import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProveedorForm } from './proveedor-form';

describe('ProveedorForm', () => {
  let component: ProveedorForm;
  let fixture: ComponentFixture<ProveedorForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProveedorForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
