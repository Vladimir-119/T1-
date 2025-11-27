import { apiClient } from './client';

export type HelpRequest = {
    session_id: string;
    question: string;
};

export async function getHelp(req: HelpRequest): Promise<{ hint: string }> {
    const res = await apiClient.post('/help', req);
    return res.data;
}
