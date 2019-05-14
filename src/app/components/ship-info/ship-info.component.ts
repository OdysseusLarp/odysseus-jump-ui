import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketIoService } from '../../services/socketio.service';
import { Subscription } from 'rxjs';
import { StateService, JumpStatusValue } from '../../services/state.service';
import { MatSnackBar } from '@angular/material';
import { SNACKBAR_DEFAULTS } from '../../config';
import { get } from 'lodash';
import { ListItem } from '../dotted-list/dotted-list.component';

interface Ship extends api.Ship {
	position?: api.Grid;
}

export function getJumpStatus(status: JumpStatusValue) {
	switch (status) {
		case 'ready_to_prep':
			return 'Ready to prep';
		case 'preparation':
			return 'Pre-jump prep';
		case 'ready':
			return 'Ready';
		case 'prep_complete':
			return 'Prep complete';
		case 'jumping':
			return 'Jumping';
		case 'jump_initiated':
			return 'Jump initiated';
		case 'cooldown':
			return 'On cooldown';
		case 'calculating':
			return 'Calculating coordinates';
		case 'broken':
			return 'Broken';
		default:
			return 'Unknown';
	}
}

export function getJumpCoordinates(data) {
	const { sub_quadrant, sector, sub_sector } = get(data, 'coordinates', {});
	// TODO: add planet orbit if available
	return `${sub_quadrant}-${sector}-${sub_sector}`;
}

@Component({
	selector: 'app-ship-info',
	templateUrl: './ship-info.component.html',
	styleUrls: ['./ship-info.component.scss'],
})
export class ShipInfoComponent implements OnInit, OnDestroy {
	eventAdded$: Subscription;
	eventUpdated$: Subscription;
	eventFinished$: Subscription;
	events$: Subscription;
	ship$: Subscription;
	jumpStatus$: Subscription;
	jumpState$: Subscription;
	events: api.Event[] = [];
	odysseus: Ship;
	probeCount: number;
	formattedListItems: ListItem[] = [];
	jumpStatus: JumpStatusValue;

	constructor(
		private socketService: SocketIoService,
		private stateService: StateService,
		private snackBar: MatSnackBar
	) {}

	ngOnInit() {
		this.events$ = this.stateService.timestampedEvents.subscribe(
			events => (this.events = events)
		);
		this.eventAdded$ = this.socketService.eventAdded.subscribe(event => {
			console.log('EVENT ADDED =>', event);
		});
		this.eventUpdated$ = this.socketService.eventUpdated.subscribe(event => {
			console.log('EVENT UPDATED =>', event);
		});
		this.eventFinished$ = this.socketService.eventFinished.subscribe(
			({ event }) => {
				console.log('EVENT FINISHED =>', event);
				if (event.type === 'JUMP') {
					const { sub_quadrant, sector, sub_sector } = get(
						event,
						'metadata',
						{}
					);
					const targetName = `${sub_quadrant}-${sector}-${sub_sector}`;
					this.showToast(`Succesfully jumped to ${targetName}`);
				} else if (event.type === 'SCAN_GRID') {
					this.showToast(`Succesfully scanned grid`);
				} else if (event.type === 'SCAN_OBJECT') {
					this.showToast(`Succesfully scanned object`);
				}
			}
		);
		this.ship$ = this.stateService.ship.subscribe(ship => {
			this.odysseus = ship;
			this.probeCount = get(ship, 'metadata.probe_count', 0);
			this.generateFormattedList();
		});
		this.jumpStatus$ = this.stateService.jumpStatus.subscribe(state => {
			if (!state) {
				this.jumpStatus = undefined;
				return;
			}
			this.jumpStatus = state.status;
			this.generateFormattedList();
		});
		this.jumpState$ = this.stateService.jumpState.subscribe(state => {
			// Render ship info list each time jump state changes
			this.generateFormattedList();
		});
	}

	private showToast(str) {
		this.snackBar.open(str, null, SNACKBAR_DEFAULTS);
	}

	ngOnDestroy() {
		this.events$.unsubscribe();
		this.eventAdded$.unsubscribe();
		this.eventUpdated$.unsubscribe();
		this.eventFinished$.unsubscribe();
		this.ship$.unsubscribe();
	}

	private generateFormattedList() {
		if (!this.odysseus) return;
		const jumpState = this.stateService.jumpState.getValue();
		// TODO: Only show relevant cooldowns for current jump status
		const props = {
			position: this.odysseus.position.name,
			jumpRange: get(this.odysseus, 'metadata.jump_range', 1),
			scanRange: get(this.odysseus, 'metadata.scan_range', 1),
			readyCountdown: get(jumpState, 'readyT') || 'UNKNOWN',
			cooldownCountdown: get(jumpState, 'cooldownT') || 'UNKNOWN',
			jumpTarget: getJumpCoordinates(this.stateService.jumpStatus.getValue()),
		};

		this.formattedListItems = [
			{ key: 'Current position', value: props.position },
			{ key: 'Jump drive status', value: getJumpStatus(this.jumpStatus) },
			{ key: 'Time until safe jump', value: props.readyCountdown },
			{ key: 'Max jump distance (sub-sector)', value: props.jumpRange },
			{ key: 'Max scan distance (sub-sector)', value: props.scanRange },
			{ key: 'Probes left (pcs)', value: this.probeCount },
		];
		if (['broken', 'cooldown', 'ready_to_prep'].includes(this.jumpStatus)) {
			this.formattedListItems.splice(3, 0, {
				key: 'Jump drive cooldown',
				value: props.cooldownCountdown,
			});
		} else if (
			[
				'calculating',
				'preparation',
				'prep_complete',
				'ready',
				'jump_initiated',
				'jumping',
			].includes(this.jumpStatus)
		) {
			this.formattedListItems.splice(2, 0, {
				key: 'Jump drive target',
				value: props.jumpTarget,
			});
		}
	}
}
