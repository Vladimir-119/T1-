import type * as Monaco from 'monaco-editor';

export type RustSnippet = Monaco.languages.CompletionItem;

export function getRustSuggestions(
    monaco: typeof Monaco,
    range: Monaco.IRange,
): RustSnippet[] {
    const kw = (label: string): RustSnippet => ({
        label,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: label,
        range,
    });

    const suggestions: RustSnippet[] = [];

    [
        'fn','let','mut','struct','enum','impl','trait',
        'pub','mod','use','crate','super','self',
        'if','else','match',
        'for','while','loop','break','continue',
        'return',
        'async','await',
    ].forEach((k) => suggestions.push(kw(k)));

    suggestions.push({
        label: 'fn main()',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'fn main() {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Функция main',
        range,
    });

    suggestions.push({
        label: 'fn name()',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'fn ${1:name}(${2:params}) ${3:-> Result<(), Box<dyn std::error::Error>>} {',
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
        label: 'for in',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'for ${1:x} in ${2:iter} {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Цикл по итератору',
        range,
    });

    suggestions.push({
        label: 'struct Name',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'struct ${1:Name} {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Объявление структуры',
        range,
    });

    return suggestions;
}
