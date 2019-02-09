import {
	Component,
	OnInit,
	OnDestroy,
	ViewChild,
	ElementRef,
} from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import { Image as ImageLayer } from 'ol/layer';
import ImageWMS from 'ol/source/ImageWMS';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, RegularShape } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import Overlay from 'ol/Overlay';
import { environment } from '@env/environment';
import { StateService } from '@app/services/state.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { get, camelCase, mapKeys, omitBy } from 'lodash';
import { Router } from '@angular/router';

const commonLayerSettings = {
	url: `${environment.geoserverUrl}/wms`,
	serverType: 'geoserver',
	transition: 0,
};

const geoJsonSettings = {
	geometryName: 'the_geom',
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

function getSelectedFeatureStyle(zoomLevel) {
	return new Style({
		image: new RegularShape({
			stroke: new Stroke({ color: '#04C1BD', width: 2 }),
			points: 4,
			radius: zoomLevel,
			angle: Math.PI / 4,
		}),
	});
}

const selectedFeatureLayer = new VectorLayer({
	source: new VectorSource({}),
});

export function getFeatureProperties(feature) {
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
	@ViewChild('popup') private popup: ElementRef;
	private map: Map;
	private overlay: Overlay;
	isGridVisible$: Subscription;
	centerToShip$: Subscription;
	clickedFeatures = [];

	constructor(
		private state: StateService,
		private http: HttpClient,
		private router: Router
	) {}

	ngOnInit() {
		this.initializeMap();
		this.setupSubscriptions();
		this.setupEventListeners();
	}

	ngOnDestroy() {
		this.isGridVisible$.unsubscribe();
	}

	closePopup(e?) {
		this.overlay.setPosition(undefined);
		if (e) e.target.blur();
	}

	selectFeature(feat) {
		this.state.selectedFeature$.next(feat);
		this.router.navigate(['/object']);
		this.renderSelectedFeature(feat);
	}

	unselectFeature() {
		this.closePopup();
		selectedFeatureLayer.getSource().clear();
		this.state.selectedFeature$.next(null);
		this.router.navigate(['/']);
	}

	private renderSelectedFeature(feat) {
		const feature = new GeoJSON(geoJsonSettings).readFeature(feat);
		const zoomLevel = this.map.getView().getZoom();
		selectedFeatureLayer.getSource().clear();
		feature.setStyle(getSelectedFeatureStyle(zoomLevel));
		selectedFeatureLayer.getSource().addFeature(feature);
	}

	private initializeMap() {
		this.overlay = new Overlay({
			element: this.popup.nativeElement,
			autoPan: true,
			autoPanAnimation: {
				duration: 250,
			},
		});
		this.map = new Map({
			target: 'map',
			controls: [],
			layers: [
				layerAll,
				layerBgStar,
				layerGrid,
				layerObject,
				selectedFeatureLayer,
			],
			overlays: [this.overlay],
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
		this.centerToShip$ = this.state.centerToShip$.subscribe(coords => {
			this.map.getView().setCenter(coords);
		});
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
				this.clickedFeatures = get(res, 'features', []);
				if (this.clickedFeatures.length === 1) {
					this.selectFeature(this.clickedFeatures[0]);
					this.closePopup();
				} else if (this.clickedFeatures.length > 1)
					this.overlay.setPosition(coordinate);
				else this.unselectFeature();
			});
		}
	}

	private updateSelectedStyles() {
		const zoomLevel = this.map.getView().getZoom();
		selectedFeatureLayer
			.getSource()
			.getFeatures()
			.forEach(feat => feat.setStyle(getSelectedFeatureStyle(zoomLevel)));
	}

	private setupEventListeners() {
		this.map.on('singleclick', e => {
			this.getClickedFeatures(e.coordinate);
		});
		this.map.on('moveend', () => {
			this.updateSelectedStyles();
		});
	}
}
