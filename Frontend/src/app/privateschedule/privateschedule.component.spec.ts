import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivatescheduleComponent } from './privateschedule.component';

describe('PrivatescheduleComponent', () => {
  let component: PrivatescheduleComponent;
  let fixture: ComponentFixture<PrivatescheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivatescheduleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivatescheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
