import { api } from './client';
import type {
	DashboardOverviewResponse,
	MonthlyExpensesResponse,
	UpcomingMaintenancesResponse,
	RecentActivitiesResponse,
	DashboardFilters
} from '$lib/types/dashboard';

export const dashboardApi = {
	/**
	 * Get complete dashboard overview
	 * GET /api/dashboard/overview
	 */
	getOverview: (token: string, filters?: DashboardFilters) => {
		const params = new URLSearchParams();

		if (filters?.months) params.append('months', filters.months.toString());
		if (filters?.vehicle_id) params.append('vehicle_id', filters.vehicle_id.toString());

		const queryString = params.toString();
		const endpoint = queryString ? `/api/dashboard/overview?${queryString}` : '/api/dashboard/overview';

		return api.get<DashboardOverviewResponse>(endpoint, token);
	},

	/**
	 * Get monthly expenses aggregated by type
	 * GET /api/dashboard/monthly-expenses
	 */
	getMonthlyExpenses: (token: string, filters?: DashboardFilters) => {
		const params = new URLSearchParams();

		if (filters?.months) params.append('months', filters.months.toString());
		if (filters?.vehicle_id) params.append('vehicle_id', filters.vehicle_id.toString());

		const queryString = params.toString();
		const endpoint = queryString
			? `/api/dashboard/monthly-expenses?${queryString}`
			: '/api/dashboard/monthly-expenses';

		return api.get<MonthlyExpensesResponse>(endpoint, token);
	},

	/**
	 * Get upcoming maintenances and reminders
	 * GET /api/dashboard/upcoming-maintenances
	 */
	getUpcomingMaintenances: (token: string, filters?: DashboardFilters) => {
		const params = new URLSearchParams();

		if (filters?.limit) params.append('limit', filters.limit.toString());
		if (filters?.vehicle_id) params.append('vehicle_id', filters.vehicle_id.toString());

		const queryString = params.toString();
		const endpoint = queryString
			? `/api/dashboard/upcoming-maintenances?${queryString}`
			: '/api/dashboard/upcoming-maintenances';

		return api.get<UpcomingMaintenancesResponse>(endpoint, token);
	},

	/**
	 * Get recent activities timeline (fuelings + maintenances)
	 * GET /api/dashboard/recent-activities
	 */
	getRecentActivities: (token: string, filters?: DashboardFilters) => {
		const params = new URLSearchParams();

		if (filters?.limit) params.append('limit', filters.limit.toString());
		if (filters?.vehicle_id) params.append('vehicle_id', filters.vehicle_id.toString());

		const queryString = params.toString();
		const endpoint = queryString
			? `/api/dashboard/recent-activities?${queryString}`
			: '/api/dashboard/recent-activities';

		return api.get<RecentActivitiesResponse>(endpoint, token);
	}
};
