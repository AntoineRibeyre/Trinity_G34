/**
 * Interface pour les pré-requis du mot de passe
 */
export interface PasswordRequirement {
  label: string;
  key: string;
}

/**
 * Liste des pré-requis du mot de passe
 */
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'Minimum 6 caractères', key: 'minLength' },
  { label: 'Au moins une lettre majuscule', key: 'uppercase' },
  { label: 'Au moins une lettre minuscule', key: 'lowercase' },
  { label: 'Au moins un chiffre', key: 'digit' },
];

/**
 * Vérifie si un pré-requis de mot de passe est respecté
 * @param password - Le mot de passe à vérifier
 * @param requirement - La clé du pré-requis ('minLength', 'uppercase', 'lowercase', 'digit')
 * @returns true si le pré-requis est respecté, false sinon
 */
export function isRequirementMet(password: string | null | undefined, requirement: string): boolean {
  if (!password) {
    return false;
  }

  switch (requirement) {
    case 'minLength':
      return password.length >= 6;
    case 'uppercase':
      return /[A-Z]/.test(password);
    case 'lowercase':
      return /[a-z]/.test(password);
    case 'digit':
      return /[0-9]/.test(password);
    default:
      return false;
  }
}

