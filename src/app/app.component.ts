import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { JumpDialogComponent } from '@components/jump-dialog/jump-dialog.component';
import { MessageDialogComponent } from '@components/message-dialog/message-dialog.component';
import { CountdownDialogComponent } from '@components/countdown-dialog/countdown-dialog.component';
import { StateService, JumpStatusValue } from '@app/services/state.service';
import { get } from 'lodash';
import { Subscription, combineLatest } from 'rxjs';

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
	isJumpUiEnabled$;
	jumpState$: Subscription;
	jumpDialogRef: MatDialogRef<JumpDialogComponent>;
	countdownDialogRef: MatDialogRef<CountdownDialogComponent>;

	constructor(public dialog: MatDialog, private state: StateService) {}

	ngOnInit() {
		this.isGridVisible$ = this.state.isGridVisible$;
		this.isJumpUiEnabled$ = this.state.isJumpUiEnabled;

		// Show big countdown dialog during jump_initiated
		this.jumpState$ = combineLatest(
			this.state.jumpState,
			this.state.isJumpUiEnabled
		).subscribe(([state, isEnabled]) => {
			if (!isEnabled && this.countdownDialogRef) this.closeCountdownDialog();
			else if (!isEnabled) return;
			const status = get(state, 'status');
			if (!this.countdownDialogRef && status === 'jump_initiated') {
				this.openCountdownDialog();
			} else if (this.countdownDialogRef && status !== 'jump_initiated') {
				this.closeCountdownDialog();
			}
		});
	}

	hasActiveDialog() {
		return !!(this.countdownDialogRef || this.jumpDialogRef);
	}

	onJumpClick() {
		if (this.jumpDialogRef) return;
		const jumpStatus: JumpStatusValue = get(
			this.state.jumpStatus.getValue(),
			'status'
		);
		// Initialize jump preparation
		if (
			['ready_to_prep', 'calculating', 'ready', 'prep_complete'].includes(
				jumpStatus
			)
		) {
			this.jumpDialogRef = this.dialog.open(
				JumpDialogComponent,
				DIALOG_SETTINGS
			);
			this.jumpDialogRef
				.afterClosed()
				.subscribe(() => (this.jumpDialogRef = null));
			return;
		}
		const title = 'Jump drive';
		let message;
		switch (jumpStatus) {
			case 'cooldown': {
				message =
					'Jump drive is on cooldown. Jumping is not possible in this state.';
				break;
			}
			case 'preparation': {
				message = 'Jump drive preparation configuration sent to engineering';
				break;
			}
			case 'jump_initiated': {
				message = 'Jump has already been initiated.';
				break;
			}
			case 'jumping': {
				message = 'Jump is currently in progress.';
				break;
			}
			case 'broken': {
				message =
					'Jump drive needs to be repaired before a jump can be initiated.';
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

	onZoomMap(value: number) {
		this.state.zoomMap$.next(value);
	}

	getIsEnabled() {
		return this.isJumpUiEnabled$.getValue();
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

	private openCountdownDialog() {
		this.countdownDialogRef = this.dialog.open(CountdownDialogComponent, {
			...DIALOG_SETTINGS,
			closeOnNavigation: false,
			disableClose: true,
		});
		this.countdownDialogRef
			.afterClosed()
			.subscribe(() => (this.countdownDialogRef = null));
	}

	private closeCountdownDialog() {
		if (this.countdownDialogRef) this.countdownDialogRef.close();
	}
}
