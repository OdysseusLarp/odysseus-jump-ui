import { Component, OnInit, OnDestroy } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
// import TileLayer from 'ol/layer/Tile';
// import XYZ from 'ol/source/XYZ';
// import TileWMS from 'ol/source/TileWMS';
import { Image as ImageLayer } from 'ol/layer';
import ImageWMS from 'ol/source/ImageWMS';
import WMSGetFeatureInfo from 'ol/format/WMSGetFeatureInfo';
import { environment } from '@env/environment';
import { StateService } from '@app/services/state.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { get, camelCase, mapKeys, omitBy } from 'lodash';

const commonLayerSettings = {
	url: `${environment.geoserverUrl}/wms`,
	serverType: 'geoserver',
	transition: 0,
};

function createLayer(layerName, visible = true) {
	return new ImageLayer({
		visible,
		source: new ImageWMS({
			params: {
				LAYERS: layerName,
			},
			...commonLayerSettings,
		}),
	});
}

function getFeatureProperties(feature) {
	const properties = get(feature, 'properties', {});
	// Convert keys to camelCase and remove attributes that are only used for
	// geoserver rendering
	return omitBy(
		mapKeys(properties, (value, key) => camelCase(key)),
		(value, key) => !!key.match(/^gs/)
	);
}

const layerAll = createLayer('odysseus:starmap_all', false);
const layerBgStar = createLayer('odysseus:starmap_bg_star', false);
const layerGrid = createLayer('odysseus:starmap_grid');
const layerObject = createLayer('odysseus:starmap_object');

@Component({
	selector: 'app-map',
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnDestroy {
	map: Map;
	isGridVisible$: Subscription;
	constructor(private state: StateService, private http: HttpClient) {}

	ngOnInit() {
		this.initializeMap();
		this.setupSubscriptions();
		this.setupEventListeners();
	}

	ngOnDestroy() {
		this.isGridVisible$.unsubscribe();
	}

	private initializeMap() {
		this.map = new Map({
			target: 'map',
			controls: [],
			layers: [layerAll, layerBgStar, layerGrid, layerObject],
			view: new View({
				center: [7243850.704901735, -5122382.060104796],
				zoom: 6,
				minZoom: 2,
				maxZoom: 8,
			}),
		});
	}

	private setupSubscriptions() {
		this.isGridVisible$ = this.state.isGridVisible$.subscribe(isGridVisible =>
			layerGrid.setVisible(isGridVisible)
		);
	}

	private getClickedFeatures(coordinate) {
		const resolution = this.map.getView().getResolution();
		const projection = 'EPSG:3857';
		const params = {
			INFO_FORMAT: 'application/json',
			FEATURE_COUNT: 100,
			BUFFER: 15,
		};
		const url = layerObject
			.getSource()
			.getGetFeatureInfoUrl(coordinate, resolution, projection, params);
		if (url) {
			this.http.get(url).subscribe(res => {
				const features = get(res, 'features', []);
				features.forEach(feat => console.log(getFeatureProperties(feat)));
			});
		}
	}

	private setupEventListeners() {
		this.map.on('singleclick', e => {
			this.getClickedFeatures(e.coordinate);
		});
	}
}
