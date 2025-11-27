import type * as Monaco from 'monaco-editor';

export type GoSnippet = Monaco.languages.CompletionItem;

export function getGoSuggestions(
    monaco: typeof Monaco,
    range: Monaco.IRange,
): GoSnippet[] {
    const kw = (label: string): GoSnippet => ({
        label,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: label,
        range,
    });

    const suggestions: GoSnippet[] = [];

    [
        'package','import',
        'func','var','const','type',
        'struct','interface',
        'if','else','switch','case','default',
        'for','range','break','continue',
        'go','defer','return',
    ].forEach((k) => suggestions.push(kw(k)));

    suggestions.push({
        label: 'main.go',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'package main',
            '',
            'import "fmt"',
            '',
            'func main() {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Базовый файл main.go',
        range,
    });

    suggestions.push({
        label: 'func name()',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'func ${1:name}(${2:params}) ${3:ret} {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Объявление функции',
        range,
    });

    suggestions.push({
        label: 'if / else',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'if ${1:condition} {',
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
        label: 'for i := 0; i < n; i++',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'for i := 0; i < ${1:n}; i++ {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Классический for‑цикл',
        range,
    });

    suggestions.push({
        label: 'for range',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'for i, x := range ${1:slice} {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Цикл по range',
        range,
    });

    return suggestions;
}
