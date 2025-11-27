import React, { useState, useEffect, useRef } from 'react';

export type ChatMessage = {
    id: string;
    sender: 'ai' | 'user';
    text: string;
};

export type AntiCheatStatsProps = {
    totalViolations: number;
    blurCount: number;
    copyCount: number;
    editorPasteCount: number;
};

type ChatPanelProps = {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    antiCheatStats: AntiCheatStatsProps;
    limits?: {
        time: string;
        memory: string;
    };
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
                                                        messages,
                                                        onSend,
                                                        antiCheatStats,
                                                        limits = { time: '5s', memory: '128MB' }, // Значения по умолчанию
                                                    }) => {
    const [input, setInput] = useState('');
    const [showScrollDown, setShowScrollDown] = useState(false);

    const messagesContainerRef = useRef<HTMLDivElement | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const trimmed = input.trim();
            if (!trimmed) return;
            onSend(trimmed);
            setInput('');
        }
    };

    const scrollToBottom = () => {
        const el = messagesContainerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
        setShowScrollDown(false);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const isAtBottom =
            el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
        setShowScrollDown(!isAtBottom);
    };

    return (
        <div className="flex flex-col h-full gap-3 text-sm">
            {/* Область сообщений */}
            <div className="relative flex-1 min-h-0">
                <div
                    ref={messagesContainerRef}
                    className="flex flex-col h-full overflow-y-auto space-y-2 pr-1"
                    onScroll={handleScroll}
                >
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={
                                m.sender === 'ai'
                                    ? 'max-w-[90%] rounded-md bg-slate-800/80 px-3 py-2 self-start'
                                    : 'max-w-[90%] rounded-md bg-emerald-700/80 px-3 py-2 self-end'
                            }
                        >
                            <div className="text-xs text-slate-300 mb-1">
                                {m.sender === 'ai' ? 'AI Interviewer' : 'Вы'}
                            </div>
                            <div className="whitespace-pre-wrap">{m.text}</div>
                        </div>
                    ))}

                    {messages.length === 0 && (
                        <div className="text-xs text-slate-400">
                            Пока сообщений нет. AI появится здесь с первым вопросом.
                        </div>
                    )}
                </div>

                {showScrollDown && (
                    <button
                        type="button"
                        onClick={scrollToBottom}
                        className="absolute bottom-2 right-2 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-600 p-1 text-xs text-slate-100 shadow-lg transition-colors"
                    >
                        ↓
                    </button>
                )}
            </div>

            {/* Поле ввода */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <textarea
            className="flex-1 min-h-[40px] max-h-[90px] resize-none rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Введите ответ..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
        />
                <button
                    type="submit"
                    className="h-[40px] inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-xs font-semibold text-white px-3 transition-colors disabled:opacity-60"
                    disabled={!input.trim()}
                >
                    Отправить
                </button>
            </form>

            {/* Панель анти-чита и лимитов */}
            <div className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 flex flex-col gap-2">

                {/* Блок Лимитов */}
                <div className="flex items-center justify-between border-b border-slate-700 pb-1 mb-1">
                    <span className="font-semibold text-slate-200">System Limits</span>
                    <div className="flex gap-3 text-[11px] font-mono">
                        <span title="Execution Time Limit">⏱ {limits.time}</span>
                        <span title="Memory Limit">💾 {limits.memory}</span>
                    </div>
                </div>

                {/* Блок Анти-чита */}
                <div className="space-y-1">
                    <div className="font-semibold text-slate-200 flex justify-between">
                        <span>Anti-cheat</span>
                        <span className="font-mono text-amber-300">{antiCheatStats.totalViolations} violations</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 text-[11px] opacity-80">
                        <div>Blur: <span className="text-amber-200">{antiCheatStats.blurCount}</span></div>
                        <div>Copy: <span className="text-amber-200">{antiCheatStats.copyCount}</span></div>
                        <div className="col-span-2">Paste in Editor: <span className="text-amber-200">{antiCheatStats.editorPasteCount}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
