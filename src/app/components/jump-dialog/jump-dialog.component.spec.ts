import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JumpDialogComponent } from './jump-dialog.component';

describe('JumpDialogComponent', () => {
	let component: JumpDialogComponent;
	let fixture: ComponentFixture<JumpDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [JumpDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(JumpDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
