import { Component } from '@angular/core';
import { HeaderFilters } from './header-filters/header-filters';

import {RouterOutlet} from '@angular/router';


@Component({
  selector: 'app-admin',
  imports: [ HeaderFilters, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {

}
