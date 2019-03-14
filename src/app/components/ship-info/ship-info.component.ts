import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketIoService } from '../../services/socketio.service';
import { Subscription } from 'rxjs';
import { StateService } from '../../services/state.service';
import { MatSnackBar } from '@angular/material';
import { SNACKBAR_DEFAULTS } from '../../config';
import { get } from 'lodash';

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
	odysseus: api.Ship;
	probeCount: number;

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
}
