import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnackBarService, SnackBarConfig } from '../../../services/snackbar.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './snackbar.html',
  styleUrls: ['./snackbar.css']
})
export class SnackBarComponent implements OnInit, OnDestroy {
  private snackBarService = inject(SnackBarService);
  private subscription?: Subscription;
  private timeoutId?: number;

  config: SnackBarConfig | null = null;
  isVisible = false;

  ngOnInit(): void {
    this.subscription = this.snackBarService.snackBar$.subscribe((config) => {
      if (config) {
        this.show(config);
      } else {
        this.hide();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private show(config: SnackBarConfig): void {
    // Annuler le timeout précédent s'il existe
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.config = config;
    this.isVisible = true;

    // Fermeture automatique si une durée est définie
    if (config.duration && config.duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.hide();
      }, config.duration);
    }
  }

  private hide(): void {
    this.isVisible = false;
    // Attendre la fin de l'animation avant de supprimer le config
    setTimeout(() => {
      if (!this.isVisible) {
        this.config = null;
      }
    }, 300);
  }

  close(): void {
    this.snackBarService.hide();
  }

  getIconClass(): string {
    if (!this.config) return '';
    
    switch (this.config.type) {
      case 'success':
        return 'icon-success';
      case 'error':
        return 'icon-error';
      case 'warning':
        return 'icon-warning';
      case 'info':
        return 'icon-info';
      default:
        return 'icon-info';
    }
  }
}

