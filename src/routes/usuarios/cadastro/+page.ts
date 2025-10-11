import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	if (browser) {
		// Verificar se há um token de autenticação
		const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

		if (!token) {
			throw redirect(302, '/login');
		}
	}

	return {};
};
