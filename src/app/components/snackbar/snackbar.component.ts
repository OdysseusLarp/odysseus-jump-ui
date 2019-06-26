import { Component, OnInit, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';
import { isFunction } from 'lodash';

@Component({
	selector: 'app-snackbar',
	templateUrl: './snackbar.component.html',
	styleUrls: ['./snackbar.component.scss'],
})
export class SnackbarComponent implements OnInit {
	constructor(
		@Inject(MAT_SNACK_BAR_DATA) public data: any,
		private snackBar: MatSnackBar
	) {}

	ngOnInit() {}

	onClose() {
		this.snackBar.dismiss();
		if (isFunction(this.data.onClose)) this.data.onClose();
	}
}
