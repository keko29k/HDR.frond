import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoteForm } from './lote-form';

describe('LoteForm', () => {
  let component: LoteForm;
  let fixture: ComponentFixture<LoteForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoteForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoteForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
