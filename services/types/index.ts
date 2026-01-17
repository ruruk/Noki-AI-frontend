// Base types and interfaces for the services layer
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  status: number;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Base service interface following Interface Segregation Principle
export interface BaseService {
  readonly baseUrl: string;
}

// HTTP methods interface
export interface HttpService {
  get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: any): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: any): Promise<ApiResponse<T>>;
  patch<T>(url: string, data?: any): Promise<ApiResponse<T>>;
  delete<T>(url: string, data?: any): Promise<ApiResponse<T>>;
}

// Configuration interface
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

// Service factory interface for dependency injection
export interface ServiceFactory {
  createAuthService(): AuthService;
  createUserService(): UserService;
  createProjectService(): ProjectService;
  createTaskService(): TaskService;
  createTodoService(): TodoService;
  createTimetableService(): TimetableService;
  createCanvasService(): CanvasService;
  createMainService(): MainService;
  createAIService(): AIService;
}

// Forward declarations for service interfaces
export interface AuthService extends BaseService {
  login(credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>>;
  register(userData: RegisterData): Promise<ApiResponse<AuthTokens>>;
  logout(): Promise<ApiResponse<void>>;
  getProfile(): Promise<ApiResponse<AuthProfile>>;
  googleAuth(idToken: string): Promise<ApiResponse<AuthTokens>>;
  isAuthenticated(): boolean;
  getCurrentToken(): string | null;
  getCurrentUser(): any | null;
}

export interface UserService extends BaseService {
  getProfile(): Promise<ApiResponse<UserProfile>>;
  updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>>;
  changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>>;
  deleteAccount(): Promise<ApiResponse<void>>;
  getAIUsage(): Promise<ApiResponse<AIUsageStats>>;
}

export interface AIUsageStats {
  totals: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    embedding_tokens: number;
    total_cost_usd: number;
  };
  monthly: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    embedding_tokens: number;
    cost_usd: number;
    change_percentage: number;
  };
  limits: {
    token_limit: number;
    tokens_remaining: number;
    tokens_used: number;
    usage_percentage: number;
    is_premium: boolean;
  };
  message_count: number;
}

export interface ProjectService extends BaseService {
  getProjects(params?: PaginationParams): Promise<PaginatedResponse<Project>>;
  getProject(id: string): Promise<ApiResponse<Project>>;
  createProject(data: CreateProjectData): Promise<ApiResponse<Project>>;
  updateProject(
    id: string,
    data: Partial<UpdateProjectData>
  ): Promise<ApiResponse<Project>>;
  deleteProject(id: string): Promise<ApiResponse<Project>>;
}

export interface TaskService extends BaseService {
  createTask(data: CreateTaskData): Promise<ApiResponse<Task>>;
  updateTask(
    id: string,
    data: Partial<UpdateTaskData>
  ): Promise<ApiResponse<Task>>;
  deleteTask(id: string): Promise<ApiResponse<Task>>;
  completeTask(id: string): Promise<ApiResponse<Task>>;
}

export interface TodoService extends BaseService {
  createTodo(taskId: string, data: CreateTodoData): Promise<ApiResponse<Todo>>;
  updateTodos(
    todoIds: string[],
    updates: Partial<UpdateTodoData>
  ): Promise<ApiResponse<UpdateTodosResponse>>;
  deleteTodos(todoIds: string[]): Promise<ApiResponse<DeleteTodosResponse>>;
  completeTodo(id: string): Promise<ApiResponse<Todo>>;
}

export interface TimetableService extends BaseService {
  getTimetable(): Promise<ApiResponse<Timetable>>;
  updateTimetable(data: Partial<Timetable>): Promise<ApiResponse<Timetable>>;
  addEvent(event: TimetableEvent): Promise<ApiResponse<TimetableEvent>>;
  updateEvent(
    id: string,
    event: Partial<TimetableEvent>
  ): Promise<ApiResponse<TimetableEvent>>;
  deleteEvent(id: string): Promise<ApiResponse<void>>;
  getEventsByDay(dayOfWeek: number): Promise<ApiResponse<TimetableEvent[]>>;
  getEventsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<TimetableEvent[]>>;
}

// Data models
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
}

export interface AuthProfile {
  userId: string;
  email: string;
  isGoogleUser: boolean;
  isNewUser: boolean;
}

export interface GoogleTokenRequest {
  idToken: string;
}

// Enums
export type ProjectSource = "Personal" | "Canvas";
export type TaskType = "Personal" | "Project" | "Canvas";
export type Priority = "High" | "Medium" | "Low";

// User type (simplified)
export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
}

// Resource type
export interface Resource {
  id: string;
  title: string;
  description?: string;
  url?: string;
  file_path?: string;
  resource_type: string;
  created_at: string;
  updated_at: string;
}

// Project types
export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  source: ProjectSource;
  external_id?: string;
  course_code?: string;
  color_hex?: string;
  time_zone?: string;
  start_at?: string;
  end_at?: string;
  raw_canvas_data?: any;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
  resources?: Resource[];
}

export interface CreateProjectData {
  title: string;
  description?: string;
  source?: ProjectSource;
  external_id?: string;
  course_code?: string;
  color_hex?: string;
  time_zone?: string;
  start_at?: string;
  end_at?: string;
  raw_canvas_data?: any;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  source?: ProjectSource;
  external_id?: string;
  course_code?: string;
  color_hex?: string;
  time_zone?: string;
  start_at?: string;
  end_at?: string;
  raw_canvas_data?: any;
}

// Task types
export interface Task {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  description?: string;
  type: TaskType;
  due_date?: string;
  is_all_day: boolean;
  is_submitted: boolean;
  priority?: Priority;
  raw_canvas_data?: any;
  created_at: string;
  updated_at: string;
  user?: User;
  project?: Project;
  todos?: Todo[];
  resources?: Resource[];
}

export interface CreateTaskData {
  title: string;
  type: TaskType;
  description?: string;
  project_id?: string;
  due_date?: string;
  is_all_day?: boolean;
  is_submitted?: boolean;
  priority?: Priority;
  raw_canvas_data?: any;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  due_date?: string;
  is_submitted?: boolean;
  priority?: Priority;
  raw_canvas_data?: any;
}

// Todo types
export interface Todo {
  id: string;
  user_id: string;
  task_id: string;
  title: string;
  description?: string;
  priority?: Priority;
  due_date?: string;
  is_all_day: boolean;
  is_submitted: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  task?: Task;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: Priority;
  due_date?: string;
  is_all_day?: boolean;
  is_submitted?: boolean;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  priority?: Priority;
  due_date?: string;
  is_all_day?: boolean;
  is_submitted?: boolean;
}

export interface UpdateTodosResponse {
  updated: number;
  todos: Todo[];
}

export interface DeleteTodosResponse {
  deleted: number;
  todoIds: string[];
}

export interface Timetable {
  id: string;
  userId: string;
  events: TimetableEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface TimetableEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  color: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

// Canvas Service Types
export interface CanvasService extends BaseService {
  setupCanvas(data: CanvasSetupData): Promise<ApiResponse<CanvasSetupResponse>>;
  linkCanvasData(): Promise<ApiResponse<CanvasLinkResponse>>;
  getCanvasProvider(): Promise<ApiResponse<any>>;
  deleteAllCanvasData(): Promise<ApiResponse<any>>;
}

export interface CanvasSetupData {
  canvas_institutional_url: string;
  canvas_token: string;
}

export interface CanvasUserDetails {
  id: number;
  name: string;
  created_at: string;
  sortable_name: string;
  short_name: string;
  avatar_url: string;
  last_name: string;
  first_name: string;
  locale: string | null;
  effective_locale: string;
  permissions: {
    can_update_name: boolean;
    can_update_avatar: boolean;
    limit_parent_app_web_access: boolean;
  };
}

export interface CanvasSetupResponse {
  message: string;
  user_details: CanvasUserDetails;
}

export interface CanvasLinkResponse {
  message: string;
}

// Main Service Types
export interface MainService extends BaseService {
  getAllUserData(): Promise<ApiResponse<AllUserData>>;
  getCachedData(): Promise<CachedData | null>;
  clearCachedData(): Promise<void>;
  getCacheAge(): Promise<number | null>;
  getDB(): any; // Returns IndexedDB service for direct CRUD operations
}

// All User Data - contains projects, tasks, and todos
export interface AllUserData {
  projects?: any[];
  tasks?: any[];
  todos?: any[];
  [key: string]: any; // Allow for additional fields
}

// Cached Data with timestamp
export interface CachedData {
  data: AllUserData;
  lastUpdated: string; // ISO 8601 datetime string
}

// AI Service Types
export interface AIService extends BaseService {
  getAllConversations(): Promise<ApiResponse<Conversation[]>>;
  getConversationHistory(
    conversationId: string
  ): Promise<ApiResponse<ConversationHistoryResponse>>;
  newConversation(): Promise<ApiResponse<NewConversationResponse>>;
  chat(data: ChatRequest): Promise<ApiResponse<ChatResponse>>;
  renameConversation(
    conversationId: string,
    title: string
  ): Promise<ApiResponse<ConversationUpdateResponse>>;
  deleteConversation(
    conversationId: string
  ): Promise<ApiResponse<DeleteConversationResponse>>;
}

// Conversation types
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface NewConversationResponse {
  conversation_id: string;
}

export interface ChatRequest {
  conversation_id: string;
  prompt: string;
  projects?: Array<{ project_id: string }>;
  tasks?: Array<{ task_id: string }>;
  todos?: Array<{ todo_id: string }>;
}

export interface ChatResponse {
  stage: string;
  conversation_id: string;
  text: string;
  blocks: any[]; // Array of structured UI blocks (optional)
  timestamp: string;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    embedding_tokens: number;
    cost_estimate_usd: number;
  };
}

export interface ConversationUpdateResponse {
  id: string;
  title: string;
  updated_at: string;
}

export interface DeleteConversationResponse {
  message: string;
  conversation_id: string;
}

// Conversation history response type
export interface ConversationHistoryResponse {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  messages: ConversationMessage[];
}

// Conversation history message types
export interface ConversationMessage {
  id: string;
  conversation_id: string;
  user_id: string | null;
  type: "Prompt" | "Response";
  prompt: string | null; // Used for type "Prompt"
  projects: MessageProject[] | null; // Full project context objects
  tasks: MessageTask[] | null; // Full task context objects
  todos: MessageTodo[] | null; // Full todo context objects
  text: string | null; // Used for type "Response"
  blocks: any[] | null; // Array of structured UI blocks (optional, for type "Response")
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    embedding_tokens: number;
    cost_estimate_usd: number;
  } | null;
  metadata: any | null; // Additional metadata
  embedding_id: string | null;
  created_at: string;
}

// Context objects included in messages
export interface MessageProject {
  project_id: string;
  title: string;
  description?: string;
  instructor?: string;
}

export interface MessageTask {
  task_id: string;
  title: string;
  description?: string;
  due_datetime?: string;
  status?: "pending" | "in_progress" | "completed";
  project_id?: string;
}

export interface MessageTodo {
  todo_id: string;
  title: string;
  description?: string;
  due_date?: string;
  status?: "pending" | "in_progress" | "completed";
  project_id?: string;
  task_id?: string;
  priority?: "low" | "medium" | "high";
}
