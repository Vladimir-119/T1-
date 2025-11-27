import React from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { registerLanguageCompletions } from './registerCompletions';

type MonacoCodeEditorProps = {
    language: string;
    value: string;
    onChange: (value: string) => void;
    onPasteViolation?: () => void;
};

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
                                                                      language,
                                                                      value,
                                                                      onChange,
                                                                      onPasteViolation,
                                                                  }) => {
    const handleEditorMount: OnMount = (
        editor: Monaco.editor.IStandaloneCodeEditor,
        monaco: typeof Monaco,
    ) => {
        editor.onDidPaste(() => {
            if (onPasteViolation) onPasteViolation();
        });

        editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space,
            () => editor.trigger('keyboard', 'editor.action.triggerSuggest', {}),
        );

        registerLanguageCompletions(monaco);
    };

    return (
        <Editor
            height="100%"
            language={language}
            value={value}
            onChange={(v) => onChange(v || '')}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                quickSuggestions: { other: true, strings: true, comments: false },
                suggestOnTriggerCharacters: true,
                parameterHints: { enabled: true },
                tabCompletion: 'on',
                wordBasedSuggestions: 'currentDocument',
            }}
        />
    );
};
