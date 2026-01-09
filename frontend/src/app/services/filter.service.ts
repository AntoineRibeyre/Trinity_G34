import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export interface Filter {
  label: string;
  route: string;
  value: string;
  teamExists?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private translate: TranslateService = inject(TranslateService);
  
  private availableFilters: Filter[] = [
    {label: this.translate.instant('ADMIN.ALL.ALL-EMPLOYEES'), route: "admin/users", value: "tous", teamExists: true},
    {label: this.translate.instant('ADMIN.ALL.OPERATIONS'), route: "admin/teams", value: "operations_bancaires"},
    {label: this.translate.instant('ADMIN.ALL.HR'), route: "admin/teams", value: "rh"},
    {label: this.translate.instant('ADMIN.ALL.RELATIONS'), route: "admin/teams", value: "relations_clients"},
    {label: this.translate.instant('ADMIN.ALL.FINANCE'), route: "admin/teams", value: "finance_compta"},
    {label: this.translate.instant('ADMIN.ALL.MARKETING'), route: "admin/teams", value: "marketing"},
    {label: this.translate.instant('ADMIN.ALL.AUDIT-CONTROLE'), route: "admin/teams", value: "audit_controle"},
    {label: this.translate.instant('ADMIN.ALL.IT'), route: "admin/teams", value: "informatique"},
    {label: this.translate.instant('ADMIN.ALL.JURIDIQUE'), route: "admin/teams", value: "juridique"},
    {label: this.translate.instant('ADMIN.ALL.DIRECTION-STRATEGIE'), route: "admin/teams", value: "direction_strategie"},

  ];
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

  /** Retourne tous les filtres disponibles */
  getAllFilters(): Filter[] {
    return [...this.availableFilters];
  }
}
