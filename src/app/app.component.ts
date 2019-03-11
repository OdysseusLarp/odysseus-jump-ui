import { Component, OnInit } from '@angular/core';
import { getFleetId } from './api/Fleet';
import { Router } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { JumpDialogComponent } from '@components/jump-dialog/jump-dialog.component';
import { SNACKBAR_DEFAULTS } from './config';
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

	constructor(
		private router: Router,
		public dialog: MatDialog,
		private state: StateService,
		private snackBar: MatSnackBar
	) {}

	ngOnInit() {
		getFleetId('odysseus').then(({ data }) => (this.ship = data));
	}

	onShipInfoClick() {
		this.router.navigate(['/']);
	}

	onLongRangeScanClick() {}

	onShortRangeScanClick() {}

	onJumpClick() {
		this.dialog.open(JumpDialogComponent, {
			hasBackdrop: true,
			width: '600px',
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
