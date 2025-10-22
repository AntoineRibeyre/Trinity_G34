// scheduler.component.ts
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { 
  ScheduleModule, 
  View, 
  EventSettingsModel,
  ScheduleComponent 
} from '@syncfusion/ej2-angular-schedule';
import { 
  DayService, 
  WeekService, 
  WorkWeekService, 
  MonthService, 
  AgendaService 
} from '@syncfusion/ej2-angular-schedule';
import { registerLicense } from '@syncfusion/ej2-base';
import { EventService } from '../../../services/event.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';

registerLicense('Ngo9BigBOggjHTQxAR8/V1JFaF1cX2hIf0x3TXxbf1x1ZFBMYlRbRHVPMyBoS35Rc0RjWHZedXBWRWJVUUVzVEFc');

interface SchedulerEvent {
  Id: number;
  Subject: string;
  StartTime: Date;
  EndTime: Date;
  IsAllDay: boolean;
  AttendeeIds?: string[];  // Changé de number[] à string[]
  Attendees?: User[];
}

@Component({
  selector: 'app-scheduler',
  imports: [ScheduleModule],
  templateUrl: './scheduler.html',
  styleUrl: './scheduler.css',
  providers: [DayService, WeekService, WorkWeekService, MonthService, AgendaService],
})
export class Scheduler implements OnInit {

  //-------------------------------ATTRIBUTS--------------------------------------------------

  @ViewChild('scheduleObj') public scheduleObj!: ScheduleComponent;
  
  userId: number | null = null;
  username: string | null = null;
  public selectedDate: Date = new Date();
  public currentView: View = 'Week';
  public currentUser: User | null = null;
  public allUsers: User[] = [];
  public data: SchedulerEvent[] = [];
  public eventSettings: EventSettingsModel = {
    dataSource: this.data
  };
  public startHour: string = '08:00';
  public endHour: string = '20:00';
  public scheduleHeight: string = 'calc(100vh - 200px)';
  public timeScale: Object = {
    enable: true,
    interval: 60,      // Intervalle principal en minutes
    slotCount: 2       // Nombre de divisions = 60/2 = 30 min par créneau
  };


  // Option pour afficher tous les événements ou seulement ceux de l'utilisateur
  public showOnlyMyEvents: boolean = true;
  
  private eventService = inject(EventService);
  private userService = inject(UserService);



  //------------------------------METHODES----------------------------------------------



  async ngOnInit() {
    // Charger l'utilisateur courant
    this.currentUser = await this.userService.loadCurrentUserFromServer();
    if (this.currentUser) {
      this.userId = Number(this.currentUser.id);
      this.username = this.currentUser.username;
    }
    
    // Charger tous les utilisateurs (pour sélection des participants)
    await this.loadUsers();
    
    // Charger les événements
    await this.loadEvents();
  }



  async loadUsers() {
    try {
      this.allUsers = await this.eventService.getAllUsers();
      console.log('Utilisateurs chargés:', this.allUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  }



  async loadEvents() {
    try {
      const events = await this.eventService.getAllEvents();
      
      // Transformer les données du backend au format Syncfusion
      let transformedEvents = events.map(event => ({
        Id: event.id,
        Subject: event.subject,
        StartTime: new Date(event.startTime),
        EndTime: new Date(event.endTime),
        IsAllDay: event.isAllDay,
        Attendees: event.attendees || [],
        // Garder les ID en tant que string pour être cohérent avec le modèle User
        AttendeeIds: event.attendees?.map(a => a.id) || []
      }));
      
      // Filtrer par utilisateur si l'option est activée
      if (this.showOnlyMyEvents && this.userId) {
        const userIdStr = this.userId.toString();
        transformedEvents = transformedEvents.filter(event => 
          event.AttendeeIds?.includes(userIdStr)
        );
      }
      
      this.data = transformedEvents;
      
      // Mettre à jour les eventSettings
      this.eventSettings = {
        dataSource: this.data
      };
      
      console.log('Événements chargés:', this.data);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    }
  }



  // Basculer entre "Mes événements" et "Tous les événements"
  async toggleMyEvents() {
    this.showOnlyMyEvents = !this.showOnlyMyEvents;
    await this.loadEvents();
  }



  // Méthode pour obtenir les noms des participants d'un événement
  getAttendeeNames(event: SchedulerEvent): string {
    if (!event.Attendees || event.Attendees.length === 0) {
      return 'Aucun participant';
    }
    return event.Attendees.map(a => a.username).join(', ');
  }



  public async onActionComplete(args: any): Promise<void> {
    // ========== CRÉATION D'ÉVÉNEMENT ==========
    if (args.requestType === 'eventCreated' && args.addedRecords) {
      for (const event of args.addedRecords) {
        try {
          // Par défaut, ajouter l'utilisateur courant comme participant
          const attendeeIds = event.AttendeeIds 
            ? event.AttendeeIds.map((id: string) => parseInt(id))
            : (this.userId ? [this.userId] : []);
          
          const result = await this.eventService.createEvent(event, attendeeIds);
          
          if (result && result.success) {
            console.log('Événement créé avec succès:', result.event);
            event.Id = result.event.id;
            await this.loadEvents();
          } else {
            console.error('Erreur lors de la création:', result?.message);
            // Annuler l'ajout dans le scheduler si échec
            this.scheduleObj.deleteEvent(event);
          }
        } catch (error) {
          console.error('Erreur lors de la création:', error);
          // Annuler l'ajout dans le scheduler si échec
          this.scheduleObj.deleteEvent(event);
        }
      }
    }
  
    // ========== MODIFICATION D'ÉVÉNEMENT ==========
    if (args.requestType === 'eventChanged' && args.changedRecords) {
      for (const event of args.changedRecords) {
        try {
          const eventId = typeof event.Id === 'string' ? parseInt(event.Id) : event.Id;
          // Récupérer les IDs des participants (string[] -> number[])
          const attendeeIds = event.AttendeeIds 
            ? event.AttendeeIds.map((id: string) => parseInt(id))
            : [];
          
          const result = await this.eventService.updateEvent(
            eventId, 
            event, 
            attendeeIds
          );
          
          if (result && result.success) {
            console.log('Événement modifié avec succès:', result.event);
            await this.loadEvents();
          } else {
            console.error('Erreur lors de la modification:', result?.message);
            // Recharger pour annuler les changements locaux
            await this.loadEvents();
          }
        } catch (error) {
          console.error('Erreur lors de la modification:', error);
          // Recharger pour annuler les changements locaux
          await this.loadEvents();
        }
      }
    }
    
    // ========== SUPPRESSION D'ÉVÉNEMENT ==========
    if (args.requestType === 'eventRemoved' && args.deletedRecords) {
      for (const event of args.deletedRecords) {
        try {
          const eventId = typeof event.Id === 'string' ? parseInt(event.Id) : event.Id;
          const result = await this.eventService.deleteEvent(eventId);
          
          if (result && result.success) {
            console.log('Événement supprimé avec succès');
            await this.loadEvents();
          } else {
            console.error('Erreur lors de la suppression:', result?.message);
            // Recharger pour restaurer l'événement
            await this.loadEvents();
          }
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          // Recharger pour restaurer l'événement
          await this.loadEvents();
        }
      }
    }
  }

  // Méthode pour ajouter un participant à un événement
  async addAttendeeToEvent(eventId: number, userId: number) {
    try {
      await this.eventService.addAttendee(eventId, userId);
      await this.loadEvents();
      console.log('Participant ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du participant:', error);
    }
  }

  // Méthode pour retirer un participant d'un événement
  async removeAttendeeFromEvent(eventId: number, userId: number) {
    try {
      await this.eventService.removeAttendee(eventId, userId);
      await this.loadEvents();
      console.log('Participant retiré avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du participant:', error);
    }
  }

  // Vérifier si l'utilisateur courant participe à un événement
  isUserAttending(event: SchedulerEvent): boolean {
    if (!this.userId || !event.AttendeeIds) return false;
    return event.AttendeeIds.includes(this.userId.toString());
  }

  //Défini la taille des pop-ups
  onPopupOpen(args: any): void {
  if (args.type === 'DeleteAlert') {
    args.element.style.width = '300px';
    args.element.style.maxWidth = '40%';
  }
}
}