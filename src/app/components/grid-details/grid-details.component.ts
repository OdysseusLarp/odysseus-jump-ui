import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { StateService } from '@app/services/state.service';
import { getFeatureProperties } from '@components/map/map.component';

@Component({
	selector: 'app-grid-details',
	templateUrl: './grid-details.component.html',
	styleUrls: ['./grid-details.component.scss'],
})
export class GridDetailsComponent implements OnInit, OnDestroy {
	selectedGrid: any;
	selectedGrid$: Subscription;
	formattedProperties: any;
	name: string;

	constructor(private state: StateService) {}

	ngOnInit() {
		this.selectedGrid$ = this.state.selectedGrid$.subscribe(feat => {
			this.selectedGrid = feat;
			if (!feat) return;
			const props = getFeatureProperties(feat);
			this.name = props.name;
			this.formattedProperties = Object.keys(props).map(
				key => `${key}: ${props[key]}`
			);
		});
	}

	ngOnDestroy() {
		this.selectedGrid$.unsubscribe();
	}
}
