import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CajaList } from './caja-list';

describe('CajaList', () => {
  let component: CajaList;
  let fixture: ComponentFixture<CajaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CajaList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CajaList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
