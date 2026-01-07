import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Employee } from './team.service';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  private readonly DEFAULT_AVATAR = 'assets/avatar/avatar-1.svg';
  private readonly MAX_AVATAR_ID = 18;

  /**
   * Retourne le chemin de l'avatar pour un utilisateur
   * @param user L'utilisateur pour lequel récupérer l'avatar
   * @returns Le chemin vers l'image de l'avatar
   */
  getAvatarPath(user: User | null): string {
    if (!user) {
      return this.DEFAULT_AVATAR;
    }

    const key = `avatar_${user.id}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      const id = Number(saved);
      if (id >= 1 && id <= this.MAX_AVATAR_ID) {
        return `assets/avatar/avatar-${id}.svg`;
      }
    }

    const seed =
      user.id ||
      user.email ||
      `${user.firstName}${user.lastName}`;

    return this.generateAvatarFromSeed(seed);
  }

  /**
   * Retourne le chemin de l'avatar pour un employé
   * @param employee L'employé pour lequel récupérer l'avatar
   * @returns Le chemin vers l'image de l'avatar
   */
  getAvatarPathForEmployee(employee: Employee | null | undefined): string {
    if (!employee || !employee.id) {
      return this.DEFAULT_AVATAR;
    }

    const key = `avatar_${employee.id}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      const id = Number(saved);
      if (id >= 1 && id <= this.MAX_AVATAR_ID) {
        return `assets/avatar/avatar-${id}.svg`;
      }
    }

    // Utiliser l'ID ou le nom pour générer un hash
    const seed =
      employee.id?.toString() ||
      (employee as any).email ||
      `${employee.firstName}${employee.lastName}`;

    return this.generateAvatarFromSeed(seed);
  }

  /**
   * Génère un chemin d'avatar à partir d'une graine (seed)
   * @param seed La chaîne de caractères utilisée pour générer le hash
   * @returns Le chemin vers l'image de l'avatar
   */
  private generateAvatarFromSeed(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % this.MAX_AVATAR_ID + 1;
    return `assets/avatar/avatar-${index}.svg`;
  }
}

