import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JumpComponent } from './jump.component';

describe('JumpComponent', () => {
  let component: JumpComponent;
  let fixture: ComponentFixture<JumpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JumpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JumpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
