import { Injectable } from "@angular/core";
import { Apollo } from "apollo-angular";
import { firstValueFrom } from "rxjs";
import { CurrentUserResponse, User } from "../models/user.model";
import gql from "graphql-tag";
import { Team } from "../models/team.model";

interface GraphQLUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  telephone?: string;
  personalEmail?: string;
  role?: string;
  team?: Team;
  contract?: string;
  socialNumber?: number;
  arrivalDate?: string;
  birthDate?: string;
  workingHours?: number;
  annualSalary?: number;
  leaves?: number;
  rib?: string;
  familySituation?: string;
  address?: {
    number?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    state?: string;
  };
  emergencyContact?: {
    courtesy?: string;
    firstName?: string;
    lastName?: string;
    relation?: string;
    phoneNumber?: string;
  };
}

interface AllUsersResponse {
  allUsers: GraphQLUser[];
}

const GET_ALL_USERS = gql`
  query GetAllUsers {
    allUsers {
      id
      username
      email
      firstName
      lastName
      telephone
      personalEmail
      role
      isActive
      team{
        id
        field
        name
        description
        members {
          id
          username
          email
          firstName
          lastName
          telephone
          role
        }
      }
      socialNumber
      contract
      arrivalDate
      annualSalary
      birthDate
      workingHours
      leaves
      rib
      familySituation
      address {
        number
        street
        postalCode
        city
        state
      }
      emergencyContact {
        courtesy
        firstName
        lastName
        relation
        phoneNumber
      }
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($userId: Int!) {
    deleteUser(userId: $userId) {
      message
    }
  }
`;

interface DeleteUserResponse {
  deleteUser: {
    message: string;
  };
}


@Injectable({ providedIn: 'root' })
export class UserService {
  currentUser: User | null = null;

  // Build a payload matching GraphQL `UserInput` from frontend `User` object
  // Filters out empty strings and null values, similar to settings.ts transformPayload
  private buildUserPayload(data: Partial<User> & { password?: string }): any {
    const payload: any = {};

    const src = data as any;
    
    // Helper function to check if a value is not empty
    const isNotEmpty = (value: any): boolean => {
      return value !== undefined && value !== null && value !== '';
    };

    if (isNotEmpty(src.username)) payload.username = src.username;
    if (isNotEmpty(src.firstName)) payload.firstName = src.firstName;
    if (isNotEmpty(src.lastName)) payload.lastName = src.lastName;
    if (isNotEmpty(src.email)) payload.email = src.email;
    if (isNotEmpty(src.password)) payload.password = src.password;
    if (isNotEmpty(src.telephone)) payload.telephone = src.telephone;
    if (isNotEmpty(src.role)) payload.role = src.role;

    if (src.socialNumber !== undefined && src.socialNumber !== null && src.socialNumber !== '') {
      const sn = Number(src.socialNumber);
      if (!Number.isNaN(sn) && Number.isFinite(sn)) payload.socialNumber = Math.trunc(sn);
    }

    if (isNotEmpty(src.contract)) payload.contract = src.contract;
    if (isNotEmpty(src.arrivalDate)) payload.arrivalDate = src.arrivalDate;
    if (src.annualSalary !== undefined && src.annualSalary !== null && src.annualSalary !== '') {
      const v = Number(src.annualSalary);
      if (!Number.isNaN(v) && Number.isFinite(v)) payload.annualSalary = Math.trunc(v);
    }
    if (isNotEmpty(src.birthDate)) payload.birthDate = src.birthDate;
    if (src.workingHours !== undefined && src.workingHours !== null && src.workingHours !== '') {
      const v = Number(src.workingHours);
      if (!Number.isNaN(v) && Number.isFinite(v)) payload.workingHours = Math.trunc(v);
    }
    if (src.leaves !== undefined && src.leaves !== null && src.leaves !== '') {
      const v = Number(src.leaves);
      if (!Number.isNaN(v) && Number.isFinite(v)) payload.leaves = Math.trunc(v);
    }
    if (isNotEmpty(src.rib)) payload.rib = src.rib;
    if (isNotEmpty(src.familySituation)) payload.familySituation = src.familySituation;
    if (isNotEmpty(src.personalEmail)) payload.personalEmail = src.personalEmail;
    if (src.isActive !== undefined && src.isActive !== null) payload.isActive = src.isActive;

    if (src.team !== undefined && src.team !== null) {
      const t = src.team as any;
      if (typeof t === 'number' || typeof t === 'string') payload.teamId = Number(t);
      else if (t && t.id !== undefined) payload.teamId = Number(t.id);
    }

    // Handle address: only include if at least one field has a value
    if (src.address !== undefined && src.address !== null) {
      const address: any = {};
      let hasAddressData = false;

      if (isNotEmpty(src.address.number)) {
        address.number = src.address.number;
        hasAddressData = true;
      }
      if (isNotEmpty(src.address.street)) {
        address.street = src.address.street;
        hasAddressData = true;
      }
      if (isNotEmpty(src.address.city)) {
        address.city = src.address.city;
        hasAddressData = true;
      }
      if (isNotEmpty(src.address.postalCode)) {
        address.postalCode = src.address.postalCode;
        hasAddressData = true;
      }
      if (isNotEmpty(src.address.state)) {
        address.state = src.address.state;
        hasAddressData = true;
      }

      if (hasAddressData) {
        // Convert address object to JSON string as backend expects JSONString type
        payload.address = JSON.stringify(address);
      }
    }

    // Handle emergencyContact: only include if at least one field has a value
    if (src.emergencyContact !== undefined && src.emergencyContact !== null) {
      const emergencyContact: any = {};
      let hasEmergencyData = false;

      if (isNotEmpty(src.emergencyContact.courtesy)) {
        emergencyContact.courtesy = src.emergencyContact.courtesy;
        hasEmergencyData = true;
      }
      if (isNotEmpty(src.emergencyContact.firstName)) {
        emergencyContact.firstName = src.emergencyContact.firstName;
        hasEmergencyData = true;
      }
      if (isNotEmpty(src.emergencyContact.lastName)) {
        emergencyContact.lastName = src.emergencyContact.lastName;
        hasEmergencyData = true;
      }
      if (isNotEmpty(src.emergencyContact.relation)) {
        emergencyContact.relation = src.emergencyContact.relation;
        hasEmergencyData = true;
      }
      if (isNotEmpty(src.emergencyContact.phoneNumber)) {
        emergencyContact.phoneNumber = src.emergencyContact.phoneNumber;
        hasEmergencyData = true;
      }

      if (hasEmergencyData) {
        // Convert emergencyContact object to JSON string as backend expects JSONString type
        payload.emergencyContact = JSON.stringify(emergencyContact);
      }
    }

    return payload;
  }

  constructor(private apollo: Apollo) {
    this.loadCurrentUserFromServer();
  }
  private readonly UPDATE_USER_MUTATION = gql`
    mutation UpdateUser($userData: UserInput!, $userId: Int) {
      updateUser(userData: $userData, userId: $userId) {
        user {
          id
          firstName
          lastName
          email
          telephone
          personalEmail
          role
          socialNumber
          contract
          arrivalDate
          annualSalary
          birthDate
          workingHours
          leaves
          rib
          familySituation
          team {
            id
            field
            name
            description
            members {
              id
              firstName
              lastName
              role
            }
          }
          address {
            number
            street
            postalCode
            city
            state
          }
          emergencyContact {
            courtesy
            firstName
            lastName
            relation
            phoneNumber
          }
        }
      }
    }
  `;

  CURRENT_USER_QUERY = gql`
      query CurrentUser {
        currentUser{
            id
            username
            email
            firstName
            lastName
            telephone
            personalEmail
            role
            isActive
            socialNumber
            contract
            arrivalDate
            annualSalary
            birthDate
            workingHours
            leaves
            rib
            familySituation
            team{
              id
              field
              name
              description
              members {
                id
                username
                email
                firstName
                lastName
                telephone
                role
              }
            }
            address {
              number
              street
              postalCode
              city
              state
            }
            emergencyContact {
              courtesy
              firstName
              lastName
              relation
              phoneNumber
            }
        }
      }
    `;

  async loadCurrentUserFromServer(): Promise<User | null> {
    try {
      const res = await firstValueFrom(
        this.apollo.query<CurrentUserResponse>({
          query: this.CURRENT_USER_QUERY,
          fetchPolicy: "network-only",
        })
      );
      this.currentUser = res.data.currentUser;
      return this.currentUser;
    } catch (error) {
      console.error("Error loading current user:", error);
      this.currentUser = null;
      return null;
    }
  }

  async updateUser(data: Partial<User> & { password?: string }, userId?: string | number): Promise<User | null> {
    try {
      const payload = this.buildUserPayload(data);

      const variables: any = { userData: payload };
      if (userId !== undefined && userId !== null) variables.userId = Number(userId);

      const res = await firstValueFrom(
        this.apollo.mutate<{ updateUser: { user: User } }>({
          mutation: this.UPDATE_USER_MUTATION,
          variables,
        })
      );

      if (!res.data?.updateUser?.user) {
        throw new Error("Failed to update user: Invalid response from server");
      }

      this.currentUser = res.data.updateUser.user;
      return this.currentUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  clearCurrentUser(): void {
    this.currentUser = null;
  }

  async getAllUsers(): Promise<User[]> {
      try {
        const response = await firstValueFrom(
          this.apollo.query<AllUsersResponse>({
            query: GET_ALL_USERS,
            fetchPolicy: 'network-only'
          })
        );

        const users = (response.data?.allUsers || []).map(user =>
          this.convertUser(user)
        );

        return users;
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        throw error;
      }
    }

    // Fonction utilitaire pour convertir GraphQLUser en User
    convertUser(graphqlUser: GraphQLUser): User {
      const teamWithMembers = graphqlUser.team
        ? {
            ...graphqlUser.team,
            members: graphqlUser.team.members
              ? graphqlUser.team.members.map(m => ({
                  ...m,
                  id: m.id.toString(),
                }))
              : undefined,
          }
        : undefined;

      return {
        id: graphqlUser.id.toString(),
        username: graphqlUser.username,
        email: graphqlUser.email,
        firstName: graphqlUser.firstName || '',
        lastName: graphqlUser.lastName || '',
        telephone: graphqlUser.telephone || '',
        personalEmail: graphqlUser.personalEmail,
        role: graphqlUser.role || '',
        team: teamWithMembers as Team | undefined,
        socialNumber: graphqlUser.socialNumber,
        contract: graphqlUser.contract,
        arrivalDate: graphqlUser.arrivalDate,
        annualSalary: graphqlUser.annualSalary,
        birthDate: graphqlUser.birthDate,
        workingHours: graphqlUser.workingHours,
        leaves: graphqlUser.leaves,
        rib: graphqlUser.rib,
        familySituation: graphqlUser.familySituation,
        address: graphqlUser.address || {
          number: '',
          street: '',
          postalCode: '',
          city: '',
          state: '',
        },

        emergencyContact: graphqlUser.emergencyContact || {
          courtesy: '',
          firstName: '',
          lastName: '',
          relation: '',
          phoneNumber: '',
        },
      };
    }

    async deleteUser(id: string): Promise<string> {
      try {
        const response = await firstValueFrom(
          this.apollo.mutate<DeleteUserResponse>({
            mutation: DELETE_USER,
            variables: { userId: Number(id) },
            fetchPolicy: 'no-cache'
          })
        );

        return response.data?.deleteUser?.message || 'Utilisateur désactivé avec succès.';
      } catch (error) {
        console.error('Erreur lors de la désactivation de l’utilisateur :', error);
        throw error;
      }
    }
}
