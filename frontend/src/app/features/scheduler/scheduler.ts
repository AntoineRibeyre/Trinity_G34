import { Component } from '@angular/core';
import { ScheduleModule, View } from '@syncfusion/ej2-angular-schedule';
import { DayService, WeekService, WorkWeekService, MonthService, AgendaService } from '@syncfusion/ej2-angular-schedule';
import { registerLicense } from '@syncfusion/ej2-base';


registerLicense('Ngo9BigBOggjHTQxAR8/V1JFaF1cX2hIf0x3TXxbf1x1ZFBMYlRbRHVPMyBoS35Rc0RjWHZedXBWRWJVUUVzVEFc');

@Component({
  selector: 'app-scheduler',
  imports: [ScheduleModule],
  templateUrl: './scheduler.html',
  styleUrl: './scheduler.css',
  providers: [DayService, WeekService, WorkWeekService, MonthService, AgendaService],
})
export class Scheduler {
   public selectedDate: Date = new Date(2018, 1, 15);
   public currentView: View = 'Week';

   public data: object[] = [
    {
      Id: 1,
      Subject: 'Réunion d\'équipe',
      StartTime: new Date(2025, 9, 20, 10, 0),
      EndTime: new Date(2025, 9, 20, 11, 30),
      IsAllDay: false
    },
    {
      Id: 2,
      Subject: 'Déjeuner client',
      StartTime: new Date(2025, 9, 21, 12, 0),
      EndTime: new Date(2025, 9, 21, 13, 30),
      IsAllDay: false
    }
  ];

}


