import type * as Monaco from 'monaco-editor';

export type JavaSnippet = Monaco.languages.CompletionItem;

export function getJavaSuggestions(
    monaco: typeof Monaco,
    range: Monaco.IRange,
): JavaSnippet[] {
    const kw = (label: string): JavaSnippet => ({
        label,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: label,
        range,
    });

    const suggestions: JavaSnippet[] = [];

    // Ключевые слова
    [
        'class',
        'interface',
        'extends',
        'implements',
        'public',
        'private',
        'protected',
        'static',
        'final',
        'void',
        'int',
        'long',
        'double',
        'boolean',
        'if',
        'else',
        'for',
        'while',
        'do',
        'break',
        'continue',
        'return',
        'try',
        'catch',
        'finally',
        'throw',
        'throws',
        'new',
        'this',
        'super',
        'import',
        'package',
    ].forEach((k) => suggestions.push(kw(k)));

    // Класс с main
    suggestions.push({
        label: 'public class Main',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'public class ${1:Main} {',
            '    public static void main(String[] args) {',
            '        $0',
            '    }',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Шаблон класса с методом main',
        range,
    });

    // Метод
    suggestions.push({
        label: 'public method',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'public ${1:void} ${2:name}(${3:params}) {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Объявление метода',
        range,
    });

    // if / else
    suggestions.push({
        label: 'if / else',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'if (${1:condition}) {',
            '    $2',
            '} else {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Условный оператор',
        range,
    });

    // for (int i = 0; i < n; i++)
    suggestions.push({
        label: 'for (int i = 0; i < n; i++)',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'for (int i = 0; i < ${1:n}; i++) {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Классический for‑цикл',
        range,
    });

    // for‑each
    suggestions.push({
        label: 'for (T x : list)',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'for (${1:Type} ${2:x} : ${3:list}) {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Цикл for‑each',
        range,
    });

    // try / catch
    suggestions.push({
        label: 'try / catch',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'try {',
            '    $1',
            '} catch (${2:Exception} e) {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Обработка исключений',
        range,
    });

    return suggestions;
}
