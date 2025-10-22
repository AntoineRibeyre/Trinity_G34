import { Component } from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-team-column',
    imports: [
        NgForOf,
        NgIf
    ],
  templateUrl: './team-column.html',
  styleUrl: './team-column.css'
})
export class TeamColumn {

}
