export interface JwtPayload {
  sub: string; // The user ID, this will be used to find the user
  email: string;
  firstName: string;
  lastName: string;
}
