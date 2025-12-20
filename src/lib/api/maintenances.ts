import { api } from './client';
import type {
    Maintenance,
    CreateMaintenanceRequest,
    UpdateMaintenanceRequest,
    MaintenanceResponse,
    MaintenanceListResponse,
    MaintenanceFilters
} from '$lib/types/maintenance';

export const maintenancesApi = {
    // List user maintenances
    list: (token: string, filters?: MaintenanceFilters) => {
        const params = new URLSearchParams();

        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.vehicleId) params.append('vehicle_id', filters.vehicleId.toString());
        if (filters?.from) params.append('start_date', filters.from);
        if (filters?.to) params.append('end_date', filters.to);
        if (filters?.sort) params.append('sort', filters.sort);
        if (filters?.status && filters.status !== 'all') {
            // Mapping 'pending'/'completed' to boolean if backend supports specific param or generic 'status'
            // I'll guess 'is_completed' matching the DB field, or just send 'status'
            // If I send 'is_completed', value should be 'true' or 'false'.
            if (filters.status === 'completed') params.append('is_completed', 'true');
            if (filters.status === 'pending') params.append('is_completed', 'false');
        }

        const queryString = params.toString();
        const endpoint = queryString ? `/api/maintenances?${queryString}` : '/api/maintenances';

        return api.get<MaintenanceListResponse>(endpoint, token);
    },

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