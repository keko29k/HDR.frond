import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompraListComponent } from './compra-list';

describe('CompraList', () => {
  let component: CompraListComponent;
  let fixture: ComponentFixture<CompraListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompraListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompraListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
