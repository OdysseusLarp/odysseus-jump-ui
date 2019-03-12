import { Component, OnInit } from '@angular/core';
import { getFleetId } from './api/Fleet';
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
	title = 'app';
	ship: any;

	constructor(public dialog: MatDialog, private state: StateService) {}

	ngOnInit() {
		getFleetId('odysseus').then(({ data }) => (this.ship = data));
	}

	onLongRangeScanClick() {}

	onShortRangeScanClick() {}

	onJumpClick() {
		this.dialog.open(JumpDialogComponent, {
			hasBackdrop: true,
			width: '750px',
			panelClass: 'boxed',
		});
	}

	onCenterToShipClick() {
		const coords = get(this.ship, 'geom.coordinates');
		if (!coords) return;
		this.state.centerToShip$.next(coords);
	}

	onGridToggle() {
		const value = !this.state.isGridVisible$.getValue();
		this.state.isGridVisible$.next(value);
	}

	onDecodeSignalClick() {}
}
