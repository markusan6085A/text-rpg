import { apiRequest } from "./core";
import type { AuthResponse } from "./typesAuthCharacter";

// Auth API functions (credentials: "include" is in apiRequest)
export async function register(login: string, password: string): Promise<string> {
  const response = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
  return response.accessToken;
}

export async function login(login: string, password: string): Promise<string> {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
  return response.accessToken;
}
