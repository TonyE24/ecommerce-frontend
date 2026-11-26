import { cookies } from "next/headers";

const BASE_URL = process.env.API_BASE_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiErrorMessage(body: string, status: number): string {
  if (body) {
    try {
      const parsed: unknown = JSON.parse(body);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "message" in parsed &&
        typeof parsed.message === "string"
      ) {
        return parsed.message;
      }
    } catch {
      return `Error ${status} al consultar la API: ${body.slice(0, 200)}`;
    }
  }

  return `Error ${status} al consultar la API`;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("Falta configurar la variable de entorno API_BASE_URL.");
  }

  const token = (await cookies()).get("jwt_token")?.value;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(
    `${BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`,
    {
      ...options,
      headers,
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(getApiErrorMessage(body, response.status), response.status);
  }

  return response.json() as Promise<T>;
}
