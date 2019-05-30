import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { StateService } from '@app/services/state.service';
import { ListItem } from '../dotted-list/dotted-list.component';

@Component({
	selector: 'app-fleet-details',
	templateUrl: './fleet-details.component.html',
	styleUrls: ['./fleet-details.component.scss'],
})
export class FleetDetailsComponent implements OnInit, OnDestroy {
	selectedFleet$: Subscription;
	fleet: any;
	formattedListItems: ListItem[] = [];

	constructor(private state: StateService) {}

	ngOnInit() {
		this.selectedFleet$ = this.state.selectedFleet$.subscribe(fleet => {
			this.fleet = fleet;
			if (!this.fleet) return;
			this.generateFormattedList();
		});
	}

	ngOnDestroy() {
		this.selectedFleet$.unsubscribe();
	}

	closeBox() {
		this.state.unselectFleet$.next(true);
	}

	private generateFormattedList() {
		if (!this.fleet) return;
		const { count_civilian, count_military } = this.fleet;
		const count_total = count_civilian + count_military;
		this.formattedListItems = [
			{ key: 'Civilian ship count', value: count_civilian },
			{ key: 'Military ship count', value: count_military },
			{ key: 'Total ship count', value: count_total },
		];
	}
}
