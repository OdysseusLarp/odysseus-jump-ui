import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import {
	StateService,
	JumpStatusValue,
	JumpState,
} from '../../services/state.service';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { postFleetIdJumpValidate } from '@api/Fleet';
import * as DataApi from '@api/Data';
import { pickBy, get, startCase, toLower } from 'lodash';
import { MatDialogRef } from '@angular/material';
import { SnackService } from '@app/services/snack.service';

@Component({
	selector: 'app-jump-dialog',
	templateUrl: './jump-dialog.component.html',
	styleUrls: ['./jump-dialog.component.scss'],
})
export class JumpDialogComponent implements OnInit, OnDestroy {
	jumpStatus$: Subscription;
	jumpForm: FormGroup;
	isSubmitting = false;
	jumpStatus: JumpStatusValue;
	safeJump$: Observable<string>;
	jumpCrystalCount: number;
	ship$: Subscription;

	constructor(
		private state: StateService,
		private dialogRef: MatDialogRef<JumpDialogComponent>,
		private snack: SnackService
	) {}

	ngOnInit() {
		this.buildForm();
		this.jumpStatus$ = this.state.jumpStatus.subscribe(state => {
			this.jumpStatus = get(state, 'status');
		});
		this.safeJump$ = this.state.jumpState.pipe(map(state => state.readyT));
		this.ship$ = this.state.ship.subscribe(ship => {
			this.jumpCrystalCount = get(ship, 'metadata.jump_crystal_count', 0);
		});
	}

	ngOnDestroy() {
		this.jumpStatus$.unsubscribe();
		this.ship$.unsubscribe();
	}

	async onCalculateJumpCoordinates() {
		if (this.isSubmitting) return;
		this.isSubmitting = true;
		const jumpCoordinates = this.formatJumpCoordinates(
			pickBy(this.jumpForm.value, Boolean)
		);
		const { data } = await this.validateJumpCoordinates(jumpCoordinates);
		if (!data.isValid) {
			const message = get(data, 'message');
			this.snack.error('Error', message);
			this.isSubmitting = false;
			return;
		}
		const version = parseInt(
			get(this.state.jumpStatus.getValue(), 'version', 0),
			10
		);
		DataApi.patchDataTypeId('jump', 'ship', {
			status: 'calculating',
			coordinates: jumpCoordinates,
			version,
		} as any).then(() => {
			this.isSubmitting = false;
			this.close();
		});
	}

	private formatJumpCoordinates(jumpCoordinates) {
		return {
			...jumpCoordinates,
			sub_quadrant: startCase(
				toLower(get(jumpCoordinates, 'sub_quadrant', ''))
			).replace(' ', '-'),
			sector: get(jumpCoordinates, 'sector', '').toUpperCase(),
			planet_orbit: get(jumpCoordinates, 'planet_orbit', '').toUpperCase(),
		};
	}

	onPerformJump() {
		if (this.isSubmitting) return;
		this.isSubmitting = true;
		DataApi.patchDataTypeId('jump', 'ship', {
			status: 'jump_initiated',
			version: this.state.jumpStatus.getValue().version,
		} as any)
			.then(res => {
				this.snack.success('Jump drive', 'Jump initiated');
			})
			.catch(err => {
				const message = get(err, 'data.body.error', '');
				this.snack.error('Error', message);
			});
		this.close();
	}

	onCancelJump() {
		if (this.isSubmitting || this.jumpStatus !== 'calculating') return;
		DataApi.patchDataTypeId('jump', 'ship', {
			status: 'ready_to_prep',
			version: this.state.jumpStatus.getValue().version,
		} as any)
			.then(res => {
				this.snack.warn('Jump drive', 'Coordinate calculation aborted');
			})
			.catch(err => {
				const message = get(err, 'data.body.error', '');
				this.snack.error('Error', message);
			});
		this.close();
	}

	close() {
		this.dialogRef.close();
	}

	private async validateJumpCoordinates(jumpCoordinates) {
		return postFleetIdJumpValidate('odysseus', {
			...jumpCoordinates,
			should_add_log_entries: false,
		});
	}

	private buildForm() {
		this.jumpForm = new FormGroup({
			sub_quadrant: new FormControl('', Validators.required),
			sector: new FormControl('', Validators.required),
			sub_sector: new FormControl('', Validators.required),
			planet_orbit: new FormControl(''),
		});
	}
}
