import { Team } from "./team.model";

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  telephone: string;
  role: string;
  team?: Team;
  Calandar?: {
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
    telephone: string;
    role: string;
    team?: Team;
  } | null;
}