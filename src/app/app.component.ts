import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { JumpDialogComponent } from '@components/jump-dialog/jump-dialog.component';
import { StateService } from '@app/services/state.service';
import { get } from 'lodash';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
	isGridVisible$;
	constructor(public dialog: MatDialog, private state: StateService) {}

	ngOnInit() {
		this.isGridVisible$ = this.state.isGridVisible$;
	}

	onJumpClick() {
		this.dialog.open(JumpDialogComponent, {
			hasBackdrop: true,
			width: '750px',
			panelClass: 'boxed',
		});
	}

	onCenterToShipClick() {
		const coords: [number, number] = get(
			this.state.ship.getValue(),
			'geom.coordinates'
		);
		if (!coords) return;
		this.state.centerToShip$.next(coords);
	}

	onGridToggle() {
		const value = !this.state.isGridVisible$.getValue();
		this.state.isGridVisible$.next(value);
	}

	onDecodeSignalClick() {}
}
