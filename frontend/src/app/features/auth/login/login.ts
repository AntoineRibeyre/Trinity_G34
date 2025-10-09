import { Component } from '@angular/core';
import {TranslateModule, TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [TranslateModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

}
