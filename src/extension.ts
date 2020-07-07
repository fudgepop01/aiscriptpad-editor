import * as vscode from 'vscode';
import { getIncludeData } from './getIncludeData';
import { generateHighlightProvider } from './generateHighlighting';
import { HoverProvider } from './hoverProvider';
import { DefinitionProvider } from './definitionProvider';
import { CompletionProvider } from './completionProvider';

const tokenTypes = ['function', 'type', 'parameter', 'variable'];
const legend = new vscode.SemanticTokensLegend(tokenTypes);
export async function activate(context: vscode.ExtensionContext) {
	const includeData = await getIncludeData();
	const semanticTokensProvider = vscode.languages.registerDocumentSemanticTokensProvider('aisp', generateHighlightProvider(includeData, legend), legend);
	const hoverProvider = vscode.languages.registerHoverProvider('aisp', HoverProvider(includeData));
	const definitionProvider = vscode.languages.registerDefinitionProvider('aisp', DefinitionProvider(includeData));
	const completionProvider = vscode.languages.registerCompletionItemProvider('aisp', CompletionProvider(includeData));

	context.subscriptions.push(
		semanticTokensProvider,
		hoverProvider,
		definitionProvider,
		completionProvider
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
