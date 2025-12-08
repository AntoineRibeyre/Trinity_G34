import { User } from "./user.model";

export interface Team {
  id: string;
  name: string;
  field: string;
  description: string;
  members?: User[]
}