import {
	Component,
	OnInit,
	OnDestroy,
	OnChanges,
	SimpleChanges,
} from '@angular/core';
import { SocketIoService } from '../../services/socketio.service';
import { Subscription, interval, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { StateService } from '../../services/state.service';
import * as moment from 'moment';

@Component({
	selector: 'app-ship-info',
	templateUrl: './ship-info.component.html',
	styleUrls: ['./ship-info.component.scss'],
})
export class ShipInfoComponent implements OnInit, OnDestroy, OnChanges {
	eventAdded$: Subscription;
	eventUpdated$: Subscription;
	eventFinished$: Subscription;
	events$: Subscription;
	ship$: Subscription;
	events: api.Event[] = [];
	odysseus: api.Ship;

	constructor(
		private socketService: SocketIoService,
		private stateService: StateService
	) {}

	ngOnChanges(changes: SimpleChanges) {
		console.log('ayyyy', changes);
	}

	ngOnInit() {
		this.events$ = combineLatest(this.stateService.events, interval(1000))
			.pipe(
				map(([events]) => {
					// Add human readable seconds until jump
					return events.map(event => ({
						...event,
						occurs_in_seconds: moment(event.occurs_at).diff(
							moment(),
							'seconds'
						),
					}));
				})
			)
			.subscribe(events => {
				this.events = events;
			});
		this.eventAdded$ = this.socketService.eventAdded.subscribe(event => {
			console.log('EVENT ADDED =>', event);
		});
		this.eventUpdated$ = this.socketService.eventUpdated.subscribe(event => {
			console.log('EVENT UPDATED =>', event);
		});
		this.eventFinished$ = this.socketService.eventFinished.subscribe(
			({ event }) => {
				console.log('EVENT FINISHED =>', event);
				if (event.type === 'JUMP') window.alert('Ship jumped!');
			}
		);
		this.ship$ = this.stateService.ship.subscribe(
			ship => (this.odysseus = ship)
		);
	}

	ngOnDestroy() {
		this.events$.unsubscribe();
		this.eventAdded$.unsubscribe();
		this.eventUpdated$.unsubscribe();
		this.eventFinished$.unsubscribe();
		this.ship$.unsubscribe();
	}
}
