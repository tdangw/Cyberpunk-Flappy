
export interface BoostDefinition {
    id: string;
    name: string;
    description: string;
    capacity: number; // in meters
    price: number;
    rechargeRate?: number; // meters per second (only for default)
}

export const BOOSTS: BoostDefinition[] = [
    {
        id: 'nitro_default',
        name: 'Default Nitro',
        description: 'Auto-recharging cell. 10m max, 30s recovery.',
        capacity: 10,
        price: 0,
        rechargeRate: 0.333
    },
    {
        id: 'nitro_basic',
        name: 'Basic Nitro Cell',
        description: 'Standard energy cell. 30m total dash.',
        capacity: 30,
        price: 50
    },
    {
        id: 'nitro_advanced',
        name: 'Advanced Nitro Core',
        description: 'Military grade energy. 80m total dash.',
        capacity: 80,
        price: 120
    },
    {
        id: 'nitro_premium',
        name: 'Premium Nitro Pack',
        description: 'Quantum storage unit. 150m total dash.',
        capacity: 150,
        price: 200
    },
    {
        id: 'nitro_super',
        name: 'Super Nitro Array',
        description: 'Infinite flow battery. 300m total dash.',
        capacity: 300,
        price: 350
    },
    {
        id: 'nitro_ultra',
        name: 'Ultra Nitro Tank',
        description: 'Heavy duty energy storage. 500m total dash.',
        capacity: 500,
        price: 550
    },
    {
        id: 'nitro_quantum',
        name: 'Quantum Nitro Core',
        description: 'Atomic scale compression. 800m total dash.',
        capacity: 800,
        price: 800
    },
    {
        id: 'nitro_hyper',
        name: 'Hyper Nitro Drive',
        description: 'Experimental super-cell. 1200m total dash.',
        capacity: 1200,
        price: 1100
    }
];
