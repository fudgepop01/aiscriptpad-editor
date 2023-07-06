import * as vscode from 'vscode';

const generateProbabilityInfo = (high: number, low: number, max: number, min: number) => {
  const CPULevelChart = [0, 15, 21, 31, 42, 48, 60, 75, 100];

  const probabilities = CPULevelChart.map(levelValue => {
    const lowMultiplier = (levelValue < min) ? 1 : (levelValue - min) / (max - min);
    const highMultiplier = (levelValue > max) ? 1 : (max - levelValue) / (max - min);
    const val = Math.round((lowMultiplier * low + highMultiplier * high) * 100) / 100;
    if (val > 100) { return 100; }
    else if (val < 0 || isNaN(val)) { return 0; }
    else { return val; }
  });

  return `

Chance per CPU Level:

level | chance
:---:|:---:
${probabilities.map((v, i) => `${i+1} | ${v}`).join('\n')}

### Formula:

\`high, low, max, min\`

\`(levelvalue-min)/(max-min)*low+(max-levelvalue)/(max-min)*high\`

If levelvalue > max, (max-levelvalue)/(max-min) will be 1

If levelvalue < min, (levelvalue-min)/(max-min) will be 1.

Levelvalue is a value which changes depending on the CPU level.

### CPU Level Values:

level | value
:---:|:---:
${CPULevelChart.map((v, i) => `${i+1} | ${v}`).join('\n')}
`;
}

export const HoverProvider = (includeData: any): vscode.HoverProvider => {
  return {
    provideHover(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
      const wordRange = document.getWordRangeAtPosition(position);
      if (!wordRange) { return undefined; }

      const lineText = document.lineAt(position.line).text;
      const docToFind = lineText.substring(wordRange.start.character, wordRange.end.character);
      let result;
      if (includeData.functions[docToFind]) {
        result = `real value: \`${includeData.functions[docToFind].realValue}\`\n\n${includeData.functions[docToFind].docs}`;
      } else if (includeData.commands[docToFind]) {
        result = `real value: \`${includeData.commands[docToFind].realValue}\`\n\n${includeData.commands[docToFind].docs}`;
      } else if (includeData.requirements[docToFind]) {
        result = `real value: \`${includeData.requirements[docToFind].realValue}\`\n\n${includeData.requirements[docToFind].docs}`;
      } else if (includeData.subactions[docToFind]) {
        result = `real value: \`${includeData.subactions[docToFind].realValue}\`\n\n${includeData.subactions[docToFind].docs}`;
      } else if (includeData.routines[docToFind]) {
        result = `real value: \`${includeData.routines[docToFind].realValue}\`\n\n${includeData.routines[docToFind].docs}`;
      } else if (document.uri.path.endsWith('.aipd')) {
        const regex = /\w+ (?<fullMatch>(?<high>1?\d{1,2}),(?<low>1?\d{1,2}),(?<max>1?\d{1,2}),(?<min>1?\d{1,2})?)/g;
        const matchResult = regex.exec(lineText);
        if (matchResult !== null
          && lineText.indexOf(matchResult.groups!.fullMatch) <= position.character
          && position.character <= regex.lastIndex) {
          result = generateProbabilityInfo(
            parseInt(matchResult.groups!.high),
            parseInt(matchResult.groups!.low),
            parseInt(matchResult.groups!.max),
            parseInt(matchResult.groups!.min)
          );
        }
      }
      if (result) { return new vscode.Hover(new vscode.MarkdownString(result)); }
      else { return undefined; }
    }
  };
}