import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbonarCredito } from './abonar-credito';

describe('AbonarCredito', () => {
  let component: AbonarCredito;
  let fixture: ComponentFixture<AbonarCredito>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbonarCredito]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbonarCredito);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
