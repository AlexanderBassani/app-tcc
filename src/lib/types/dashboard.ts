// Dashboard Types

export interface MonthlyExpense {
	month: string;
	year: number;
	month_num: number;
	total: number;
	fuel: number;
	maintenance: number;
	other: number;
	breakdown: {
		fuel_percentage: number;
		maintenance_percentage: number;
		other_percentage: number;
	};
}

export interface RecentActivity {
	type: 'fuel' | 'maintenance';
	id: number;
	date: string;
	description: string;
	amount: number;
	details?: any;
	vehicle_id: number;
	vehicle_info: string;
}

export interface UpcomingReminder {
	id: number;
	type: 'maintenance' | 'licensing' | 'insurance';
	title: string;
	description?: string;
	remind_at_km?: number;
	remind_at_date?: string;
	vehicle_id: number;
	vehicle_info: string;
	current_km?: number;
	days_until?: number;
	km_until?: number;
	is_urgent: boolean;
}

export interface DashboardOverview {
	expenses: {
		monthly: MonthlyExpense[];
		period_total: number;
		period_avg: number;
	};
	recent_activities: RecentActivity[];
	upcoming_reminders: UpcomingReminder[];
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
