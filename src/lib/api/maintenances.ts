import { api } from './client';
import type {
    Maintenance,
    CreateMaintenanceRequest,
    UpdateMaintenanceRequest,
    MaintenanceResponse,
    MaintenanceListResponse
} from '$lib/types/maintenance';

export const maintenancesApi = {
    // List user maintenances
    list: (token: string) => api.get<MaintenanceListResponse>('/api/maintenances', token),

    // Get maintenance by ID
    getById: (id: number, token: string) => 
        api.get<MaintenanceResponse>(`/api/maintenances/${id}`, token),

    // Create new maintenance
    create: (data: CreateMaintenanceRequest, token: string) =>
        api.post<MaintenanceResponse>('/api/maintenances', data, token),

    // Update maintenance
    update: (id: number, data: UpdateMaintenanceRequest, token: string) =>
        api.put<MaintenanceResponse>(`/api/maintenances/${id}`, data, token),

    // Mark maintenance as completed
    complete: (id: number, token: string) =>
        api.patch<MaintenanceResponse>(`/api/maintenances/${id}/complete`, {}, token),

    // Delete maintenance
    delete: (id: number, token: string) => 
        api.delete<{ message: string }>(`/api/maintenances/${id}`, token),

    // List maintenances by user (admin only)
    listByUser: (userId: number, token: string) =>
        api.get<MaintenanceListResponse>(`/api/maintenances/user/${userId}`, token)
};