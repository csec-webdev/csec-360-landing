export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface Application {
  id: string;
  name: string;
  description: string;
  url: string;
  image_url: string;
  auth_type: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithDepartments extends Application {
  departments: Department[];
  is_favorited?: boolean;
}

export interface ApplicationDepartment {
  application_id: string;
  department_id: string;
}

export interface UserFavorite {
  user_id: string;
  application_id: string;
  created_at: string;
}

export type AuthType = 'username_password' | 'sso' | 'api_key' | 'oauth' | 'other';

export const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'username_password', label: 'Username/Password' },
  { value: 'sso', label: 'SSO' },
  { value: 'api_key', label: 'API Key' },
  { value: 'oauth', label: 'OAuth' },
  { value: 'other', label: 'Other' },
];
