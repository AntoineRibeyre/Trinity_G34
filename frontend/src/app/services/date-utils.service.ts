import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {
  /**
   * Formate une date pour l'affichage (format DD/MM/YYYY)
   * @param date La date à formater
   * @returns La chaîne formatée (ex: "15/01/2026")
   */
  formatDateForDisplay(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Formate une date pour un nom de fichier (format YYYYMMDD)
   * @param date La date à formater
   * @returns La chaîne formatée (ex: "20260115")
   */
  formatDateForFileName(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}${month}${day}`;
  }

  /**
   * Formate une date pour un input HTML (format YYYY-MM-DD)
   * @param date La date à formater
   * @returns La chaîne formatée (ex: "2026-01-15")
   */
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

