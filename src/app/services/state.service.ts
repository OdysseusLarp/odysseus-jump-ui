import { Injectable } from '@angular/core';
import * as EventApi from '@api/Event';
import * as LogApi from '@api/Log';
import { getFleetId } from '@api/Fleet';
import { BehaviorSubject, Subject, interval } from 'rxjs';
import { SocketIoService } from './socketio.service';
import * as moment from 'moment';

export interface LogEntry extends api.LogEntry {
	time?: string;
}

const MAX_LOG_COUNT = 8;

@Injectable()
export class StateService {
	events: BehaviorSubject<api.Event[]> = new BehaviorSubject([]);
	ship: BehaviorSubject<api.Ship> = new BehaviorSubject(null);
	log: BehaviorSubject<LogEntry[]> = new BehaviorSubject([]);
	isGridVisible$: BehaviorSubject<boolean> = new BehaviorSubject(true);
	selectedFeature$: BehaviorSubject<any> = new BehaviorSubject(null);
	selectedGrid$: BehaviorSubject<any> = new BehaviorSubject(null);
	geoEventFinished$: Subject<boolean> = new Subject();
	unselectGrid$: Subject<boolean> = new Subject();
	unselectObject$: Subject<boolean> = new Subject();

	// Actions kinda
	centerToShip$: Subject<string> = new Subject();

	constructor(private socketIoService: SocketIoService) {
		// Get all active events from API
		this.fetchActiveEvents();

		// Get ship log entries
		this.fetchShipLog();

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
			this.geoEventFinished$.next(true);
		});
		socketIoService.logEntryAdded.subscribe(logEntry => {
			const entry = this.parseLogEntry(logEntry);
			this.setLogEntries([entry, ...this.log.getValue()]);
		});
		// Parse log entries periodically to update their human readable time
		interval(10000).subscribe(() => {
			const logs = this.log
				.getValue()
				.map(logEntry => this.parseLogEntry(logEntry));
			this.setLogEntries(logs);
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

	async fetchShipLog() {
		const { data } = await LogApi.getLog();
		const logs = data.map(logEntry => this.parseLogEntry(logEntry));
		this.setLogEntries(logs);
	}

	setLogEntries(logEntries) {
		// Only take the last X log entries
		const logs = logEntries
			.sort((a, b) => moment(b.created_at).isSameOrAfter(moment(a.created_at)))
			.filter((_, i) => i < MAX_LOG_COUNT);
		this.log.next(logs);
	}

	parseLogEntry(logEntry) {
		const entry = {
			...logEntry,
			date: new Date(logEntry.created_at),
			time: this.addReadableTime(logEntry),
		};
		return entry;
	}

	addReadableTime(obj) {
		return moment.duration(moment(obj.created_at).diff(moment())).humanize();
	}
}
