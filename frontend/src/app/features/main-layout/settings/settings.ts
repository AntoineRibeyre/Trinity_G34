import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { LanguageService } from '../../../services/lang.service';
import { Subscription } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { BasicTextButton } from '../../../shared/components/basic-text-button/basic-text-button';
import { MatDialog } from '@angular/material/dialog';
import { SettingEditPassword } from '../../../shared/components/setting-edit-password/setting-edit-password';
import {AvatarComponent} from '../../../shared/components/avatar/avatar';
import {AvatarDialog} from '../../../shared/components/avatar-dialog/avatar-dialog';
import { AvatarService } from '../../../services/avatar.service';
import { SnackBarService } from '../../../services/snackbar.service';

/* ================= VALIDATORS ================= */

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) return null;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const valid =
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    value.length >= 6;

  return valid ? null : { passwordStrength: true };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    BasicTextButton
  ],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class Settings implements OnInit, OnDestroy {

  settingsForm!: FormGroup;
  currentUser: User | null = null;

  currentLanguage = '';
  availableLanguages: Array<{ code: string; label: string }> = [];
  private languageSubscription?: Subscription;

  isLoading = false;

  /* ================= SELECT OPTIONS ================= */

  familyStatusOptions = [
    { value: 'single', label: 'SETTINGS.FAMILY_STATUS.SINGLE' },
    { value: 'married', label: 'SETTINGS.FAMILY_STATUS.MARRIED' },
    { value: 'divorced', label: 'SETTINGS.FAMILY_STATUS.DIVORCED' },
    { value: 'widowed', label: 'SETTINGS.FAMILY_STATUS.WIDOW' },
    {value: 'marital', label: 'SETTINGS.FAMILY_STATUS.MARITAL' },
    {value: 'unknown', label: 'SETTINGS.FAMILY_STATUS.UNKNOWN' },
    {value: 'civil partnership', label: 'SETTINGS.FAMILY_STATUS.CIVIL_PARTNERSHIP' },
    {value: 'separate', label: 'SETTINGS.FAMILY_STATUS.SEPARATE' },
  ];

  titleOptions = [
    { value: 'M', label: 'SETTINGS.TITLE.MR' },
    { value: 'Mme', label: 'SETTINGS.TITLE.MRS' },
    { value: 'Mms', label: 'SETTINGS.TITLE.MS' }
  ];

  constructor(
    private fb: FormBuilder,
    private languageService: LanguageService,
    private userService: UserService,
    private dialog: MatDialog,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef,
    private avatarService: AvatarService,
    private snackBarService: SnackBarService
  ) {}

  /* ================= INIT ================= */

  async ngOnInit(): Promise<void> {
    this.initForm();

    this.availableLanguages = this.languageService.getAvailableLanguages();
    this.currentLanguage = this.languageService.getCurrentLanguage();

    this.languageSubscription =
      this.languageService.currentLanguage$.subscribe(
        lang => (this.currentLanguage = lang)
      );

    this.currentUser = await this.userService.loadCurrentUserFromServer();

    if (this.currentUser) {
      this.patchUserData(this.currentUser);
    }
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
  }

  /* ================= FORM INIT ================= */

  private initForm(): void {
    this.settingsForm = this.fb.group(
      {
        /* READONLY */
        firstName: [{ value: '', disabled: true }],
        lastName: [{ value: '', disabled: true }],
        email: [{ value: '', disabled: true }],

        contractType: [{ value: '', disabled: true }],
        socialSecurityNumber: [{ value: '', disabled: true }],
        annualSalary: [{ value: '', disabled: true }],
        arrivalDate: [{ value: '', disabled: true }],
        leaveBalance: [{ value: '', disabled: true }],

        /* EDITABLE */
        telephone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
        personalEmail: ['', Validators.email],
        familyStatus: [''],

        iban: [
          '',
          [
            Validators.pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/)
          ]
        ],

        password: ['', passwordStrengthValidator],
        confirmPassword: [''],

        address: this.fb.group({
          streetNumber: [''],
          streetName: [''],
          city: [''],
          postalCode: ['', [Validators.pattern(/^[0-9]{5}$/)]],
          country: ['']
        }),

        emergencyContact: this.fb.group({
          title: [''],
          firstName: [''],
          lastName: [''],
          relation: [''],
          phone: ['', [Validators.pattern(/^[0-9]{10}$/)]]
        })
      },
      { validators: passwordMatchValidator }
    );
  }

  /* ================= PATCH USER ================= */

  private patchUserData(user: User): void {
    // Transformer l'adresse du backend vers le formulaire
    const addressFormData: any = {};
    if (user.address) {
      addressFormData.streetNumber = user.address.number || '';
      addressFormData.streetName = user.address.street || '';
      addressFormData.city = user.address.city || '';
      addressFormData.postalCode = user.address.postalCode || '';
      addressFormData.country = user.address.state || '';
    }

    // Transformer le contact d'urgence du backend vers le formulaire
    const emergencyContactFormData: any = {};
    if (user.emergencyContact) {
      emergencyContactFormData.title = user.emergencyContact.courtesy || '';
      emergencyContactFormData.firstName = user.emergencyContact.firstName || '';
      emergencyContactFormData.lastName = user.emergencyContact.lastName || '';
      emergencyContactFormData.relation = user.emergencyContact.relation || '';
      emergencyContactFormData.phone = user.emergencyContact.phoneNumber || '';
    }

    this.settingsForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      telephone: user.telephone || '',

      personalEmail: user.personalEmail || '',
      familyStatus: user.familySituation || '',
      iban: user.rib || '',

      contractType: user.contract || '',
      socialSecurityNumber: user.socialNumber || '',
      annualSalary: user.annualSalary || '',
      arrivalDate: user.arrivalDate || '',
      leaveBalance: user.leaves || '',

      address: addressFormData,
      emergencyContact: emergencyContactFormData
    });
  }

  /* ================= SUBMIT ================= */

  private transformPayload(formValue: any): any {
    const payload: any = {};

    // Mapper les champs simples
    if (formValue.telephone !== undefined && formValue.telephone !== '') {
      payload.telephone = formValue.telephone;
    }
    if (formValue.personalEmail !== undefined && formValue.personalEmail !== '') {
      payload.personalEmail = formValue.personalEmail;
    }
    if (formValue.familyStatus !== undefined && formValue.familyStatus !== '') {
      payload.familySituation = formValue.familyStatus;
    }
    if (formValue.iban !== undefined && formValue.iban !== '') {
      payload.rib = formValue.iban;
    }

    // Transformer l'adresse
    if (formValue.address) {
      const address: any = {};
      let hasAddressData = false;

      if (formValue.address.streetNumber) {
        address.number = formValue.address.streetNumber;
        hasAddressData = true;
      }
      if (formValue.address.streetName) {
        address.street = formValue.address.streetName;
        hasAddressData = true;
      }
      if (formValue.address.city) {
        address.city = formValue.address.city;
        hasAddressData = true;
      }
      if (formValue.address.postalCode) {
        address.postalCode = formValue.address.postalCode;
        hasAddressData = true;
      }
      if (formValue.address.country) {
        address.state = formValue.address.country;
        hasAddressData = true;
      }

      if (hasAddressData) {
        payload.address = address;
      }
    }

    // Transformer le contact d'urgence
    if (formValue.emergencyContact) {
      const emergencyContact: any = {};
      let hasEmergencyData = false;

      if (formValue.emergencyContact.title) {
        emergencyContact.courtesy = formValue.emergencyContact.title;
        hasEmergencyData = true;
      }
      if (formValue.emergencyContact.firstName) {
        emergencyContact.firstName = formValue.emergencyContact.firstName;
        hasEmergencyData = true;
      }
      if (formValue.emergencyContact.lastName) {
        emergencyContact.lastName = formValue.emergencyContact.lastName;
        hasEmergencyData = true;
      }
      if (formValue.emergencyContact.relation) {
        emergencyContact.relation = formValue.emergencyContact.relation;
        hasEmergencyData = true;
      }
      if (formValue.emergencyContact.phone) {
        emergencyContact.phoneNumber = formValue.emergencyContact.phone;
        hasEmergencyData = true;
      }

      if (hasEmergencyData) {
        payload.emergencyContact = emergencyContact;
      }
    }

    return payload;
  }

  async onSubmit(): Promise<void> {
    // Ne plus bloquer si le formulaire est invalide, mais marquer les champs touchés pour afficher les erreurs
    this.settingsForm.markAllAsTouched();

    this.isLoading = true;

    try {
      const formValue = this.settingsForm.value;
      const payload = this.transformPayload(formValue);

      // Ne pas envoyer le password si vide
      if (formValue.password && formValue.password !== '') {
        payload.password = formValue.password;
      }

      const updatedUser = await this.userService.updateUser(payload);

      if (updatedUser) {
        this.currentUser = updatedUser;
        this.settingsForm.patchValue({ password: '', confirmPassword: '' });
        this.settingsForm.markAsPristine();
        this.snackBarService.showSuccess('Modifications sauvegardées avec succès');
      }
    } catch (err) {
      console.error(err);
      this.snackBarService.showError('Erreur lors de la sauvegarde des modifications');
    }

    this.isLoading = false;
  }

  /* ================= HELPERS ================= */

  isInvalid(controlName: string): boolean {
    const control = this.settingsForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  /* ================= LANGUAGE ================= */

  changeLanguage(lang: string): void {
    this.languageService.setLanguage(lang);
    this.currentLanguage = lang;
  }

  /* ================= PASSWORD DIALOG ================= */

  openEditPassword(): void {
    this.dialog.open(SettingEditPassword, {
      data: {
        title: this.translateService.instant('SETTINGS.DIALOG.TITLE'),
        confirm: this.translateService.instant('BASE.EDIT'),
        cancel: this.translateService.instant('BASE.CANCEL'),
        onConfirm: async (dialogRef: any, newPassword: string) => {
          await this.userService.updateUser({ password: newPassword });
          dialogRef.close();
        },
        onCancel: (dialogRef: any) => dialogRef.close()
      }
    });
  }

  /* ================= AVATAR ================= */

  openAvatarDialog(): void {
    const dialogRef = this.dialog.open(AvatarDialog);

    dialogRef.afterClosed().subscribe((selectedAvatarId: number | undefined) => {
      if (selectedAvatarId && this.currentUser) {
        const key = `avatar_${this.currentUser.id}`;
        localStorage.setItem(key, selectedAvatarId.toString());
        this.currentUser = { ...this.currentUser };
        this.cdr.detectChanges();
      }
    });
  }

  getAvatarPath(): string {
    return this.avatarService.getAvatarPath(this.currentUser);
  }
}
