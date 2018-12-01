import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

@Component({
	selector: 'app-map',
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
	map: Map;
	constructor() {}

	ngOnInit() {
		this.map = new Map({
			target: 'map',
			controls: [],
			layers: [
				new TileLayer({
					source: new XYZ({
						url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
					}),
				}),
			],
			view: new View({
				center: [2872131, 9438013],
				zoom: 6,
			}),
		});
	}
}
