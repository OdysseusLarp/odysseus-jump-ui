import { Injectable } from '@angular/core';
import * as io from 'socket.io-client/dist/socket.io';
import { Observable } from 'rxjs/Observable';

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

	constructor() {
		// TODO: Load URL from env
		const url = 'http://localhost:8888/';
		this.socket = io(url);
		this.initSubscriptions();
	}

	initSubscriptions() {
		this.eventAdded = new Observable(observer => {
			this.socket.on('eventAdded', (event: api.Event) => {
				observer.next(event);
			});
			// return () => {
			// 	this.socket.disconnect();
			// };
		});
		this.eventUpdated = new Observable(observer => {
			this.socket.on('eventUpdated', (event: api.Event) => {
				observer.next(event);
			});
			// return () => {
			// 	this.socket.disconnect();
			// };
		});
		this.eventFinished = new Observable(observer => {
			this.socket.on('eventFinished', (finishedEvent: FinishedEvent) => {
				observer.next(finishedEvent);
			});
			// return () => {
			// 	this.socket.disconnect();
			// };
		});
	}

	emit(event: string, data: any) {
		this.socket.emit(event, data);
	}
}
