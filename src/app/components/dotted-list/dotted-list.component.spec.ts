import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DottedListComponent } from './dotted-list.component';

describe('DottedListComponent', () => {
	let component: DottedListComponent;
	let fixture: ComponentFixture<DottedListComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [DottedListComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(DottedListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
