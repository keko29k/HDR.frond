import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcaListComponent } from './marca-list';

describe('MarcaListComponent', () => {
  let component: MarcaListComponent;
  let fixture: ComponentFixture<MarcaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarcaListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarcaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
