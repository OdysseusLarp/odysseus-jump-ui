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
import { Subscription, zip } from 'rxjs';
import { finalize, first as firstPipe } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { get, camelCase, mapKeys, omitBy, first } from 'lodash';

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

const selectedGridStyle = new Style({
	stroke: new Stroke({
		color: '#04C1BD',
		width: 2,
	}),
});

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
const layerGridInfo = createLayer('odysseus:starmap_grid_info', false);
const layerBgStar = createLayer('odysseus:starmap_bg_star');
const layerGrid = createLayer('odysseus:starmap_grid');
const layerObject = createLayer('odysseus:starmap_object');
const layerFleet = createLayer('odysseus:starmap_fleet');

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
	isGridVisible: boolean;
	centerToShip$: Subscription;
	geoEventFinished$: Subscription;
	unselectGrid$: Subscription;
	unselectObject$: Subscription;
	clickedFeatures = [];
	clickedGrid: any;
	isLoading = false;

	constructor(private state: StateService, private http: HttpClient) {}

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
		this.renderSelectedFeature(feat);
	}

	unselectFeature() {
		this.closePopup();
		selectedFeatureLayer.getSource().clear();
		this.state.selectedFeature$.next(null);
	}

	selectGrid(feat) {
		this.state.selectedGrid$.next(feat);
	}

	unselectGrid() {
		this.clickedGrid = null;
		this.state.selectedGrid$.next(null);
		const source = selectedFeatureLayer.getSource();
		source
			.getFeatures()
			.filter(feat => feat.getId().match(/^starmap_grid_info/))
			.forEach(feat => source.removeFeature(feat));
	}

	private renderSelectedFeature(feat) {
		const feature = new GeoJSON(geoJsonSettings).readFeature(feat);
		const zoomLevel = this.map.getView().getZoom();
		selectedFeatureLayer.getSource().clear();
		feature.setStyle(getSelectedFeatureStyle(zoomLevel));
		selectedFeatureLayer.getSource().addFeature(feature);
	}

	private renderSelectedGrid(feat) {
		const feature = new GeoJSON(geoJsonSettings).readFeature(feat);
		// If this grid is already selected, clear the selection
		if (
			feature &&
			this.clickedGrid &&
			this.clickedGrid.getProperties().id === feature.getProperties().id
		) {
			this.unselectGrid();
			selectedFeatureLayer.getSource().clear();
			return;
		}
		this.clickedGrid = feature;
		// TODO: Remove this hack, actually select the grid and implement actions
		feature.setStyle(selectedGridStyle);
		selectedFeatureLayer.getSource().addFeature(feature);
		this.selectGrid(feat);
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
				layerFleet,
				selectedFeatureLayer,
			],
			overlays: [this.overlay],
			view: new View({
				center: [0, 0],
				zoom: 6,
				minZoom: 1,
				maxZoom: 9,
			}),
		});
		this.map.render();
		// When ship data is initially loaded, center map to the ship's location
		this.state.ship.pipe(firstPipe(Boolean)).subscribe(ship => {
			this.state.centerToShip$.next(get(ship, 'geom.coordinates'));
		});
	}

	private setupSubscriptions() {
		this.isGridVisible$ = this.state.isGridVisible$.subscribe(isGridVisible => {
			this.isGridVisible = isGridVisible;
			layerGrid.setVisible(isGridVisible);
		});
		this.centerToShip$ = this.state.centerToShip$.subscribe(coords => {
			this.map.getView().setCenter(coords);
		});
		this.geoEventFinished$ = this.state.geoEventFinished$.subscribe(() => {
			// Re-render starmap objects and fleet position after a jump
			// TODO: Fix bug where this does nothing if the map does not have
			// focus in the UI - this.map.getViewport().focus() did not help.
			layerObject.getSource().changed();
			layerFleet.getSource().changed();
		});
		this.unselectGrid$ = this.state.unselectGrid$.subscribe(() =>
			this.unselectGrid()
		);
		this.unselectObject$ = this.state.unselectObject$.subscribe(() =>
			this.unselectFeature()
		);
	}

	private getClickedFeatures(coordinate) {
		if (this.isLoading) return;
		this.isLoading = true;
		const resolution = this.map.getView().getResolution();
		const projection = 'EPSG:3857';
		const objectUrl = layerObject
			.getSource()
			.getGetFeatureInfoUrl(coordinate, resolution, projection, {
				INFO_FORMAT: 'application/json',
				FEATURE_COUNT: 100,
				BUFFER: 15,
			});
		const requests = [];
		if (objectUrl) requests.push(this.http.get(objectUrl));
		const gridUrl = layerGridInfo
			.getSource()
			.getGetFeatureInfoUrl(coordinate, resolution, projection, {
				INFO_FORMAT: 'application/json',
				BUFFER: 0,
				FEATURE_COUNT: 1,
				// We have multiple grids on top of eachother, so only
				// pick the one with the lowest zoom level (4)
				CQL_FILTER: 'zoom = 4',
			});
		if (this.isGridVisible && gridUrl) {
			requests.push(this.http.get(gridUrl));
		}
		zip(...requests)
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe(
				([objectRes, gridRes]) => {
					if (objectRes) {
						this.clickedFeatures = get(objectRes, 'features', []);
						if (this.clickedFeatures.length === 1) {
							this.selectFeature(this.clickedFeatures[0]);
							this.closePopup();
						} else if (this.clickedFeatures.length > 1)
							this.overlay.setPosition(coordinate);
						else this.unselectFeature();
					}
					if (gridRes && !this.clickedFeatures.length) {
						const gridFeat = first(get(gridRes, 'features', []));
						if (gridFeat) this.renderSelectedGrid(gridFeat);
						else this.unselectGrid();
					} else {
						this.unselectGrid();
					}
				},
				err => console.error('Error requesting clicked features', err)
			);
	}

	private updateSelectedStyles() {
		const zoomLevel = this.map.getView().getZoom();
		selectedFeatureLayer
			.getSource()
			.getFeatures()
			.forEach(feat => {
				// only restyle selected starmap objects, not the grid
				if (feat.getId().match(/^starmap_grid_info/)) return;
				feat.setStyle(getSelectedFeatureStyle(zoomLevel));
			});
	}

	private setupEventListeners() {
		this.map.on('singleclick', e => {
			// if (this.map.getView().getZoom() < 6) return;
			this.getClickedFeatures(e.coordinate);
		});
		this.map.on('moveend', () => {
			this.updateSelectedStyles();
		});
	}
}
