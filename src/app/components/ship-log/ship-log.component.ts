import { Component, OnInit } from '@angular/core';
import { StateService } from '@app/services/state.service';

@Component({
	selector: 'app-ship-log',
	templateUrl: './ship-log.component.html',
	styleUrls: ['./ship-log.component.scss'],
})
export class ShipLogComponent implements OnInit {
	minimized = false;

	constructor(private state: StateService) {}

	ngOnInit() {}

	toggleMinimized() {
		this.minimized = !this.minimized;
	}
}
