import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StateService, JumpStatusValue } from '@app/services/state.service';
import { getFeatureProperties } from '@components/map/map.component';
import { putEvent } from '@api/Event';
import { get, pick, set } from 'lodash';
import { ListItem } from '../dotted-list/dotted-list.component';
import moment from 'moment';
import { MatSnackBar } from '@angular/material';
import { SNACKBAR_DEFAULTS } from '../../config';

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
	probeCount: number;
	properties: any;
	name: string;
	canBeScanned: boolean;
	isScanning = false;
	isDiscovered: boolean;
	scanEvent: api.Event;
	formattedListItems: ListItem[] = [];
	jumpStatus$: Observable<JumpStatusValue>;

	constructor(private state: StateService, private snackBar: MatSnackBar) {}

	ngOnInit() {
		this.selectedGrid$ = this.state.selectedGrid$.subscribe(feat => {
			this.resetValues();
			this.selectedGrid = feat;
			if (!feat) return;
			this.setCanBeScanned(feat);
			const props = getFeatureProperties(feat);
			this.properties = props;
			this.isDiscovered = props.isDiscovered;
			this.generateFormattedList();
		});
		this.ship$ = this.state.ship.subscribe(ship => {
			const shipGridId = get(ship, 'position.id');
			const selectedGridId = get(this.selectedGrid, 'properties.id');
			// This should trigger if Odysseus jumps to the currently selected grid
			if (shipGridId && shipGridId === selectedGridId && !this.isDiscovered) {
				this.setIsDiscovered();
			}
			this.setCanBeScanned(this.selectedGrid);
			this.probeCount = get(ship, 'metadata.probe_count', 0);
		});
		this.events$ = this.state.timestampedEvents.subscribe(events => {
			const gridId = get(this.selectedGrid, 'properties.id');
			if (!gridId) return;
			const scanEvent = events
				.filter(event => event.type === 'SCAN_GRID')
				.find(event => get(event, 'metadata.target') === gridId);
			const isSameGrid = gridId === get(scanEvent, 'metadata.target');
			if (scanEvent && isSameGrid) this.setScanEvent(scanEvent);
			else if (!scanEvent && this.scanEvent && isSameGrid) {
				this.finishScanEvent();
			}
		});
		this.jumpStatus$ = this.state.jumpStatus.pipe(map(status => status.status));
	}

	private resetValues() {
		this.properties = {};
		this.canBeScanned = false;
		this.name = null;
		this.isScanning = false;
		this.formattedListItems = [];
		this.isDiscovered = false;
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
		}).then(res => {
			if (!res.error) return;
			this.isScanning = false;
			const message = get(res, 'data.body.error', '');
			this.snackBar.open(`Error: ${message}`, null, SNACKBAR_DEFAULTS);
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
			this.isDiscovered = true;
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
