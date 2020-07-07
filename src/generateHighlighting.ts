import * as vscode from 'vscode';

interface IParsedToken {
	line: number;
	startCharacter: number;
	length: number;
	tokenType: string;
}

export const generateHighlightProvider = (includeData: any, legend: vscode.SemanticTokensLegend): vscode.DocumentSemanticTokensProvider => {
  return {
    provideDocumentSemanticTokens(
      document: vscode.TextDocument,
      cancelToken: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.SemanticTokens> {
      const builder = new vscode.SemanticTokensBuilder();
      const tokens: IParsedToken[] = [];
      for (const [lineNum, lineText] of document.getText().replace(/\r/g, '').split('\n').entries()) {
        let matcher = new RegExp(`\\b(?<fn>${Object.keys(includeData.functions).join('|')})\\b`, 'g');
        let matchData = matcher.exec(lineText);
        while (matchData !== null) {
          tokens.push({
            line: lineNum,
            startCharacter: matcher.lastIndex - matchData.groups!.fn.length,
            length: matchData.groups!.fn.length,
            tokenType: 'function'
          });
          matchData = matcher.exec(lineText);
        }
        matcher = new RegExp(`\\b(?<cmd>${Object.keys(includeData.commands).join('|')})\\b`, 'g');
        matchData = matcher.exec(lineText);
        while (matchData !== null) {
          tokens.push({
            line: lineNum,
            startCharacter: matcher.lastIndex - matchData.groups!.cmd.length,
            length: matchData.groups!.cmd.length,
            tokenType: 'type'
          });
          matchData = matcher.exec(lineText);
        }
        matcher = new RegExp(`\\b(?<requirement>${Object.keys(includeData.requirements).join('|')})\\b`, 'g');
        matchData = matcher.exec(lineText);
        while (matchData !== null) {
          tokens.push({
            line: lineNum,
            startCharacter: matcher.lastIndex - matchData.groups!.requirement.length,
            length: matchData.groups!.requirement.length,
            tokenType: 'parameter'
          });
          matchData = matcher.exec(lineText);
        }
        matcher = new RegExp(`\\b(?<subaction>${Object.keys(includeData.subactions).join('|')}|subaction[0-9]{1,3})\\b`, 'g');
        matchData = matcher.exec(lineText);
        while (matchData !== null) {
          tokens.push({
            line: lineNum,
            startCharacter: matcher.lastIndex - matchData.groups!.subaction.length,
            length: matchData.groups!.subaction.length,
            tokenType: 'variable'
          });
          matchData = matcher.exec(lineText);
        }
      }

      for (const token of tokens) {
        const idx = legend.tokenTypes.indexOf(token.tokenType);
        builder.push(token.line, token.startCharacter, token.length, idx);
      }
      return builder.build();
    }
  }
}