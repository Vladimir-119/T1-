import { apiClient } from './client';

export type StartSessionRequest = {
    level: string;
    topic: string;
};

export type StartSessionResponse = {
    session_id: string;
    message: string;
};

export async function startSession(req: StartSessionRequest): Promise<StartSessionResponse> {
    const res = await apiClient.post<StartSessionResponse>('/start', req);
    return res.data;
}

export async function getNextTask(sessionId: string) {
    const res = await apiClient.get(`/task/next?session_id=${sessionId}`);
    return res.data;
}
