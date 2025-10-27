import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '../../../services/lang.service';
import { Subscription } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';

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
  isLoading = false;
  currentUser: User | null = null;

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
      password: [''], // Password optionnel - seulement si l'utilisateur veut le changer
    });
  }

  async ngOnInit(): Promise<void> {
    // Récupérer les langues disponibles
    this.availableLanguages = this.languageService.getAvailableLanguages();

    // S'abonner aux changements de langue
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });

    // Charger les données du user
    this.currentUser = await this.userService.loadCurrentUserFromServer();
    if (this.currentUser) {
      // Remplir le formulaire avec les données de l'utilisateur
      this.settingsForm.patchValue({
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        email: this.currentUser.email || '',
        // Ne jamais pré-remplir le mot de passe
      });
    }
  }

  ngOnDestroy(): void {
    // Nettoyer l'abonnement
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
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

    this.languageService.setLanguage(lang);
  }

  /**
   * Soumet le formulaire et met à jour l'utilisateur dans la BDD
   */
  async onSubmit(): Promise<void> {
    if (this.settingsForm.valid) {
      this.isLoading = true;

      try {
        const formData = { ...this.settingsForm.value };

        // Si le mot de passe est vide, ne pas l'envoyer
        // (l'utilisateur garde son ancien mot de passe)
        if (!formData.password || formData.password.trim() === '') {
          delete formData.password;
        }

        // Appel à la mutation GraphQL via le service
        const updatedUser = await this.userService.updateUser(formData);

        if (updatedUser) {
          console.log('Utilisateur mis à jour avec succès:', updatedUser);

          // Mettre à jour currentUser local
          this.currentUser = updatedUser;

          // Notification de succès
          alert('Paramètres sauvegardés avec succès !');

          // Vider le champ mot de passe après la sauvegarde
          this.settingsForm.patchValue({ password: '' });

          // Marquer le formulaire comme pristine (non modifié)
          this.settingsForm.markAsPristine();
        }

      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        alert("Une erreur est survenue lors de la sauvegarde des paramètres.");
      } finally {
        this.isLoading = false;
      }
    } else {
      // Marquer tous les champs comme touched pour afficher les erreurs
      this.settingsForm.markAllAsTouched();
      console.warn('Formulaire invalide');
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
