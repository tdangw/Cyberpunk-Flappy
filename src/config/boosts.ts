
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
        name: 'Standard Nitro',
        description: 'Auto-recharging cell. 10m max, 30s recovery.',
        capacity: 10,
        price: 0,
        rechargeRate: 0.333
    },
    {
        id: 'nitro_basic',
        name: 'Flux Cell',
        description: 'Standard energy cell. 30m total dash.',
        capacity: 30,
        price: 25
    },
    {
        id: 'nitro_advanced',
        name: 'Vanguard Core',
        description: 'Military grade energy. 80m total dash.',
        capacity: 80,
        price: 60
    },
    {
        id: 'nitro_premium',
        name: 'Nebula Array',
        description: 'Quantum storage unit. 150m total dash.',
        capacity: 150,
        price: 100
    },
    {
        id: 'nitro_super',
        name: 'Infinity Drive',
        description: 'Infinite flow battery. 300m total dash.',
        capacity: 300,
        price: 175
    },
    {
        id: 'nitro_ultra',
        name: 'Titan Tank',
        description: 'Heavy duty energy storage. 500m total dash.',
        capacity: 500,
        price: 275
    },
    {
        id: 'nitro_quantum',
        name: 'Quasar Core',
        description: 'Atomic scale compression. 800m total dash.',
        capacity: 800,
        price: 400
    },
    {
        id: 'nitro_hyper',
        name: 'Godspeed Drive',
        description: 'Experimental super-cell. 1200m total dash.',
        capacity: 1200,
        price: 550
    }
];
