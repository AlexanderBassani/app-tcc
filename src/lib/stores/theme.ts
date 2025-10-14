import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { preferencesApi } from '$lib/api/preferences';

type Theme = 'light' | 'dark';

function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>('light');

	return {
		subscribe,
		toggle: () => {
			update((current) => {
				const newTheme = current === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('theme', newTheme);
					document.documentElement.classList.toggle('dark', newTheme === 'dark');
				}
				return newTheme;
			});
		},
		init: async () => {
			if (!browser) return;

			try {
				// Try to get token from localStorage
				const authData = localStorage.getItem('auth');
				if (authData) {
					const { token } = JSON.parse(authData);

					if (token) {
						// Try to load preferences from API
						const response = await preferencesApi.get(token);
						const prefs = response.data;

						// Apply theme mode
						const themeMode = prefs.theme_mode || 'system';
						let appliedTheme: Theme;

						if (themeMode === 'system') {
							const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
							appliedTheme = prefersDark ? 'dark' : 'light';
						} else {
							appliedTheme = themeMode as Theme;
						}

						set(appliedTheme);
						document.documentElement.classList.toggle('dark', appliedTheme === 'dark');

						// Apply theme color
						const themeColor = prefs.theme_color || 'blue';
						if (themeColor !== 'blue') {
							document.documentElement.setAttribute('data-theme', themeColor);
						}

						// Apply font size
						const fontSize = prefs.font_size || 'medium';
						document.documentElement.setAttribute('data-font-size', fontSize);

						return;
					}
				}
			} catch (error) {
				console.error('Error loading preferences from API, using localStorage fallback:', error);
			}

			// Fallback to localStorage
			const stored = localStorage.getItem('theme') as Theme | null;
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			const theme = stored || (prefersDark ? 'dark' : 'light');
			set(theme);
			document.documentElement.classList.toggle('dark', theme === 'dark');

			// Load theme color
			const themeColor = localStorage.getItem('themeColor');
			if (themeColor && themeColor !== 'blue') {
				document.documentElement.setAttribute('data-theme', themeColor);
			}

			// Load font size
			const fontSize = localStorage.getItem('fontSize') || 'medium';
			document.documentElement.setAttribute('data-font-size', fontSize);
		}
	};
}

export const theme = createThemeStore();
