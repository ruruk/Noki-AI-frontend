import {
  CanvasService,
  CanvasSetupData,
  CanvasSetupResponse,
  CanvasLinkResponse,
  ApiResponse,
} from "../types";
import { HttpClient, createHttpClient } from "../http";

// Canvas Service implementation following Single Responsibility Principle
// Uses extended timeout for Canvas operations (15 minutes) as data syncing can take time
export class CanvasServiceImpl implements CanvasService {
  readonly baseUrl = "/canvas";
  private httpClient: HttpClient;

  constructor(httpClient?: HttpClient) {
    // Create a custom HTTP client with extended timeout for Canvas operations
    const canvasConfig = {
      timeout: 900000, // 5 minutes for Canvas data sync operations (strictly enforced)
      retries: 0, // No retries for Canvas operations to prevent duplicate syncs
    };

    this.httpClient = httpClient || createHttpClient(canvasConfig);

    // Debug: Log the timeout configuration
    console.log(
      "[Canvas Service] Initialized with timeout:",
      canvasConfig.timeout,
      "ms (",
      canvasConfig.timeout / 300000,
      "minutes)"
    );
  }

  /**
   * Step 1: Setup Canvas account
   * Sets up the Canvas account with institutional URL and token
   * Requires bearer token authentication
   */
  async setupCanvas(
    data: CanvasSetupData
  ): Promise<ApiResponse<CanvasSetupResponse>> {
    return this.httpClient.post<CanvasSetupResponse>(
      `${this.baseUrl}/setup`,
      data
    );
  }

  /**
   * Step 2: Link Canvas data to Noki AI
   * Links the Canvas account data to the user's Noki account
   * Must be called after setupCanvas
   * Requires bearer token authentication
   */
  async linkCanvasData(): Promise<ApiResponse<CanvasLinkResponse>> {
    return this.httpClient.post<CanvasLinkResponse>(
      `${this.baseUrl}/link-data`
    );
  }

  /**
   * Get Canvas provider information
   * Returns Canvas integration details if connected, null otherwise
   */
  async getCanvasProvider(): Promise<ApiResponse<any>> {
    return this.httpClient.get<any>(`${this.baseUrl}/provider`);
  }

  /**
   * Delete all Canvas data
   * Deletes all Canvas-linked projects, tasks, todos, and auth provider
   */
  async deleteAllCanvasData(): Promise<ApiResponse<any>> {
    return this.httpClient.delete<any>(`${this.baseUrl}/delete-all`);
  }
}
