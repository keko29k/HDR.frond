import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompraFormComponent } from './compra-form';

describe('CompraFormComponent', () => {
  let component: CompraFormComponent;
  let fixture: ComponentFixture<CompraFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompraFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompraFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
