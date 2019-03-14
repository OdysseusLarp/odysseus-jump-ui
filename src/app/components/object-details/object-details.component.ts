import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { StateService } from '@app/services/state.service';
import { getFeatureProperties } from '@components/map/map.component';
import { get, set, pick, capitalize } from 'lodash';
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
	isScanning = false;
	scanEvent: api.Event;
	formattedListItems: ListItem[] = [];

	constructor(private state: StateService) {}

	ngOnInit() {
		this.selectedFeature$ = this.state.selectedFeature$.subscribe(feat => {
			this.feature = feat;
			const props = getFeatureProperties(feat);
			this.properties = props;
			this.generateFormattedList();
		});
		this.events$ = this.state.timestampedEvents.subscribe(events => {
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

	getHabitableZoneString() {
		const str = get(this.feature, 'properties.habitable_zone');
		if (str && get(this.feature, 'properties.celestial_body') === 'star') {
			return `Habitable zone in ${str}.`;
		}
		return `${str}.`;
	}

	getAtmosphereString() {
		if (get(this.feature, 'properties.celestial_body') === 'star') return '';
		const str = get(this.feature, 'properties.atmosphere');
		return `Components of atmosphere in order of % amount: ${str}.`;
	}

	private generateFormattedList() {
		if (!this.properties) return;
		// Others:
		// nameKnown
		const props = pick(this.properties, [
			'nameKnown',
			'ringSystem',
			'radius',
			'mass',
			'celestialBody',
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
		const ellarionMass = 5.9722e24;
		const mass = parseFloat('' + props.mass / ellarionMass).toFixed(2);
		const temperature = Math.round(props.temperature - 272.15);
		const list = [
			{ key: 'Known name', value: props.nameKnown },
			{ key: 'Celestial body', value: capitalize(props.celestialBody) },
			{ key: 'Category', value: props.category },
			{ key: 'Ring system', value: props.ringSystem ? 'Yes' : 'No' },
			{ key: 'Radius (km)', value: props.radius },
			{ key: 'Mass (1=Ellarion)', value: mass },
			{ key: 'Temperature (°C)', value: temperature },
			{ key: 'Atmospheric pressure (bar)', value: props.atmPressure },
			{ key: 'Gravity (1=Ellarion)', value: props.surfaceGravity },
			{ key: 'Orbiting distance (AU)', value: props.distance },
			{ key: 'Orbital period (years)', value: props.orbitalPeriod },
			{ key: 'Rotation (days)', value: props.rotation },
			{ key: 'Orbiter count', value: props.orbiterCount },
		].filter(item => {
			if (item.value === null || item.value === undefined) return false;
			return true;
		});
		this.formattedListItems = list;
	}
}
