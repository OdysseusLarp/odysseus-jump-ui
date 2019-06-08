import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BeaconDialogComponent } from './beacon-dialog.component';

describe('BeaconDialogComponent', () => {
	let component: BeaconDialogComponent;
	let fixture: ComponentFixture<BeaconDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [BeaconDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(BeaconDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
