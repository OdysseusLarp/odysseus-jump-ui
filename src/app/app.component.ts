import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { JumpDialogComponent } from '@components/jump-dialog/jump-dialog.component';
import { MessageDialogComponent } from '@components/message-dialog/message-dialog.component';
import { StateService, JumpStatus } from '@app/services/state.service';
import { get } from 'lodash';

export const DIALOG_SETTINGS = {
	hasBackdrop: true,
	width: '750px',
	panelClass: 'boxed',
};

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
		const jumpStatus: JumpStatus = get(
			this.state.jumpState.getValue(),
			'status'
		);
		// Initialize jump preparation
		if (['ready_to_prep', 'ready', 'prep_complete'].includes(jumpStatus)) {
			return this.dialog.open(JumpDialogComponent, DIALOG_SETTINGS);
		}
		const title = 'Jump drive';
		let message;
		switch (jumpStatus) {
			case 'cooldown': {
				message =
					'Jump drive is on cooldown. Jumping is not possible in this state.';
				break;
			}
			case 'calculating': {
				message = 'Jump coordinates are currently being calculated.';
				break;
			}
			case 'preparation': {
				message = 'Ship is already preparing for jump.';
				break;
			}
			// case 'prep_complete': {
			// 	message = 'Jump preparation has been completed, ship will be ready to jump soon.';
			// 	break;
			// }
			// case 'ready': {
			// 	message = 'This should open a modal with a big jump button.';
			// 	break;
			// }
			case 'jump_initiated': {
				message = 'Jump has already been initiated.';
				break;
			}
			case 'jumping': {
				message = 'Jump is currently in progress.';
				break;
			}
			default:
				message = 'Jump drive is in unknown state';
		}
		this.dialog.open(MessageDialogComponent, {
			...DIALOG_SETTINGS,
			data: {
				message,
				title,
			},
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
