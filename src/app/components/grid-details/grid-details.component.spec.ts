import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GridDetailsComponent } from './grid-details.component';

describe('GridDetailsComponent', () => {
	let component: GridDetailsComponent;
	let fixture: ComponentFixture<GridDetailsComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [GridDetailsComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(GridDetailsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
