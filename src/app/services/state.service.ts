import { Injectable } from '@angular/core';
import * as EventApi from '@api/Event';
import * as LogApi from '@api/Log';
import * as DataApi from '@api/Data';
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
import { get } from 'lodash';
import moment from 'moment';
import queryString from 'query-string';

export interface LogEntry extends api.LogEntry {
	time?: string;
}

export type JumpStatusValue =
	| 'ready_to_prep'
	| 'ready'
	| 'preparation'
	| 'prep_complete'
	| 'jumping'
	| 'jump_initiated'
	| 'cooldown'
	| 'calculating'
	| 'broken';

export interface JumpStatus {
	id?: 'jump';
	jump_at: number;
	last_jump: number;
	prep_at: number;
	safe_at: number;
	safe_jump: boolean;
	status: JumpStatusValue;
	type?: 'ship';
	coordinates?: string;
	version: number;
	created_at?: string;
	updated_at?: string;
	presets?: any;
}

export interface JumpState {
	id?: 'jumpstate';
	cooldown_time?: string;
	jump_time?: string;
	jump_drive_temp_exact?: number;
	jump_drive_temp?: number;
	breaking_jump?: boolean;
	coherence?: number;
	readyRemaining?: number;
	readyT?: string;
	cooldownRemaining?: number;
	cooldownT?: string;
	jumpT?: string;
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
	selectedFleet$: BehaviorSubject<any> = new BehaviorSubject(null);
	geoEventFinished$: Subject<boolean> = new Subject();
	unselectGrid$: Subject<boolean> = new Subject();
	unselectObject$: Subject<boolean> = new Subject();
	unselectFleet$: Subject<boolean> = new Subject();
	hasActiveGridScanEvent: BehaviorSubject<boolean> = new BehaviorSubject(false);
	hasActiveObjectScanEvent: BehaviorSubject<boolean> = new BehaviorSubject(
		false
	);
	hasActiveJumpEvent: BehaviorSubject<boolean> = new BehaviorSubject(false);
	jumpStatus: BehaviorSubject<JumpStatus> = new BehaviorSubject(null);
	jumpState: BehaviorSubject<JumpState> = new BehaviorSubject(null);
	isJumpUiEnabled: BehaviorSubject<boolean> = new BehaviorSubject(true);

	// Debug mode
	isDebugEnabled =
		get(queryString.parse(document.location.search), 'debug') === 'true';

	// Actions kinda
	centerToShip$: Subject<[number, number]> = new Subject();
	zoomMap$: Subject<number> = new Subject();

	constructor(private socketIoService: SocketIoService) {
		// Get initial data from API
		this.fetchShipMetadataState();
		this.fetchShip();
		this.fetchActiveEvents();
		this.fetchShipLog();
		this.fetchJumpState();

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

		// Jump status changes (actual info, coordinates, etc)
		socketIoService.jumpStatusUpdated.subscribe(data => {
			this.jumpStatus.next(data);
		});

		// Jump state changes (human readable cooldowns etc)
		socketIoService.jumpStateUpdated.subscribe(data => {
			this.jumpState.next(data);
		});

		// Jump UI Enabled / Disabled changes
		socketIoService.jumpUiEnabled.subscribe(isEnabled => {
			this.isJumpUiEnabled.next(isEnabled);
			// Emit geoEventFinished so that map gets refreshed
			this.geoEventFinished$.next(true);
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
		this.timestampedEvents = combineLatest(
			this.events,
			updateInterval,
			// Also emit when grid / starmap object selection changes to update instantly
			this.selectedGrid$,
			this.selectedFeature$
		).pipe(
			map(([events]) => {
				if (!events) return [];
				// Add human readable seconds until scan completes
				return events.map(event => ({
					...event,
					occurs_in_seconds: moment(event.occurs_at).diff(moment(), 'seconds'),
				}));
			})
		);
		socketIoService.shipUpdated.subscribe(ship => {
			// Update the map in case ship has moved
			this.geoEventFinished$.next(true);
			this.ship.next(ship);
		});
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

	async fetchJumpState() {
		const { data } = await DataApi.getDataTypeId('jump', 'ship');
		this.jumpStatus.next(data);
	}

	async fetchShipMetadataState() {
		const { data } = await DataApi.getDataTypeId('metadata', 'ship');
		this.isJumpUiEnabled.next(get(data, 'jump_ui_enabled', true));
	}

	setLogEntries(logEntries) {
		// Only take the last X log entries
		const logs = logEntries
			.sort((a, b) =>
				moment(a.created_at).isAfter(moment(b.created_at)) ? -1 : 1
			)
			.filter((_, i) => i < MAX_LOG_COUNT);
		this.log.next(logs);
	}

	parseLogEntry(logEntry) {
		const entry = {
			...logEntry,
			time: this.addReadableTime(logEntry),
		};
		return entry;
	}

	addReadableTime(obj) {
		return moment.duration(moment(obj.created_at).diff(moment())).humanize();
	}

	getScanDuration(scanType: 'object' | 'grid') {
		const { min_seconds, max_seconds } = get(
			this.ship.getValue(),
			['metadata', `${scanType}_scan_duration`],
			{}
		);
		// Default to 30sec scans
		if (!min_seconds || !max_seconds) return 30;
		return Math.floor(
			Math.random() * (max_seconds - min_seconds) + min_seconds
		);
	}
}
