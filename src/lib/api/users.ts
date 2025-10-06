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

export interface CreateUserRequest {
	first_name: string;
	last_name: string;
	username: string;
	email: string;
	password: string;
	role?: 'admin' | 'user';
	phone?: string;
	date_of_birth?: string;
	gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
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

export interface ChangeUserPasswordRequest {
	new_password: string;
}

// Users API Functions
export const usersApi = {
	// List all users
	list: (token: string) =>
		api.get<UsersListResponse>('/api/users', token),

	// Get current user profile
	getProfile: (token: string) =>
		api.get<UserResponse>('/api/users/profile', token),

	// Get user by ID
	getById: (id: number, token: string) =>
		api.get<UserResponse>(`/api/users/${id}`, token),

	// Create user (admin only)
	create: (data: CreateUserRequest, token: string) =>
		api.post<UserResponse>('/api/users', data, token),

	// Update own profile
	updateProfile: (data: UpdateProfileRequest, token: string) =>
		api.put<UserResponse>('/api/users/profile', data, token),

	// Change another user's password (admin only)
	changeUserPassword: (userId: number, data: ChangeUserPasswordRequest, token: string) =>
		api.put(`/api/users/${userId}/change-password`, data, token),
};
