// Dashboard Types

export interface MonthlyExpense {
	month: string;
	total: number;
	fuel: number;
	maintenance: number;
	others: number;
}

export interface RecentActivity {
	type: 'fuel' | 'maintenance';
	id: number;
	date: string;
	description: string | null;
	cost: number;
	vehicle: string;
	fuel_type?: string | null;
}

export interface UpcomingReminder {
	id: number;
	type: 'maintenance' | 'tax' | 'license' | 'insurance';
	title: string;
	description: string | null;
	date: string | null;
	km: number | null;
	vehicle_id: number;
	vehicle: string;
	days_until: number | null;
	km_until: number | null;
}

export interface DashboardOverview {
	expenses: {
		monthly: MonthlyExpense[];
		totals: {
			fuel: number;
			maintenance: number;
			others: number;
			total: number;
			fuel_percentage: number;
			maintenance_percentage: number;
			others_percentage: number;
		};
	};
	recent_activities: RecentActivity[];
	upcoming_maintenances: UpcomingReminder[];
	total_vehicles: number;
}

export interface MonthlyExpensesData {
	monthly_expenses: MonthlyExpense[];
	period_total: number;
	period_avg: number;
	months_count: number;
}

export interface DashboardFilters {
	months?: number;
	vehicle_id?: number;
	limit?: number;
}

// API Response types
export interface DashboardOverviewResponse {
	success: boolean;
	data: DashboardOverview;
}

export interface MonthlyExpensesResponse {
	success: boolean;
	data: MonthlyExpensesData;
}

export interface UpcomingMaintenancesResponse {
	success: boolean;
	data: UpcomingReminder[];
	count: number;
}

export interface RecentActivitiesResponse {
	success: boolean;
	data: RecentActivity[];
	count: number;
}
