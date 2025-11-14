import { api } from "./api";

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface PaginationResponse {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export class ApiService {
  constructor(private endpoint: string) {}

  async getAll<T>(
    params?: any
  ): Promise<{ data: T[]; pagination: PaginationResponse }> {
    const response = await api.get<
      ApiResponse<{ data: T[]; pagination: PaginationResponse }>
    >(this.endpoint, { params });
    return response.data.data;
  }

  async getById<T>(id: string | number): Promise<T> {
    const response = await api.get<ApiResponse<{ data: T }>>(
      `${this.endpoint}/${id}`
    );
    return response.data.data;
  }

  async create<T>(data: any): Promise<T> {
    const response = await api.post<ApiResponse<{ data: T }>>(
      this.endpoint,
      data
    );
    return response.data.data;
  }

  async update<T>(id: string | number, data: any): Promise<T> {
    const response = await api.put<ApiResponse<{ data: T }>>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data.data;
  }

  async delete(id: string | number): Promise<void> {
    await api.delete(`${this.endpoint}/${id}`);
  }
}

export const createApiService = (endpoint: string) => new ApiService(endpoint);
