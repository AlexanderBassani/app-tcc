// History API Types

export type HistoryType = 'all' | 'maintenance' | 'fuel';

export type MaintenanceCategory =
	| 'preventive'
	| 'corrective'
	| 'inspection'
	| 'upgrade'
	| 'warranty'
	| 'recall'
	| 'other';

export type FuelType = 'gasoline' | 'ethanol' | 'diesel' | 'gnv' | 'flex';

export type SortBy = 'date' | 'km' | 'cost';
export type SortOrder = 'asc' | 'desc';

export type HistoryItemType = 'maintenance' | 'fuel';

// Base history item (what comes from the API)
export interface HistoryItem {
	id: number;
	type: HistoryItemType;
	vehicle_id: number;
	vehicle_name: string;
	date: string;
	km: number;
	cost: number;
	description?: string;

	// Maintenance-specific fields
	category?: MaintenanceCategory;
	service_provider?: string;
	is_completed?: boolean;
	attachments_count?: number;

	// Fuel-specific fields
	liters?: number;
	price_per_liter?: number;
	fuel_type?: FuelType;
	is_full_tank?: boolean;
	gas_station?: string;
	consumption?: number;
}

export interface HistoryPagination {
	total: number;
	limit: number;
	offset: number;
	has_more: boolean;
}

export interface HistoryFiltersApplied {
	vehicle_id: number | null;
	type: HistoryType;
	category: MaintenanceCategory | null;
	fuel_type: FuelType | null;
	start_date: string | null;
	end_date: string | null;
	min_cost: number | null;
	max_cost: number | null;
	sort_by: SortBy;
	sort_order: SortOrder;
}

export interface HistoryListResponse {
	success: boolean;
	data: {
		items: HistoryItem[];
		pagination: HistoryPagination;
		filters_applied: HistoryFiltersApplied;
	};
}

// Filters for history list request
export interface HistoryFilters {
	// Filtering
	vehicle_id?: number;
	type?: HistoryType;
	category?: MaintenanceCategory;
	fuel_type?: FuelType;
	start_date?: string; // YYYY-MM-DD
	end_date?: string; // YYYY-MM-DD
	min_cost?: number;
	max_cost?: number;

	// Sorting
	sort_by?: SortBy;
	sort_order?: SortOrder;

	// Pagination
	limit?: number;
	offset?: number;
}

// Statistics types
export type StatisticsPeriod =
	| 'last_month'
	| 'last_3_months'
	| 'last_6_months'
	| 'last_year'
	| 'all_time';

export interface HistoryStatisticsFilters {
	vehicle_id?: number;
	start_date?: string;
	end_date?: string;
	period?: StatisticsPeriod;
}

export interface PeriodInfo {
	start_date: string;
	end_date: string;
	days: number;
	km_traveled: number;
}

export interface TotalCosts {
	total: number;
	maintenance: number;
	fuel: number;
	maintenance_percentage: number;
	fuel_percentage: number;
}

export interface CostPerKm {
	total: number;
	maintenance: number;
	fuel: number;
}

export interface MaintenanceCategoryStats {
	count: number;
	cost: number;
}

export interface MaintenanceStats {
	total_services: number;
	average_cost: number;
	by_category: {
		preventive: MaintenanceCategoryStats;
		corrective: MaintenanceCategoryStats;
		inspection: MaintenanceCategoryStats;
		other: MaintenanceCategoryStats;
	};
	most_expensive: {
		description: string;
		cost: number;
		date: string;
	};
}

export interface FuelTypeStats {
	count: number;
	liters: number;
	cost: number;
}

export interface FuelStats {
	total_refuels: number;
	total_liters: number;
	average_consumption: number;
	average_price_per_liter: number;
	by_fuel_type: {
		gasoline: FuelTypeStats;
		ethanol: FuelTypeStats;
		diesel: FuelTypeStats;
	};
}

export interface Projections {
	monthly_average: number;
	next_3_months_estimate: number;
	next_6_months_estimate: number;
	cost_per_km_trend: string;
}

export interface HistoryStatisticsResponse {
	success: boolean;
	data: {
		period: PeriodInfo;
		total_costs: TotalCosts;
		cost_per_km: CostPerKm;
		maintenance_stats: MaintenanceStats;
		fuel_stats: FuelStats;
		projections: Projections;
	};
}

// Compare vehicles types
export interface CompareVehiclesFilters {
	vehicle_ids: number[]; // 2-5 vehicles
	start_date?: string;
	end_date?: string;
	period?: StatisticsPeriod;
}

export interface VehicleComparison {
	vehicle_id: number;
	name: string;
	km_traveled: number;
	total_cost: number;
	cost_per_km: number;
	maintenance_cost: number;
	fuel_cost: number;
	average_consumption: number;
	services_count: number;
	efficiency_rank: number;
}

export interface ComparisonSummary {
	most_economical: {
		vehicle_id: number;
		name: string;
		cost_per_km: number;
	};
	most_expensive: {
		vehicle_id: number;
		name: string;
		cost_per_km: number;
	};
	best_consumption: {
		vehicle_id: number;
		name: string;
		average_consumption: number;
	};
}

export interface CompareVehiclesResponse {
	success: boolean;
	data: {
		period: {
			start_date: string;
			end_date: string;
		};
		vehicles: VehicleComparison[];
		summary: ComparisonSummary;
	};
}
