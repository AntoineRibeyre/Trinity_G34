import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validateur pour vérifier que le mot de passe et la confirmation correspondent
 */
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

/**
 * Validateur pour vérifier la force du mot de passe
 * Le mot de passe doit contenir :
 * - Au moins 6 caractères
 * - Au moins une lettre majuscule
 * - Au moins une lettre minuscule
 * - Au moins un chiffre
 */
export function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null;
  }

  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);

  const passwordValid = hasUppercase && hasLowercase && hasDigit;

  return passwordValid ? null : { passwordStrength: true };
}

