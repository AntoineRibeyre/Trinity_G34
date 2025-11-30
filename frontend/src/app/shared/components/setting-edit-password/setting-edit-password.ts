import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

// Validator : mot de passe = confirmation
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
}

// Validator : force du mot de passe
function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value || '';

  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  const minLength = value.length >= 6;

  const valid = hasUppercase && hasLowercase && hasDigit && minLength;

  return valid ? null : { passwordStrength: true };
}

@Component({
  selector: 'app-setting-edit-password',
  standalone: true,
  templateUrl: './setting-edit-password.html',
  styleUrls: ['./setting-edit-password.css'],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule]
})
export class SettingEditPassword {

  form: FormGroup;
  hidePassword = true;
  hideConfirm = true;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      confirm: string;
      cancel: string;
      onConfirm: (dialogRef: MatDialogRef<any>, newPassword: string) => void;
      onCancel: (dialogRef: MatDialogRef<any>) => void;
    },
    private dialogRef: MatDialogRef<SettingEditPassword>,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, passwordStrengthValidator]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordMatchValidator }
    );
  }

  // Vérifie si un prérequis est rempli
  checkRequirement(requirement: string): boolean {
    const pwd = this.form.get('password')?.value || '';

    switch (requirement) {
      case 'minLength': return pwd.length >= 6;
      case 'uppercase': return /[A-Z]/.test(pwd);
      case 'lowercase': return /[a-z]/.test(pwd);
      case 'digit': return /[0-9]/.test(pwd);
      default: return false;
    }
  }

  // Bouton "Confirmer"
  confirm() {
    if (this.form.valid) {
      this.data.onConfirm(this.dialogRef, this.form.get('password')?.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancel() {
    this.data.onCancel(this.dialogRef);
  }
}
