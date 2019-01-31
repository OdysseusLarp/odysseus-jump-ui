import { Routes } from '@angular/router';
import { JumpComponent } from '@components/jump/jump.component';
import { ShipInfoComponent } from '@components/ship-info/ship-info.component';
import { ObjectDetailsComponent } from '@components/object-details/object-details.component';

export const routes: Routes = [
	{ path: '', component: ShipInfoComponent },
	{ path: 'jump', component: JumpComponent },
	{ path: 'object', component: ObjectDetailsComponent },
];
