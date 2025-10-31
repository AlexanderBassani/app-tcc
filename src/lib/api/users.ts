import { api } from './client';
import type { User } from '$lib/stores/auth';

// Request/Response Types
export interface UsersListResponse {
	message: string;
	data: User[];
	count: number;
}

export interface UserResponse {
	message: string;
	user: User;
}

export interface RegisterUserRequest {
	first_name: string;
	last_name: string;
	username: string;
	email: string;
	password: string;
	phone?: string;
	date_of_birth?: string;
	gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
	bio?: string;
	preferred_language?: string;
	timezone?: string;
	marketing_emails_consent?: boolean;
}

export interface CreateUserRequest extends RegisterUserRequest {
	role?: 'admin' | 'user';
	status?: 'active' | 'inactive';
}

export interface UpdateProfileRequest {
	first_name?: string;
	last_name?: string;
	email?: string;
	phone?: string;
	date_of_birth?: string;
	gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
	bio?: string;
	profile_image_url?: string;
	preferred_language?: string;
	timezone?: string;
}

export interface UpdateUserRequest extends UpdateProfileRequest {
	username?: string;
	role?: 'admin' | 'user';
	status?: 'active' | 'inactive';
	marketing_emails_consent?: boolean;
}

export interface ChangeUserPasswordRequest {
	new_password: string;
}

// Users API Functions
export const usersApi = {
	// Register new user (public endpoint)
	register: (data: RegisterUserRequest) =>
		api.post<UserResponse>('/api/users/register', data),

	// List all users
	list: (token: string) =>
		api.get<UsersListResponse>('/api/users', token),

	// Get current user profile
	getProfile: (token: string) =>
		api.get<UserResponse>('/api/users/profile', token),

	// Get user by ID
	getById: (id: number, token: string) =>
		api.get<UserResponse>(`/api/users/${id}`, token),

	// Create user (admin only) - used for admin creating users with role assignment
	create: (data: CreateUserRequest, token: string) =>
		api.post<UserResponse>('/api/users/register', data, token),

	// Update own profile
	updateProfile: (data: UpdateProfileRequest, token: string) =>
		api.put<UserResponse>('/api/users/profile', data, token),

	// Update user (admin only)
	update: (userId: number, data: UpdateUserRequest, token: string) =>
		api.put<UserResponse>(`/api/users/${userId}`, data, token),

	// Change another user's password (admin only)
	changeUserPassword: (userId: number, data: ChangeUserPasswordRequest, token: string) =>
		api.put(`/api/users/${userId}/change-password`, data, token),
};
