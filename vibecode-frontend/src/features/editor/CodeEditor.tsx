import React from 'react';
import Editor from '@monaco-editor/react';

type CodeEditorProps = {
    language?: 'javascript' | 'python';
    value: string;
    onChange: (value: string) => void;
    onPasteViolation?: () => void;
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
                                                          language = 'javascript',
                                                          value,
                                                          onChange,
                                                          onPasteViolation,
                                                      }) => {
    const handleMount = (editor: any) => {
        editor.onDidPaste(() => {
            if (onPasteViolation) {
                onPasteViolation();
            }
        });
    };

    return (
        <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            theme="vs-dark"
            value={value}
            onChange={(val) => onChange(val ?? '')}
            onMount={handleMount}
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
            }}
        />
    );
};
