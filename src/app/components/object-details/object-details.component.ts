import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, interval, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { StateService } from '@app/services/state.service';
import { getFeatureProperties } from '@components/map/map.component';
import { get, set } from 'lodash';
import * as moment from 'moment';
import { putEvent } from '@api/Event';

@Component({
	selector: 'app-object-details',
	templateUrl: './object-details.component.html',
	styleUrls: ['./object-details.component.scss'],
})
export class ObjectDetailsComponent implements OnInit, OnDestroy {
	selectedFeature$: Subscription;
	events$: Subscription;
	feature: any;
	formattedProperties: any;
	isScanning = false;
	scanEvent: api.Event;

	constructor(private state: StateService) {}

	ngOnInit() {
		this.selectedFeature$ = this.state.selectedFeature$.subscribe(feat => {
			this.feature = feat;
			const props = getFeatureProperties(feat);
			this.formattedProperties = Object.keys(props).map(
				key => `${key}: ${props[key]}`
			);
		});
		this.events$ = combineLatest(this.state.events, interval(1000))
			.pipe(
				map(([events]) => {
					// Add human readable seconds until scan completes
					return events.map(event => ({
						...event,
						occurs_in_seconds: moment(event.occurs_at).diff(
							moment(),
							'seconds'
						),
					}));
				})
			)
			.subscribe(events => {
				const featureId = get(this.feature, 'properties.id');
				if (!featureId) return;
				const scanEvent = events
					.filter(event => event.type === 'SCAN_OBJECT')
					.find(event => get(event, 'metadata.target') === featureId);
				if (scanEvent) this.setScanEvent(scanEvent);
				else if (!scanEvent && this.scanEvent) this.finishScanEvent();
			});
	}

	private setScanEvent(event) {
		this.scanEvent = event;
		this.isScanning = true;
	}

	private finishScanEvent() {
		this.scanEvent = undefined;
		this.isScanning = false;
		// TODO: Refetch feature instead of doing this dirty stuff
		if (this.feature) set(this.feature, 'properties.is_scanned', true);
	}

	ngOnDestroy() {
		this.selectedFeature$.unsubscribe();
		this.events$.unsubscribe();
	}

	onSendProbeClick() {
		console.log('Sending probe to', this.feature);
		const id = get(this.feature, 'properties.id');
		const scanTime = moment()
			.add(30, 'seconds') // 30 second scan time hardcoded for testing
			.format();
		putEvent({
			type: 'SCAN_OBJECT',
			ship_id: 'odysseus',
			is_active: true,
			occurs_at: scanTime,
			metadata: { target: id },
			status: 'Meh', // TODO: Drop status field alltogether?
		});
	}

	closeBox() {
		this.state.unselectObject$.next(true);
	}
}
