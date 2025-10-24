import { Component } from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-team-column',
  imports: [
    NgForOf,
    NgIf,
    TranslatePipe
  ],
  templateUrl: './team-column.html',
  styleUrl: './team-column.css'
})
export class TeamColumn {

}
