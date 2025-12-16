import { api } from './client';
import type {
    Fueling,
    CreateFuelingRequest,
    UpdateFuelingRequest,
    PatchFuelingRequest,
    FuelingResponse,
    FuelingListResponse,
    FuelingStatsResponse,
    FuelingFilters,
    FuelingStatsFilters
} from '$lib/types/fueling';

export const fuelingsApi = {
    /**
     * List fuel records with pagination and filters
     * GET /api/fuel-records
     */
    list: (token: string, filters?: FuelingFilters) => {
        const params = new URLSearchParams();

        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.vehicleId) params.append('vehicle_id', filters.vehicleId.toString());
        if (filters?.from) params.append('start_date', filters.from);
        if (filters?.to) params.append('end_date', filters.to);
        if (filters?.sort) params.append('sort', filters.sort);

        const queryString = params.toString();
        const endpoint = queryString ? `/api/fuel-records?${queryString}` : '/api/fuel-records';

        return api.get<FuelingListResponse>(endpoint, token);
    },

    /**
     * Get fuel record by ID
     * GET /api/fuel-records/:id
     */
    getById: (id: number, token: string) =>
        api.get<FuelingResponse>(`/api/fuel-records/${id}`, token),

    /**
     * Create new fuel record
     * POST /api/fuel-records
     */
    create: (data: CreateFuelingRequest, token: string) =>
        api.post<FuelingResponse>('/api/fuel-records', data, token),

    /**
     * Update fuel record (replace all fields)
     * PUT /api/fuel-records/:id
     */
    update: (id: number, data: UpdateFuelingRequest, token: string) =>
        api.put<FuelingResponse>(`/api/fuel-records/${id}`, data, token),

    /**
     * Partially update fuel record
     * PATCH /api/fuel-records/:id
     */
    patch: (id: number, data: PatchFuelingRequest, token: string) =>
        api.patch<FuelingResponse>(`/api/fuel-records/${id}`, data, token),

    /**
     * Delete fuel record (soft delete by default)
     * DELETE /api/fuel-records/:id
     * @param hardDelete - if true, performs hard delete (admin only)
     */
    delete: (id: number, token: string, hardDelete: boolean = false) => {
        const endpoint = hardDelete
            ? `/api/fuel-records/${id}?hardDelete=true`
            : `/api/fuel-records/${id}`;
        return api.delete<{ success: boolean; message: string }>(endpoint, token);
    },

    /**
     * List fuel records by vehicle
     * GET /api/fuel-records/vehicle/:vehicleId
     */
    listByVehicle: (vehicleId: number, token: string) =>
        api.get<{ success: boolean; data: Fueling[]; count: number }>(
            `/api/fuel-records/vehicle/${vehicleId}`,
            token
        ),

    /**
     * Get fuel record statistics for a vehicle
     * GET /api/fuel-records/vehicle/:vehicleId/statistics
     */
    getVehicleStats: (vehicleId: number, token: string, filters?: FuelingStatsFilters) => {
        const params = new URLSearchParams();

        if (filters?.from) params.append('start_date', filters.from);
        if (filters?.to) params.append('end_date', filters.to);
        if (filters?.period) params.append('period', filters.period);

        const queryString = params.toString();
        const endpoint = queryString
            ? `/api/fuel-records/vehicle/${vehicleId}/statistics?${queryString}`
            : `/api/fuel-records/vehicle/${vehicleId}/statistics`;

        return api.get<FuelingStatsResponse>(endpoint, token);
    }
};
