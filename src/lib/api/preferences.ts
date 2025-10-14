import { api } from './client';

// Types
export interface UserPreferences {
	id: number;
	user_id: number;
	theme_mode: 'light' | 'dark' | 'system';
	theme_color: string;
	font_size: 'small' | 'medium' | 'large' | 'extra-large';
	compact_mode: boolean;
	animations_enabled: boolean;
	high_contrast: boolean;
	reduce_motion: boolean;
	created_at: string;
	updated_at: string;
}

export interface PreferencesResponse {
	message: string;
	data: UserPreferences;
}

export interface UpdatePreferencesRequest {
	theme_mode?: 'light' | 'dark' | 'system';
	theme_color?: string;
	font_size?: 'small' | 'medium' | 'large' | 'extra-large';
	compact_mode?: boolean;
	animations_enabled?: boolean;
	high_contrast?: boolean;
	reduce_motion?: boolean;
}

export interface UpdateThemeRequest {
	theme_mode?: 'light' | 'dark' | 'system';
	theme_color?: string;
}

// Preferences API Functions
export const preferencesApi = {
	// Get current user's preferences
	get: (token: string) => api.get<PreferencesResponse>('/api/preferences', token),

	// Update current user's preferences
	update: (data: UpdatePreferencesRequest, token: string) =>
		api.put<PreferencesResponse>('/api/preferences', data, token),

	// Update only theme (faster)
	updateTheme: (data: UpdateThemeRequest, token: string) =>
		api.patch<PreferencesResponse>('/api/preferences/theme', data, token),

	// Get another user's preferences (admin only)
	getByUserId: (userId: number, token: string) =>
		api.get<PreferencesResponse>(`/api/preferences/${userId}`, token),

	// Update another user's preferences (admin only)
	updateByUserId: (userId: number, data: UpdatePreferencesRequest, token: string) =>
		api.put<PreferencesResponse>(`/api/preferences/${userId}`, data, token),

	// Reset preferences to default
	reset: (token: string) => api.delete<PreferencesResponse>('/api/preferences', token)
};
