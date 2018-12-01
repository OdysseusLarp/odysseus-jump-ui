import { Component, OnInit } from '@angular/core';
import { getFleetId } from './api/Fleet';
import { Router } from '@angular/router';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
	title = 'app';
	ship: any;
	showGrid = false;

	constructor(private router: Router) {}

	ngOnInit() {
		getFleetId('odysseus').then(({ data }) => (this.ship = data));
	}

	onShipInfoClick() {
		this.router.navigate(['/']);
	}
	onLongRangeScanClick() {}
	onShortRangeScanClick() {}
	onJumpClick() {
		this.router.navigate(['/jump']);
	}
	onGridToggle() {
		this.showGrid = !this.showGrid;
		console.log(`Grid toggled ${this.showGrid ? 'on' : 'off'}`);
	}
	onDecodeSignalClick() {
		console.log('');
	}
}
