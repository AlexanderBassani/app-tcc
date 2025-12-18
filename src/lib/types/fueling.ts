export interface Fueling {
    id: number;
    vehicle_id: number;
    date: string; // ISO Date string (YYYY-MM-DD)
    km: number;
    liters: number;
    price_per_liter: number;
    total_cost: number;
    fuel_type: 'gasoline' | 'ethanol' | 'diesel' | 'flex' | 'gnv' | 'electric';
    is_full_tank: boolean;
    gas_station?: string;
    notes?: string;
    created_at: string; // ISO DateTime string
    deleted_at?: string; // ISO DateTime string (soft delete)
    // Relations
    vehicle?: {
        id: number;
        brand: string;
        model: string;
        plate: string;
        year: number;
    };
}

export interface CreateFuelingRequest {
    vehicle_id: number;
    date: string; // YYYY-MM-DD
    km: number;
    liters: number;
    price_per_liter: number;
    fuel_type?: 'gasoline' | 'ethanol' | 'diesel' | 'flex' | 'gnv' | 'electric';
    is_full_tank?: boolean;
    gas_station?: string;
    notes?: string;
}

export interface UpdateFuelingRequest {
    date: string; // YYYY-MM-DD
    km: number;
    liters: number;
    price_per_liter: number;
    fuel_type?: 'gasoline' | 'ethanol' | 'diesel' | 'flex' | 'gnv' | 'electric';
    is_full_tank?: boolean;
    gas_station?: string;
    notes?: string;
}

export interface PatchFuelingRequest {
    date?: string; // YYYY-MM-DD
    km?: number;
    liters?: number;
    price_per_liter?: number;
    fuel_type?: 'gasoline' | 'ethanol' | 'diesel' | 'flex' | 'gnv' | 'electric';
    is_full_tank?: boolean;
    gas_station?: string;
    notes?: string;
}

export interface FuelingResponse {
    success: boolean;
    message?: string;
    data: Fueling;
}

export interface FuelingListResponse {
    success: boolean;
    data: Fueling[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface FuelingStatsResponse {
    success: boolean;
    data: {
        overview: {
            total_records: number;
            total_liters: number;
            total_cost: number;
            avg_price_per_liter: number;
        };
        consumption: {
            avg_km_per_liter: number | null;
            records_used: number;
        };
        by_period: Array<{
            day?: string;    // YYYY-MM-DD (when period=daily)
            month?: string;  // YYYY-MM (when period=monthly)
            year?: string;   // YYYY (when period=yearly)
            count: number;
            total_liters: number;
            total_cost: number;
            avg_price: number;
        }>;
    };
}

export interface FuelingFilters {
    page?: number;
    limit?: number;
    vehicleId?: number;
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
    sort?: 'date:ASC' | 'date:DESC' | 'km:ASC' | 'km:DESC' | 'total_cost:ASC' | 'total_cost:DESC' | 'liters:ASC' | 'liters:DESC';
}

export interface FuelingStatsFilters {
    vehicleId?: number;
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
    period?: 'daily' | 'monthly' | 'yearly';
}

export const FUEL_TYPES = [
    { value: 'gasoline', label: 'Gasolina' },
    { value: 'ethanol', label: 'Etanol' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'flex', label: 'Flex' },
    { value: 'gnv', label: 'GNV' },
    { value: 'electric', label: 'Elétrico' }
] as const;

export const SORT_OPTIONS = [
    { value: 'date:DESC', label: 'Data (mais recente)' },
    { value: 'date:ASC', label: 'Data (mais antiga)' },
    { value: 'km:DESC', label: 'Km (maior)' },
    { value: 'km:ASC', label: 'Km (menor)' },
    { value: 'total_cost:DESC', label: 'Custo (maior)' },
    { value: 'total_cost:ASC', label: 'Custo (menor)' },
    { value: 'liters:DESC', label: 'Litros (maior)' },
    { value: 'liters:ASC', label: 'Litros (menor)' }
] as const;

export const PERIOD_OPTIONS = [
    { value: 'daily', label: 'Diário' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'yearly', label: 'Anual' }
] as const;

export interface VehicleFuelingStats {
    total_records: number;
    total_liters: number;
    total_cost: number;
    avg_consumption: number | null;
    avg_price_per_liter: number;
    avg_liters_per_fueling: number;
    km_range: { min: number; max: number };
}

export interface LastFuelingInfo extends Fueling {
    days_ago: number;
    km_diff: number;
}
