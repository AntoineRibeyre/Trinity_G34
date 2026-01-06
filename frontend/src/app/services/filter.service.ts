import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Filter {
  label: string;
  route: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private selectedFilterSubject: BehaviorSubject<Filter | null>;
  selectedFilter$; // on la déclare ici, mais on l’initialise plus bas

  constructor() {
    // Récupération du filtre depuis le localStorage au démarrage
    const savedFilter = localStorage.getItem('selectedFilter');
    const initialFilter: Filter | null = savedFilter ? JSON.parse(savedFilter) : null;

    // On initialise le BehaviorSubject ici
    this.selectedFilterSubject = new BehaviorSubject<Filter | null>(initialFilter);

    // Et on crée l’observable après
    this.selectedFilter$ = this.selectedFilterSubject.asObservable();
  }

  /** Met à jour le filtre et le sauvegarde dans localStorage */
  setSelectedFilter(filter: Filter) {
    this.selectedFilterSubject.next(filter);
    localStorage.setItem('selectedFilter', JSON.stringify(filter));
  }

  /** Retourne le filtre actuellement sélectionné */
  getSelectedFilter(): Filter | null {
    const saved = localStorage.getItem('selectedFilter');
    return saved ? JSON.parse(saved) as Filter : null;
  }


  /** Supprime le filtre sélectionné (et le localStorage associé) */
  clearSelectedFilter() {
    this.selectedFilterSubject.next(null);
    localStorage.removeItem('selectedFilter');
  }
}
