import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteList } from './reporte-list';

describe('ReporteList', () => {
  let component: ReporteList;
  let fixture: ComponentFixture<ReporteList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
