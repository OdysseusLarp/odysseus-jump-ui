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

	constructor() {
		this.socket = io(environment.apiUrl);
		this.initSubscriptions();
	}

	initSubscriptions() {
		this.eventAdded = new Observable(observer => {
			this.socket.on('eventAdded', (event: api.Event) => {
				observer.next(event);
			});
		});
		this.eventUpdated = new Observable(observer => {
			this.socket.on('eventUpdated', (event: api.Event) => {
				observer.next(event);
			});
		});
		this.eventFinished = new Observable(observer => {
			this.socket.on('eventFinished', (finishedEvent: FinishedEvent) => {
				observer.next(finishedEvent);
			});
		});
		this.logEntryAdded = new Observable(observer => {
			this.socket.on('logEntryAdded', (logEntry: api.LogEntry) => {
				observer.next(logEntry);
			});
		});
	}

	emit(event: string, data: any) {
		this.socket.emit(event, data);
	}
}
