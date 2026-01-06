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
    { value: 'widowed', label: 'SETTINGS.FAMILY_STATUS.WIDOWED' }
  ];

  titleOptions = [
    { value: 'mr', label: 'SETTINGS.TITLE.MR' },
    { value: 'mrs', label: 'SETTINGS.TITLE.MRS' },
    { value: 'ms', label: 'SETTINGS.TITLE.MS' }
  ];

  constructor(
    private fb: FormBuilder,
    private languageService: LanguageService,
    private userService: UserService,
    private dialog: MatDialog,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
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
        telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        personalEmail: ['', Validators.email],
        familyStatus: ['', Validators.required],

        iban: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/)
          ]
        ],

        password: ['', passwordStrengthValidator],
        confirmPassword: [''],

        address: this.fb.group({
          streetNumber: ['', Validators.required],
          streetName: ['', Validators.required],
          city: ['', Validators.required],
          postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
          country: ['', Validators.required]
        }),

        emergencyContact: this.fb.group({
          title: ['', Validators.required],
          firstName: ['', Validators.required],
          lastName: ['', Validators.required],
          relation: ['', Validators.required],
          phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
        })
      },
      { validators: passwordMatchValidator }
    );
  }

  /* ================= PATCH USER ================= */

  private patchUserData(user: User): void {
    this.settingsForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      telephone: user.telephone,

      personalEmail: user.personalEmail,
      familyStatus: user.familySituation,
      iban: user.rib,

      contractType: user.contract,
      socialSecurityNumber: user.socialNumber,
      annualSalary: user.annualSalary,
      arrivalDate: user.arrivalDate,
      leaveBalance: user.leaves,

      address: user.address,
      emergencyContact: user.emergencyContact
    });
  }

  /* ================= SUBMIT ================= */

  async onSubmit(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const payload = { ...this.settingsForm.value };

      if (!payload.password) {
        delete payload.password;
      }

      const updatedUser = await this.userService.updateUser(payload);

      if (updatedUser) {
        this.currentUser = updatedUser;
        this.settingsForm.patchValue({ password: '', confirmPassword: '' });
        this.settingsForm.markAsPristine();
      }
    } catch (err) {
      console.error(err);
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
    if (!this.currentUser) {
      return 'assets/avatar/avatar-1.svg';
    }

    const key = `avatar_${this.currentUser.id}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      const id = Number(saved);
      if (id >= 1 && id <= 18) {
        return `assets/avatar/avatar-${id}.svg`;
      }
    }

    const seed =
      this.currentUser.id ||
      this.currentUser.email ||
      `${this.currentUser.firstName}${this.currentUser.lastName}`;

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % 18 + 1;
    return `assets/avatar/avatar-${index}.svg`;
  }
}
