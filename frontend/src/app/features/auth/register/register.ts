import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule, TranslateModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

}
