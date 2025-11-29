import { TestBed } from '@angular/core/testing';
import { PointService } from './point.service';
import {ApolloTestingController, ApolloTestingModule} from 'apollo-angular/testing';

describe('PointageService - RegisterArrival', () => {
  let service: PointService;
  let controller: ApolloTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
      providers: [PointService]
    });

    service = TestBed.inject(PointService);
    controller = TestBed.inject(ApolloTestingController);
  });

  afterEach(() => {
    // Vérifie qu'il n'y a pas de requêtes GraphQL non traitées
    controller.verify();
  });

  describe('enregistrerArrivee', () => {
    const USER_ID = 123;
    const MOCK_DATETIME = '2024-01-15T09:00:00+01:00';

    it('devrait enregistrer l\'arrivée avec succès', (done) => {
      // Arrange - Données mockées de la réponse
      const mockResponse = {
        datetimeField: {
          begin: MOCK_DATETIME,
          end: null
        },
        durationField: null
      };

      // Act - Appel de la méthode
      service.enregistrerArrivee(USER_ID).subscribe({
        next: (result) => {
          // Assert - Vérifications
          expect(result).toEqual(mockResponse);
          expect(result.datetimeField.begin).toBe(MOCK_DATETIME);
          expect(result.datetimeField.end).toBeNull();
          expect(result.durationField).toBeNull();
          done();
        },
        error: (error) => {
          fail('Ne devrait pas avoir d\'erreur : ' + error);
          done();
        }
      });

      // Intercepter la mutation GraphQL
      const operation = controller.expectOne('RegisterArrival');

      // Vérifier que c'est bien une mutation
      expect(operation.operation.operationName).toEqual('RegisterArrival');

      // Vérifier les variables envoyées
      expect(operation.operation.variables["userId"]).toBe(USER_ID);

      // Simuler la réponse du serveur
      operation.flush({
        data: {
          registerArrival: mockResponse
        }
      });
    });

    // it('devrait envoyer le bon userId', (done) => {
    //   const differentUserId = 456;
    //
    //   service.enregistrerArrivee(differentUserId).subscribe(() => {
    //     done();
    //   });
    //
    //   const operation = controller.expectOne('RegisterArrival');
    //   expect(operation.operation.variables.userId).toBe(differentUserId);
    //
    //   operation.flush({
    //     data: {
    //       registerArrival: {
    //         datetimeField: { begin: MOCK_DATETIME, end: null },
    //         durationField: null
    //       }
    //     }
    //   });
    // });

    it('devrait gérer les erreurs réseau', (done) => {
      service.enregistrerArrivee(USER_ID).subscribe({
        next: () => {
          fail('Ne devrait pas réussir avec une erreur réseau');
          done();
        },
        error: (error) => {
          expect(error.networkError).toBeDefined();
          expect(error.networkError.message).toContain('Network error');
          done();
        }
      });

      const operation = controller.expectOne('RegisterArrival');

      // Simuler une erreur réseau
      operation.networkError(new Error('Network error: Failed to fetch'));
    });

    it('devrait gérer une réponse vide', (done) => {
      service.enregistrerArrivee(USER_ID).subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        }
      });

      const operation = controller.expectOne('RegisterArrival');

      operation.flush({
        data: {
          registerArrival: null
        }
      });
    });

    it('devrait utiliser le bon format de mutation GraphQL', () => {
      service.enregistrerArrivee(USER_ID).subscribe();

      const operation = controller.expectOne('RegisterArrival');

      // Vérifier la structure de la query
      const query = operation.operation.query.loc?.source.body;
      expect(query).toContain('mutation RegisterArrival');
      expect(query).toContain('$userId: Int!');
      expect(query).toContain('registerArrival(userId: $userId)');
      expect(query).toContain('datetimeField');
      expect(query).toContain('durationField');

      operation.flush({
        data: {
          registerArrival: {
            datetimeField: { begin: MOCK_DATETIME, end: null },
            durationField: null
          }
        }
      });
    });

    it('devrait mapper correctement les données de réponse', (done) => {
      const mockResponse = {
        datetimeField: {
          begin: '2024-01-15T08:30:00+01:00',
          end: null
        },
        durationField: null
      };

      service.enregistrerArrivee(USER_ID).subscribe({
        next: (result) => {
          // Vérifier que le pipe map() fonctionne correctement
          expect(result).toBeDefined();
          expect(result.datetimeField).toBeDefined();
          expect(result.datetimeField.begin).toBe('2024-01-15T08:30:00+01:00');
          done();
        }
      });

      const operation = controller.expectOne('RegisterArrival');
      operation.flush({
        data: {
          registerArrival: mockResponse
        }
      });
    });
  });
});
