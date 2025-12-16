// Função para garantir que a URL seja absoluta
function getAbsoluteApiUrl(): string {
	const envUrl = import.meta.env.VITE_API_URL;
	const fallbackUrl = 'http://localhost:3001';

	let url = envUrl || fallbackUrl;

	// Se a URL não começar com http:// ou https://, adiciona https://
	if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
		url = `https://${url}`;
	}

	// Remove trailing slash se existir
	url = url.replace(/\/$/, '');

	return url;
}

export const API_URL = getAbsoluteApiUrl();

// Debug temporário
if (typeof window !== 'undefined') {
	console.log('🔍 API_URL final:', API_URL);
	console.log('🔍 VITE_API_URL do env:', import.meta.env.VITE_API_URL);
}
