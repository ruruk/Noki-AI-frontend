import { UserService, UserProfile, ApiResponse } from "../types";
import { HttpClient } from "../http";

// User Service implementation following Single Responsibility Principle
export class UserServiceImpl implements UserService {
  readonly baseUrl = "/users";
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.httpClient.get<UserProfile>(`${this.baseUrl}/profile`);
  }

  async updateProfile(
    data: Partial<UserProfile>
  ): Promise<ApiResponse<UserProfile>> {
    return this.httpClient.patch<UserProfile>(`${this.baseUrl}/profile`, data);
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    return this.httpClient.post<void>(`${this.baseUrl}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  async deleteAccount(): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(`${this.baseUrl}/account`);
  }

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append("avatar", file);

    return this.httpClient.post<{ avatarUrl: string }>(
      `${this.baseUrl}/avatar`,
      formData
    );
  }

  async getAIUsage(): Promise<ApiResponse<any>> {
    return this.httpClient.get<any>(`${this.baseUrl}/ai-usage`);
  }
}
