import { apiClient } from './client';

export type RunCodeRequest = {
    session_id: string;
    code: string;
    type: 'public' | 'hidden';
};

export type RunCodeResponse = {
    status: string;
    passed: number;
    total: number;
    logs: string[];
};

export async function runCode(req: RunCodeRequest): Promise<RunCodeResponse> {
    const res = await apiClient.post<RunCodeResponse>('/code/run', req);
    return res.data;
}
