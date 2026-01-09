import {Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import { Router } from '@angular/router';
import { FilterService, Filter } from '../../../../services/filter.service';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import { Team } from '../../../../models/team.model';
import { TeamService } from '../../../../services/team.service';

@Component({
  selector: 'app-header-filters',
  templateUrl: './header-filters.html',
  styleUrls: ['./header-filters.css'],
})

export class HeaderFilters implements OnInit, OnDestroy {
  currentRoute: string = '';
  translate: TranslateService = inject(TranslateService);

  @Input() filters: Filter[] = [];
  @Input() selectedFilter: Filter | null = null;
  @Output() filterChange = new EventEmitter<string>();


  constructor(private router: Router, private filterService: FilterService, private teamService: TeamService) {
      this.currentRoute = this.router.url;
    }
  ngOnInit(): void {
    this.filters = this.filterService.getAllFilters();
    this.selectedFilter = this.filterService.getSelectedFilter();
    this.sortFilters();
  }

  selectFilter(filter: Filter) {
    this.selectedFilter = filter;
    this.filterService.setSelectedFilter(this.selectedFilter);
    this.filterChange.emit(filter.label);
    this.router.navigate([filter.route]);
    this.currentRoute = `/${filter.route}`;
  }

  ngOnDestroy(): void {
    this.filterService.clearSelectedFilter();
  }

  //Trie les filtres selon si des équipes existent pour chaque filtre : les filtres possédant des équipes sont placés en premier
  sortFilters():void {
    if (this.filters){
      const teams = this.teamService.getAllTeams()
      for (let filter of this.filters){
        teams.subscribe((teamList: Team[]) => {
          const teamExists = teamList.some(team => team.field.toLowerCase() === filter.value.toLowerCase());
          if (filter.value != 'tous'){
            if (teamExists ) {
              // Déplacer le filtre au début du tableau (après "tous")
              this.filters = this.filters.filter(f => f !== filter);
              // Insérer après le filtre "tous"
              const tousIndex = this.filters.findIndex(f => f.value === 'tous');
              this.filters.splice(tousIndex + 1, 0, filter);
              filter.teamExists = true;
            }
            else {
              filter.teamExists = false;
            }
          }  
          
        });
      }
      // S'assurer que "tous" est toujours en première position
      const tousFilter = this.filters.find(f => f.value === 'tous');
      if (tousFilter) {
        this.filters = this.filters.filter(f => f !== tousFilter);
        this.filters.unshift(tousFilter);
        tousFilter.teamExists = true;
      }
    }
  }
}
