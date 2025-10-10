import { Routes, RouterModule} from '@angular/router';
import {NgModule} from '@angular/core';
import {Login} from './features/auth/login/login';
import {Register} from './features/auth/register/register';
import {Dashboard} from './features/main-layout/dashboard/dashboard';
import {Settings} from './features/main-layout/settings/settings';
import {Calendar} from './features/main-layout/calendar/calendar';
import {Team} from './features/main-layout/team/team';
import {Admin} from './features/admin/admin';
import {Home} from './features/home/home';
import {MainLayout} from './features/main-layout/main-layout';

export const routes: Routes = [

  { path: '', component: Home}, //Accueil
  { path: 'login', component: Login },//login
  { path: 'register', component: Register },//register
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'calendar', component: Calendar },//calendar/congés
      { path: 'team', component: Team},//team (manager only)
      { path: 'admin', component: Admin},//admin (admin only)
      { path: 'settings', component: Settings }
    ]
  },
  {path: '**', redirectTo: '' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
