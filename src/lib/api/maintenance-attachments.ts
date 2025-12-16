import { API_URL } from '$lib/config/api';
import type {
	MaintenanceAttachment,
	MaintenanceAttachmentResponse,
	MaintenanceAttachmentListResponse,
	UpdateAttachmentRequest
} from '$lib/types/maintenance-attachment';

// Helper function for file uploads (uses FormData instead of JSON)
async function uploadRequest<T = any>(
	endpoint: string,
	files: File[],
	token: string
): Promise<T> {
	const formData = new FormData();

	// Adiciona cada arquivo ao FormData
	files.forEach((file) => {
		formData.append('files', file);
	});

	const fullUrl = `${API_URL}${endpoint}`;

	console.log('🔍 Uploading files to:', fullUrl);
	console.log('🔍 Files count:', files.length);

	const response = await fetch(fullUrl, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`
			// NÃO adicionar Content-Type - o browser define automaticamente para multipart/form-data
		},
		body: formData
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Erro no upload' }));
		throw new Error(error.message || `Upload error: ${response.status}`);
	}

	return response.json();
}

// Helper function for file downloads
async function downloadRequest(endpoint: string, token: string): Promise<Blob> {
	const fullUrl = `${API_URL}${endpoint}`;

	console.log('🔍 Downloading file from:', fullUrl);

	const response = await fetch(fullUrl, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Erro no download' }));
		throw new Error(error.message || `Download error: ${response.status}`);
	}

	return response.blob();
}

// Helper function for regular API requests
async function apiRequest<T = any>(
	endpoint: string,
	options: RequestInit = {},
	token?: string
): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const fullUrl = `${API_URL}${endpoint}`;

	console.log('🔍 Calling API:', fullUrl);

	const response = await fetch(fullUrl, {
		...options,
		headers
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
		throw new Error(error.message || `API error: ${response.status}`);
	}

	return response.json();
}

export const maintenanceAttachmentsApi = {
	// List attachments for a maintenance
	listByMaintenance: (maintenanceId: number, token: string) =>
		apiRequest<MaintenanceAttachmentListResponse>(
			`/api/maintenance-attachments/maintenance/${maintenanceId}`,
			{ method: 'GET' },
			token
		),

	// Get attachment by ID
	getById: (id: number, token: string) =>
		apiRequest<MaintenanceAttachmentResponse>(
			`/api/maintenance-attachments/${id}`,
			{ method: 'GET' },
			token
		),

	// Upload attachments (max 5 files)
	upload: (maintenanceId: number, files: File[], token: string) =>
		uploadRequest<MaintenanceAttachmentListResponse>(
			`/api/maintenance-attachments/maintenance/${maintenanceId}/upload`,
			files,
			token
		),

	// Download attachment
	download: async (id: number, fileName: string, token: string) => {
		const blob = await downloadRequest(`/api/maintenance-attachments/${id}/download`, token);

		// Criar URL temporária e fazer download automático
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	},

	// Update attachment name
	update: (id: number, data: UpdateAttachmentRequest, token: string) =>
		apiRequest<MaintenanceAttachmentResponse>(
			`/api/maintenance-attachments/${id}`,
			{
				method: 'PUT',
				body: JSON.stringify(data)
			},
			token
		),

	// Delete attachment
	delete: (id: number, token: string) =>
		apiRequest<{ message: string }>(`/api/maintenance-attachments/${id}`, { method: 'DELETE' }, token)
};
