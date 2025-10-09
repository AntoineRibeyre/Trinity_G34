import { Routes, RouterModule} from '@angular/router';
import {NgModule} from '@angular/core';
import {Login} from './features/auth/login/login';
import {Register} from './features/auth/register/register';
import {Dashboard} from './features/dashboard/dashboard';
import {Settings} from './features/settings/settings';
import {Calendar} from './features/calendar/calendar';
import {Team} from './features/team/team';
import {Admin} from './features/admin/admin';
import {Home} from './features/home/home';

export const routes: Routes = [

  { path: '', component: Home}, //Accueil
  { path: 'login', component: Login },//login
  { path: 'register', component: Register },//register
  { path: 'dashboard', component: Dashboard },//dashboard
  { path: 'settings', component: Settings },//settings
  { path: 'calendar', component: Calendar },//calendar/congés
  { path: 'team', component: Team},//team (manager only)
  { path: 'admin', component: Admin},//admin (admin only)
  {path: '**', redirectTo: '' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
