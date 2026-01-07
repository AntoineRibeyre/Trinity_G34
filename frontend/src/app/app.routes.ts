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
import { EmployeeList } from './features/main-layout/admin/employee-list/employee-list';
import { TeamList } from './features/main-layout/admin/team-list/team-list';

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
      { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard],  data: { roles: ['manager','employe'] }  },
      { path: 'calendar', component: Scheduler, canActivate: [AuthGuard],  data: { roles: ['manager','employe'] } },//calendar/congés
      { path: 'team', component: Team, canActivate: [AuthGuard], data: { roles: ['manager'] } },//team (manager only)
      { path: 'settings', component: Settings, canActivate: [AuthGuard] },
      {
        path: 'admin',
        component: Admin,
        canActivate: [AuthGuard],
        data: { roles: ['admin'] },
        children: [
          { path: 'users', component: EmployeeList, canActivate: [AuthGuard] },
          { path: 'teams', component: TeamList, canActivate: [AuthGuard] }
        ]
      }

    ]
  },
  {path: '**', redirectTo: '' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
