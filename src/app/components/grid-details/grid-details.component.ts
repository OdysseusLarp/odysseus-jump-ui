import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, interval, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { StateService } from '@app/services/state.service';
import { getFeatureProperties } from '@components/map/map.component';
import { putEvent } from '@api/Event';
import { get, pick, set } from 'lodash';
import { ListItem } from '../dotted-list/dotted-list.component';
import * as moment from 'moment';

@Component({
	selector: 'app-grid-details',
	templateUrl: './grid-details.component.html',
	styleUrls: ['./grid-details.component.scss'],
})
export class GridDetailsComponent implements OnInit, OnDestroy {
	events$: Subscription;
	selectedGrid: any;
	selectedGrid$: Subscription;
	ship$: Subscription;
	properties: any;
	name: string;
	canBeScanned: boolean;
	isScanning = false;
	scanEvent: api.Event;
	jumpEvent: api.Event;
	formattedListItems: ListItem[] = [];

	constructor(private state: StateService) {}

	ngOnInit() {
		const updateInterval = interval(1000).pipe(startWith(0));
		this.selectedGrid$ = this.state.selectedGrid$.subscribe(feat => {
			this.selectedGrid = feat;
			this.setCanBeScanned(feat);
			if (!feat) return;
			const props = getFeatureProperties(feat);
			this.properties = props;
			this.generateFormattedList();
		});
		this.ship$ = this.state.ship.subscribe(() => {
			this.setCanBeScanned(this.selectedGrid);
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
				const gridId = get(this.selectedGrid, 'properties.id');
				if (!gridId) return;
				const {
					sector,
					sub_quadrant,
					sub_sector,
				} = this.selectedGrid.properties;
				const scanEvent = events
					.filter(event => event.type === 'SCAN_GRID')
					.find(event => get(event, 'metadata.target') === gridId);
				const jumpEvent = events
					.filter(event => event.type === 'JUMP')
					.find(event => {
						const target = get(event, 'metadata', {});
						return (
							target.sector === sector &&
							target.sub_quadrant === sub_quadrant &&
							target.sub_sector === sub_sector
						);
					});
				if (scanEvent) this.setScanEvent(scanEvent);
				else if (!scanEvent && this.scanEvent) this.finishScanEvent();
				if (jumpEvent) this.jumpEvent = jumpEvent;
				else if (!jumpEvent && this.jumpEvent) {
					this.jumpEvent = undefined;
					this.setIsDiscovered();
				}
			});
	}

	ngOnDestroy() {
		this.selectedGrid$.unsubscribe();
	}

	scanGrid() {
		if (!this.selectedGrid || !this.canBeScanned || this.isScanning) return;
		const id = get(this.selectedGrid, 'properties.id');
		this.isScanning = true;
		const scanTime = moment()
			.add(30, 'seconds') // 30 second scan time hardcoded for testing
			.format();
		putEvent({
			type: 'SCAN_GRID',
			ship_id: 'odysseus',
			is_active: true,
			occurs_at: scanTime,
			metadata: { target: id },
			status: 'Meh', // TODO: Drop status field alltogether?
		});
	}

	closeBox() {
		this.state.unselectGrid$.next(true);
	}

	getEventOccursSeconds(event) {
		return get(event, 'occurs_in_seconds', '??');
	}

	private setCanBeScanned(feat) {
		const ship = this.state.ship.getValue();
		const shipPosition = pick(get(ship, 'position'), ['x', 'y']);
		const gridPosition = pick(get(feat, 'properties'), ['x', 'y']);
		if (
			!feat ||
			!ship ||
			!(shipPosition.x && shipPosition.y && gridPosition.x && gridPosition.y)
		) {
			this.canBeScanned = false;
			return;
		}
		const scanRange = parseInt(get(ship, 'metadata.scan_range', 1), 10);
		const positionDiffX = shipPosition.x - gridPosition.x;
		const positionDiffY = shipPosition.y - gridPosition.y;
		const canBeScannedX =
			positionDiffX <= scanRange && positionDiffX >= -scanRange;
		const canBeScannedY =
			positionDiffY <= scanRange && positionDiffY >= -scanRange;
		const canBeScanned = canBeScannedX && canBeScannedY;
		this.canBeScanned =
			feat && !get(feat, 'properties.is_discovered') && canBeScanned;
	}

	private setScanEvent(event) {
		this.scanEvent = event;
		this.isScanning = true;
	}

	private finishScanEvent() {
		this.scanEvent = undefined;
		this.isScanning = false;
		this.setIsDiscovered();
	}

	private setIsDiscovered() {
		// TODO: Refetch feature instead of doing this dirty stuff
		if (this.selectedGrid) {
			set(this.properties, 'isDiscovered', true);
			this.canBeScanned = false;
			set(this.selectedGrid, 'properties.is_discovered', true);
			this.generateFormattedList();
		}
	}

	private generateFormattedList() {
		if (!this.properties) return;
		const props = pick(this.properties, [
			'quadrant',
			'sector',
			'subSector',
			'subQuadrant',
			'planetCount',
			'cometCount',
			'naturalSatelliteCount',
			'asteroidCount',
		]);
		let list = [
			{ key: 'Quadrant', value: props.quadrant },
			{ key: 'Sub-quadrant', value: props.subQuadrant },
			{ key: 'Sector', value: props.sector },
			{ key: 'Sub-sector', value: props.subSector },
		];
		if (this.properties.isDiscovered) {
			list = [
				...list,
				{ key: '', value: '' },
				{ key: 'Planets', value: props.planetCount },
				{ key: 'Comets', value: props.cometCount },
				{ key: 'Satellites', value: props.naturalSatelliteCount },
				{ key: 'Asteroids', value: props.asteroidCount },
			];
		}
		this.formattedListItems = list;
	}
}