import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagenesProductoForm } from './imagenes-producto-form';

describe('ImagenesProductoForm', () => {
  let component: ImagenesProductoForm;
  let fixture: ComponentFixture<ImagenesProductoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagenesProductoForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImagenesProductoForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
