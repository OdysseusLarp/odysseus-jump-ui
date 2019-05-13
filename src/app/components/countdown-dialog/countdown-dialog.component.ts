import { Component, OnInit, OnDestroy } from '@angular/core';
import { get } from 'lodash';
import { StateService } from '@app/services/state.service';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-countdown-dialog',
	templateUrl: './countdown-dialog.component.html',
	styleUrls: ['./countdown-dialog.component.scss'],
})
export class CountdownDialogComponent implements OnInit, OnDestroy {
	jumpState$: Subscription;
	countdown: string;

	constructor(private state: StateService) {}

	ngOnInit() {
		this.jumpState$ = this.state.jumpState.subscribe(state => {
			const jumpCountDown = get(state, 'jumpT');
			this.countdown = jumpCountDown;
		});
	}

	ngOnDestroy() {
		this.jumpState$.unsubscribe();
	}
}
