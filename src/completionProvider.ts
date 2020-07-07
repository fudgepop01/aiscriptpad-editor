import * as vscode from 'vscode';

export const CompletionProvider = (includeData: any): vscode.CompletionItemProvider => {
  // characters, commands, attacks, functions, requirements, routines, events
  const fullData: vscode.CompletionItem[] = [
    ...Object.entries(includeData.commands).map(([key, data]: [string, any]): vscode.CompletionItem => {
      return {
        label: key,
        kind: vscode.CompletionItemKind.Keyword,
        documentation: new vscode.MarkdownString(`real value: \`${data.realValue}\`;\n\n${data.docs}`),
        insertText: new vscode.SnippetString(`${key}${data.arguments.length ? ' ' : ''}${data.arguments.map((arg: string, i: number) => `\${${i+1}:${arg}}`).join(' ')}`)
      };
    }),
    ...Object.entries(includeData.functions).map(([key, data]: [string, any]): vscode.CompletionItem => {
      return {
        label: key,
        kind: vscode.CompletionItemKind.Function,
        documentation: new vscode.MarkdownString(`real value: \`${data.realValue}\`;\n\n${data.docs}`),
        insertText: new vscode.SnippetString(`${key}${data.arguments.length ? ' ' : ''}${data.arguments.map((arg: string, i: number) => `\${${i+1}:${arg}}`).join(' ')}`)
      };
    }),
    ...Object.entries(includeData.requirements).map(([key, data]: [string, any]): vscode.CompletionItem => {
      return {
        label: key,
        kind: vscode.CompletionItemKind.Method,
        documentation: new vscode.MarkdownString(`real value: \`${data.realValue}\`;\n\n${data.docs}`),
        insertText: new vscode.SnippetString(`${key}${data.arguments.length ? ' ' : ''}${data.arguments.map((arg: string, i: number) => `\${${i+1}:${arg}}`).join(' ')}`)
      };
    }),
    ...Object.entries(includeData.routines).map(([key, data]: [string, any]): vscode.CompletionItem => {
      return {
        label: key,
        kind: vscode.CompletionItemKind.Variable,
        documentation: new vscode.MarkdownString(`real value: \`${data.realValue}\`;\n\n${data.docs}`),
        insertText: key
      };
    }),
    ...Object.entries(includeData.events).map(([key, data]: [string, any]): vscode.CompletionItem => {
      return {
        label: key,
        kind: vscode.CompletionItemKind.Event,
        documentation: new vscode.MarkdownString(`real value: \`${data.realValue}\`;\n\n${data.docs}`),
        insertText: key
      };
    }),
  ];

  return {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
      // const out = [];

      // const currentLineText = document.lineAt(position.line).text;
      // const currentWordRange = document.getWordRangeAtPosition(position);
      // if (!currentWordRange) { return []; }

      // const currentWord = currentLineText.substring(currentWordRange.start.character, currentWordRange.end.character)

      // console.log(currentWord);

      return fullData;
    }
  };
};