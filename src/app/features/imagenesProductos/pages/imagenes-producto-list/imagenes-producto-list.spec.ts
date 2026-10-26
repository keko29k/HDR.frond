import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagenesProductoList } from './imagenes-producto-list';

describe('ImagenesProductoList', () => {
  let component: ImagenesProductoList;
  let fixture: ComponentFixture<ImagenesProductoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagenesProductoList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImagenesProductoList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
