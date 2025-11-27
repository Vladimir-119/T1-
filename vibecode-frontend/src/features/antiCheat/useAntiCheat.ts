import { useEffect, useState } from 'react';

export type AntiCheatStats = {
    totalViolations: number;    // все нарушения суммарно
    blurCount: number;          // выход из окна (blur)
    copyCount: number;          // копирование (copy)
    editorPasteCount: number;   // вставка в редактор кода
};

type UseAntiCheatResult = AntiCheatStats & {
    notifyEditorPaste: () => void;
};

export const useAntiCheat = (): UseAntiCheatResult => {
    const [stats, setStats] = useState<AntiCheatStats>({
        totalViolations: 0,
        blurCount: 0,
        copyCount: 0,
        editorPasteCount: 0,
    });

    useEffect(() => {
        const incBlur = () => {
            setStats(prev => ({
                ...prev,
                blurCount: prev.blurCount + 1,
                totalViolations: prev.totalViolations + 1,
            }));
        };

        const incCopy = () => {
            setStats(prev => ({
                ...prev,
                copyCount: prev.copyCount + 1,
                totalViolations: prev.totalViolations + 1,
            }));
        };

        const handleBlur = () => {
            incBlur();
        };

        const handleCopy = () => {
            incCopy();
        };

        window.addEventListener('blur', handleBlur);
        document.addEventListener('copy', handleCopy, true);

        return () => {
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('copy', handleCopy, true);
        };
    }, []);

    // Вызов из Monaco-редактора при вставке
    const notifyEditorPaste = () => {
        setStats(prev => ({
            ...prev,
            editorPasteCount: prev.editorPasteCount + 1,
            totalViolations: prev.totalViolations + 1,
        }));
    };

    return { ...stats, notifyEditorPaste };
};
