import { Injectable } from '@angular/core';
import * as io from 'socket.io-client/dist/socket.io';
import { get } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { JumpStatus, JumpState } from './state.service';

interface FinishedEvent {
	success: boolean;
	event: api.Event;
}

interface ShipStateMetadata {
	ee_sync_enabled: true;
	jump_ui_enabled: true;
}

interface Socket {
	on: (eventName: string, attributes: any) => void;
	emit: (eventName: string, data: any) => void;
}

@Injectable()
export class SocketIoService {
	socket: Socket;
	jumpStatusSocket: Socket;
	jumpStateSocket: Socket;
	metadataStateSocket: Socket;
	public eventAdded: Observable<api.Event>;
	public eventUpdated: Observable<api.Event>;
	public eventFinished: Observable<FinishedEvent>;
	public logEntryAdded: Observable<api.LogEntry>;
	public logEntryDeleted: Observable<{ id: number }>;
	public shipUpdated: Observable<api.Ship>;
	public refreshMap: Observable<any>;
	public jumpStatusUpdated: Observable<JumpStatus>;
	public jumpStateUpdated: Observable<JumpState>;
	public shipMetadataUpdated: Observable<ShipStateMetadata>;
	public jumpUiEnabled: Observable<boolean>;

	constructor() {
		this.socket = io(environment.apiUrl);
		this.jumpStatusSocket = io.connect(
			`${environment.apiUrl}/data`,
			{ query: { data: '/data/ship/jump' } }
		);
		// Jump State Socket
		this.jumpStateSocket = io.connect(
			`${environment.apiUrl}/data`,
			{ query: { data: '/data/ship/jumpstate' } }
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
		this.jumpStateUpdated = this.createDataUpdateObservable(
			this.jumpStateSocket
		);
		this.jumpStatusUpdated = this.createDataUpdateObservable(
			this.jumpStatusSocket
		);
		this.shipMetadataUpdated = this.createDataUpdateObservable(
			this.metadataStateSocket
		);
		this.jumpUiEnabled = this.shipMetadataUpdated.pipe(
			map(data => !!get(data, 'jump_ui_enabled', true))
		);
	}

	private createObservable<T>(event: string): Observable<T> {
		return new Observable(o =>
			this.socket.on(event, (e: T) => {
				o.next(e);
			})
		);
	}

	private createDataUpdateObservable<T>(socket: Socket): Observable<T> {
		return new Observable(o =>
			socket.on('dataUpdate', (_type: string, _id: string, data: T) =>
				o.next(data)
			)
		);
	}

	emit(event: string, data: any) {
		this.socket.emit(event, data);
	}
}
