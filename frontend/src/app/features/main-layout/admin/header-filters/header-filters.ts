import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';

interface Filter{
  label: string;
  route: string;
}



@Component({
  selector: 'app-header-filters',
  templateUrl: './header-filters.html',
  styleUrls: ['./header-filters.css'],
})


export class HeaderFilters {
  currentRoute: string = '';

  tous_filter: Filter = {label:'Tous',route:"admin/users"}
  commerce_filter: Filter = {label:'Commerce',route:"admin/teams"}
  finance_filter: Filter = {label:'Finance',route:"admin/teams"}
  design_filter: Filter = {label:'Design',route:"admin/teams"}

  @Input() filters: Filter[] = [this.tous_filter,this.commerce_filter,this.finance_filter,this.design_filter];
  @Input() selectedFilter: Filter = this.tous_filter;
  @Output() filterChange = new EventEmitter<string>();


  constructor(private router: Router) {
      this.currentRoute = this.router.url;
    }

  
  

  selectFilter(filter: Filter) {
    this.selectedFilter = filter;
    this.filterChange.emit(filter.label);
    this.router.navigate([filter.route]);
    this.currentRoute = `/${filter.route}`;
  }
}
