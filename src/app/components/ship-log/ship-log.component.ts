import { Component, OnInit } from '@angular/core';
import { StateService, LogEntry } from '@app/services/state.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { slice } from 'lodash';
import * as moment from 'moment';

type LogType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

// Maximum amount of log entries displayed at once
const MAX_LOG_COUNT = 30;

@Component({
	selector: 'app-ship-log',
	templateUrl: './ship-log.component.html',
	styleUrls: ['./ship-log.component.scss'],
})
export class ShipLogComponent implements OnInit {
	readonly logTypes: LogType[] = ['INFO', 'SUCCESS', 'WARNING', 'ERROR'];
	isMinimized = false;
	enabledLogTypes: Set<LogType> = new Set(this.logTypes) as Set<LogType>;
	logTypesUpdated$: BehaviorSubject<boolean> = new BehaviorSubject(true);
	log: Observable<LogEntry[]>;

	constructor(private state: StateService) {}

	ngOnInit() {
		this.log = combineLatest(this.state.log, this.logTypesUpdated$).pipe(
			map(([logEntries]) => {
				const filteredEntries = logEntries.filter(entry =>
					this.enabledLogTypes.has(<LogType>entry.type)
				);
				return slice(filteredEntries, 0, MAX_LOG_COUNT).sort((a, b) =>
					moment(a.created_at).isAfter(moment(b.created_at)) ? -1 : 1
				);
			})
		);
	}

	toggleMinimized() {
		this.isMinimized = !this.isMinimized;
	}

	toggleEnabledType(type: LogType) {
		if (this.isEnabled(type)) this.enabledLogTypes.delete(type);
		else this.enabledLogTypes.add(type);
		this.logTypesUpdated$.next(true);
	}

	isEnabled(type: LogType) {
		return !!this.enabledLogTypes.has(type);
	}
}
