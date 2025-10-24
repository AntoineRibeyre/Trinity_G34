import { Component, OnInit, OnDestroy } from '@angular/core';
import { Filter, FilterService } from '../../../../services/filter.service';
import { TeamService } from '../../../../services/team.service';
import { Subscription } from 'rxjs';
import { Team } from '../../../../models/team.model';



@Component({
  selector: 'app-team-list',
  templateUrl: './team-list.html',
  styleUrls: ['./team-list.css']
})
export class TeamList implements OnInit, OnDestroy {
  teams: Team[] = [];
  filteredTeams: Team[] = [];
  selectedFilter: Filter | null = null;

  private filterSub?: Subscription;
  private teamSub?: Subscription;

  constructor(
    private filterService: FilterService,
    private teamService: TeamService
  ) {}

  ngOnInit() {
    // 🔹 1. Abonnement au filtre courant
    this.filterSub = this.filterService.selectedFilter$.subscribe(filter => {
      this.selectedFilter = filter;
      console.log('Filtre actuel:', filter?.label);
      this.applyFilter();
    });

    // 🔹 2. Récupération de toutes les équipes
    this.teamSub = this.teamService.getAllTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
        this.applyFilter();
      },
      error: (err) => console.error('Erreur lors du chargement des équipes:', err)
    });
  }

  /**
   * 🔹 Crée une nouvelle équipe
   */
  createTeam() {
    const name = prompt('Nom de l’équipe :');
    const field = prompt('Domaine :');
    const description = prompt('Description :');

    if (!name || !field || !description) {
      console.warn('Création annulée — champs manquants');
      return;
    }

    this.teamService.createTeam(name, field, description).subscribe({
      next: (newTeam) => {
        console.log('Équipe créée :', newTeam);
        this.teams.push(newTeam);
        this.applyFilter();
      },
      error: (err) => console.error('Erreur lors de la création de l’équipe :', err)
    });
  }

  /**
   * 🔹 Filtre les équipes selon le filtre sélectionné
   */
  applyFilter() {
    this.filteredTeams = this.teams.filter(team =>
      team.field.toLowerCase() === this.selectedFilter!.label.toLowerCase()
    );
  }

  ngOnDestroy() {
    this.filterSub?.unsubscribe();
    this.teamSub?.unsubscribe();
  }

  onSelectTeam(team: any) {
    console.log('Équipe sélectionnée :', team.name);
  }

  onAddMember(team: any) {
    console.log('Ajout d’un membre à :', team.name);
  }

  getManager(team: any) {
    return team.members.find((m: any) => m.role === 'manager');
  }

  
}
