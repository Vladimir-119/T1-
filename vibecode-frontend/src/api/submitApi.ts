import { apiClient } from './client';

export type SubmitRoundRequest = {
    session_id: string;
    code: string;
};

export async function submitRound(req: SubmitRoundRequest) {
    const res = await apiClient.post('/round/submit', req);
    return res.data;
}
