import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {SideNav} from '../../shared/components/side-nav/side-nav';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    SideNav,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {

}
