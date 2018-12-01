import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipInfoComponent } from './ship-info.component';

describe('ShipInfoComponent', () => {
  let component: ShipInfoComponent;
  let fixture: ComponentFixture<ShipInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShipInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShipInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
