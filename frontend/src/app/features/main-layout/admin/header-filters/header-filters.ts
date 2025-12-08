import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { FilterService } from '../../../../services/filter.service';

interface Filter{
  label: string;
  route: string;
}



@Component({
  selector: 'app-header-filters',
  templateUrl: './header-filters.html',
  styleUrls: ['./header-filters.css'],
})


export class HeaderFilters implements OnInit{
  currentRoute: string = '';

  tous_filter: Filter = {label:'Tous',route:"admin/users"}
  commerce_filter: Filter = {label:'Commerce',route:"admin/teams"}
  finance_filter: Filter = {label:'Finance',route:"admin/teams"}
  design_filter: Filter = {label:'Design',route:"admin/teams"}

  @Input() filters: Filter[] = [this.tous_filter,this.commerce_filter,this.finance_filter,this.design_filter];
  @Input() selectedFilter: Filter | null = this.tous_filter;
  @Output() filterChange = new EventEmitter<string>();


  constructor(private router: Router, private filterService: FilterService) {
      this.currentRoute = this.router.url;
    }
  ngOnInit(): void {
    this.selectedFilter = this.filterService.getSelectedFilter();
    console.log(this.selectedFilter)
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
}
