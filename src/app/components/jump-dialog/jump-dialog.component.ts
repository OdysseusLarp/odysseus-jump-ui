import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { StateService } from '../../services/state.service';
import { Subscription } from 'rxjs';
import { putEvent } from '@api/Event';
import * as moment from 'moment';
import { pickBy } from 'lodash';
import { MatDialogRef, MatSnackBar } from '@angular/material';
import { SNACKBAR_DEFAULTS } from '../../config';

@Component({
	selector: 'app-jump-dialog',
	templateUrl: './jump-dialog.component.html',
	styleUrls: ['./jump-dialog.component.scss'],
})
export class JumpDialogComponent implements OnInit, OnDestroy {
	event$: Subscription;
	jumpForm: FormGroup;
	hasActiveJumpEvent = false;
	isSubmitting = false;

	constructor(
		private stateService: StateService,
		private dialogRef: MatDialogRef<JumpDialogComponent>,
		private snackBar: MatSnackBar
	) {}

	ngOnInit() {
		this.buildForm();
		this.event$ = this.stateService.events.subscribe(events => {
			this.hasActiveJumpEvent = !!events.find(e => e.type === 'JUMP');
		});
	}

	ngOnDestroy() {
		this.event$.unsubscribe();
	}

	onSubmit() {
		if (this.isSubmitting) return;
		this.isSubmitting = true;
		const jumpTime = moment()
			.add(30, 'seconds') // 30 second jumps hardcoded for testing
			.format();
		putEvent({
			type: 'JUMP',
			ship_id: 'odysseus',
			is_active: true,
			occurs_at: jumpTime,
			metadata: pickBy(this.jumpForm.value, Boolean),
			status: 'Meh', // TODO: Drop status field alltogether?
		});
		this.snackBar.open('Jump initiated', null, SNACKBAR_DEFAULTS);
		this.close();
	}

	close() {
		this.dialogRef.close();
	}

	private buildForm() {
		this.jumpForm = new FormGroup({
			quadrant: new FormControl('', Validators.required),
			sector: new FormControl('', Validators.required),
			sub_sector: new FormControl('', Validators.required),
			planet_orbit: new FormControl(''),
		});
	}
}
