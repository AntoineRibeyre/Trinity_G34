import { Routes, RouterModule} from '@angular/router';
import {NgModule} from '@angular/core';
import {Login} from './features/auth/login/login';
import {Register} from './features/auth/register/register';
import {Dashboard} from './features/main-layout/dashboard/dashboard';
import {Settings} from './features/main-layout/settings/settings';
import {Calendar} from './features/main-layout/calendar/calendar';
import {Team} from './features/main-layout/team/team';
import {Admin} from './features/main-layout/admin/admin';
import {Home} from './features/home/home';
import {MainLayout} from './features/main-layout/main-layout';
import { AuthGuard } from './core/guards/auth.guard';
import { Scheduler } from './features/main-layout/scheduler/scheduler';

export const routes: Routes = [
  //pages publiques
  { path: '', component: Home}, //Accueil
  { path: 'login', component: Login },//login
  { path: 'register', component: Register },//register
  {
    path: '',
    component: MainLayout,
    // Pages protégées (authentification requise)
    children: [
      { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
      { path: 'calendar', component: Scheduler, canActivate: [AuthGuard] },//calendar/congés
      { path: 'team', component: Team, canActivate: [AuthGuard]},//team (manager only)
      { path: 'admin', component: Admin, canActivate: [AuthGuard]},//admin (admin only)
      { path: 'settings', component: Settings, canActivate: [AuthGuard] },
    ]
  },
  {path: '**', redirectTo: '' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
