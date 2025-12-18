/**
 * Utility functions for formatting values in Brazilian Portuguese format
 */

/**
 * Format number as Brazilian currency (R$)
 */
export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL'
	}).format(value);
}

/**
 * Parse Brazilian currency string to number
 * Handles formats like "R$ 1.234,56" or "1.234,56" or "1234,56"
 */
export function parseCurrency(value: string): number {
	const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
	return parseFloat(cleaned) || 0;
}

/**
 * Format number as kilometers with thousand separator
 */
export function formatKm(value: number): string {
	return value.toLocaleString('pt-BR') + ' km';
}

/**
 * Parse kilometer string to number
 */
export function parseKm(value: string): number {
	return parseInt(value.replace(/\D/g, '')) || 0;
}

/**
 * Format number as liters with 2 decimal places
 */
export function formatLiters(value: number): string {
	return value.toLocaleString('pt-BR', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}) + ' L';
}

/**
 * Parse liter string to number
 */
export function parseLiters(value: string): number {
	const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
	return parseFloat(cleaned) || 0;
}

/**
 * Format number as km/L with 1 decimal place
 */
export function formatConsumption(value: number): string {
	return value.toLocaleString('pt-BR', {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}) + ' km/L';
}

/**
 * Format date to Brazilian format (DD/MM/YYYY)
 */
export function formatDate(date: string | Date): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('pt-BR');
}

/**
 * Format date with time to Brazilian format (DD/MM/YYYY HH:MM)
 */
export function formatDateTime(date: string | Date): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
	const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
	const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
	const diffTime = Math.abs(d2.getTime() - d1.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Input mask for currency (R$)
 * Returns formatted value as user types
 */
export function maskCurrency(value: string): string {
	const numbers = value.replace(/\D/g, '');
	if (!numbers) return '';
	const amount = parseInt(numbers) / 100;
	return formatCurrency(amount);
}

/**
 * Input mask for liters
 * Returns formatted value as user types
 */
export function maskLiters(value: string): string {
	const numbers = value.replace(/\D/g, '');
	if (!numbers) return '';
	const amount = parseInt(numbers) / 100;
	return formatLiters(amount);
}

/**
 * Input mask for kilometers
 * Returns formatted value as user types
 */
export function maskKm(value: string): string {
	const numbers = value.replace(/\D/g, '');
	if (!numbers) return '';
	return formatKm(parseInt(numbers));
}

/**
 * Calculate percentage difference
 */
export function percentageDiff(oldValue: number, newValue: number): number {
	if (oldValue === 0) return 0;
	return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Get color indicator for price comparison
 * Returns 'green' (cheaper), 'red' (more expensive), or 'yellow' (similar)
 */
export function getPriceIndicator(current: number, previous: number): 'green' | 'red' | 'yellow' {
	const diff = percentageDiff(previous, current);
	if (diff < -5) return 'green'; // More than 5% cheaper
	if (diff > 5) return 'red'; // More than 5% more expensive
	return 'yellow'; // Similar price (within ±5%)
}
