import React, { useEffect, useState, useRef } from 'react';
import { InterviewLayout } from './components/layout/InterviewLayout';
import { MonacoCodeEditor } from './features/editor/MonacoCodeEditor';
import { ChatPanel, type ChatMessage } from './features/chat/ChatPanel';
import { useAntiCheat } from './features/antiCheat/useAntiCheat';
import { startSession, getNextTask } from './api/sessionApi';
import { runCode } from './api/runCodeApi';
import { getHelp } from './api/helpApi';
import { apiClient } from './api/client';

type Stage = 'coding' | 'complexity' | 'explanation' | 'ai_detector' | 'similarity' | 'interview' | 'done';

const App: React.FC = () => {
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState('');
    const [consoleText, setConsoleText] = useState('> Готово.\n');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentTask, setCurrentTask] = useState<any>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [stage, setStage] = useState<Stage>('coding');
    const [validCode, setValidCode] = useState('');
    const [attempts, setAttempts] = useState(0);

    const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Для финального расчета
    const [testRatio, setTestRatio] = useState(1.0);
    const [similarity, setSimilarity] = useState(0.0);
    const [complexityOk, setComplexityOk] = useState(false);
    const [styleScore, setStyleScore] = useState(70);
    const [softScore, setSoftScore] = useState(0);
    const [aiPenalty, setAiPenalty] = useState(0);

    const { totalViolations, blurCount, copyCount, editorPasteCount, notifyEditorPaste } = useAntiCheat();
    const isInitialized = useRef(false);

    const addMsg = (sender: 'ai' | 'user', text: string) => {
        setChatMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, sender, text }]);
    };

    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;
        initSession();
    }, []);

    const initSession = async () => {
        addMsg('ai', '👋 Привет! Начинаем интервью...');
        try {
            const { session_id } = await startSession({ level: 'Middle', topic: 'Algorithms' });
            setSessionId(session_id);
            await loadTask(session_id);
        } catch (e) {
            addMsg('ai', 'Ошибка старта.');
        }
    };

    const loadTask = async (sid: string) => {
        addMsg('ai', '📝 Генерирую задачу...');
        try {
            const task = await getNextTask(sid);
            setCurrentTask(task);
            setCode(task.initial_code || '');
            setConsoleText('> Новая задача загружена.\n');
            setStage('coding');
            setAttempts(0);
            setValidCode('');

            addMsg('ai', `**Задача: ${task.title}**\n\n${task.description}`);
            addMsg('ai', '💡 Напиши код и нажми **Start** для проверки Public тестов.\n💡 Подсказка: напиши **HELP** + вопрос для помощи.');
        } catch (e) {
            addMsg('ai', 'Не удалось загрузить задачу.');
        }
    };

    // КНОПКА START (Public тесты)
    const handleStartClick = async () => {
        if (!sessionId || !currentTask || stage !== 'coding') return;

        setConsoleText('> 🧪 Запуск открытых тестов...\n');
        setAttempts(prev => prev + 1);

        try {
            const res = await runCode({ session_id: sessionId, code, type: 'public' });
            const logs = res.logs.join('\n');
            setConsoleText(logs + `\n\nПройдено: ${res.passed}/${res.total}`);

            if (res.passed === res.total) {
                addMsg('ai', '🔓 Открытые тесты пройдены! Запускаю скрытые тесты...');
                // Автоматически запускаем Hidden тесты (как в оригинале)
                await runHiddenTests();
            } else {
                addMsg('ai', `❌ Открытые тесты: ${res.passed}/${res.total}. Исправь ошибки и попробуй снова.`);
            }
        } catch (e) {
            setConsoleText('Network error');
        }
    };

    const handleUserMessage = async (text: string) => {
        addMsg('user', text);
        const upper = text.trim().toUpperCase();

        // ЭТАП 1: CODING
        if (stage === 'coding') {
            if (upper === 'SKIP') {
                if (validCode) {
                    addMsg('ai', '⚠️ Вы решили завершить попытки. Оцениваю последнее рабочее решение...');
                    await proceedToComplexityStage();
                } else {
                    addMsg('ai', '⏭️ Задача пропущена (нет рабочих решений). 0 баллов.');
                    if (sessionId) loadTask(sessionId);
                }
                return;
            }
            if (upper.startsWith('HELP')) {
                try {
                    const { hint } = await getHelp({ session_id: sessionId!, question: text });
                    addMsg('ai', hint);
                } catch {
                    addMsg('ai', 'AI не ответил (таймаут).');
                }
                return;
            }
            addMsg('ai', 'Используй: **Start** (тесты), **HELP** (подсказка), **SKIP** (пропустить).');
            return;
        }

        // ЭТАП 2: COMPLEXITY
        if (stage === 'complexity') {
            try {
                const res = await apiClient.post('/complexity/check', { code: validCode, user_estimate: text });
                if (res.data.is_correct) {
                    addMsg('ai', `✅ Верно! Сложность: ${res.data.real_complexity}`);
                    setComplexityOk(true);
                } else {
                    addMsg('ai', `❌ Неверно. AI считает: ${res.data.real_complexity}\n📝 ${res.data.explanation}`);
                    setComplexityOk(false);
                }
            } catch {
                addMsg('ai', 'Ошибка проверки.');
            }

            setStage('explanation');
            addMsg('ai', '🗣 **ЭТАП ОБЪЯСНЕНИЯ:**\nИнтервьюер: "Объясните кратко, почему вы выбрали именно этот подход? В чем его плюсы?"');
            return;
        }

        // ЭТАП 3: EXPLANATION
        if (stage === 'explanation') {
            try {
                const res = await apiClient.post('/soft-skills/evaluate', { code: validCode, explanation: text });
                addMsg('ai', `💬 Оценка коммуникации: ${res.data.comm_score}/100\n📝 ${res.data.feedback}`);
                setSoftScore(res.data.comm_score);
            } catch {
                addMsg('ai', 'Ошибка оценки.');
                setSoftScore(0);
            }

            await runCodeReview();
            return;
        }

        // ЭТАП 4: INTERVIEW
        if (stage === 'interview') {
            if (currentQuestionIndex < interviewQuestions.length) {
                try {
                    const res = await apiClient.post('/interview/respond', {
                        question: interviewQuestions[currentQuestionIndex],
                        answer: text
                    });
                    addMsg('ai', res.data.reaction);
                } catch {
                    addMsg('ai', 'Пропускаем...');
                }

                setCurrentQuestionIndex(prev => prev + 1);

                if (currentQuestionIndex + 1 < interviewQuestions.length) {
                    addMsg('ai', interviewQuestions[currentQuestionIndex + 1]);
                } else {
                    await finishRound();
                }
            }
            return;
        }

        // ЭТАП 5: DONE
        if (stage === 'done') {
            if (upper === 'NEXT' || upper === 'SKIP') {
                if (sessionId) loadTask(sessionId);
            } else {
                addMsg('ai', 'Напиши **NEXT** для следующей задачи.');
            }
            return;
        }

        addMsg('ai', 'Команда не распознана.');
    };

    const runHiddenTests = async () => {
        setConsoleText('> 🔓 Запуск скрытых тестов...\n');

        try {
            const res = await runCode({ session_id: sessionId!, code, type: 'hidden' });
            const logs = res.logs.join('\n');
            setConsoleText(logs + `\n\nПройдено: ${res.passed}/${res.total}`);

            const ratio = res.total > 0 ? res.passed / res.total : 1.0;
            setTestRatio(ratio);

            if (res.passed === res.total) {
                addMsg('ai', '✅ ПОЗДРАВЛЯЮ! Все тесты (Public + Hidden) пройдены!');
                setValidCode(code);
                await proceedToComplexityStage();
            } else {
                addMsg('ai', `❌ Скрытые тесты: ${res.passed}/${res.total}.\n👉 Исправь код и нажми Start снова.\n👉 Или напиши **SKIP** для сдачи с частичными баллами.`);
            }
        } catch {
            addMsg('ai', 'Ошибка проверки.');
        }
    };

    const proceedToComplexityStage = async () => {
        setStage('complexity');
        addMsg('ai', '❓ **Оцени сложность своего алгоритма:**\nНапример: O(1), O(n), O(n^2), O(n log n)...');
    };

        const runCodeReview = async () => {
        setStage('ai_detector');
        addMsg('ai', '⏳ AI проводит финальное ревью и проверку на авторство...');

        try {
            // ОДИН вызов /round/submit — возвращает ВСЁ
            const submitRes = await apiClient.post('/round/submit', {
                session_id: sessionId,
                code: validCode,
                anti_cheat_stats: { blurCount, copyCount, editorPasteCount }
            });

            const data = submitRes.data;

            // 1. Code Review
            const review = data.review || {};
            const score = review.score || 70;
            setStyleScore(score);
            addMsg('ai', `📊 **Оценка кода: ${score}/100**\n${review.feedback || ''}`);

            // 2. AI Detector
            if (data.ai_cheat_detected) {
                const aiCheck = data.ai_check || {}; // Если бэк отдает детали
                addMsg('ai', `⚠️ **ВНИМАНИЕ: Высокая вероятность использования LLM!**\n📝 Причина: ${aiCheck.reason || 'Не указана'}`);
                setAiPenalty(50);
            } else {
                addMsg('ai', '✅ Код выглядит естественным.');
                setAiPenalty(0);
            }

            // 3. Similarity (из /round/submit)
            const sim = data.similarity || 0;
            setSimilarity(sim);
            addMsg('ai', `📊 **Схожесть с эталонным решением: ${(sim * 100).toFixed(0)}%**`);

        } catch (err) {
            console.error('Review error:', err);
            addMsg('ai', 'Ошибка при оценке кода.');
            setStyleScore(70);
            setAiPenalty(0);
            setSimilarity(0);
        }

        await runInterviewQuestions();
    };

    const runInterviewQuestions = async () => {
        setStage('interview');
        addMsg('ai', '💬 Интервьюер готовит вопросы по вашим слабым местам...');

        try {
            const res = await apiClient.post('/interview/question', {
                code: validCode,
                reference_solution: currentTask.reference_solution || ''
            });

            const questions = res.data.questions || [];

            if (questions.length > 0) {
                setInterviewQuestions(questions);
                setCurrentQuestionIndex(0);
                addMsg('ai', `🎤 **БЛИЦ-ИНТЕРВЬЮ** (${Math.min(2, questions.length)} вопроса):`);
                addMsg('ai', questions[0]);
            } else {
                addMsg('ai', 'Вопросы не сгенерированы. Переходим к финалу.');
                await finishRound();
            }
        } catch (err) {
            console.error('Interview questions error:', err);
            addMsg('ai', 'Ошибка генерации вопросов.');
            await finishRound();
        }
    };


    const runSimilarityAnalysis = async () => {
        setStage('similarity');
        addMsg('ai', '🧠 AI анализирует глубину вашего решения...');

        try {
            const res = await apiClient.post('/interview/question', {
                code: validCode,
                reference_solution: currentTask.reference_solution || ''
            });

            setSimilarity(res.data.similarity);
            addMsg('ai', `📊 Схожесть с эталонным решением: ${(res.data.similarity * 100).toFixed(0)}%`);

            const questions = res.data.questions || [];

            if (questions.length > 0) {
                setInterviewQuestions(questions);
                setCurrentQuestionIndex(0);
                setStage('interview');
                addMsg('ai', '💬 Интервьюер готовит вопросы по вашим слабым местам...');
                addMsg('ai', `🎤 **БЛИЦ-ИНТЕРВЬЮ** (${Math.min(2, questions.length)} вопроса):`);
                addMsg('ai', questions[0]);
            } else {
                await finishRound();
            }
        } catch {
            addMsg('ai', 'Ошибка генерации вопросов.');
            await finishRound();
        }
    };

    const finishRound = async () => {
        setStage('done');

        // Формула из оригинала
        const testPoints = 40 * testRatio;
        const simPoints = 20 * similarity;
        const complexityPoints = complexityOk ? 10 : 0;
        const stylePoints = 15 * (styleScore / 100);
        const softPoints = 15 * (softScore / 100);
        const attemptPenalty = Math.max(0, (attempts - 1) * 2);

        const rawScore = testPoints + simPoints + complexityPoints + stylePoints + softPoints;
        const finalScore = Math.max(0, Math.round(rawScore - attemptPenalty - aiPenalty));

        addMsg('ai', `🏆 **ИТОГОВЫЙ БАЛЛ: ${finalScore}/100**\n\n` +
            `Детали:\n` +
            `- Тесты: ${Math.round(testPoints)} / 40\n` +
            `- Similarity: ${Math.round(simPoints)} / 20\n` +
            `- Big O: ${complexityPoints} / 10\n` +
            `- Style: ${Math.round(stylePoints)} / 15\n` +
            `- Soft: ${Math.round(softPoints)} / 15\n` +
            `- Штраф (попытки): -${attemptPenalty}\n` +
            `- Штраф (AI): -${aiPenalty}`
        );

        if (aiPenalty > 0) {
            addMsg('ai', '⚠️ (Применен штраф за AI-генерацию кода)');
        }

        addMsg('ai', 'Готов к следующему раунду? Напиши **NEXT**.');
    };

    const handleSkipClick = () => {
        if (stage === 'coding') {
            addMsg('user', 'SKIP');
            handleUserMessage('SKIP');
        } else if (stage === 'done') {
            if (sessionId) loadTask(sessionId);
        }
    };

    return (
        <InterviewLayout
            chat={<ChatPanel messages={chatMessages} onSend={handleUserMessage} antiCheatStats={{ totalViolations, blurCount, copyCount, editorPasteCount }} limits={{ time: '5.0s', memory: '256MB' }} />}
            editor={<MonacoCodeEditor language={language} value={code} onChange={setCode} onPasteViolation={notifyEditorPaste} />}
            consoleOutput={consoleText}
            onRunClick={handleStartClick}
            onSkipClick={handleSkipClick}
            onDebugClick={() => addMsg('ai', 'Debug: Не реализовано')}
            language={language}
            onLanguageChange={setLanguage}
        />
    );
};

export default App;
