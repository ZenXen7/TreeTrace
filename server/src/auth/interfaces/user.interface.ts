export interface UserPayload {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  access_token: string;
  user: UserPayload;
}
