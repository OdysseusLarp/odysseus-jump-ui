import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StaticScreenComponent } from './static-screen.component';

describe('StaticScreenComponent', () => {
	let component: StaticScreenComponent;
	let fixture: ComponentFixture<StaticScreenComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [StaticScreenComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(StaticScreenComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
