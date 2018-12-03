import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTrimModule } from 'ng2-trim-directive';

import { AppComponent } from './app.component';
import { JumpComponent } from './components/jump/jump.component';
import { ShipInfoComponent } from './components/ship-info/ship-info.component';
import { routes } from './routes';
import { SocketIoService } from './services/socketio.service';
import { StateService } from './services/state.service';
import { MapComponent } from './components/map/map.component';

@NgModule({
	declarations: [AppComponent, JumpComponent, ShipInfoComponent, MapComponent],
	imports: [
		BrowserModule,
		RouterModule.forRoot(routes),
		ReactiveFormsModule,
		InputTrimModule,
	],
	providers: [SocketIoService, StateService],
	bootstrap: [AppComponent],
})
export class AppModule {}
