export interface Vehicle {
    id: number;
    user_id: number;
    brand: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    current_km: number;
    purchase_date: string; // ISO Date string
    is_active: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateVehicleRequest {
    brand: string;
    model: string;
    year: number;
    plate: string;
    color: string;
    current_km: number;
    purchase_date: string;
    notes?: string;
}

export interface UpdateVehicleRequest {
    brand?: string;
    model?: string;
    year?: number;
    plate?: string;
    color?: string;
    current_km?: number;
    purchase_date?: string;
    notes?: string;
}

export interface VehicleResponse {
    success?: boolean;
    message?: string;
    data?: Vehicle; // Matches user's API
    vehicle?: Vehicle; // Legacy/Mock support
}

export interface VehicleListResponse {
    message: string;
    data: Vehicle[];
    count: number;
}
export interface VehicleWithMaintenance extends Vehicle {
    last_maintenance?: {
        id: number;
        title: string;
        service_date: string;
        is_completed: boolean;
        type: string;
    } | null;
}
