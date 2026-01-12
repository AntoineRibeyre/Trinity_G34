import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'selectedLanguage';
  private readonly DEFAULT_LANGUAGE = 'fr';
  private readonly AVAILABLE_LANGUAGES = ['fr', 'en'];

  private currentLanguageSubject = new BehaviorSubject<string>(this.DEFAULT_LANGUAGE);
  public currentLanguage$: Observable<string> = this.currentLanguageSubject.asObservable();

  constructor(
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeLanguage();
  }

  /**
   * Initialise la langue au démarrage de l'application
   */
  private initializeLanguage(): void {
    // Définir les langues disponibles
    this.translate.addLangs(this.AVAILABLE_LANGUAGES);

    // Définir la langue par défaut
    this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);

    // Charger la langue sauvegardée ou utiliser celle du navigateur
    const savedLang = this.getSavedLanguage();
    const browserLang = this.translate.getBrowserLang();

    let langToUse = this.DEFAULT_LANGUAGE;

    // Priorité : langue sauvegardée > langue du navigateur > langue par défaut
    if (savedLang && this.isValidLanguage(savedLang)) {
      langToUse = savedLang;
    } else if (browserLang && this.isValidLanguage(browserLang)) {
      langToUse = browserLang;
    }

    this.setLanguage(langToUse);
  }

  /**
   * Récupère la langue sauvegardée dans le localStorage
   */
  private getSavedLanguage(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.STORAGE_KEY);
    }
    return null;
  }

  /**
   * Vérifie si une langue est valide
   */
  private isValidLanguage(lang: string): boolean {
    return this.AVAILABLE_LANGUAGES.includes(lang);
  }

  /**
   * Change la langue actuelle et la sauvegarde
   */
  public setLanguage(lang: string): void {
    if (!this.isValidLanguage(lang)) {
      // console.warn(`Langue invalide: ${lang}. Utilisation de ${this.DEFAULT_LANGUAGE}`);
      lang = this.DEFAULT_LANGUAGE;
    }

    this.translate.use(lang);
    this.currentLanguageSubject.next(lang);

    // Sauvegarder dans le localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, lang);
    }
  }

  /**
   * Récupère la langue actuelle
   */
  public getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  /**
   * Récupère les langues disponibles avec leurs labels
   */
  public getAvailableLanguages(): Array<{ code: string; label: string }> {
    return [
      { code: 'fr', label: 'Français' },
      { code: 'en', label: 'English' }
    ];
  }
}
