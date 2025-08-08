export interface User {
  id: string;
  officeName: string;
  oabNumber: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}