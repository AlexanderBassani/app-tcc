import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
	id: number;
	first_name: string;
	last_name: string;
	username: string;
	email: string;
	role: 'admin' | 'user';
	phone?: string;
	date_of_birth?: string;
	gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
	profile_image_url?: string;
	bio?: string;
	status?: 'active' | 'inactive' | 'suspended' | 'deleted';
	email_verified?: boolean;
	phone_verified?: boolean;
	two_factor_enabled?: boolean;
	preferred_language?: string;
	timezone?: string;
	last_login_at?: string;
	login_attempts?: number;
	locked_until?: string;
	terms_accepted_at?: string;
	privacy_policy_accepted_at?: string;
	marketing_emails_consent?: boolean;
	created_at?: string;
	updated_at?: string;
	deleted_at?: string;
}

// Helper computed property
export function isAdmin(user: User | null): boolean {
	return user?.role === 'admin';
}

export interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
}

function createAuthStore() {
	const initialState: AuthState = {
		user: null,
		token: browser ? localStorage.getItem('authToken') : null,
		isAuthenticated: false
	};

	const { subscribe, set, update } = writable<AuthState>(initialState);

	// Sincronização entre abas usando Storage Events
	if (browser) {
		window.addEventListener('storage', (event) => {
			if (event.key === 'authToken') {
				if (event.newValue) {
					// Token foi atualizado em outra aba - recarregar estado
					const userStr = localStorage.getItem('user');
					if (userStr) {
						try {
							const user = JSON.parse(userStr);
							set({ user, token: event.newValue, isAuthenticated: true });
							console.log('🔄 Auth sincronizada de outra aba (login)');
						} catch (e) {
							console.error('Erro ao sincronizar auth:', e);
						}
					}
				} else {
					// Token foi removido em outra aba - fazer logout
					set({ user: null, token: null, isAuthenticated: false });
					console.log('🔄 Auth sincronizada de outra aba (logout)');
				}
			}
		});
	}

	return {
		subscribe,
		login: (user: User, token: string, rememberMe: boolean = false) => {
			if (browser) {
				// Sempre usar localStorage para compartilhar entre abas
				// A diferença do "rememberMe" será no tempo de expiração do cookie
				localStorage.setItem('authToken', token);
				localStorage.setItem('user', JSON.stringify(user));
				localStorage.setItem('rememberMe', rememberMe.toString());

				// Salvar token nos cookies para o server-side load
				const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 dias ou 1 dia
				document.cookie = `authToken=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
			}
			set({ user, token, isAuthenticated: true });
		},
		logout: () => {
			if (browser) {
				localStorage.removeItem('authToken');
				localStorage.removeItem('user');
				localStorage.removeItem('rememberMe');

				// Remover cookie
				document.cookie = 'authToken=; path=/; max-age=0; SameSite=Strict';
			}
			set({ user: null, token: null, isAuthenticated: false });
		},
		initialize: () => {
			if (browser) {
				const token = localStorage.getItem('authToken');
				const userStr = localStorage.getItem('user');

				if (token && userStr) {
					try {
						const user = JSON.parse(userStr);
						set({ user, token, isAuthenticated: true });

						// Sincronizar cookie se ainda não existir
						if (!document.cookie.includes('authToken=')) {
							const rememberMe = localStorage.getItem('rememberMe') === 'true';
							const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
							document.cookie = `authToken=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
						}
					} catch (e) {
						console.error('Erro ao carregar dados do usuário:', e);
						// Limpar dados corrompidos
						localStorage.removeItem('authToken');
						localStorage.removeItem('user');
						localStorage.removeItem('rememberMe');
					}
				}
			}
		}
	};
}

export const authStore = createAuthStore();
