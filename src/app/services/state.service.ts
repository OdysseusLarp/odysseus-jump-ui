import { Injectable } from '@angular/core';
import * as EventApi from '@api/Event';
import * as LogApi from '@api/Log';
import { getFleetId } from '@api/Fleet';
import {
	BehaviorSubject,
	Subject,
	interval,
	combineLatest,
	Observable,
} from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SocketIoService } from './socketio.service';
import * as moment from 'moment';

export interface LogEntry extends api.LogEntry {
	time?: string;
}

// Maximum amount of log entries stored in state
const MAX_LOG_COUNT = 150;

@Injectable()
export class StateService {
	events: BehaviorSubject<api.Event[]> = new BehaviorSubject([]);
	timestampedEvents: Observable<api.Event[]>;
	ship: BehaviorSubject<api.Ship> = new BehaviorSubject(null);
	log: BehaviorSubject<LogEntry[]> = new BehaviorSubject([]);
	isGridVisible$: BehaviorSubject<boolean> = new BehaviorSubject(true);
	selectedFeature$: BehaviorSubject<any> = new BehaviorSubject(null);
	selectedGrid$: BehaviorSubject<any> = new BehaviorSubject(null);
	geoEventFinished$: Subject<boolean> = new Subject();
	unselectGrid$: Subject<boolean> = new Subject();
	unselectObject$: Subject<boolean> = new Subject();
	hasActiveGridScanEvent: BehaviorSubject<boolean> = new BehaviorSubject(false);
	hasActiveObjectScanEvent: BehaviorSubject<boolean> = new BehaviorSubject(
		false
	);
	hasActiveJumpEvent: BehaviorSubject<boolean> = new BehaviorSubject(false);

	// Actions kinda
	centerToShip$: Subject<[number, number]> = new Subject();

	constructor(private socketIoService: SocketIoService) {
		// Get initial data from API
		this.fetchShip();
		this.fetchActiveEvents();
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
			this.events.next(this.events.getValue().filter(e => e.id !== event.id));
			this.geoEventFinished$.next(true);
		});

		// Subscribe to new log entries
		socketIoService.logEntryAdded.subscribe(logEntry => {
			const entry = this.parseLogEntry(logEntry);
			this.setLogEntries([entry, ...this.log.getValue()]);
		});

		// Subscribe to deleted log entries
		socketIoService.logEntryDeleted.subscribe(({ id }) => {
			this.setLogEntries(
				this.log.getValue().filter(logEntry => logEntry.id !== id)
			);
		});

		// Parse log entries periodically to update their human readable time
		interval(10000).subscribe(() => {
			const logs = this.log
				.getValue()
				.map(logEntry => this.parseLogEntry(logEntry));
			this.setLogEntries(logs);
		});

		// Current event with added 'occurs_at' field
		const updateInterval = interval(1000).pipe(startWith(0));
		this.timestampedEvents = combineLatest(this.events, updateInterval).pipe(
			map(([events]) => {
				if (!events) return [];
				// Add human readable seconds until scan completes
				return events.map(event => ({
					...event,
					occurs_in_seconds: moment(event.occurs_at).diff(moment(), 'seconds'),
				}));
			})
		);
		socketIoService.shipUpdated.subscribe(ship => this.ship.next(ship));
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
			.sort((a, b) =>
				moment(a.created_at).isSameOrAfter(moment(b.created_at)) ? -1 : 1
			)
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
