export interface Maintenance {
    id: number;
    user_id: number;
    vehicle_id: number;
    title: string;
    description?: string;
    type: 'preventiva' | 'corretiva' | 'revisao' | 'outros';
    cost?: number;
    km_when_done?: number;
    service_date: string; // ISO Date string
    next_service_date?: string; // ISO Date string
    next_km?: number; // Próxima quilometragem para manutenção
    is_completed: boolean;
    completed_at?: string; // ISO Date string
    notes?: string;
    created_at: string;
    updated_at: string;
    // Relations
    vehicle?: {
        id: number;
        brand: string;
        model: string;
        plate: string;
        year: number;
    };
}

export interface CreateMaintenanceRequest {
    vehicle_id: number;
    title: string;
    description?: string;
    type: 'preventiva' | 'corretiva' | 'revisao' | 'outros';
    cost?: number;
    km_when_done?: number;
    service_date: string;
    next_service_date?: string;
    next_km?: number;
    notes?: string;
}

export interface UpdateMaintenanceRequest {
    vehicle_id?: number;
    title?: string;
    description?: string;
    type?: 'preventiva' | 'corretiva' | 'revisao' | 'outros';
    cost?: number;
    km_when_done?: number;
    service_date?: string;
    next_service_date?: string;
    notes?: string;
    next_km?: number;
}

export interface MaintenanceResponse {
    success?: boolean;
    message?: string;
    data?: Maintenance;
    maintenance?: Maintenance; // Legacy/Mock support
}

export interface MaintenanceListResponse {
    message: string;
    data: Maintenance[];
    count: number;
}

export const MAINTENANCE_TYPES = [
    { value: 'preventiva', label: 'Preventiva' },
    { value: 'corretiva', label: 'Corretiva' },
    { value: 'revisao', label: 'Revisão' },
    { value: 'outros', label: 'Outros' }
] as const;