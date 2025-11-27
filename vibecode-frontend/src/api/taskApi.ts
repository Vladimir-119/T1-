import { apiClient } from './client';
import type { Task } from '../types/task';

export type GenerateTaskPayload = {
    level: string;
    topic?: string;
};

export async function generateTask(payload: GenerateTaskPayload): Promise<Task> {
    // Здесь мы обращаемся к /generate-task
    const res = await apiClient.post<Task>('/generate-task', payload);
    return res.data;
}
