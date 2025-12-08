import {getToken} from "../auth/tokenProvider.ts";

export interface HttpError {
  status: number;
  message: string;
  data?: any;
}

export class HttpClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }


  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = await getToken();
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: HttpError = {
        status: response.status,
        message: `HTTP Error: ${response.status} ${response.statusText}`,
      };

      // Leer el body del error una sola vez
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          error.data = await response.json();
        } else {
          error.data = await response.text();
        }
      } catch (e) {
        // Si no se puede leer el body, dejamos error.data como undefined
        error.data = undefined;
      }

      throw error;
    }

    // Manejar respuestas vacías o de texto plano
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Si es texto plano, leerlo como texto
      if (contentType && contentType.includes('text/plain')) {
        const text = await response.text();
        return (text || {}) as T;
      }
      // Si no hay contenido o es otro tipo, devolver objeto vacío
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    console.log('POST Request:', endpoint, body);
    try {
      const result = await this.request<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      console.log('POST Response:', result);
      return result;
    } catch (error: any) {
      console.error('POST Error:', error);
      throw error;
    }
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }


  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}

// Instancia singleton del cliente HTTP
export const httpClient = new HttpClient(import.meta.env.VITE_API_BASE_URL);
export const httpUserClient = new HttpClient(import.meta.env.VITE_API_USER_BASE_URL);

