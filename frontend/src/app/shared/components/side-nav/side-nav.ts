import { Component } from '@angular/core';
import { NgOptimizedImage, NgFor } from '@angular/common';
import { Router } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  section: 'top' | 'bottom';
  isActive?: boolean;
}

@Component({
  selector: 'app-side-nav',
  imports: [NgOptimizedImage, NgFor],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css'
})
export class SideNav {
  currentRoute: string = '';

  menuItems: MenuItem[] = [
    {
      label: 'Logo',
      icon: '', // Vide pour le logo
      section: 'top'
    },
    {
      label: 'Accueil',
      icon: 'assets/icons/nav-home.svg',
      route: 'dashboard',
      section: 'top'
    },
    {
      label: 'Calendrier',
      icon: 'assets/icons/nav-calendar.svg',
      route: 'calendar',
      section: 'top'
    },
    {
      label: 'Équipe',
      icon: 'assets/icons/nav-team.svg',
      route: 'team',
      section: 'top'
    },
    {
      label: 'Paramètres',
      icon: 'assets/icons/nav-parameter.svg',
      route: 'settings',
      section: 'bottom'
    },
    {
      label: 'Déconnexion',
      icon: 'assets/icons/nav-exit.svg',
      section: 'bottom',
      action: () => this.logout()
    }
  ];

  constructor(private router: Router) {
    this.currentRoute = this.router.url;
  }

  get topItems(): MenuItem[] {
    return this.menuItems.filter(item => item.section === 'top');
  }

  get bottomItems(): MenuItem[] {
    return this.menuItems.filter(item => item.section === 'bottom');
  }

  navigateTo(route?: string): void {
    if (route) {
      this.router.navigate([route]);
      this.currentRoute = `/${route}`;
    }
  }

  handleItemClick(item: MenuItem): void {
    if (item.action) {
      item.action();
    } else if (item.route) {
      this.navigateTo(item.route);
    }
  }

  isActive(route?: string): boolean {
    return route ? this.currentRoute.includes(route) : false;
  }

  logout(): void {
    // Logique de déconnexion
    console.log('Déconnexion...');
    // this.authService.logout();
    this.router.navigate(['/login']);
  }
}
