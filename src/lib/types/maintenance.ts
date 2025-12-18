// Category types
export type MaintenanceCategory =
    | 'preventive'
    | 'corrective'
    | 'inspection'
    | 'upgrade'
    | 'warranty'
    | 'recall'
    | 'other';

export interface Maintenance {
    id: number;
    user_id: number;
    vehicle_id: number;
    service_provider_id?: number;
    type: string; // Tipo de manutenção (ex: "Troca de óleo", "Alinhamento")
    category?: MaintenanceCategory;
    description?: string;
    cost?: number;
    km_when_done?: number; // Quilometragem quando o serviço foi realizado
    service_date: string; // ISO Date string (YYYY-MM-DD)
    next_km?: number; // Próxima quilometragem recomendada
    next_service_date?: string; // ISO Date string (YYYY-MM-DD)
    invoice_number?: string;
    warranty_until?: string; // ISO Date string (YYYY-MM-DD)
    notes?: string; // Notas adicionais
    is_completed: boolean; // Status de conclusão
    completed_at?: string; // Data de conclusão
    created_at: string;
    updated_at: string;
    // Relations
    vehicle?: {
        id: number;
        brand: string;
        model: string;
        plate: string;
        year: number;
        current_km: number;
    };
    service_provider?: {
        id: number;
        name: string;
        type: string;
    };
}

export interface CreateMaintenanceRequest {
    vehicle_id: number;
    service_provider_id?: number;
    type: string;
    category?: MaintenanceCategory;
    description?: string;
    cost?: number;
    km_when_done?: number;
    service_date: string; // YYYY-MM-DD
    next_km?: number;
    next_service_date?: string; // YYYY-MM-DD
    invoice_number?: string;
    warranty_until?: string; // YYYY-MM-DD
    notes?: string;
}

export interface UpdateMaintenanceRequest {
    vehicle_id?: number;
    service_provider_id?: number;
    type?: string;
    category?: MaintenanceCategory;
    description?: string;
    cost?: number;
    km_when_done?: number;
    service_date?: string;
    next_km?: number;
    next_service_date?: string;
    invoice_number?: string;
    warranty_until?: string;
    notes?: string;
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

// Categorias de manutenção
export const MAINTENANCE_CATEGORIES = [
    { value: 'preventive', label: 'Preventiva', icon: '🔧', color: 'green' },
    { value: 'corrective', label: 'Corretiva', icon: '🛠️', color: 'red' },
    { value: 'inspection', label: 'Inspeção', icon: '🔍', color: 'blue' },
    { value: 'upgrade', label: 'Melhoria', icon: '⬆️', color: 'purple' },
    { value: 'warranty', label: 'Garantia', icon: '✅', color: 'yellow' },
    { value: 'recall', label: 'Recall', icon: '🔔', color: 'orange' },
    { value: 'other', label: 'Outras', icon: '📋', color: 'gray' }
] as const;

// Sugestões comuns de tipos de manutenção
export const COMMON_MAINTENANCE_TYPES = [
    'Troca de óleo',
    'Alinhamento e balanceamento',
    'Troca de pastilhas de freio',
    'Revisão periódica',
    'Troca de pneus',
    'Reparo no sistema de ar condicionado',
    'Substituição de bateria',
    'Troca de correia dentada',
    'Troca de filtros (óleo, ar, combustível)',
    'Revisão completa'
] as const;