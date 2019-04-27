import { Injectable } from '@angular/core';
import * as io from 'socket.io-client/dist/socket.io';
import { get } from 'lodash';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { JumpState } from './state.service';

interface FinishedEvent {
	success: boolean;
	event: api.Event;
}

interface ShipStateMetadata {
	ee_sync_enabled: true;
	jump_ui_enabled: true;
}

@Injectable()
export class SocketIoService {
	socket: any;
	jumpStateSocket: any;
	metadataStateSocket: any;
	public eventAdded: Observable<api.Event>;
	public eventUpdated: Observable<api.Event>;
	public eventFinished: Observable<FinishedEvent>;
	public logEntryAdded: Observable<api.LogEntry>;
	public logEntryDeleted: Observable<{ id: number }>;
	public shipUpdated: Observable<api.Ship>;
	public refreshMap: Observable<any>;
	public jumpStateUpdated: Observable<JumpState>;
	public jumpUiEnabled: Observable<boolean>;

	constructor() {
		this.socket = io(environment.apiUrl);
		this.jumpStateSocket = io.connect(
			`${environment.apiUrl}/data`,
			{ query: { data: '/data/ship/jump' } }
		);
		this.metadataStateSocket = io.connect(
			`${environment.apiUrl}/data`,
			{ query: { data: '/data/ship/metadata' } }
		);
		this.eventAdded = this.createObservable<api.Event>('eventAdded');
		this.eventUpdated = this.createObservable<api.Event>('eventUpdated');
		this.eventFinished = this.createObservable<FinishedEvent>('eventFinished');
		this.logEntryAdded = this.createObservable<api.LogEntry>('logEntryAdded');
		this.shipUpdated = this.createObservable<api.Ship>('shipUpdated');
		this.refreshMap = this.createObservable<any>('refreshMap');
		this.logEntryDeleted = this.createObservable<{ id: number }>(
			'logEntryDeleted'
		);
		this.jumpStateUpdated = new Observable(o =>
			this.jumpStateSocket.on(
				'dataUpdate',
				(_type: string, _id: string, data: JumpState) => {
					o.next(data);
				}
			)
		);
		this.jumpUiEnabled = new Observable(o => {
			this.metadataStateSocket.on(
				'dataUpdate',
				(_type: string, _id: string, data: ShipStateMetadata) => {
					o.next(!!get(data, 'jump_ui_enabled', true));
				}
			);
		});
	}

	private createObservable<T>(event: string): Observable<T> {
		return new Observable(o => this.socket.on(event, (e: T) => o.next(e)));
	}

	emit(event: string, data: any) {
		this.socket.emit(event, data);
	}
}
