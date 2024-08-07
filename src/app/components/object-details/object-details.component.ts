import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StateService, JumpStatusValue } from '@app/services/state.service';
import { getFeatureProperties } from '@components/map/map.component';
import { get, set, pick, capitalize } from 'lodash';
import moment from 'moment';
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
	jumpStatus$: Observable<JumpStatusValue>;
	hasScanEvents = false;

	constructor(private state: StateService) {}

	ngOnInit() {
		this.selectedFeature$ = this.state.selectedFeature$.subscribe(feat => {
			this.resetValues();
			this.feature = feat;
			if (!this.feature) return;
			const props = getFeatureProperties(feat);
			this.properties = props;
			this.generateFormattedList();
		});
		this.events$ = this.state.timestampedEvents.subscribe(events => {
			const featureId = get(this.feature, 'properties.id');
			const scanEvents = events.filter(event => event.type === 'SCAN_OBJECT');
			this.hasScanEvents = scanEvents.length > 0;
			if (!featureId) return;
			const scanEvent = scanEvents.find(
				event => get(event, 'metadata.target') === featureId
			);
			const isSameObject = featureId === get(scanEvent, 'metadata.target');
			const isCurrentScanSameObject =
				featureId === get(this.scanEvent, 'metadata.target');
			if (scanEvent && isSameObject) this.setScanEvent(scanEvent);
			else if (!scanEvent && this.scanEvent && isCurrentScanSameObject)
				this.finishScanEvent();
		});
		this.jumpStatus$ = this.state.jumpStatus.pipe(map(status => status.status));
	}

	private resetValues() {
		this.isScanning = false;
		this.properties = {};
		this.formattedListItems = [];
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
		if (this.hasScanEvents) return;
		const id = get(this.feature, 'properties.id');
		const scanTime = moment()
			.add(this.state.getScanDuration('object'), 'seconds')
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
		const celestialBody = get(this.feature, 'properties.celestial_body');
		if (
			['star', 'jump point', 'celestial station', 'black hole'].includes(
				celestialBody
			)
		)
			return '';
		const str = get(this.feature, 'properties.atmosphere');
		return `Components of atmosphere in order of % amount: ${str}.`;
	}

	private generateFormattedList() {
		if (!this.properties) return;
		// Others:
		// nameKnown
		const props = pick(this.properties, [
			'nameGenerated',
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
		const ellarionMass = 5.478158e24;
		const mass = parseFloat('' + props.mass / ellarionMass).toFixed(2);
		const temperature =
			props.temperature === null
				? null
				: Math.round(props.temperature - 272.15);
		const list = [
			{ key: 'Generated name', value: props.nameGenerated },
			{ key: 'Known name', value: props.nameKnown },
			{ key: 'Celestial body', value: capitalize(props.celestialBody) },
			{ key: 'Category', value: props.category },
			{ key: 'Ring system', value: props.ringSystem ? 'Yes' : 'No' },
			{ key: 'Radius (km)', value: props.radius === 0 ? null : props.radius },
			{ key: 'Mass (1=Ellarion)', value: mass === '0.00' ? null : mass },
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
