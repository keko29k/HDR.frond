import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoteList } from './lote-list';

describe('LoteList', () => {
  let component: LoteList;
  let fixture: ComponentFixture<LoteList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoteList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoteList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
