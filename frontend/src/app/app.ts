import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {SideNav} from './shared/components/side-nav/side-nav';
import {Home} from './features/home/home';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SideNav, Home],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
