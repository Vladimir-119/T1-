import type * as Monaco from 'monaco-editor';

export type CSharpSnippet = Monaco.languages.CompletionItem;

export function getCSharpSuggestions(
    monaco: typeof Monaco,
    range: Monaco.IRange,
): CSharpSnippet[] {
    const kw = (label: string): CSharpSnippet => ({
        label,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: label,
        range,
    });

    const suggestions: CSharpSnippet[] = [];

    [
        'class','struct','interface',
        'public','private','protected','internal',
        'static','readonly','sealed','abstract','virtual','override',
        'void','int','long','double','bool','string',
        'if','else','switch','case','default',
        'for','foreach','while','do','break','continue',
        'return',
        'try','catch','finally','throw',
        'using','namespace','new','this','base',
        'async','await',
    ].forEach((k) => suggestions.push(kw(k)));

    suggestions.push({
        label: 'class Program',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'using System;',
            '',
            'class ${1:Program} {',
            '    static void Main(string[] args) {',
            '        $0',
            '    }',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Шаблон класса Program с Main',
        range,
    });

    suggestions.push({
        label: 'public method',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'public ${1:void} ${2:Name}(${3:params}) {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Объявление метода',
        range,
    });

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

    return suggestions;
}
