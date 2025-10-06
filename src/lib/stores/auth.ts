import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
	id: string;
	login: string;
	email?: string;
	name?: string;
}

export interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
}

function createAuthStore() {
	const initialState: AuthState = {
		user: null,
		token: browser ? localStorage.getItem('token') : null,
		isAuthenticated: false
	};

	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		login: (user: User, token: string, rememberMe: boolean = false) => {
			if (browser) {
				if (rememberMe) {
					localStorage.setItem('token', token);
					localStorage.setItem('user', JSON.stringify(user));
				} else {
					sessionStorage.setItem('token', token);
					sessionStorage.setItem('user', JSON.stringify(user));
				}
			}
			set({ user, token, isAuthenticated: true });
		},
		logout: () => {
			if (browser) {
				localStorage.removeItem('token');
				localStorage.removeItem('user');
				sessionStorage.removeItem('token');
				sessionStorage.removeItem('user');
			}
			set({ user: null, token: null, isAuthenticated: false });
		},
		initialize: () => {
			if (browser) {
				const token =
					localStorage.getItem('token') || sessionStorage.getItem('token');
				const userStr =
					localStorage.getItem('user') || sessionStorage.getItem('user');
				if (token && userStr) {
					try {
						const user = JSON.parse(userStr);
						set({ user, token, isAuthenticated: true });
					} catch (e) {
						console.error('Erro ao carregar dados do usuário:', e);
					}
				}
			}
		}
	};
}

export const authStore = createAuthStore();
