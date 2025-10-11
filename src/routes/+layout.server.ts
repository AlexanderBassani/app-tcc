import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, cookies }) => {
	// Lista de rotas públicas que não precisam de autenticação
	const publicRoutes = ['/login'];

	// Verifica se a rota atual é pública
	const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));

	if (!isPublicRoute) {
		// Verifica se existe token nos cookies
		const authToken = cookies.get('authToken');

		if (!authToken) {
			throw redirect(302, '/login');
		}
	}

	return {};
};
