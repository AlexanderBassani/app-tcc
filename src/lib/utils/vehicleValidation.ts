/**
 * Vehicle form validation utilities
 */

import { LIMITS, EXPECTED_KM_PER_YEAR, MAX_KM_PER_YEAR } from '$lib/data/vehicleConstants';

// Regex patterns
export const PLATE_REGEX_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
export const PLATE_REGEX_OLD = /^[A-Z]{3}[0-9]{4}$/;
export const BRAND_REGEX = /^[a-zA-Z0-9\s\-]+$/;
export const COLOR_REGEX = /^[a-zA-ZÀ-ÿ\s]+$/;

/**
 * Format plate to uppercase and detect format
 */
export function formatPlate(input: string): string {
	// Remove all non-alphanumeric characters
	const cleaned = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

	// Limit to 7 characters
	return cleaned.slice(0, 7);
}

/**
 * Apply plate mask as user types
 * Returns formatted plate with hyphens: ABC-1D23 or ABC-1234
 */
export function applyPlateMask(plate: string): string {
	const formatted = formatPlate(plate);

	if (formatted.length <= 3) {
		return formatted;
	}

	// Add hyphen after 3rd character
	return `${formatted.slice(0, 3)}-${formatted.slice(3)}`;
}

/**
 * Validate plate format (Mercosul or old)
 */
export function validatePlate(plate: string): {
	valid: boolean;
	format: 'mercosul' | 'old' | null;
	message: string;
} {
	const formatted = formatPlate(plate);

	if (formatted.length < LIMITS.PLATE.MIN) {
		return {
			valid: false,
			format: null,
			message: 'Placa deve ter 7 caracteres'
		};
	}

	const isMercosul = PLATE_REGEX_MERCOSUL.test(formatted);
	const isOld = PLATE_REGEX_OLD.test(formatted);

	if (isMercosul) {
		return {
			valid: true,
			format: 'mercosul',
			message: 'Formato Mercosul válido'
		};
	}

	if (isOld) {
		return {
			valid: true,
			format: 'old',
			message: 'Formato antigo válido'
		};
	}

	return {
		valid: false,
		format: null,
		message: 'Formato inválido. Use ABC1D23 (Mercosul) ou ABC1234 (antigo)'
	};
}

/**
 * Validate brand name
 */
export function validateBrand(brand: string): { valid: boolean; message: string } {
	if (brand.length < LIMITS.BRAND.MIN) {
		return {
			valid: false,
			message: `Marca deve ter pelo menos ${LIMITS.BRAND.MIN} caracteres`
		};
	}

	if (brand.length > LIMITS.BRAND.MAX) {
		return {
			valid: false,
			message: `Marca deve ter no máximo ${LIMITS.BRAND.MAX} caracteres`
		};
	}

	if (!BRAND_REGEX.test(brand)) {
		return {
			valid: false,
			message: 'Marca contém caracteres inválidos'
		};
	}

	return { valid: true, message: '' };
}

/**
 * Validate model name
 */
export function validateModel(model: string): { valid: boolean; message: string } {
	if (model.length < LIMITS.MODEL.MIN) {
		return {
			valid: false,
			message: 'Modelo é obrigatório'
		};
	}

	if (model.length > LIMITS.MODEL.MAX) {
		return {
			valid: false,
			message: `Modelo deve ter no máximo ${LIMITS.MODEL.MAX} caracteres`
		};
	}

	return { valid: true, message: '' };
}

/**
 * Validate year
 */
export function validateYear(year: number): { valid: boolean; message: string } {
	const currentYear = new Date().getFullYear();

	if (year < 1900) {
		return {
			valid: false,
			message: 'Ano deve ser maior que 1900'
		};
	}

	if (year > currentYear + 1) {
		return {
			valid: false,
			message: `Ano não pode ser maior que ${currentYear + 1}`
		};
	}

	return { valid: true, message: '' };
}

/**
 * Validate color
 */
export function validateColor(color: string): { valid: boolean; message: string } {
	if (color && color.length > LIMITS.COLOR.MAX) {
		return {
			valid: false,
			message: `Cor deve ter no máximo ${LIMITS.COLOR.MAX} caracteres`
		};
	}

	if (color && !COLOR_REGEX.test(color)) {
		return {
			valid: false,
			message: 'Cor deve conter apenas letras'
		};
	}

	return { valid: true, message: '' };
}

/**
 * Validate current km
 * Returns validation result with optional warning
 */
export function validateCurrentKm(
	km: number,
	year: number
): {
	valid: boolean;
	message: string;
	warning?: string;
} {
	if (km < 0) {
		return {
			valid: false,
			message: 'Quilometragem deve ser positiva'
		};
	}

	// Calculate expected max km based on vehicle age
	const currentYear = new Date().getFullYear();
	const vehicleAge = currentYear - year;
	const expectedMaxKm = vehicleAge * MAX_KM_PER_YEAR;

	if (km > expectedMaxKm && vehicleAge > 0) {
		return {
			valid: true,
			message: '',
			warning: `⚠️ Quilometragem alta para um veículo de ${vehicleAge} ano${vehicleAge > 1 ? 's' : ''} (média esperada: ${Math.round(vehicleAge * EXPECTED_KM_PER_YEAR).toLocaleString('pt-BR')} km)`
		};
	}

	return { valid: true, message: '' };
}

/**
 * Validate purchase date
 */
export function validatePurchaseDate(
	date: string,
	year: number
): { valid: boolean; message: string } {
	if (!date) {
		return { valid: true, message: '' };
	}

	const purchaseDate = new Date(date);
	const today = new Date();

	// Check if date is in the future
	if (purchaseDate > today) {
		return {
			valid: false,
			message: 'Data de aquisição não pode ser futura'
		};
	}

	// Check if purchase date is before manufacturing year
	const purchaseYear = purchaseDate.getFullYear();
	if (purchaseYear < year) {
		return {
			valid: false,
			message: 'Data de aquisição não pode ser anterior ao ano de fabricação'
		};
	}

	return { valid: true, message: '' };
}

/**
 * Validate notes
 */
export function validateNotes(notes: string): { valid: boolean; message: string } {
	if (notes && notes.length > LIMITS.NOTES.MAX) {
		return {
			valid: false,
			message: `Observações devem ter no máximo ${LIMITS.NOTES.MAX} caracteres`
		};
	}

	return { valid: true, message: '' };
}

/**
 * Calculate vehicle ownership duration
 */
export function calculateOwnershipDuration(purchaseDate: string): string {
	if (!purchaseDate) return '';

	const purchase = new Date(purchaseDate);
	const today = new Date();

	const diffTime = today.getTime() - purchase.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	const years = Math.floor(diffDays / 365);
	const months = Math.floor((diffDays % 365) / 30);

	if (years === 0 && months === 0) {
		return 'Menos de 1 mês';
	}

	if (years === 0) {
		return `${months} ${months === 1 ? 'mês' : 'meses'}`;
	}

	if (months === 0) {
		return `${years} ${years === 1 ? 'ano' : 'anos'}`;
	}

	return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

/**
 * Get vehicle age based on year
 */
export function getVehicleAge(year: number): string {
	const currentYear = new Date().getFullYear();
	const age = currentYear - year;

	if (age === 0) {
		return '0 km / Novo';
	}

	if (age === 1) {
		return '1 ano / Seminovo';
	}

	if (age <= 3) {
		return `${age} anos / Seminovo`;
	}

	return `${age} anos / Usado`;
}
