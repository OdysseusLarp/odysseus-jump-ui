import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { StateService, JumpStatus } from '../../services/state.service';
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
	jumpState$: Subscription;
	jumpForm: FormGroup;
	hasActiveJumpEvent = false;
	isSubmitting = false;
	jumpStatus: JumpStatus;

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
		this.jumpState$ = this.state.jumpState.subscribe(state => {
			this.jumpStatus = get(state, 'status');
		});
	}

	ngOnDestroy() {
		this.event$.unsubscribe();
		this.jumpState$.unsubscribe();
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
			get(this.state.jumpState.getValue(), 'version', 0),
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
		const jumpTime = moment()
			.add(30, 'seconds') // 30 second jumps hardcoded for testing
			.format();
		Promise.all([
			DataApi.patchDataTypeId('jump', 'ship', {
				status: 'jump_initiated',
				version: this.state.jumpState.getValue().version,
			}),
			putEvent({
				type: 'JUMP',
				ship_id: 'odysseus',
				is_active: true,
				occurs_at: jumpTime,
				metadata: this.state.jumpState.getValue().coordinates,
				status: 'Meh', // TODO: Drop status field alltogether?
			}),
		]).then(([dataApiRes, eventRes]) => {
			console.log('Got RES =>', dataApiRes, eventRes);
			if (!eventRes.error) {
				this.snackBar.open('Jump initiated', null, SNACKBAR_DEFAULTS);
				return;
			}
			const message = get(eventRes, 'data.body.error', '');
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
