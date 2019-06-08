import {
	Component,
	OnInit,
	OnDestroy,
	ViewChild,
	ElementRef,
} from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { putStarmapBeaconDecodeId } from '@api/Starmap';
import { get } from 'lodash';

const DECODE_TIME_MS = 3000;

@Component({
	selector: 'app-beacon-dialog',
	templateUrl: './beacon-dialog.component.html',
	styleUrls: ['./beacon-dialog.component.scss'],
})
export class BeaconDialogComponent implements OnInit, OnDestroy {
	@ViewChild('signalInput') signalInput: ElementRef;
	isSubmitting = false;
	timeout: NodeJS.Timeout;
	error = '';
	value = '';

	constructor(private dialogRef: MatDialogRef<BeaconDialogComponent>) {}

	ngOnInit() {}

	ngOnDestroy() {
		clearTimeout(this.timeout);
	}

	async onDecodeSignal() {
		if (this.isSubmitting || this.value.length < 4) return;
		this.isSubmitting = true;
		this.dialogRef.disableClose = true;
		this.error = '';
		const value = this.signalInput.nativeElement.value.toUpperCase().trim();
		this.timeout = setTimeout(async () => {
			await putStarmapBeaconDecodeId(value)
				.then(res => {
					if (res.error) this.error = get(res, 'data.body.error', '');
					else {
						this.dialogRef.close();
					}
				})
				.catch(err => {
					this.error = get(err, 'data.body.message', '');
				});
			this.isSubmitting = false;
			this.dialogRef.disableClose = false;
		}, DECODE_TIME_MS);
	}

	close() {
		if (this.isSubmitting) return;
		this.dialogRef.close();
	}

	keyDown(event) {
		if (event.key === 'Enter') this.onDecodeSignal();
	}
}
