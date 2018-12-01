import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { StateService } from '../../services/state.service';
import { Subscription } from 'rxjs';
import { putEvent } from '@api/Event';
import * as moment from 'moment';
import { Router } from '@angular/router';

@Component({
	selector: 'app-jump',
	templateUrl: './jump.component.html',
	styleUrls: ['./jump.component.scss'],
})
export class JumpComponent implements OnInit, OnDestroy {
	event$: Subscription;
	jumpForm: FormGroup;
	hasActiveJumpEvent = false;
	isSubmitting = false;

	constructor(private stateService: StateService, private router: Router) {}

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
		const { coordinates } = this.jumpForm.value;
		const jumpTime = moment()
			.add(30, 'seconds') // 30 second jumps hardcoded for testing
			.format();
		console.log('Creating jump event');
		putEvent({
			type: 'JUMP',
			ship_id: 'odysseus',
			is_active: true,
			occurs_at: jumpTime,
			metadata: {
				grid: coordinates,
			},
			status: 'Meh', // TODO: Drop status field alltogether?
		});
		this.router.navigate(['/']);
	}

	private buildForm() {
		this.jumpForm = new FormGroup({
			coordinates: new FormControl('', Validators.required),
		});
	}
}
