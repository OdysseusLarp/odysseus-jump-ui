import { Injectable } from '@angular/core';
import * as io from 'socket.io-client/dist/socket.io';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

interface FinishedEvent {
	success: boolean;
	event: api.Event;
}

@Injectable()
export class SocketIoService {
	socket: any;
	public eventAdded: Observable<api.Event>;
	public eventUpdated: Observable<api.Event>;
	public eventFinished: Observable<FinishedEvent>;
	public logEntryAdded: Observable<api.LogEntry>;
	public logEntryDeleted: Observable<{ id: number }>;
	public shipUpdated: Observable<api.Ship>;
	public refreshMap: Observable<any>;

	constructor() {
		this.socket = io(environment.apiUrl);
		this.eventAdded = this.createObservable<api.Event>('eventAdded');
		this.eventUpdated = this.createObservable<api.Event>('eventUpdated');
		this.eventFinished = this.createObservable<FinishedEvent>('eventFinished');
		this.logEntryAdded = this.createObservable<api.LogEntry>('logEntryAdded');
		this.shipUpdated = this.createObservable<api.Ship>('shipUpdated');
		this.refreshMap = this.createObservable<any>('refreshMap');
		this.logEntryDeleted = this.createObservable<{ id: number }>(
			'logEntryDeleted'
		);
	}

	private createObservable<T>(event: string): Observable<T> {
		return new Observable(o => this.socket.on(event, (e: T) => o.next(e)));
	}

	emit(event: string, data: any) {
		this.socket.emit(event, data);
	}
}
