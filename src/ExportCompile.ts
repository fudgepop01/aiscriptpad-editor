import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import { pathToIncludes } from './getIncludeData';
import { preprocess } from './preprocessor';

export const Export = async (uri?: vscode.Uri) => {
  if (process.platform !== 'win32') {
    vscode.window.showErrorMessage("Sorry! This feature is only available on windows platforms");
    return;
  }
  const importPath = pathToIncludes;
  let pacPath;
  if (uri) {
    pacPath = uri;
  } else {
    vscode.window.showInformationMessage("select pac to extract data from");
    pacPath = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: { "pacfile": ['pac'] }
    });
  }
  if (!pacPath) { return; }
  if (Array.isArray(pacPath)) { pacPath = pacPath[0]; }

  vscode.window.showInformationMessage("select folder to write files to");
  const outFolder = await vscode.window.showOpenDialog({
    defaultUri: pacPath,
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false
  });
  if (!outFolder) { return; }

  execSync(join(__dirname, "..", "AIScriptCLA", "AIScriptCLA.exe") + ' ' + [
    "--export",
    "--path",
    `"${pacPath.path.substring(1)}"`,
    "--out",
    `"${outFolder[0].path.substring(1)}"`,
    "--include",
    `"${importPath}"`
  ].join(' '));

  vscode.window.showInformationMessage("Exported Sucessfully!");
};

export const Compile = async (uri?: vscode.Uri) => {
  if (process.platform !== 'win32') {
    vscode.window.showErrorMessage("Sorry! This feature is only available on windows platforms");
    return;
  }
  const importPath = pathToIncludes;
  let inputFolder;
  if (uri) {
    inputFolder = uri;
  } else {
    vscode.window.showInformationMessage("select folder to compile");
    inputFolder = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'folder to compile'
    });
  }
  if (!inputFolder) { return; }
  if (Array.isArray(inputFolder)) { inputFolder = inputFolder[0]; }

  vscode.window.showInformationMessage("select .pac file to compile scripts to");
  const targetFile = await vscode.window.showOpenDialog({
    openLabel: 'target pacfile',
    defaultUri: inputFolder,
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    filters: { "pacfile": ['pac'] }
  });
  if (!targetFile) { return; }

  const targetFileDir = targetFile[0].path.substring(1, targetFile[0].path.lastIndexOf('/'));
  const targetFileName = targetFile[0].path.substring(targetFile[0].path.lastIndexOf('/') + 1);
  if (!existsSync(join(targetFileDir, "out"))) { mkdirSync(join(targetFileDir, "out")); }
  copyFileSync(targetFile[0].path.substring(1), join(targetFileDir, "out", targetFileName));

  const errors = await preprocess(inputFolder.path.substring(1));
  if (errors) {
    return vscode.window.showErrorMessage(errors.join("\n"));
  }

  const out = execSync(join(__dirname, "..", "AIScriptCLA", "AIScriptCLA.exe") + ' ' + [
    "--compile",
    "--path",
    `"${inputFolder.path.substring(1)}/__preprocessed"`,
    "--out",
    `"${join(targetFileDir, "out", targetFileName).replace(/\\/g, '/')}"`,
    "--include",
    `"${importPath}"`
  ].join(" ")).toString('utf8').split('\n');

  console.log(out);
  if (out.length > 4) {
    out.shift();
    out.shift();
    out.shift();
    vscode.window.showErrorMessage(out.join('\n'));
  } else {
    vscode.window.showInformationMessage("Compiled Sucessfully!");
  };
};

