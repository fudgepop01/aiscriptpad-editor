import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
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
    defaultUri: vscode.Uri.parse(pacPath.path.substring(0, pacPath.path.lastIndexOf("/"))),
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false
  });
  if (!outFolder) { return; }

  console.log("==========");
  console.log(pacPath.path);
  console.log(outFolder[0].path);
  

  console.log(join(__dirname, "..", "AIScriptCLA", "AIScriptCLA.exe") + ' ' + [
    "--export",
    "--path",
    `"${pacPath.path.substring(1)}"`,
    "--out",
    `"${outFolder[0].path.substring(1)}"`,
    "--include",
    `"${importPath}"`
  ].join(' '));

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

export const BatchExport = async () => {
  if (process.platform !== 'win32') {
    vscode.window.showErrorMessage("Sorry! This feature is only available on windows platforms");
    return;
  }
  const importPath = pathToIncludes;
  vscode.window.showInformationMessage("select folders containing pac files");
  const rootFolderPaths = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: true
  });
  if (!rootFolderPaths) { return; }
  const failed = [];
  for (const uri of rootFolderPaths) {
    const files = readdirSync(uri.path.substring(1))
      .filter((files) => files.endsWith(".pac"));
    for (const file of files) {
      const fullPath = `${uri.path.substring(1)}/${file}`;
      try {
        execSync(join(__dirname, "..", "AIScriptCLA", "AIScriptCLA.exe") + ' ' + [
          "--export",
          "--path",
          `"${fullPath}"`,
          "--out",
          `"${uri.path.substring(1)}/"`,
          "--include",
          `"${importPath}"`
        ].join(' '));
      } catch (e) {
        failed.push(file);
      }
    }
  }

  if (failed.length == 0) {
    vscode.window.showInformationMessage("Batch-Exported Sucessfully!");
  } else {
    vscode.window.showErrorMessage(`The following files encountered issues while exporting: ${failed.join('" | "')}`);
  }
}

export const BatchCompile = async () => {
  if (process.platform !== 'win32') {
    vscode.window.showErrorMessage("Sorry! This feature is only available on windows platforms");
    return;
  }
  const importPath = pathToIncludes;
  vscode.window.showInformationMessage("select folders containing folders named ai_*");
  const rootFolderPaths = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: true
  });
  if (!rootFolderPaths) { return; }
  vscode.window.showInformationMessage("select folder for resulting pac files");
  const copyDirPath = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
  });
  const failed = [];
  const noPac = [];
  const pacFiles = [];
  for (const uri of rootFolderPaths) {
    const files = readdirSync(uri.path.substring(1), {withFileTypes: true});
    const aiFolders = files.filter((files) => files.name.startsWith("ai_") && files.isDirectory());
    const pacFile = files.find((files) => !files.isDirectory() && files.name.endsWith(".pac"));
    if (!pacFile) { 
      noPac.push(uri.path.substring(uri.path.lastIndexOf("/") + 1)); 
      continue; 
    }

    if (!existsSync(join(uri.path.substring(1), "out"))) { mkdirSync(join(uri.path.substring(1), "out")); }
    const pacFilePath = join(uri.path.substring(1), "out", pacFile.name);
    pacFiles.push(pacFilePath);
    copyFileSync(join(uri.path.substring(1), pacFile.name), pacFilePath);

    for (const folder of aiFolders) {
      const fullPath = join(uri.path.substring(1), folder.name);
      try {
        const errors = await preprocess(fullPath);
        if (errors) {
          throw "preprocess error";
        }

        const out = execSync(join(__dirname, "..", "AIScriptCLA", "AIScriptCLA.exe") + ' ' + [
          "--compile",
          "--path",
          `"${fullPath}/__preprocessed"`,
          "--out",
          `"${pacFilePath.replace(/\\/g, '/')}"`,
          "--include",
          `"${importPath}"`
        ].join(" ")).toString('utf8').split('\n');
      
        if (out.length > 4) {
          failed.push(folder);
        }
      } catch (e) {
        failed.push(folder);
        pacFiles.pop();
        break;
      }
    }
  }

  if (copyDirPath) {
    for (const pacFilePath of pacFiles) {
      copyFileSync(pacFilePath, join(copyDirPath[0].path.substring(1), pacFilePath.substring(pacFilePath.lastIndexOf("\\"))));
    }
  }

  if (failed.length == 0) {
    vscode.window.showInformationMessage(`Batch-Compiled Sucessfully!${(copyDirPath) ? "Pacs copied to the selected folder" : ""}`);
  } else {
    vscode.window.showErrorMessage(`The following folders encountered issues while compiling: ${failed.join('" | "')}`);
    if (copyDirPath) vscode.window.showInformationMessage("Pacs that succeeded were copied to the selected folder");
  }
}