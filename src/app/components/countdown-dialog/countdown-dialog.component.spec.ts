import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CountdownDialogComponent } from './countdown-dialog.component';

describe('CountdownDialogComponent', () => {
	let component: CountdownDialogComponent;
	let fixture: ComponentFixture<CountdownDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [CountdownDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(CountdownDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
