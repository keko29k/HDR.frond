import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CajaForm } from './caja-form';

describe('CajaForm', () => {
  let component: CajaForm;
  let fixture: ComponentFixture<CajaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CajaForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CajaForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
