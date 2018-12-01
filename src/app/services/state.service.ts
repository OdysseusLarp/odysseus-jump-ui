import { Injectable } from '@angular/core';
import * as EventApi from '@api/Event';
import { getFleetId } from '@api/Fleet';
import { BehaviorSubject, Subject } from 'rxjs';
import { SocketIoService } from './socketio.service';

@Injectable()
export class StateService {
	events: BehaviorSubject<api.Event[]> = new BehaviorSubject([]);
	ship: BehaviorSubject<api.Ship> = new BehaviorSubject(null);

	constructor(private socketIoService: SocketIoService) {
		// Get all active events from API
		this.fetchActiveEvents();

		// React to event events sent by Socket IO
		socketIoService.eventAdded.subscribe(event => {
			this.events.next([...this.events.getValue(), event]);
		});
		socketIoService.eventUpdated.subscribe(event => {
			this.events.next([
				...this.events.getValue().map(e => {
					if (e.id === event.id) return event;
					return e;
				}),
			]);
			this.events.next([...this.events.getValue(), event]);
		});
		socketIoService.eventFinished.subscribe(({ event }) => {
			if (event.type === 'JUMP') this.fetchShip();
			this.events.next(this.events.getValue().filter(e => e.id !== event.id));
		});
		this.fetchShip();
	}

	async fetchActiveEvents() {
		const events = await EventApi.getEvent();
		this.events.next(events.data);
	}

	async fetchShip() {
		const ship = await getFleetId('odysseus');
		this.ship.next(ship.data);
	}
}
