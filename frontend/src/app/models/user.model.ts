import { Team } from "./team.model";

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  telephone?: string;
  role: string;
  team?: Team;
  socialNumber?: number;
  contract?: string;
  arrivalDate?: string;
  annualSalary?: number;
  birthDate?: string;
  workingHours?: number;
  leaves?: number;
  rib?: string;
  familySituation?: string;
  address: {
    number?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    state?: string;
  };
  emergencyContact: {
    courtesy?: string;
    firstName?: string;
    lastName?: string;
    relation?: string;
    phoneNumber?: string;
  }
  personalEmail?: string;
  calendar?: {
    begin: string;
    end: string;
    duration: string;
    dayType: string;
  }[];
}

export interface CurrentUserResponse {
  currentUser: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    telephone?: string;
    role: string;
    team?: Team;
    socialNumber?: number;
    contract?: string;
    arrivalDate?: string;
    annualSalary?: number;
    birthDate?: string;
    leaves?: number;
    rib?: string;
    familySituation?: string;
    address: {
      number?: string;
      street?: string;
      postalCode?: string;
      city?: string;
      state?: string;
    };
    emergencyContact: {
      courtesy?: string;
      firstName?: string;
      lastName?: string;
      relation?: string;
      phoneNumber?: string;
    }
    personalEmail?: string;
  }
}
