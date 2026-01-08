import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Apollo } from 'apollo-angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CurrentUserResponse } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let apollo: jasmine.SpyObj<Apollo>;
  let router: jasmine.SpyObj<Router>;
  let http: jasmine.SpyObj<HttpClient>;
  let loginClientMutateSpy: jasmine.Spy;
  let apolloQuerySpy: jasmine.Spy;

  const mockLoginResponse = {
    data: {
      tokenAuth: {
        token: 'mock-token',
        csrfToken: 'mock-csrf-token',
        payload: { userId: 1 }
      }
    }
  };

  const mockCurrentUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'test',
    lastName: 'test',
    role: 'employee',
    address: {},
    emergencyContact: {}
  };

  const mockCurrentUserResponse: CurrentUserResponse = {
    currentUser: mockCurrentUser
  };

  beforeEach(() => {
    const apolloSpy = jasmine.createSpyObj('Apollo', ['query', 'mutate']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);

    // Mock pour le loginClient (ApolloClient)
    loginClientMutateSpy = jasmine.createSpy('mutate').and.returnValue(Promise.resolve(mockLoginResponse));
    apolloQuerySpy = jasmine.createSpy('query').and.returnValue(of({ data: mockCurrentUserResponse }));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Apollo, useValue: apolloSpy },
        { provide: Router, useValue: routerSpy },
        { provide: HttpClient, useValue: httpSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    apollo = TestBed.inject(Apollo) as jasmine.SpyObj<Apollo>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    http = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;

    // Mock du loginClient
    (service as any).loginClient = {
      mutate: loginClientMutateSpy
    };

    // Mock apollo.query pour isAuthenticated et autres
    apollo.query = apolloQuerySpy;

    // Reset document.cookie
    document.cookie = '';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store CSRF token', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const result = await service.login(email, password);

      expect(loginClientMutateSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          mutation: service['LOGIN_MUTATION'],
          variables: { email, password }
        })
      );

      expect(document.cookie).toContain('csrftoken=mock-csrf-token');
      expect(apolloQuerySpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          query: service.CURRENT_USER_QUERY,
          fetchPolicy: 'network-only'
        })
      );
      expect(result).toEqual(mockCurrentUser);
    });

    it('should throw error when login fails', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const error = new Error('Invalid credentials');

      loginClientMutateSpy.and.returnValue(Promise.reject(error));

      await expectAsync(service.login(email, password)).toBeRejectedWith(error);
    });

    it('should throw error when user cannot be retrieved after login', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      apolloQuerySpy.and.returnValue(of({ data: { currentUser: null } }));

      await expectAsync(service.login(email, password)).toBeRejected();
    });

    it('should handle missing CSRF token gracefully', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      // Clear cookies first - remove all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });

      loginClientMutateSpy.and.returnValue(Promise.resolve({
        data: {
          tokenAuth: {
            token: 'mock-token',
            csrfToken: null,
            payload: { userId: 1 }
          }
        }
      }));

      const result = await service.login(email, password);

      expect(result).toEqual(mockCurrentUser);
      // When csrfToken is null, it should not set the cookie
      // Check that csrftoken cookie is not present (either empty or not set)
      const cookies = document.cookie;
      const csrfCookie = cookies.split(';').find(c => c.trim().startsWith('csrftoken='));
      expect(csrfCookie).toBeUndefined();
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const registerData = {
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@example.com',
        telephone: '123456789',
        password: 'password123',
        role: 'USER'
      };

      const mockRegisterResponse = {
        data: {
          createUser: {
            user: {
              id: '2',
              email: registerData.email
            }
          }
        }
      };

      loginClientMutateSpy.and.returnValue(Promise.resolve(mockRegisterResponse));

      const result = await service.register(
        registerData.username,
        registerData.firstName,
        registerData.lastName,
        registerData.email,
        registerData.telephone,
        registerData.password,
        registerData.role
      );

      expect(loginClientMutateSpy).toHaveBeenCalled();
      expect(result.data.createUser.user.email).toBe(registerData.email);
    });

    it('should handle registration errors', async () => {
      const error = new Error('Registration failed');
      loginClientMutateSpy.and.returnValue(Promise.reject(error));

      await expectAsync(
        service.register('user', 'First', 'Last', 'email@test.com', '123', 'pass', 'USER')
      ).toBeRejectedWith(error);
    });
  });

  describe('logout', () => {
    it('should logout successfully and redirect to login', (done) => {
      const mockLogoutResponse = {
        data: {
          logout: {
            success: true,
            message: 'Logged out successfully'
          }
        }
      };

      loginClientMutateSpy.and.returnValue(Promise.resolve(mockLogoutResponse));

      // Set some cookies first
      document.cookie = 'csrftoken=test-token; path=/';
      document.cookie = 'access_token=test-access; path=/';

      service.logout();

      setTimeout(() => {
        expect(loginClientMutateSpy).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        expect(document.cookie).not.toContain('csrftoken=');
        expect(document.cookie).not.toContain('access_token=');
        done();
      }, 100);
    });

    it('should redirect to login even on logout error', (done) => {
      const error = new Error('Logout failed');
      loginClientMutateSpy.and.returnValue(Promise.reject(error));

      service.logout();

      setTimeout(() => {
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }, 100);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      apolloQuerySpy.and.returnValue(of({ data: mockCurrentUserResponse }));

      const result = await service.isAuthenticated();

      expect(result).toBe(true);
      expect(apolloQuerySpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          query: service.CURRENT_USER_QUERY,
          fetchPolicy: 'network-only',
          errorPolicy: 'all'
        })
      );
    });

    it('should return false when user is not authenticated', async () => {
      apolloQuerySpy.and.returnValue(of({ data: { currentUser: null } }));

      const result = await service.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false on GraphQL errors', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = {
        graphQLErrors: [{ message: 'Unauthenticated' }],
        networkError: null
      };

      apolloQuerySpy.and.returnValue(throwError(() => error));

      const result = await service.isAuthenticated();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should return false on network errors', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = {
        graphQLErrors: null,
        networkError: { status: 401 }
      };

      apolloQuerySpy.and.returnValue(throwError(() => error));

      const result = await service.isAuthenticated();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getCookie', () => {
    it('should return cookie value when it exists', () => {
      document.cookie = 'testcookie=testvalue; path=/';
      const result = service.getCookie('testcookie');
      expect(result).toBe('testvalue');
    });

    it('should return null when cookie does not exist', () => {
      document.cookie = '';
      const result = service.getCookie('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle cookies with spaces', () => {
      document.cookie = 'csrftoken=token123; path=/';
      const result = service.getCookie('csrftoken');
      expect(result).toBe('token123');
    });
  });

  describe('doMutationWithCsrf', () => {
    it('should execute mutation with CSRF token from cookie', () => {
      document.cookie = 'csrftoken=test-csrf-token; path=/';
      const mockQuery = { query: 'mutation Test { test }' };
      const mockVariables = { test: 'value' };
      const mockResult = { data: { test: 'result' } };

      apollo.mutate = jasmine.createSpy('mutate').and.returnValue(of(mockResult));

      service.doMutationWithCsrf(mockQuery, mockVariables);

      expect(apollo.mutate).toHaveBeenCalledWith(
        jasmine.objectContaining({
          mutation: mockQuery,
          variables: mockVariables,
          context: {
            headers: {
              'X-CSRFToken': 'test-csrf-token'
            }
          }
        })
      );
    });

    it('should execute mutation with empty CSRF token when cookie is missing', () => {
      // Clear all cookies first
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      const mockQuery = { query: 'mutation Test { test }' };
      const mockVariables = { test: 'value' };
      const mockResult = { data: { test: 'result' } };

      apollo.mutate = jasmine.createSpy('mutate').and.returnValue(of(mockResult));

      service.doMutationWithCsrf(mockQuery, mockVariables);

      expect(apollo.mutate).toHaveBeenCalledWith(
        jasmine.objectContaining({
          context: {
            headers: {
              'X-CSRFToken': ''
            }
          }
        })
      );
    });
  });
});

