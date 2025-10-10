import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule, TranslateModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  constructor(private router: Router) {
  }
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

}
