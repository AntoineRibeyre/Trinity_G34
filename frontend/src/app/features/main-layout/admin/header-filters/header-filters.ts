import {Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import { Router } from '@angular/router';
import { FilterService } from '../../../../services/filter.service';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

interface Filter{
  label: string;
  route: string;
  value: string;
}

@Component({
  selector: 'app-header-filters',
  templateUrl: './header-filters.html',
  styleUrls: ['./header-filters.css'],
})

export class HeaderFilters implements OnInit, OnDestroy {
  currentRoute: string = '';
  translate: TranslateService = inject(TranslateService);
  tous_filter: Filter = {label:this.translate.instant('ADMIN.ALL.ALL-EMPLOYEES'),route:"admin/users", value:"tous"}
  commerce_filter: Filter = {label:this.translate.instant('ADMIN.ALL.SALES'),route:"admin/teams", value:"commerce"}
  finance_filter: Filter = {label:this.translate.instant('ADMIN.ALL.FINANCE'),route:"admin/teams", value:"finance"}
  design_filter: Filter = {label:this.translate.instant('ADMIN.ALL.DESIGN'),route:"admin/teams", value:"design"}

  @Input() filters: Filter[] = [this.tous_filter,this.commerce_filter,this.finance_filter,this.design_filter];
  @Input() selectedFilter: Filter | null = this.tous_filter;
  @Output() filterChange = new EventEmitter<string>();


  constructor(private router: Router, private filterService: FilterService) {
      this.currentRoute = this.router.url;
    }
  ngOnInit(): void {
    this.selectedFilter = this.filterService.getSelectedFilter();
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
