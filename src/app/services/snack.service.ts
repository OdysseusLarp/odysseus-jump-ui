import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material';
import { SnackbarComponent } from '@components/snackbar/snackbar.component';

const snackBarOptions: MatSnackBarConfig = {
	duration: 5000,
	horizontalPosition: 'end',
	verticalPosition: 'bottom',
	panelClass: 'custom-snackbar',
};

@Injectable({
	providedIn: 'root',
})
export class SnackService {
	constructor(private snackBar: MatSnackBar) {}

	info(title: string, text: string, onClose?: () => void) {
		return this.open(title, text, 'INFO', onClose);
	}

	warn(title: string, text: string, onClose?: () => void) {
		return this.open(title, text, 'WARNING', onClose);
	}

	error(title: string, text: string, onClose?: () => void) {
		return this.open(title, text, 'ERROR', onClose);
	}

	success(title: string, text: string, onClose?: () => void) {
		return this.open(title, text, 'SUCCESS', onClose);
	}

	open(title: string, text: string, type: string, onClose?: () => void) {
		return this.snackBar.openFromComponent(SnackbarComponent, {
			...snackBarOptions,
			data: { title, text, onClose, type: type.toUpperCase() },
		});
	}
}
