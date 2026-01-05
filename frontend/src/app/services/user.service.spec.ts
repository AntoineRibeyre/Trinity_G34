import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { of, throwError } from 'rxjs';
import { UserService } from './user.service';
import { User, CurrentUserResponse } from '../models/user.model';
import { Team } from '../models/team.model';

describe('UserService', () => {
  let service: UserService;
  let apollo: jasmine.SpyObj<Apollo>;

  const mockTeam: Team = {
    id: '1',
    name: 'Team Test',
    field: 'Development',
    description: 'Test team description'
  };

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    telephone: '123456789',
    role: 'USER',
    team: mockTeam
  };

  const mockGraphQLUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    telephone: '123456789',
    role: 'USER',
    team: mockTeam
  };

  beforeEach(() => {
    const apolloSpy = jasmine.createSpyObj('Apollo', ['query', 'mutate']);

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: Apollo, useValue: apolloSpy }
      ]
    });

    service = TestBed.inject(UserService);
    apollo = TestBed.inject(Apollo) as jasmine.SpyObj<Apollo>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadCurrentUserFromServer', () => {
    it('should load current user successfully', async () => {
      const mockResponse: CurrentUserResponse = {
        currentUser: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          telephone: '123456789',
          role: 'USER',
          team: mockTeam
        }
      };

      apollo.query.and.returnValue(of({ data: mockResponse } as any));

      const result = await service.loadCurrentUserFromServer();

      expect(result).toEqual(mockResponse.currentUser);
      expect(service.currentUser).toEqual(mockResponse.currentUser);
      expect(apollo.query).toHaveBeenCalledWith(
        jasmine.objectContaining({
          query: service.CURRENT_USER_QUERY,
          fetchPolicy: 'network-only'
        })
      );
    });

    it('should return null and set currentUser to null on error', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      apollo.query.and.returnValue(throwError(() => new Error('Network error')));

      const result = await service.loadCurrentUserFromServer();

      expect(result).toBeNull();
      expect(service.currentUser).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle null currentUser response', async () => {
      const mockResponse = {
        currentUser: null
      } as any;

      apollo.query.and.returnValue(of({ data: mockResponse } as any));

      const result = await service.loadCurrentUserFromServer();

      expect(result).toBeNull();
      expect(service.currentUser).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com'
      };

      const mockResponse = {
        data: {
          updateUser: {
            user: {
              ...mockUser,
              ...updateData
            }
          }
        }
      };

      apollo.mutate.and.returnValue(of(mockResponse as any));

      const result = await service.updateUser(updateData);

      expect(result).toEqual(mockResponse.data.updateUser.user);
      expect(service.currentUser).toEqual(mockResponse.data.updateUser.user);
      expect(apollo.mutate).toHaveBeenCalledWith(
        jasmine.objectContaining({
          mutation: service['UPDATE_USER_MUTATION'],
          variables: {
            userData: updateData
          }
        })
      );
    });

    it('should throw error when response is invalid', async () => {
      const updateData = { firstName: 'Updated' };
      const mockResponse = {
        data: {
          updateUser: null
        }
      };

      apollo.mutate.and.returnValue(of(mockResponse as any));

      await expectAsync(service.updateUser(updateData)).toBeRejected();
    });

    it('should throw error on network failure', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const updateData = { firstName: 'Updated' };

      apollo.mutate.and.returnValue(throwError(() => new Error('Network error')));

      await expectAsync(service.updateUser(updateData)).toBeRejected();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle password update', async () => {
      const updateData = {
        password: 'newPassword123',
        firstName: 'Updated'
      };

      const mockResponse = {
        data: {
          updateUser: {
            user: {
              ...mockUser,
              firstName: 'Updated'
            }
          }
        }
      };

      apollo.mutate.and.returnValue(of(mockResponse as any));

      const result = await service.updateUser(updateData);

      expect(result).toBeTruthy();
      expect(apollo.mutate).toHaveBeenCalledWith(
        jasmine.objectContaining({
          variables: {
            userData: updateData
          }
        })
      );
    });
  });

  describe('clearCurrentUser', () => {
    it('should clear current user', () => {
      service.currentUser = mockUser;
      expect(service.currentUser).not.toBeNull();

      service.clearCurrentUser();

      expect(service.currentUser).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockResponse = {
        data: {
          allUsers: [mockGraphQLUser, { ...mockGraphQLUser, id: 2, username: 'user2' }]
        }
      };

      apollo.query.and.returnValue(of(mockResponse as any));

      const result = await service.getAllUsers();

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('1');
      expect(result[0].username).toBe('testuser');
      expect(result[1].id).toBe('2');
      expect(apollo.query).toHaveBeenCalledWith(
        jasmine.objectContaining({
          fetchPolicy: 'network-only'
        })
      );
    });

    it('should return empty array when no users', async () => {
      const mockResponse = {
        data: {
          allUsers: []
        }
      };

      apollo.query.and.returnValue(of(mockResponse as any));

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
    });

    it('should handle null data response', async () => {
      const mockResponse = {
        data: null
      };

      apollo.query.and.returnValue(of(mockResponse as any));

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
    });

    it('should throw error on network failure', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      apollo.query.and.returnValue(throwError(() => new Error('Network error')));

      await expectAsync(service.getAllUsers()).toBeRejected();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('convertUser', () => {
    it('should convert GraphQL user to User model', () => {
      const graphqlUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        telephone: '123456789',
        role: 'USER',
        team: mockTeam
      };

      const result = service.convertUser(graphqlUser);

      expect(result.id).toBe('1');
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('Test');
      expect(result.lastName).toBe('User');
      expect(result.telephone).toBe('123456789');
      expect(result.role).toBe('USER');
      // Le service peut ajouter members: undefined si le team n'a pas de members
      // Vérifions les propriétés principales du team
      expect(result.team).toBeDefined();
      if (result.team) {
        expect(result.team.id).toBe(mockTeam.id);
        expect(result.team.name).toBe(mockTeam.name);
        expect(result.team.field).toBe(mockTeam.field);
        expect(result.team.description).toBe(mockTeam.description);
      }
    });

    it('should handle optional fields with default values', () => {
      const graphqlUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      const result = service.convertUser(graphqlUser as any);

      expect(result.id).toBe('1');
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('');
      expect(result.lastName).toBe('');
      expect(result.telephone).toBe('');
      expect(result.role).toBe('');
      expect(result.team).toBeUndefined();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = '1';
      const mockResponse = {
        data: {
          deleteUser: {
            message: 'Utilisateur supprimé avec succès'
          }
        }
      };

      apollo.mutate.and.returnValue(of(mockResponse as any));

      const result = await service.deleteUser(userId);

      expect(result).toBe('Utilisateur supprimé avec succès');
      expect(apollo.mutate).toHaveBeenCalledWith(
        jasmine.objectContaining({
          variables: { userId: 1 },
          fetchPolicy: 'no-cache'
        })
      );
    });

    it('should return default message when response message is missing', async () => {
      const userId = '1';
      const mockResponse = {
        data: {
          deleteUser: null
        }
      };

      apollo.mutate.and.returnValue(of(mockResponse as any));

      const result = await service.deleteUser(userId);

      expect(result).toBe('Utilisateur désactivé avec succès.');
    });

    it('should throw error on network failure', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const userId = '1';

      apollo.mutate.and.returnValue(throwError(() => new Error('Network error')));

      await expectAsync(service.deleteUser(userId)).toBeRejected();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should convert string id to number', async () => {
      const userId = '123';
      const mockResponse = {
        data: {
          deleteUser: {
            message: 'Success'
          }
        }
      };

      apollo.mutate.and.returnValue(of(mockResponse as any));

      await service.deleteUser(userId);

      expect(apollo.mutate).toHaveBeenCalledWith(
        jasmine.objectContaining({
          variables: { userId: 123 }
        })
      );
    });
  });
});



