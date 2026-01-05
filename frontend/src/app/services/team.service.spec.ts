import { TestBed } from '@angular/core/testing';
import { TeamService, ManagerViewResponse } from './team.service';
import { ApolloTestingController, ApolloTestingModule } from 'apollo-angular/testing';
import { of, throwError } from 'rxjs';
import { GraphQLError } from 'graphql';

describe('TeamService', () => {
  let service: TeamService;
  let controller: ApolloTestingController;

  const mockTeam = {
    id: 1,
    name: 'Test Team',
    description: 'Test Description',
    field: 'Development',
    members: [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'USER'
      }
    ]
  };

  const mockManagerView: ManagerViewResponse['managerView'] = {
    manager: {
      userDetails: {
        id: 1,
        firstName: 'Manager',
        lastName: 'Name',
        role: 'manager'
      },
      planning: [
        {
          date: '2024-01-15',
          totalHours: '08:00:00',
          calendar: []
        }
      ]
    },
    members: [
      {
        userDetails: {
          id: 2,
          firstName: 'Member',
          lastName: 'Name',
          role: 'USER'
        },
        planning: []
      }
    ],
    teamDetails: {
      id: 1,
      name: 'Test Team',
      description: 'Test Description',
      members: []
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
      providers: [TeamService]
    });

    service = TestBed.inject(TeamService);
    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  describe('getAllTeams', () => {
    it('should fetch all teams', (done) => {
      const mockTeams = [mockTeam, { ...mockTeam, id: 2, name: 'Team 2' }];

      service.getAllTeams().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].id).toBe(1);
        expect(result[0].name).toBe('Test Team');
        done();
      });

      const op = controller.expectOne('GetAllTeams');
      op.flush({
        data: {
          allTeams: mockTeams
        }
      });
    });

    it('should return empty array when no teams', (done) => {
      service.getAllTeams().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const op = controller.expectOne('GetAllTeams');
      op.flush({
        data: {
          allTeams: []
        }
      });
    });
  });

  describe('createTeam', () => {
    it('should create team successfully', (done) => {
      const name = 'New Team';
      const field = 'Development';
      const description = 'New Description';
      const managerID = 1;

      service.createTeam(name, field, description, managerID).subscribe(result => {
        expect(result.id).toBe(1);
        done();
      });

      const op = controller.expectOne('CreateTeam');
      expect(op.operation.variables["name"]).toBe(name);
      expect(op.operation.variables["field"]).toBe(field);
      expect(op.operation.variables["description"]).toBe(description);
      expect(op.operation.variables["managerID"]).toBe(managerID);

      op.flush({
        data: {
          createTeam: {
            team: { id: 1 }
          }
        }
      });
    });
  });

  describe('addEmployees', () => {
    it('should add employees to team', (done) => {
      const teamId = 1;
      const employeeIds = [2, 3];

      service.addEmployees(teamId, employeeIds).subscribe(result => {
        expect(result).toBeDefined();
        done();
      });

      const op = controller.expectOne('AddEmployeeToTeam');
      expect(op.operation.variables["teamId"]).toBe(teamId);
      expect(op.operation.variables["employeeIds"]).toEqual(employeeIds);

      op.flush({
        data: {
          addEmployeeToTeam: {
            message: 'Employees added',
            team: mockTeam
          }
        }
      });
    });
  });

  describe('getManagerView', () => {
    it('should fetch manager view successfully', (done) => {
      const managerId = 1;

      service.getManagerView(managerId).subscribe(result => {
        expect(result).not.toBeNull();
        expect(result?.manager.userDetails.id).toBe(1);
        expect(result?.members.length).toBe(1);
        expect(result?.teamDetails.name).toBe('Test Team');
        done();
      });

      const op = controller.expectOne('ManagerView');
      expect(op.operation.variables["managerId"]).toBe(managerId);

      op.flush({
        data: {
          managerView: mockManagerView
        }
      });
    });

    it('should return null on error', (done) => {
      const consoleErrorSpy = spyOn(console, 'error');
      const managerId = 1;

      service.getManagerView(managerId).subscribe(result => {
        expect(result).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalled();
        done();
      });

      const op = controller.expectOne('ManagerView');
      op.graphqlErrors([new GraphQLError('Error fetching manager view')]);
    });
  });

  describe('removeMembers', () => {
    it('should remove members from team', (done) => {
      const teamId = 1;
      const employeeIds = [2, 3];

      service.removeMembers(teamId, employeeIds).subscribe(result => {
        expect(result).toBeDefined();
        done();
      });

      const op = controller.expectOne('DeleteMember');
      expect(op.operation.variables["teamId"]).toBe(teamId);
      expect(op.operation.variables["employeeIds"]).toEqual(employeeIds);

      op.flush({
        data: {
          deleteMember: {
            message: 'Members removed',
            team: mockTeam
          }
        }
      });
    });
  });

  describe('deleteTeam', () => {
    it('should delete team successfully', (done) => {
      const teamId = 1;

      service.deleteTeam(teamId).subscribe(result => {
        expect(result).toBeDefined();
        done();
      });

      const op = controller.expectOne('DeleteTeam');
      expect(op.operation.variables["teamId"]).toBe(teamId);

      op.flush({
        data: {
          deleteTeam: {
            ok: true,
            message: 'Team deleted'
          }
        }
      });
    });
  });

  describe('updateTeam', () => {
    it('should update team successfully', (done) => {
      const teamToUpdate = {
        id: 1,
        name: 'Updated Team',
        description: 'Updated Description',
        field: 'Updated Field'
      };

      service.updateTeam(teamToUpdate).subscribe(result => {
        expect(result).toBeDefined();
        expect(result.message).toBe('Team updated');
        done();
      });

      const op = controller.expectOne('UpdateTeam');
      expect(op.operation.variables["teamToUpdate"]).toEqual(teamToUpdate);

      op.flush({
        data: {
          updateTeam: {
            message: 'Team updated'
          }
        }
      });

      // Handle refetchQueries for GetAllTeams
      const refetchOp = controller.expectOne('GetAllTeams');
      refetchOp.flush({
        data: {
          allTeams: []
        }
      });
    });

    it('should update team with manager change', (done) => {
      const teamToUpdate = {
        id: 1,
        name: 'Updated Team',
        managerId: 2
      };

      service.updateTeam(teamToUpdate).subscribe(result => {
        expect(result).toBeDefined();
        expect(result.message).toBe('Team updated');
        done();
      });

      const op = controller.expectOne('UpdateTeam');
      expect(op.operation.variables["teamToUpdate"].managerId).toBe(2);

      op.flush({
        data: {
          updateTeam: {
            message: 'Team updated'
          }
        }
      });

      // Handle refetchQueries for GetAllTeams
      const refetchOp = controller.expectOne('GetAllTeams');
      refetchOp.flush({
        data: {
          allTeams: []
        }
      });
    });
  });

  describe('getTeamDetails', () => {
    it('should get team details from manager view', (done) => {
      const managerId = 1;

      service.getTeamDetails(managerId).subscribe(result => {
        expect(result).not.toBeNull();
        expect(result?.id).toBe(1);
        expect(result?.name).toBe('Test Team');
        done();
      });

      const op = controller.expectOne('ManagerView');
      op.flush({
        data: {
          managerView: mockManagerView
        }
      });
    });

    it('should return null when manager view is null', (done) => {
      const managerId = 1;

      service.getTeamDetails(managerId).subscribe(result => {
        expect(result).toBeNull();
        done();
      });

      const op = controller.expectOne('ManagerView');
      op.graphqlErrors([new GraphQLError('Error')]);
    });
  });

  describe('getTeamMembers', () => {
    it('should get team members from manager view', (done) => {
      const managerId = 1;

      service.getTeamMembers(managerId).subscribe(result => {
        expect(result).not.toBeNull();
        expect(result?.length).toBe(1);
        expect(result?.[0].userDetails.id).toBe(2);
        done();
      });

      const op = controller.expectOne('ManagerView');
      op.flush({
        data: {
          managerView: mockManagerView
        }
      });
    });
  });

  describe('getManagerData', () => {
    it('should get manager data from manager view', (done) => {
      const managerId = 1;

      service.getManagerData(managerId).subscribe(result => {
        expect(result).not.toBeNull();
        if (result) {
          expect(result.userDetails.id).toBe(1);
          expect(result.userDetails.firstName).toBe('Manager');
          expect(result.userDetails.lastName).toBe('Name');
          // Note: role n'est pas récupéré dans la requête GraphQL pour le manager
          // Seulement pour les membres, donc on ne vérifie pas le role ici
        }
        done();
      });

      const op = controller.expectOne('ManagerView');
      expect(op.operation.variables["managerId"]).toBe(managerId);
      op.flush({
        data: {
          managerView: mockManagerView
        }
      });
    });
  });

  describe('getTeamMembersByTeamId', () => {
    it('should get team members by team ID', (done) => {
      const teamId = 1;
      const mockMembers = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          username: 'johndoe',
          telephone: '123456789',
          role: 'USER',
          socialNumber: 12345,
          contract: 'CDI',
          arrivalDate: '2024-01-01',
          annualSalary: 50000,
          birthDate: '1990-01-01',
          workingHours: 35,
          leaves: 25,
          Calendar: []
        }
      ];

      service.getTeamMembersByTeamId(teamId).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(1);
        expect(result[0].firstName).toBe('John');
        done();
      });

      const op = controller.expectOne('GetTeamMembers');
      expect(op.operation.variables["teamId"]).toBe(teamId);

      op.flush({
        data: {
          teamMembers: mockMembers
        }
      });
    });

    it('should return empty array on error', (done) => {
      const consoleErrorSpy = spyOn(console, 'error');
      const teamId = 1;

      service.getTeamMembersByTeamId(teamId).subscribe(result => {
        expect(result).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalled();
        done();
      });

      const op = controller.expectOne('GetTeamMembers');
      op.graphqlErrors([new GraphQLError('Error')]);
    });
  });

  describe('changeTeamManager', () => {
    it('should change team manager successfully', (done) => {
      const teamId = 1;
      const newManagerId = 2;

      service.changeTeamManager(teamId, newManagerId).subscribe(result => {
        expect(result).toBeDefined();
        done();
      });

      const op = controller.expectOne('ChangeTeamManager');
      expect(op.operation.variables["teamId"]).toBe(teamId);
      expect(op.operation.variables["newManagerId"]).toBe(newManagerId);

      op.flush({
        data: {
          changeTeamManager: {
            message: 'Manager changed'
          }
        }
      });
    });
  });
});

