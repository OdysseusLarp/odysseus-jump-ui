import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MatSnackBarModule } from '@angular/material';
import { InputTrimModule } from 'ng2-trim-directive';

import { AppComponent } from './app.component';
import { JumpComponent } from './components/jump/jump.component';
import { ShipInfoComponent } from './components/ship-info/ship-info.component';
import { routes } from './routes';
import { SocketIoService } from './services/socketio.service';
import { StateService } from './services/state.service';
import { MapComponent } from './components/map/map.component';
import { JumpDialogComponent } from '@app/components/jump-dialog/jump-dialog.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
	declarations: [
		AppComponent,
		JumpComponent,
		ShipInfoComponent,
		JumpDialogComponent,
		MapComponent,
	],
	imports: [
		BrowserModule,
		RouterModule.forRoot(routes),
		ReactiveFormsModule,
		InputTrimModule,
		BrowserAnimationsModule,
		MatDialogModule,
		MatSnackBarModule,
		HttpClientModule,
	],
	providers: [SocketIoService, StateService],
	bootstrap: [AppComponent],
	entryComponents: [JumpDialogComponent],
})
export class AppModule {}
