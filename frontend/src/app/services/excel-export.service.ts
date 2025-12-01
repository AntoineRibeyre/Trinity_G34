import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }

  /**
   * Exporte des données en fichier Excel
   * @param data - Tableau d'objets à exporter
   * @param fileName - Nom du fichier (sans extension)
   * @param sheetName - Nom de la feuille (optionnel)
   */
  exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1'): void {
    // Crée une nouvelle feuille de calcul à partir des données
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // Ajuste automatiquement la largeur des colonnes
    const columnWidths = this.calculateColumnWidths(data);
    worksheet['!cols'] = columnWidths;

    // Crée un nouveau classeur
    const workbook: XLSX.WorkBook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName]
    };

    // Génère le fichier Excel et le télécharge
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Exporte plusieurs feuilles dans un seul fichier Excel
   * @param sheets - Tableau d'objets contenant les données et noms de feuilles
   * @param fileName - Nom du fichier
   */
  exportMultipleSheets(
    sheets: { data: any[], sheetName: string }[],
    fileName: string
  ): void {
    const workbook: XLSX.WorkBook = { Sheets: {}, SheetNames: [] };

    sheets.forEach(sheet => {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sheet.data);

      // Ajuste la largeur des colonnes
      const columnWidths = this.calculateColumnWidths(sheet.data);
      worksheet['!cols'] = columnWidths;

      workbook.Sheets[sheet.sheetName] = worksheet;
      workbook.SheetNames.push(sheet.sheetName);
    });

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Exporte avec des colonnes personnalisées
   * @param data - Données à exporter
   * @param columns - Configuration des colonnes
   * @param fileName - Nom du fichier
   * @param sheetName - Nom de la feuille
   */
  exportWithCustomColumns(
    data: any[],
    columns: { header: string, key: string, width?: number }[],
    fileName: string,
    sheetName: string = 'Sheet1'
  ): void {
    // Transforme les données selon les colonnes définies
    const transformedData = data.map(item => {
      const row: any = {};
      columns.forEach(col => {
        row[col.header] = item[col.key] || '';
      });
      return row;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(transformedData);

    // Applique les largeurs de colonnes personnalisées
    if (columns.some(col => col.width)) {
      worksheet['!cols'] = columns.map(col => ({
        wch: col.width || 15
      }));
    }

    const workbook: XLSX.WorkBook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName]
    };

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Calcule automatiquement la largeur optimale des colonnes
   */
  private calculateColumnWidths(data: any[]): { wch: number }[] {
    if (!data || data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const widths: { wch: number }[] = [];

    keys.forEach(key => {
      // Trouve la longueur maximale pour chaque colonne
      const maxLength = Math.max(
        key.length, // Longueur du header
        ...data.map(row => {
          const value = row[key];
          return value ? String(value).length : 0;
        })
      );

      // Ajoute un peu de padding et limite la largeur max
      widths.push({ wch: Math.min(maxLength + 2, 50) });
    });

    return widths;
  }
}
