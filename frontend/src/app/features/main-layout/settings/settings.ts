import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '../../../services/lang.service';
import { Subscription } from 'rxjs';
import {UserService} from '../../../services/user.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule
  ],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class Settings implements OnInit, OnDestroy {
  settingsForm: FormGroup;
  currentLanguage = 'en';
  availableLanguages: Array<{ code: string; label: string }> = [];

  private languageSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private languageService: LanguageService,
    private userService: UserService,
  ) {
    this.settingsForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Récupérer les langues disponibles
    this.availableLanguages = this.languageService.getAvailableLanguages();

    // S'abonner aux changements de langue
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });

    //Charger les données du user
    //this.loadUserData();
  }

  ngOnDestroy(): void {
    // Nettoyer l'abonnement
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  /**
   * Charge les données utilisateur
   */
  private loadUserData(): void {
    //
    const userData = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      password:'Pwd123'
    };

    this.settingsForm.patchValue(userData);
  }

  /**
   * Change la langue via le service
   */
  changeLanguage(event: Event | string): void {
    let lang: string;

    if (typeof event === 'string') {
      lang = event;
    } else {
      lang = (event.target as HTMLSelectElement).value;
    }

    // Utiliser le service pour changer la langue
    //  sera automatiquement sauvegardée dans le localStorage
    this.languageService.setLanguage(lang);
  }

  /**
   * Soumet le formulaire
   */
  async onSubmit(): Promise<void> {
  if (this.settingsForm.valid) {
    try {
      const updatedUser = await this.userService.updateUser(this.settingsForm.value);
      console.log('Utilisateur mis à jour:', updatedUser);
      alert('Paramètres sauvegardés avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert("Une erreur est survenue lors de la sauvegarde.");
    }
  } else {
    this.settingsForm.markAllAsTouched();
  }
}

  /**
   * Vérifie si un champ est invalide
   */
  isInvalid(controlName: string): boolean {
    const control = this.settingsForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
