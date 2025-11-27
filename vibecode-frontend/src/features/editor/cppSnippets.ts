import type * as Monaco from 'monaco-editor';

export type CppSnippet = Monaco.languages.CompletionItem;

export function getCppSuggestions(
    monaco: typeof Monaco,
    range: Monaco.IRange,
): CppSnippet[] {
    const kw = (label: string): CppSnippet => ({
        label,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: label,
        range,
    });

    const suggestions: CppSnippet[] = [];

    // Ключевые слова (сокращённый, но полезный набор)
    [
        'int',
        'long',
        'double',
        'float',
        'bool',
        'char',
        'void',
        'auto',
        'class',
        'struct',
        'template',
        'typename',
        'public',
        'private',
        'protected',
        'if',
        'else',
        'switch',
        'case',
        'default',
        'for',
        'while',
        'do',
        'break',
        'continue',
        'return',
        'try',
        'catch',
        'throw',
        'namespace',
        'using',
        'const',
        'constexpr',
        'static',
        'virtual',
        'override',
        'new',
        'delete',
    ].forEach((k) => suggestions.push(kw(k)));

    // ===== ВСПОМОГАТЕЛЬНЫЕ КОНСТРУКЦИИ =====

    // Стандартный main с быстрым вводом/выводом
    suggestions.push({
        label: 'main() with fast IO',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            '#include <bits/stdc++.h>',
            'using namespace std;',
            '',
            'int main() {',
            '    ios::sync_with_stdio(false);',
            '    cin.tie(nullptr);',
            '    $0',
            '    return 0;',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Функция main с подключением стандартной библиотеки и быстрым вводом/выводом',
        range,
    });

    // Вывод / ввод
    suggestions.push({
        label: 'cout <<',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'std::cout << ${1:value} << std::endl;$0',
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Вывод в стандартный поток',
        range,
    });

    suggestions.push({
        label: 'cin >>',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'std::cin >> ${1:var};$0',
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Чтение из стандартного потока',
        range,
    });

    // ===== УСЛОВИЯ =====

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
        documentation: 'Условный оператор if / else',
        range,
    });

    suggestions.push({
        label: 'if / else if / else',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'if (${1:condition}) {',
            '    $2',
            '} else if (${3:other}) {',
            '    $4',
            '} else {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Цепочка if / else if / else',
        range,
    });

    suggestions.push({
        label: 'switch / case',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'switch (${1:expr}) {',
            'case ${2:value}:',
            '    $3',
            '    break;',
            'default:',
            '    $0',
            '    break;',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Конструкция switch / case',
        range,
    });

    // ===== ЦИКЛЫ =====

    // Классический for
    suggestions.push({
        label: 'for (int i = 0; i < n; ++i)',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'for (int i = 0; i < ${1:n}; ++i) {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Классический for‑цикл',
        range,
    });

    // Range-based for
    suggestions.push({
        label: 'for (auto& x : container)',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'for (auto& ${1:x} : ${2:container}) {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Range-based for по контейнеру',
        range,
    });

    // while
    suggestions.push({
        label: 'while (...)',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'while (${1:condition}) {',
            '    $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Цикл while',
        range,
    });

    // do / while
    suggestions.push({
        label: 'do / while',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'do {',
            '    $1',
            '} while (${2:condition});',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Цикл do / while',
        range,
    });

    // ===== КЛАССЫ / СТРУКТУРЫ =====

    suggestions.push({
        label: 'class Name',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'class ${1:ClassName} {',
            'public:',
            '    ${1:ClassName}(${2:args}) {',
            '        $0',
            '    }',
            '};',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Объявление класса с конструктором',
        range,
    });

    suggestions.push({
        label: 'struct Name',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'struct ${1:Name} {',
            '    $0',
            '};',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Объявление структуры',
        range,
    });

    // ===== ИСКЛЮЧЕНИЯ =====

    suggestions.push({
        label: 'try / catch',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'try {',
            '    $1',
            '} catch (const std::exception& e) {',
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
