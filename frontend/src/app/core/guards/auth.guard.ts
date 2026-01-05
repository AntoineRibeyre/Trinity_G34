import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
@Injectable({
  providedIn: 'root'
})
//Permet de vérifier si les utilisateurs sont connectés
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private userService: UserService, private router: Router) {}

  async canActivate(route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot): Promise<boolean> {
    const isAuth = await this.authService.isAuthenticated();
    if (!isAuth) {
      this.router.navigate(['/login']);
      return false;
    }

    // If route specifies required roles, enforce them
  const requiredRoles: string[] | undefined = route?.data?.['roles'] as string[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      // Ensure we have the current user loaded
      let currentUser = this.userService.currentUser;
      if (!currentUser) {
        currentUser = await this.userService.loadCurrentUserFromServer();
      }

      const userRole = (currentUser?.role || '').toLowerCase();
      const allowed = requiredRoles.map(r => r.toLowerCase()).includes(userRole);
      if (!allowed) {
        // Not authorized for this role – redirect to dashboard
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    return true;
  }
}
