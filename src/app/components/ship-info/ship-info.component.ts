import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketIoService } from '../../services/socketio.service';
import { Subscription } from 'rxjs';
import { StateService } from '../../services/state.service';
import { MatSnackBar } from '@angular/material';
import { SNACKBAR_DEFAULTS } from '../../config';
import { get } from 'lodash';
import { ListItem } from '../dotted-list/dotted-list.component';

interface Ship extends api.Ship {
	position?: api.Grid;
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
	events: api.Event[] = [];
	odysseus: Ship;
	probeCount: number;
	formattedListItems: ListItem[] = [];

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
			console.log('jes uus shippi', ship);
			this.odysseus = ship;
			this.probeCount = get(ship, 'metadata.probe_count', 0);
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
		const props = {
			position: this.odysseus.position.name,
			jumpRange: get(this.odysseus, 'metadata.jump_range', 1),
			scanRange: get(this.odysseus, 'metadata.scan_range', 1),
		};
		console.log('jes uudet brobsit', props);
		this.formattedListItems = [
			{ key: 'Current position', value: props.position },
			{ key: 'Jump distance (sub-sector)', value: props.jumpRange },
			{ key: 'Scan distance (sub-sector)', value: props.scanRange },
			{ key: 'Probes left (pcs)', value: this.probeCount },
		];
	}
}
