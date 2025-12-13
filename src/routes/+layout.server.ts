import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, cookies }) => {
	// Lista de rotas públicas que não precisam de autenticação
	const publicRoutes = ['/login', '/register'];

	// Verifica se a rota atual é pública
	const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));

	// Verifica se existe token nos cookies
	const authToken = cookies.get('authToken');

	// DEBUG
	console.log('\n🔍 [SERVER LOAD]');
	console.log('   URL:', url.pathname);
	console.log('   isPublicRoute:', isPublicRoute);
	console.log('   hasToken:', !!authToken);

	if (!isPublicRoute) {
		// Rota protegida - verifica se tem token
		if (!authToken) {
			console.log('   ➡️  REDIRECT: /login (no token)');
			throw redirect(302, '/login');
		}
		console.log('   ✅ ALLOW (has token)');
	} else {
		// Rota pública (login/register) - se tem token, redireciona para home
		if (authToken) {
			console.log('   ➡️  REDIRECT: / (already authenticated)');
			throw redirect(302, '/');
		}
		console.log('   ✅ ALLOW (public route)');
	}

	return {};
};
