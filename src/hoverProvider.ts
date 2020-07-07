import * as vscode from 'vscode';

export const HoverProvider = (includeData: any): vscode.HoverProvider => {
  return {
    provideHover(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
      const wordRange = document.getWordRangeAtPosition(position);
      if (!wordRange) { return undefined; }

      const docToFind = document.lineAt(position.line).text.substring(wordRange.start.character, wordRange.end.character);
      let result;
      if (includeData.functions[docToFind]) {
        result = `real value: \`${includeData.functions[docToFind].realValue}\`\n\n${includeData.functions[docToFind].docs}`;
      } else if (includeData.commands[docToFind]) {
        result = `real value: \`${includeData.commands[docToFind].realValue}\`\n\n${includeData.commands[docToFind].docs}`;
      } else if (includeData.requirements[docToFind]) {
        result = `real value: \`${includeData.requirements[docToFind].realValue}\`\n\n${includeData.requirements[docToFind].docs}`;
      } else if (includeData.subactions[docToFind]) {
        result = `real value: \`${includeData.subactions[docToFind].realValue}\`\n\n${includeData.subactions[docToFind].docs}`;
      }
      if (result) { return new vscode.Hover(new vscode.MarkdownString(result)); }
      else { return undefined; }
    }
  };
}