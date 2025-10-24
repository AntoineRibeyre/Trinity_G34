import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Filter {
  label: string;
  route: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private selectedFilterSubject = new BehaviorSubject<Filter | null>(null);
  selectedFilter$ = this.selectedFilterSubject.asObservable();

  setSelectedFilter(filter: Filter) {
    this.selectedFilterSubject.next(filter);
  }

  getSelectedFilter(): Filter | null {
    return this.selectedFilterSubject.value;
  }
}