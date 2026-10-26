import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GastoForm } from './gasto-form';

describe('GastoForm', () => {
  let component: GastoForm;
  let fixture: ComponentFixture<GastoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GastoForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GastoForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
