import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, interval, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { StateService } from '@app/services/state.service';
import { getFeatureProperties } from '@components/map/map.component';
import { get, set, pick } from 'lodash';
import * as moment from 'moment';
import { putEvent } from '@api/Event';
import { ListItem } from '../dotted-list/dotted-list.component';

@Component({
	selector: 'app-object-details',
	templateUrl: './object-details.component.html',
	styleUrls: ['./object-details.component.scss'],
})
export class ObjectDetailsComponent implements OnInit, OnDestroy {
	selectedFeature$: Subscription;
	events$: Subscription;
	feature: any;
	properties: any;
	formattedProperties: any;
	isScanning = false;
	scanEvent: api.Event;
	formattedListItems: ListItem[] = [];

	constructor(private state: StateService) {}

	ngOnInit() {
		const updateInterval = interval(1000).pipe(startWith(0));
		this.selectedFeature$ = this.state.selectedFeature$.subscribe(feat => {
			this.feature = feat;
			const props = getFeatureProperties(feat);
			this.properties = props;
			this.formattedProperties = Object.keys(props).map(
				key => `${key}: ${props[key]}`
			);
			this.generateFormattedList();
		});
		this.events$ = combineLatest(this.state.events, updateInterval)
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

	private generateFormattedList() {
		if (!this.properties) return;
		// Others:
		// nameGenerated
		// habitableZone
		// nameKnown
		const props = pick(this.properties, [
			'ringSystem',
			'radius',
			'mass',
			'celestialBody',
			'atmosphere',
			'satelliteOf',
			'category',
			'temperature',
			'orbitalPeriod',
			'rotation',
			'orbiterCount',
			'atmPressure',
			'distance',
			'surfaceGravity',
		]);
		const list = [
			{ key: 'Ring system', value: props.ringSystem ? 'Yes' : 'No' },
			{ key: 'Radius', value: props.radius },
			{ key: 'Mass', value: props.mass },
			{ key: 'Celestial body', value: props.celestialBody },
			{ key: 'Atmosphere', value: props.atmosphere },
			{ key: 'Category', value: props.category },
			{ key: 'Temperature', value: `${props.temperature}K` },
			{ key: 'Orbital period', value: `${props.temperature} days` },
			{ key: 'Rotation', value: `${props.rotation}°` },
			{ key: 'Orbiters', value: props.orbiterCount },
			{ key: 'Atmospheric pressure', value: props.atmPressure },
			{ key: 'Distance from star', value: props.distance },
			{ key: 'Surface gravity', value: props.surfaceGravity },
		].filter(item => {
			if (item.value === null || item.value === undefined) return false;
			return true;
		});
		this.formattedListItems = list;
	}
}
