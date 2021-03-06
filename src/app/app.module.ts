import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MatSnackBarModule } from '@angular/material';
import { InputTrimModule } from 'ng2-trim-directive';

import { AppComponent } from './app.component';
import { ShipInfoComponent } from './components/ship-info/ship-info.component';
import { routes } from './routes';
import { SocketIoService } from './services/socketio.service';
import { StateService } from './services/state.service';
import { MapComponent } from './components/map/map.component';
import { JumpDialogComponent } from '@app/components/jump-dialog/jump-dialog.component';
import { HttpClientModule } from '@angular/common/http';
import { ObjectDetailsComponent } from './components/object-details/object-details.component';
import { GridDetailsComponent } from './components/grid-details/grid-details.component';
import { ShipLogComponent } from './components/ship-log/ship-log.component';
import { DottedListComponent } from './components/dotted-list/dotted-list.component';
import { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
import { StaticScreenComponent } from './components/static-screen/static-screen.component';
import { CountdownDialogComponent } from './components/countdown-dialog/countdown-dialog.component';
import { FleetDetailsComponent } from './components/fleet-details/fleet-details.component';
import { BeaconDialogComponent } from './components/beacon-dialog/beacon-dialog.component';
import { SnackbarComponent } from './components/snackbar/snackbar.component';

@NgModule({
	declarations: [
		AppComponent,
		ShipInfoComponent,
		JumpDialogComponent,
		MapComponent,
		ObjectDetailsComponent,
		GridDetailsComponent,
		ShipLogComponent,
		DottedListComponent,
		MessageDialogComponent,
		StaticScreenComponent,
		CountdownDialogComponent,
		FleetDetailsComponent,
		BeaconDialogComponent,
		SnackbarComponent,
	],
	imports: [
		BrowserModule,
		RouterModule.forRoot(routes),
		ReactiveFormsModule,
		FormsModule,
		InputTrimModule,
		BrowserAnimationsModule,
		MatDialogModule,
		MatSnackBarModule,
		HttpClientModule,
	],
	providers: [SocketIoService, StateService],
	bootstrap: [AppComponent],
	entryComponents: [
		JumpDialogComponent,
		MessageDialogComponent,
		CountdownDialogComponent,
		BeaconDialogComponent,
		SnackbarComponent,
	],
})
export class AppModule {}
