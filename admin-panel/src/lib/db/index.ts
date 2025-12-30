import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/upsc_app';

// Add connection options with better error handling
const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {}, // Suppress notices
});

// Test connection on startup
if (connectionString && !connectionString.includes('localhost')) {
    client`SELECT 1`
        .then(() => {
            console.log('✅ Database connection established');
        })
        .catch((error) => {
            console.error('❌ Database connection failed:', error.message);
            console.error('💡 Please check:');
            console.error('   1. DATABASE_URL in .env.local is correct');
            console.error('   2. Supabase project is active (not paused)');
            console.error('   3. Database password is correct');
            console.error('   4. Get exact connection string from: Supabase Dashboard > Connect button');
        });
}

export const db = drizzle(client, { schema });

