/**
 * Constants for vehicle registration form
 */

// Popular car colors with their hex codes for visual preview
export const VEHICLE_COLORS = [
	{ name: 'Branco', hex: '#FFFFFF', borderColor: '#E5E7EB' },
	{ name: 'Preto', hex: '#000000', borderColor: '#000000' },
	{ name: 'Prata', hex: '#C0C0C0', borderColor: '#C0C0C0' },
	{ name: 'Cinza', hex: '#808080', borderColor: '#808080' },
	{ name: 'Vermelho', hex: '#DC2626', borderColor: '#DC2626' },
	{ name: 'Azul', hex: '#2563EB', borderColor: '#2563EB' },
	{ name: 'Amarelo', hex: '#EAB308', borderColor: '#EAB308' },
	{ name: 'Verde', hex: '#16A34A', borderColor: '#16A34A' },
	{ name: 'Laranja', hex: '#EA580C', borderColor: '#EA580C' },
	{ name: 'Marrom', hex: '#92400E', borderColor: '#92400E' },
	{ name: 'Roxo', hex: '#9333EA', borderColor: '#9333EA' },
	{ name: 'Bege', hex: '#D4A574', borderColor: '#D4A574' }
] as const;

// Popular car models by brand
export const POPULAR_MODELS: Record<string, string[]> = {
	'Toyota': ['Corolla', 'Hilux', 'SW4', 'Yaris', 'Etios', 'RAV4', 'Camry'],
	'Volkswagen': ['Gol', 'Polo', 'Virtus', 'T-Cross', 'Tiguan', 'Amarok', 'Nivus', 'Jetta'],
	'Chevrolet': ['Onix', 'Tracker', 'S10', 'Spin', 'Cruze', 'Montana', 'Equinox'],
	'Honda': ['Civic', 'City', 'HR-V', 'CR-V', 'Fit', 'WR-V', 'Accord'],
	'Fiat': ['Argo', 'Mobi', 'Cronos', 'Toro', 'Pulse', 'Fastback', 'Strada', 'Uno'],
	'Ford': ['Ka', 'EcoSport', 'Ranger', 'Territory', 'Maverick', 'Focus', 'Fusion'],
	'Hyundai': ['HB20', 'Creta', 'Tucson', 'ix35', 'Azera', 'Santa Fe', 'Venue'],
	'Nissan': ['Kicks', 'Versa', 'Frontier', 'Sentra', 'March', 'Livina'],
	'Renault': ['Kwid', 'Sandero', 'Logan', 'Duster', 'Oroch', 'Captur', 'Kardian'],
	'Jeep': ['Renegade', 'Compass', 'Commander', 'Wrangler', 'Grand Cherokee'],
	'BMW': ['320i', 'X1', 'X3', 'X5', 'Série 3', 'Série 5', 'Z4'],
	'Mercedes-Benz': ['Classe A', 'Classe C', 'GLA', 'GLC', 'Sprinter'],
	'Audi': ['A3', 'A4', 'Q3', 'Q5', 'Q7', 'A5', 'TT'],
	'Peugeot': ['208', '2008', '3008', '5008', 'Partner'],
	'Citroën': ['C3', 'C4 Cactus', 'Aircross'],
	'Kia': ['Sportage', 'Sorento', 'Cerato', 'Picanto', 'Stonic'],
	'Mitsubishi': ['L200', 'Outlander', 'ASX', 'Eclipse Cross'],
	'BYD': ['Dolphin', 'Yuan Plus', 'Han', 'Tan', 'Song Plus'],
	'GWM': ['Haval H6', 'Poer', 'Ora 03'],
	'Caoa Chery': ['Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Arrizo 6']
};

// Years for quick selection (current year + next year + last 10 years)
export const QUICK_YEARS = (() => {
	const currentYear = new Date().getFullYear();
	const years: number[] = [];
	for (let i = currentYear + 1; i >= currentYear - 10; i--) {
		years.push(i);
	}
	return years;
})();

// Generate all years from 1900 to next year
export const ALL_YEARS = (() => {
	const currentYear = new Date().getFullYear();
	const years: number[] = [];
	for (let i = currentYear + 1; i >= 1900; i--) {
		years.push(i);
	}
	return years;
})();

// Expected km per year for validation
export const EXPECTED_KM_PER_YEAR = 15000;
export const MAX_KM_PER_YEAR = 20000;

// Character limits
export const LIMITS = {
	BRAND: { MIN: 2, MAX: 50 },
	MODEL: { MIN: 1, MAX: 50 },
	COLOR: { MAX: 30 },
	NOTES: { MAX: 1000 },
	PLATE: { MIN: 7, MAX: 7 }
} as const;

// Suggested note tags
export const NOTE_SUGGESTIONS = [
	'🎵 Multimídia',
	'📹 Câmera de ré',
	'🅿️ Sensor de estacionamento',
	'☀️ Teto solar',
	'🪟 Vidros elétricos',
	'🔒 Travas elétricas',
	'❄️ Ar condicionado',
	'🛞 Rodas de liga',
	'💺 Bancos de couro',
	'🔐 Alarme',
	'🔊 Som premium',
	'🎮 Cruise control',
	'⚡ Turbo',
	'🔋 Start-stop',
	'🚗 Piloto automático'
] as const;
