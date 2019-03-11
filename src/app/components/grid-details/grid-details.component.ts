import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { StateService } from '@app/services/state.service';
import { getFeatureProperties } from '@components/map/map.component';
import { putEvent } from '@api/Event';
import { get, pick } from 'lodash';
import * as moment from 'moment';

@Component({
	selector: 'app-grid-details',
	templateUrl: './grid-details.component.html',
	styleUrls: ['./grid-details.component.scss'],
})
export class GridDetailsComponent implements OnInit, OnDestroy {
	selectedGrid: any;
	selectedGrid$: Subscription;
	ship$: Subscription;
	properties: any;
	name: string;
	canBeScanned: boolean;
	isScanning = false;

	constructor(private state: StateService) {}

	ngOnInit() {
		this.selectedGrid$ = this.state.selectedGrid$.subscribe(feat => {
			this.selectedGrid = feat;
			this.setCanBeScanned(feat);
			if (!feat) return;
			const props = getFeatureProperties(feat);
			this.properties = props;
		});
		this.ship$ = this.state.ship.subscribe(() =>
			this.setCanBeScanned(this.selectedGrid)
		);
	}

	ngOnDestroy() {
		this.selectedGrid$.unsubscribe();
	}

	scanGrid() {
		if (!this.selectedGrid || !this.canBeScanned || this.isScanning) return;
		console.log('Scanning grid', this.selectedGrid);
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
}
