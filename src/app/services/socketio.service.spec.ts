import { TestBed, inject } from '@angular/core/testing';

import { SocketIoService } from './socketio.service';

describe('SocketioService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [SocketIoService],
		});
	});

	it('should be created', inject(
		[SocketIoService],
		(service: SocketIoService) => {
			expect(service).toBeTruthy();
		}
	));
});
