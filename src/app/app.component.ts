import { Component, OnInit } from '@angular/core';
import { getFleetId } from './api/Fleet';
import { Router } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { JumpDialogComponent } from '@components/jump-dialog/jump-dialog.component';
import { SNACKBAR_DEFAULTS } from './config';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
	title = 'app';
	ship: any;
	showGrid = false;

	constructor(
		private router: Router,
		public dialog: MatDialog,
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

	onGridToggle() {
		this.showGrid = !this.showGrid;
		console.log(`Grid toggled ${this.showGrid ? 'on' : 'off'}`);
	}

	onDecodeSignalClick() {}
}
