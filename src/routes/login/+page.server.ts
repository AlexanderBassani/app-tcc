import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const token = data.get('token') as string;
		const rememberMe = data.get('rememberMe') === 'true';

		if (!token) {
			return fail(400, { error: 'Token não fornecido' });
		}

		// Salvar token nos cookies
		cookies.set('authToken', token, {
			path: '/',
			httpOnly: false, // Precisa ser acessível pelo JavaScript para o store
			secure: false, // Mudar para true em produção com HTTPS
			sameSite: 'lax',
			maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 // 30 dias ou 1 dia
		});

		throw redirect(302, '/');
	},

	logout: async ({ cookies }) => {
		cookies.delete('authToken', { path: '/' });
		throw redirect(302, '/login');
	}
} satisfies Actions;
