import { Component, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { StateService } from '@app/services/state.service';
import { getFeatureProperties } from '@components/map/map.component';

@Component({
	selector: 'app-object-details',
	templateUrl: './object-details.component.html',
	styleUrls: ['./object-details.component.scss'],
})
export class ObjectDetailsComponent implements OnInit, OnDestroy {
	selectedFeature$: Subscription;
	feature: any;
	formattedProperties: any;

	constructor(private state: StateService) {}

	ngOnInit() {
		this.selectedFeature$ = this.state.selectedFeature$.subscribe(feat => {
			this.feature = feat;
			const props = getFeatureProperties(feat);
			this.formattedProperties = Object.keys(props).map(
				key => `${key}: ${props[key]}`
			);
		});
	}

	ngOnDestroy() {
		this.selectedFeature$.unsubscribe();
	}
}
