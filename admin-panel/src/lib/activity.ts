import { db } from './db';
import { activityLogs } from './db/schema';

export async function logActivity(
    action: string,
    entityType: string,
    entityId: number | null,
    description: string,
    metadata?: Record<string, any>
) {
    try {
        await db.insert(activityLogs).values({
            action,
            entityType,
            entityId,
            description,
            metadata,
        });
    } catch (error) {
        console.error('Activity log error:', error);
    }
}

