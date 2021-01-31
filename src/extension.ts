import * as vscode from 'vscode';
import { getIncludeData } from './getIncludeData';
import { generateHighlightProvider } from './generateHighlighting';
import { HoverProvider } from './hoverProvider';
import { DefinitionProvider } from './definitionProvider';
import { CompletionProvider } from './completionProvider';
import { Export, Compile, BatchExport, BatchCompile } from './ExportCompile';

const tokenTypes = ['function', 'type', 'parameter', 'variable'];
const legend = new vscode.SemanticTokensLegend(tokenTypes);
export async function activate(context: vscode.ExtensionContext) {
	const includeData = await getIncludeData();
	const semanticTokensProvider = vscode.languages.registerDocumentSemanticTokensProvider('aisp', generateHighlightProvider(includeData, legend), legend);
	const hoverProvider = vscode.languages.registerHoverProvider('aisp', HoverProvider(includeData));
	const definitionProvider = vscode.languages.registerDefinitionProvider('aisp', DefinitionProvider(includeData));
	const completionProvider = vscode.languages.registerCompletionItemProvider('aisp', CompletionProvider(includeData));

	const exportCommand = vscode.commands.registerCommand('aiscriptpad-editor.export', Export);
	const compileCommand = vscode.commands.registerCommand('aiscriptpad-editor.compile', Compile);
	const batchExportCommand = vscode.commands.registerCommand("aiscriptpad-editor.batch-export", BatchExport);
	const batchCompileCommand = vscode.commands.registerCommand("aiscriptpad-editor.batch-compile", BatchCompile);

	context.subscriptions.push(
		semanticTokensProvider,
		hoverProvider,
		definitionProvider,
		completionProvider,
		exportCommand,
		compileCommand,
		batchExportCommand,
		batchCompileCommand
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
