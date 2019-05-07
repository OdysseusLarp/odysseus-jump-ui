import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { StateService, JumpStatusValue } from '../../services/state.service';
import { Subscription } from 'rxjs';
import { putEvent } from '@api/Event';
import { postFleetIdJumpValidate } from '@api/Fleet';
import * as DataApi from '@api/Data';
import * as moment from 'moment';
import { pickBy, get } from 'lodash';
import { MatDialogRef, MatSnackBar } from '@angular/material';
import { SNACKBAR_DEFAULTS } from '../../config';

@Component({
	selector: 'app-jump-dialog',
	templateUrl: './jump-dialog.component.html',
	styleUrls: ['./jump-dialog.component.scss'],
})
export class JumpDialogComponent implements OnInit, OnDestroy {
	event$: Subscription;
	jumpStatus$: Subscription;
	jumpForm: FormGroup;
	hasActiveJumpEvent = false;
	isSubmitting = false;
	jumpStatus: JumpStatusValue;

	constructor(
		private state: StateService,
		private dialogRef: MatDialogRef<JumpDialogComponent>,
		private snackBar: MatSnackBar
	) {}

	ngOnInit() {
		this.buildForm();
		this.event$ = this.state.events.subscribe(events => {
			this.hasActiveJumpEvent = !!events.find(e => e.type === 'JUMP');
		});
		this.jumpStatus$ = this.state.jumpStatus.subscribe(state => {
			this.jumpStatus = get(state, 'status');
		});
	}

	ngOnDestroy() {
		this.event$.unsubscribe();
		this.jumpStatus$.unsubscribe();
	}

	async onCalculateJumpCoordinates() {
		if (this.isSubmitting) return;
		this.isSubmitting = true;
		const jumpCoordinates = pickBy(this.jumpForm.value, Boolean);
		const { data } = await this.validateJumpCoordinates(jumpCoordinates);
		if (!data.isValid) {
			const message = get(data, 'message');
			this.snackBar.open(`Error: ${message}`, null, SNACKBAR_DEFAULTS);
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
		}).then(() => {
			this.isSubmitting = false;
			this.close();
		});
	}

	onPerformJump() {
		if (this.isSubmitting) return;
		this.isSubmitting = true;
		DataApi.patchDataTypeId('jump', 'ship', {
			status: 'jump_initiated',
			version: this.state.jumpStatus.getValue().version,
		})
			.then(res => {
				console.log('Jump initiated =>', res);
				this.snackBar.open('Jump initiated', null, SNACKBAR_DEFAULTS);
			})
			.catch(err => {
				const message = get(err, 'data.body.error', '');
				this.snackBar.open(`Error: ${message}`, null, SNACKBAR_DEFAULTS);
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
