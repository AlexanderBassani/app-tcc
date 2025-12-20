import { api } from './client';
import type {
    Vehicle,
    CreateVehicleRequest,
    UpdateVehicleRequest,
    VehicleResponse,
    VehicleListResponse
} from '$lib/types/vehicle';

export const vehiclesApi = {
    // List active vehicles
    list: (token: string) => api.get<VehicleListResponse>('/api/vehicles', token),

    // List inactive vehicles
    listInactive: (token: string) => api.get<VehicleListResponse>('/api/vehicles/inactive', token),

    // Get vehicle by ID
    getById: (id: number, token: string) => api.get<VehicleResponse>(`/api/vehicles/${id}`, token),

    // Create new vehicle
    create: (data: CreateVehicleRequest, token: string) =>
        api.post<VehicleResponse>('/api/vehicles', data, token),

    // Update vehicle
    update: (id: number, data: UpdateVehicleRequest, token: string) =>
        api.put<VehicleResponse>(`/api/vehicles/${id}`, data, token),

    // Inactivate vehicle (soft delete)
    inactivate: (id: number, token: string) =>
        api.patch<VehicleResponse>(`/api/vehicles/${id}/inactivate`, {}, token),

    // Reactivate vehicle
    reactivate: (id: number, token: string) =>
        api.patch<VehicleResponse>(`/api/vehicles/${id}/reactivate`, {}, token),

    // Delete vehicle permanently
    delete: (id: number, token: string) => api.delete<{ message: string }>(`/api/vehicles/${id}`, token),

    // List vehicles by user (admin only)
    listByUser: (userId: number, token: string) =>
        api.get<VehicleListResponse>(`/api/vehicles/user/${userId}`, token),

    // Check plate availability
    checkPlate: async (plate: string, token: string): Promise<{ available: boolean | null; message: string }> => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/vehicles/check-plate/${plate}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                return { available: true, message: '✅ Placa disponível' };
            } else if (response.status === 409) {
                return { available: false, message: '❌ Placa já cadastrada' };
            } else {
                return { available: null, message: '⚠️ Erro ao verificar placa' };
            }
        } catch (error) {
            return { available: null, message: '⚠️ Erro ao verificar placa' };
        }
    }
};
