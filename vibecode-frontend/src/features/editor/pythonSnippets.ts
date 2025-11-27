import type * as Monaco from 'monaco-editor';

export type PythonSnippet = Monaco.languages.CompletionItem;

export function getPythonSuggestions(
    monaco: typeof Monaco,
    range: Monaco.IRange,
): PythonSnippet[] {
    const kw = (label: string): PythonSnippet => ({
        label,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: label,
        range,
    });

    const func = (name: string): PythonSnippet => ({
        label: name,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: `${name}($1)`,
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
    });

    const suggestions: PythonSnippet[] = [];

    // Ключевые слова
    [
        'def',
        'class',
        'return',
        'for',
        'while',
        'if',
        'elif',
        'else',
        'try',
        'except',
        'finally',
        'with',
        'import',
        'from',
        'as',
        'lambda',
        'yield',
        'pass',
        'break',
        'continue',
        'in',
        'not',
        'and',
        'or',
        'is',
    ].forEach((k) => suggestions.push(kw(k)));

    // Базовые встроенные функции
    [
        'len',
        'range',
        'print',
        'sorted',
        'sum',
        'min',
        'max',
        'map',
        'filter',
        'any',
        'all',
        'zip',
        'enumerate',
    ].forEach((n) => suggestions.push(func(n)));

    // Шаблон функции solution (без логики)
    suggestions.push({
        label: 'solution',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'def solution(${1:args}):',
            '    """Напиши решение задачи здесь."""',
            '    $0',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Шаблон основной функции solution(...)',
        range,
    });

    // Базовые конструкции управления

    suggestions.push({
        label: 'for in range',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['for i in range(${1:n}):', '    $0'].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Цикл for по диапазону',
        range,
    });

    suggestions.push({
        label: 'if / elif / else',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'if ${1:condition}:',
            '    $2',
            'elif ${3:other_condition}:',
            '    $4',
            'else:',
            '    $0',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Условный оператор',
        range,
    });

    suggestions.push({
        label: 'try / except',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'try:',
            '    $1',
            'except ${2:Exception} as e:',
            '    $0',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Обработка исключений',
        range,
    });

    suggestions.push({
        label: 'with open(...)',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'with open(${1:path}, ${2:"r"}) as f:',
            '    $0',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Контекстный менеджер with',
        range,
    });

    // Простые comprehension

    suggestions.push({
        label: 'list comprehension',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '[${1:expr} for ${2:x} in ${3:iterable}]',
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'List comprehension',
        range,
    });

    suggestions.push({
        label: 'dict comprehension',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '{${1:key}: ${2:value} for ${3:x} in ${4:iterable}}',
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Dict comprehension',
        range,
    });

    // Базовые структуры данных без алгоритмов

    suggestions.push({
        label: 'class TreeNode',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'class TreeNode:',
            '    def __init__(self, val=0, left=None, right=None):',
            '        self.val = val',
            '        self.left = left',
            '        self.right = right',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Определение TreeNode',
        range,
    });

    suggestions.push({
        label: 'class ListNode',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'class ListNode:',
            '    def __init__(self, val=0, next=None):',
            '        self.val = val',
            '        self.next = next',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Определение ListNode',
        range,
    });

    return suggestions;
}
