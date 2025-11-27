import React from 'react';

type InterviewLayoutProps = {
    chat: React.ReactNode;
    editor: React.ReactNode;
    consoleOutput: React.ReactNode;
    onRunClick?: () => void;
    onSkipClick?: () => void;
    onDebugClick?: () => void;
    language: string;
    onLanguageChange: (lang: string) => void;
};

const LANGUAGES = [
    { id: 'python', label: 'Python' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'java', label: 'Java' },
    { id: 'cpp', label: 'C++' },
    { id: 'csharp', label: 'C#' },
    { id: 'go', label: 'Go' },
    { id: 'rust', label: 'Rust' },
];

export const InterviewLayout: React.FC<InterviewLayoutProps> = ({
                                                                    chat,
                                                                    editor,
                                                                    consoleOutput,
                                                                    onRunClick,
                                                                    onSkipClick,
                                                                    onDebugClick,
                                                                    language,
                                                                    onLanguageChange,
                                                                }) => {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-50">
            <div className="h-screen max-h-screen grid grid-cols-[minmax(260px,0.38fr)_minmax(0,1fr)] gap-3 p-4">
                {/* Левая колонка: чат */}
                <section className="flex flex-col rounded-lg border border-slate-700 bg-slate-900/70 overflow-hidden">
                    <header className="px-3 py-2 border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                        Chat with AI interviewer
                    </header>
                    <div className="flex-1 overflow-hidden p-2">
                        {chat}
                    </div>
                </section>

                {/* Правая колонка */}
                <div className="grid grid-rows-[minmax(0,1fr)_220px] gap-3 overflow-hidden">
                    {/* Редактор кода */}
                    <section className="flex flex-col rounded-lg border border-slate-700 bg-slate-900/70 overflow-hidden">
                        <header className="px-3 py-2 border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400 flex items-center justify-between">
                            <span>Code editor</span>

                            <div className="flex items-center gap-2">
                                {/* Кнопка Debug слева */}
                                <button
                                    onClick={onDebugClick}
                                    disabled={!onDebugClick}
                                    className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                                >
                                    Debug
                                </button>

                                {/* Селектор языка */}
                                <select
                                    value={language}
                                    onChange={(e) => onLanguageChange(e.target.value)}
                                    className="rounded-md bg-slate-800 border border-slate-600 text-xs text-slate-100 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    {LANGUAGES.map((lang) => (
                                        <option key={lang.id} value={lang.id}>
                                            {lang.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Кнопка Start */}
                                <button
                                    onClick={onRunClick}
                                    disabled={!onRunClick}
                                    className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50"
                                >
                                    Start
                                </button>

                                {/* Кнопка Skip */}
                                <button
                                    onClick={onSkipClick}
                                    disabled={!onSkipClick}
                                    className="px-3 py-1 rounded bg-gray-600 text-white disabled:opacity-50"
                                >
                                    Skip
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 overflow-hidden">
                            {editor}
                        </div>
                    </section>

                    {/* Консоль */}
                    <section className="rounded-lg border border-slate-700 bg-black/80 overflow-hidden flex flex-col">
                        <header className="px-3 py-2 border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                            Console output
                        </header>
                        <div className="flex-1 overflow-auto p-3 text-xs font-mono text-slate-100">
                            {consoleOutput}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
