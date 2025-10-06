import { api } from './client';
import type { User } from '$lib/stores/auth';

// Request/Response Types
export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	user: User;
}

export interface RegisterRequest {
	first_name: string;
	last_name: string;
	username: string;
	email: string;
	password: string;
	phone?: string;
	date_of_birth?: string;
	gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}

export interface RegisterResponse {
	message: string;
	user: User;
}

export interface RefreshTokenResponse {
	token: string;
}

export interface PasswordResetRequest {
	email: string;
}

export interface PasswordResetValidateRequest {
	token: string;
}

export interface PasswordResetResetRequest {
	token: string;
	new_password: string;
}

export interface ChangePasswordRequest {
	current_password: string;
	new_password: string;
}

// Auth API Functions
export const authApi = {
	// Login
	login: (data: LoginRequest) =>
		api.post<LoginResponse>('/api/users/login', data),

	// Register
	register: (data: RegisterRequest) =>
		api.post<RegisterResponse>('/api/users/register', data),

	// Logout
	logout: (token: string) =>
		api.post('/api/users/logout', {}, token),

	// Refresh Token
	refreshToken: (token: string) =>
		api.post<RefreshTokenResponse>('/api/users/refresh-token', {}, token),

	// Change Own Password
	changePassword: (data: ChangePasswordRequest, token: string) =>
		api.put('/api/users/change-password', data, token),

	// Password Reset - Request
	requestPasswordReset: (data: PasswordResetRequest) =>
		api.post('/api/password-reset/request', data),

	// Password Reset - Validate Token
	validateResetToken: (data: PasswordResetValidateRequest) =>
		api.post('/api/password-reset/validate-token', data),

	// Password Reset - Reset Password
	resetPassword: (data: PasswordResetResetRequest) =>
		api.post('/api/password-reset/reset', data),
};
