import * as vscode from 'vscode';

export const DefinitionProvider = (includeData: any): vscode.DefinitionProvider => {
  return {
    provideDefinition(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Location | vscode.Location[] | vscode.LocationLink[]> {

      const links: vscode.LocationLink[] = [];
      const wordRange = document.getWordRangeAtPosition(position);
      if (!wordRange) { return []; }

      const currentLineText = document.lineAt(position.line).text;

      const gotoInstr = Object.values(includeData.commands).find((v: any) => v.realValue === "0x1C") as any;
      const seekInstr = Object.values(includeData.commands).find((v: any) => v.realValue === "0x5") as any;
      // const atkDiceRollInstr = Object.values(includeData).find((v: any) => v.realValue === "0x2A") as any;

      let matcher = new RegExp(`(?<fullmatch>(?<type>${gotoInstr.label}|${seekInstr.label})\\s*(?<dest>[\\w\\d_]+)?)`, 'g');
      const labelMatchResults = matcher.exec(currentLineText);
      if (labelMatchResults !== null) {
        const startLine = 0;
        let regexBuilder = '(?<fullmatch>label';
        regexBuilder +=
          (labelMatchResults.groups!.dest)
          ? `\\s*${labelMatchResults.groups!.dest})`
          : ')';
        const labelRegex = new RegExp(regexBuilder, 'g');
        for (let line = startLine; line < document.lineCount; line++) {
          const lineText = document.lineAt(line).text;
          const findLabelResults = labelRegex.exec(lineText);
          if (findLabelResults !== null) {
            links.push({
              targetRange: new vscode.Range(
                new vscode.Position(line, labelRegex.lastIndex - findLabelResults.groups!.fullmatch.length),
                new vscode.Position(line, labelRegex.lastIndex)
              ),
              targetUri: document.uri,
              originSelectionRange: new vscode.Range(
                new vscode.Position(position.line, matcher.lastIndex - labelMatchResults.groups!.fullmatch.length),
                new vscode.Position(position.line, matcher.lastIndex)
              )
            });
            if (!labelMatchResults.groups!.dest) {
              break;
            }
          }
          labelRegex.lastIndex = 0;
        }
      }

      return links;
    }
  };
};