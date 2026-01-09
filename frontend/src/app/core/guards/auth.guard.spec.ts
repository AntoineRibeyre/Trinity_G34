import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { User } from '../../models/user.model';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'employee',
    address: {},
    emergencyContact: {}
  };

  const mockManager: User = {
    ...mockUser,
    role: 'manager'
  };

  const mockAdmin: User = {
    ...mockUser,
    role: 'admin'
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['loadCurrentUserFromServer']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate - authentication', () => {
    it('should allow access when user is authenticated', async () => {
      authService.isAuthenticated.and.returnValue(Promise.resolve(true));

      const result = await guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to login when user is not authenticated', async () => {
      authService.isAuthenticated.and.returnValue(Promise.resolve(false));

      const result = await guard.canActivate(mockRoute, mockState);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('canActivate - role-based access', () => {
    beforeEach(() => {
      authService.isAuthenticated.and.returnValue(Promise.resolve(true));
    });

    it('should allow access when user has required role', async () => {
      const routeWithRole = {
        data: { roles: ['manager'] }
      } as unknown as ActivatedRouteSnapshot;

      userService.currentUser = mockManager;

      const result = await guard.canActivate(routeWithRole, mockState);

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should load user from server if not in service', async () => {
      const routeWithRole = {
        data: { roles: ['manager'] }
      } as unknown as ActivatedRouteSnapshot;

      userService.currentUser = null;
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(mockManager));

      const result = await guard.canActivate(routeWithRole, mockState);

      expect(userService.loadCurrentUserFromServer).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', async () => {
      const routeWithRole = {
        data: { roles: ['admin'] }
      } as unknown as ActivatedRouteSnapshot;

      userService.currentUser = mockUser;

      const result = await guard.canActivate(routeWithRole, mockState);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should deny access when user role is empty', async () => {
      const routeWithRole = {
        data: { roles: ['admin'] }
      } as unknown as ActivatedRouteSnapshot;

      userService.currentUser = { ...mockUser, role: '' };

      const result = await guard.canActivate(routeWithRole, mockState);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should allow access when no roles are required', async () => {
      const routeWithoutRole = {
        data: {}
      } as unknown as ActivatedRouteSnapshot;

      userService.currentUser = mockUser;

      const result = await guard.canActivate(routeWithoutRole, mockState);

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should allow access when route has no data', async () => {
      userService.currentUser = mockUser;

      const result = await guard.canActivate(mockRoute, mockState);

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive role comparison', async () => {
      const routeWithRole = {
        data: { roles: ['MANAGER'] }
      } as unknown as ActivatedRouteSnapshot;

      userService.currentUser = mockManager;

      const result = await guard.canActivate(routeWithRole, mockState);

      expect(result).toBe(true);
    });

    it('should handle multiple required roles', async () => {
      const routeWithRoles = {
        data: { roles: ['admin', 'manager'] }
      } as unknown as ActivatedRouteSnapshot;

      userService.currentUser = mockAdmin;

      const result = await guard.canActivate(routeWithRoles, mockState);

      expect(result).toBe(true);
    });

    it('should deny access when user role does not match any required role', async () => {
      const routeWithRoles = {
        data: { roles: ['admin', 'manager'] }
      } as unknown as ActivatedRouteSnapshot;

      userService.currentUser = mockUser;

      const result = await guard.canActivate(routeWithRoles, mockState);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('canActivate - edge cases', () => {
    it('should handle null user after loading', async () => {
      authService.isAuthenticated.and.returnValue(Promise.resolve(true));
      const routeWithRole = {
        data: { roles: ['admin'] }
      } as unknown as ActivatedRouteSnapshot;

      userService.currentUser = null;
      userService.loadCurrentUserFromServer.and.returnValue(Promise.resolve(null));

      const result = await guard.canActivate(routeWithRole, mockState);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should handle user with undefined role', async () => {
      authService.isAuthenticated.and.returnValue(Promise.resolve(true));
      const routeWithRole = {
        data: { roles: ['admin'] }
      } as unknown as ActivatedRouteSnapshot;

      userService.currentUser = { ...mockUser, role: undefined as any };

      const result = await guard.canActivate(routeWithRole, mockState);

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});

