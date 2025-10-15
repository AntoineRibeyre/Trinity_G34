import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {
  registerForm!: FormGroup;  // ✅ Utilisation du ! pour indiquer qu'il sera initialisé
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  // Initialisation dans ngOnInit plutôt que dans le constructeur, pour s'assurer que tout soit prêt
  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit(): Promise<void> {
  if (this.registerForm.valid) {
    this.isLoading = true;
    this.errorMessage = '';

    const { firstName, lastName, email, telephone, password } = this.registerForm.value;
    const role = 'employe';
    const username = firstName;

    try {
      const response = await this.authService.register(username, firstName, lastName, email, telephone, password, role);
      this.isLoading = false;
      console.log('Inscription réussie:', response);
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error.message || "Erreur lors de l'inscription.";
      console.error('Erreur inscription:', error);
    }
  } else {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
    this.errorMessage = 'Veuillez remplir tous les champs correctement.';
  }
}

}