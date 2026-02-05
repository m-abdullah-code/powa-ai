

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface SignInData {
    id?: string;
    email: string;
    password: string;
    username?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
  is_admin?: boolean;
  token?: string; 
  access_token?: string;
}

export interface AuthState {
  token: string | null; // global token for API calls
  user: User | null; // can be null after logout
  loading: boolean;
  error: string | null;
}