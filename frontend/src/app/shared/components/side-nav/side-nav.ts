import { Component, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';

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
  imports: [NgOptimizedImage],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css'
})
export class SideNav implements OnInit{
  currentRoute: string = '';
  currentUser: User | null = null;

  menuItems: MenuItem[] = [
    {
      label: 'Logo',
      icon: 'assets/icons/PrimeBank-logo.svg',
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



  constructor(private router: Router, private authService: AuthService, private userService: UserService) {
    this.currentRoute = this.router.url;
  }
  async ngOnInit(): Promise<void> {
    this.currentUser = await this.userService.loadCurrentUserFromServer();
    if (this.currentUser?.role.toLowerCase() == "admin"){
      this.menuItems.push({
      label: 'Admin',
      icon: 'assets/icons/nav-admin.svg',
      route: 'admin/users',
      section: 'top'
    })
    }
    if (this.currentUser?.role.toLowerCase() == "manager"){
      this.menuItems.push({
      label: 'Équipe',
      icon: 'assets/icons/nav-team.svg',
      route: 'team',
      section: 'top'
    })
    }
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
    this.authService.logout();
    //this.router.navigate(['/login']);
  }
}
