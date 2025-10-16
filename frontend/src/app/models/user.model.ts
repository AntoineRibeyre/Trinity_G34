export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName?: string;
  telephone?: string;
  role?: string;
}

export interface CurrentUserResponse {
  currentUser: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName?: string;
    telephone?: string;
    role?: string;
  } | null;
}