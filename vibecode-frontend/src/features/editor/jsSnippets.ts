import type * as Monaco from 'monaco-editor';

export type JsSnippet = Monaco.languages.CompletionItem;

export function getJsTsSuggestions(
    monaco: typeof Monaco,
    range: Monaco.IRange,
): JsSnippet[] {
    const kw = (label: string): JsSnippet => ({
        label,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: label,
        range,
    });

    const suggestions: JsSnippet[] = [];

    // Ключевые слова и служебные слова
    [
        'function',
        'const',
        'let',
        'var',
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
        'finally',
        'throw',
        'class',
        'extends',
        'super',
        'this',
        'new',
        'import',
        'from',
        'export',
        'async',
        'await',
    ].forEach((k) => suggestions.push(kw(k)));

    // Базовые конструкции

    // Функция / метод
    suggestions.push({
        label: 'function name()',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['function ${1:name}(${2:args}) {', '  $0', '}'].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Объявление функции',
        range,
    });

    // Стрелочная функция
    suggestions.push({
        label: 'const fn = () =>',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'const ${1:name} = (${2:args}) => {\n  $0\n};',
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Стрелочная функция',
        range,
    });

    // if / else
    suggestions.push({
        label: 'if / else',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['if (${1:condition}) {', '  $2', '} else {', '  $0', '}'].join(
            '\n',
        ),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Условный оператор',
        range,
    });

    // for (i = 0; i < n; i++)
    suggestions.push({
        label: 'for (let i = 0; i < n; i++)',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'for (let i = 0; i < ${1:n}; i++) {',
            '  $0',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Классический for‑цикл',
        range,
    });

    // for..of
    suggestions.push({
        label: 'for..of',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['for (const x of ${1:iterable}) {', '  $0', '}'].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Цикл по элементам коллекции',
        range,
    });

    // try / catch
    suggestions.push({
        label: 'try / catch',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: ['try {', '  $1', '} catch (e) {', '  $0', '}'].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Обработка исключений',
        range,
    });

    // Класс
    suggestions.push({
        label: 'class Name',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
            'class ${1:ClassName} {',
            '  constructor(${2:args}) {',
            '    $0',
            '  }',
            '}',
        ].join('\n'),
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'ES6‑класс',
        range,
    });

    // Массив и объект
    suggestions.push({
        label: 'const arr = []',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'const ${1:arr} = [$0];',
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Объявление массива',
        range,
    });

    suggestions.push({
        label: 'const obj = {}',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: 'const ${1:obj} = { $0 };',
        insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Объявление объекта',
        range,
    });

    return suggestions;
}
