import { Component } from '@angular/core';
import {TranslateModule, TranslatePipe} from '@ngx-translate/core';
import {Router} from '@angular/router';
import {ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [TranslateModule, TranslatePipe, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  isAuthenticated = true;

  constructor(private router: Router) {
  }

  navigateToRegister(): void {
     this.router.navigate(['/register']);
  }

}
