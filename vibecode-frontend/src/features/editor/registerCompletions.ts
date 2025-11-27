import type * as Monaco from 'monaco-editor';
import { getPythonSuggestions } from './pythonSnippets';
import { getJsTsSuggestions } from './jsSnippets';
import { getJavaSuggestions } from './javaSnippets';
import { getCppSuggestions } from './cppSnippets';
import { getCSharpSuggestions } from './csharpSnippets';
import { getGoSuggestions } from './goSnippets';
import { getRustSuggestions } from './rustSnippets';

export function registerLanguageCompletions(monaco: typeof Monaco) {
    registerPythonCompletions(monaco);
    registerJsTsCompletions(monaco);
    registerJavaCompletions(monaco);
    registerCppCompletions(monaco);
    registerCSharpCompletions(monaco);
    registerGoCompletions(monaco);
    registerRustCompletions(monaco);
}

function createRange(
    model: Monaco.editor.ITextModel,
    position: Monaco.Position,
): Monaco.IRange {
    const word = model.getWordUntilPosition(position);
    return {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
    };
}

function registerPythonCompletions(monaco: typeof Monaco) {
    monaco.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['.', ' ', '(', '['],
        provideCompletionItems(model, position) {
            const range = createRange(model, position);
            return { suggestions: getPythonSuggestions(monaco, range) };
        },
    });
}

function registerJsTsCompletions(monaco: typeof Monaco) {
    ['javascript', 'typescript'].forEach((id) => {
        monaco.languages.registerCompletionItemProvider(id, {
            triggerCharacters: ['.', ' ', '(', '['],
            provideCompletionItems(model, position) {
                const range = createRange(model, position);
                return { suggestions: getJsTsSuggestions(monaco, range) };
            },
        });
    });
}

function registerJavaCompletions(monaco: typeof Monaco) {
    monaco.languages.registerCompletionItemProvider('java', {
        triggerCharacters: ['.', ' ', '(', '['],
        provideCompletionItems(model, position) {
            const range = createRange(model, position);
            return { suggestions: getJavaSuggestions(monaco, range) };
        },
    });
}

function registerCppCompletions(monaco: typeof Monaco) {
    monaco.languages.registerCompletionItemProvider('cpp', {
        triggerCharacters: ['.', ' ', '(', '<'],
        provideCompletionItems(model, position) {
            const range = createRange(model, position);
            return { suggestions: getCppSuggestions(monaco, range) };
        },
    });
}

function registerCSharpCompletions(monaco: typeof Monaco) {
    monaco.languages.registerCompletionItemProvider('csharp', {
        triggerCharacters: ['.', ' ', '(', '['],
        provideCompletionItems(model, position) {
            const range = createRange(model, position);
            return { suggestions: getCSharpSuggestions(monaco, range) };
        },
    });
}

function registerGoCompletions(monaco: typeof Monaco) {
    monaco.languages.registerCompletionItemProvider('go', {
        triggerCharacters: [' ', '(', '['],
        provideCompletionItems(model, position) {
            const range = createRange(model, position);
            return { suggestions: getGoSuggestions(monaco, range) };
        },
    });
}

function registerRustCompletions(monaco: typeof Monaco) {
    monaco.languages.registerCompletionItemProvider('rust', {
        triggerCharacters: [' ', '(', '['],
        provideCompletionItems(model, position) {
            const range = createRange(model, position);
            return { suggestions: getRustSuggestions(monaco, range) };
        },
    });
}
