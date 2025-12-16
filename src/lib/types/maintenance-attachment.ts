export interface MaintenanceAttachment {
	id: number;
	maintenance_id: number;
	file_name: string;
	file_path: string;
	file_size: number;
	file_type: string;
	uploaded_at: string;
	created_at: string;
	updated_at: string;
}

export interface MaintenanceAttachmentResponse {
	message: string;
	data: MaintenanceAttachment;
}

export interface MaintenanceAttachmentListResponse {
	message: string;
	data: MaintenanceAttachment[];
	count: number;
}

export interface UploadAttachmentRequest {
	files: File[];
}

export interface UpdateAttachmentRequest {
	file_name: string;
}
