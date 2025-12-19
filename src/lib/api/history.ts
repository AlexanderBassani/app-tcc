import { api } from './client';
import type {
	HistoryListResponse,
	HistoryFilters,
	HistoryStatisticsResponse,
	HistoryStatisticsFilters,
	CompareVehiclesResponse,
	CompareVehiclesFilters
} from '$lib/types/history';

export const historyApi = {
	/**
	 * Get unified timeline history with advanced filters and pagination
	 * GET /api/history
	 */
	list: (token: string, filters?: HistoryFilters) => {
		const params = new URLSearchParams();

		// Filtering
		if (filters?.vehicle_id) params.append('vehicle_id', filters.vehicle_id.toString());
		if (filters?.type) params.append('type', filters.type);
		if (filters?.category) params.append('category', filters.category);
		if (filters?.fuel_type) params.append('fuel_type', filters.fuel_type);
		if (filters?.start_date) params.append('start_date', filters.start_date);
		if (filters?.end_date) params.append('end_date', filters.end_date);
		if (filters?.min_cost !== undefined) params.append('min_cost', filters.min_cost.toString());
		if (filters?.max_cost !== undefined) params.append('max_cost', filters.max_cost.toString());

		// Sorting
		if (filters?.sort_by) params.append('sort_by', filters.sort_by);
		if (filters?.sort_order) params.append('sort_order', filters.sort_order);

		// Pagination
		if (filters?.limit) params.append('limit', filters.limit.toString());
		if (filters?.offset) params.append('offset', filters.offset.toString());

		const queryString = params.toString();
		const endpoint = queryString ? `/api/history?${queryString}` : '/api/history';

		return api.get<HistoryListResponse>(endpoint, token);
	},

	/**
	 * Get advanced statistics for a period
	 * GET /api/history/statistics
	 */
	getStatistics: (token: string, filters?: HistoryStatisticsFilters) => {
		const params = new URLSearchParams();

		if (filters?.vehicle_id) params.append('vehicle_id', filters.vehicle_id.toString());
		if (filters?.start_date) params.append('start_date', filters.start_date);
		if (filters?.end_date) params.append('end_date', filters.end_date);
		if (filters?.period) params.append('period', filters.period);

		const queryString = params.toString();
		const endpoint = queryString
			? `/api/history/statistics?${queryString}`
			: '/api/history/statistics';

		return api.get<HistoryStatisticsResponse>(endpoint, token);
	},

	/**
	 * Compare multiple vehicles (2-5 vehicles)
	 * GET /api/history/compare-vehicles
	 */
	compareVehicles: (token: string, filters: CompareVehiclesFilters) => {
		const params = new URLSearchParams();

		// Vehicle IDs (required, 2-5 vehicles)
		if (filters.vehicle_ids && filters.vehicle_ids.length >= 2) {
			params.append('vehicle_ids', filters.vehicle_ids.join(','));
		} else {
			throw new Error('Mínimo de 2 veículos necessários para comparação');
		}

		if (filters.vehicle_ids.length > 5) {
			throw new Error('Máximo de 5 veículos permitidos para comparação');
		}

		// Date filters
		if (filters.start_date) params.append('start_date', filters.start_date);
		if (filters.end_date) params.append('end_date', filters.end_date);
		if (filters.period) params.append('period', filters.period);

		const queryString = params.toString();
		const endpoint = `/api/history/compare-vehicles?${queryString}`;

		return api.get<CompareVehiclesResponse>(endpoint, token);
	}
};
