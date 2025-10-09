import { Component } from '@angular/core';
import {NgIf} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  imports: [
    NgIf, TranslateModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
