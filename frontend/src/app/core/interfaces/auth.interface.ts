export interface Credentials {
  username: string;
  password: string;
  auto?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
}
