// TODO: give macros the ability to have arguments and call other macros

import * as fs from 'fs';
import { workspace } from 'vscode';
import { sep } from 'path';
import { normalize } from 'path';
const { readdir, readFile, writeFile, mkdir, unlink, access } = fs.promises;

export const preprocess = async (path: string) => {
  const macros: {
    [key: string]: {
      text: string,
      lets: {[key: string]: string},
      constants: {[key: string]: string},
      arguments: string[]
    }
  } = {};
  const outFiles: {[key: string]: string} = {};
  const errors: string[] = [];
  let currentScopeItems: {lets: {[key: string]: string}, constants: {[key: string]: string}} = {constants: {}, lets: {}};
  let globals: typeof currentScopeItems = {constants: {}, lets: {}};
  const scopeStack: Array<typeof currentScopeItems> = [];

  const errStartGen = (file: string, lineNum: number) => `preprocess error: ${file}; line ${lineNum}:\n`;

  const updateScopeItems = () => {
    let out = {constants: {}, lets: {}};
    for (const scope of scopeStack) {
      out = {
        constants: {...out.constants, ...scope.constants},
        lets: {...out.lets, ...scope.lets}
      };
    }
    currentScopeItems = out;
  };

  const addLetToScope = (groups: RegExpMatchArray["groups"]) => {
    scopeStack[scopeStack.length - 1].lets[groups!.alias] = groups!.variable;
    updateScopeItems();
  };

  const addConstToScope = (groups: RegExpMatchArray["groups"]) => {
    scopeStack[scopeStack.length - 1].constants[groups!.alias] = groups!.value;
    updateScopeItems();
  };

  const convertRawVars = (line: string) => {
    for (const [alias, variable] of Object.entries(currentScopeItems.lets)) {
      line = line.replace(new RegExp(`\\b${alias}\\b`, 'g'), variable);
    }
    for (const [alias, value] of Object.entries(currentScopeItems.constants)) {
      line = line.replace(new RegExp(`\\b${alias}\\b`, 'g'), value);
    }
    for (const [alias, variable] of Object.entries(globals.lets)) {
      line = line.replace(new RegExp(`\\b${alias}\\b`, 'g'), variable);
    }
    for (const [alias, value] of Object.entries(globals.constants)) {
      line = line.replace(new RegExp(`\\b${alias}\\b`, 'g'), value);
    }
    return line;
  }

  const processLine = (line: string, file: string, lineNum: number, localSnippets?: typeof macros): string => {
    const errStart = errStartGen(file, lineNum);
    let isError = false;
    // scope stack modifiers
    if (line.trim().startsWith("if ")) {
      scopeStack.push({lets: {}, constants: {}});
    }
    else if (line.trim().startsWith("elif ")) {
      scopeStack.pop();
      scopeStack.push({lets: {}, constants: {}});
      updateScopeItems();
    }
    else if (line.trim() === "endif") {
      scopeStack.pop();
      updateScopeItems();
    }
    // preprocessor directives
    // these "return" so as not to add to the actual output
    else if (line.trim().startsWith("#macro")) {
      errors.push(`${errStart}macros must be defined within macros.as;\nmacros cannot be defined within a macro`);
      return "error";
    }
    else if (line.trim().startsWith("#let")) {
      const matches = line.trim().match(/#let\s+(?<alias>[a-zA-Z_][a-zA-Z0-9_]+)\s*=\s*(?<variable>var[0-9]+)/);
      if (!matches!.groups!.alias) {
        errors.push(`${errStart}let-variable must have a name`);
      }
      if (!matches!.groups!.variable) {
        errors.push(`${errStart}let must have an associated variable`);
      }
      if (isError) { return "error"; }
      if (file === "globals.as") { globals.lets[matches!.groups!.alias] = matches!.groups!.variable; }
      else { addLetToScope(matches!.groups!); }
      return "";
    }
    else if (line.trim().startsWith("#const")) {
      const matches = line.trim().match(/#const\s+(?<alias>[a-zA-Z_][a-zA-Z0-9_]+)\s*=\s*(?<value>-?[0-9]+(?:\.[0-9]+)?)/);
      if (!matches!.groups!.alias) {
        errors.push(`${errStart}const must have a name`);
      }
      if (!matches!.groups!.value) {
        errors.push(`${errStart}const must have a numeric value`);
      }
      if (isError) { return "error"; }
      if (file === "globals.as") { globals.constants[matches!.groups!.alias] = matches!.groups!.value; }
      else { addConstToScope(matches!.groups!); }
      return "";
    }
    if (localSnippets) {
      for (const [snippetName, parsedSnippet] of Object.entries(localSnippets)) {
        if (line.trim().startsWith("{" + snippetName + "}")) {  
          line = parsedSnippet.text;
  
          const procLines: (string | undefined)[] = [];
  
          scopeStack.push({lets: {}, constants: {}});
          for (const [ind, ln] of line.split("\n").entries()) {
            const processed = processLine(ln, `(${errStart}) > ${snippetName}`, ind);
            if (processed) { procLines.push(processed); }
          }
          const parsedSnippetItems = scopeStack.pop();
  
          const ssTarget = scopeStack[scopeStack.length - 1];
          ssTarget.lets = { ...ssTarget.lets, ...parsedSnippetItems!.lets };
          ssTarget.constants = { ...ssTarget.constants, ...parsedSnippetItems!.constants };
          updateScopeItems();
  
          if (!file.startsWith("(")) {
            if (!outFiles[file]) { outFiles[file] = ''; }
            outFiles[file] += `${procLines.join('\n')}\n`;
          }
          return procLines.join('\n');
        }
      }
    }
    for (const [macroName, parsedMacro] of Object.entries(macros)) {
      if (line.trim().startsWith(macroName)) {
        const passedArgRegexRes = /\((?<args>.*)\)/.exec(line);
        const passedArgs = (passedArgRegexRes?.groups?.args) ? passedArgRegexRes.groups.args.split(",").map(arg=>arg.trim()) : [];

        if (passedArgs.length !== parsedMacro.arguments.length) {
          errors.push(`${errStart}macro argument count mismatch!`);
          return "error";
        }

        const processedArgs: string[] = passedArgs.map(arg => convertRawVars(arg));

        line = parsedMacro.text;
        for (const [idx, arg] of parsedMacro.arguments.entries()) {
          line = line.replace(new RegExp(`\\{${arg}\\}`, 'g'), processedArgs[idx]);
        }

        const procLines: (string | undefined)[] = [];

        scopeStack.push({lets: {}, constants: {}});
        for (const [ind, ln] of line.split("\n").entries()) {
          const processed = processLine(ln, `(${errStart}) > ${macroName}`, ind);
          if (processed) { procLines.push(processed); }
        }
        const parsedMacroItems = scopeStack.pop();

        const ssTarget = scopeStack[scopeStack.length - 1];
        ssTarget.lets = { ...ssTarget.lets, ...parsedMacroItems!.lets };
        ssTarget.constants = { ...ssTarget.constants, ...parsedMacroItems!.constants };
        updateScopeItems();

        if (!file.startsWith("(")) {
          if (!outFiles[file]) { outFiles[file] = ''; }
          outFiles[file] += `${procLines.join('\n')}\n`;
        }
        return procLines.join('\n');
      }
    }

    for (const [alias, variable] of Object.entries(currentScopeItems.lets)) {
      line = line.replace(new RegExp(`\\b${alias}\\b`, 'g'), variable);
    }
    for (const [alias, value] of Object.entries(currentScopeItems.constants)) {
      line = line.replace(new RegExp(`\\b${alias}\\b`, 'g'), value);
    }
    for (const [alias, variable] of Object.entries(globals.lets)) {
      line = line.replace(new RegExp(`\\b${alias}\\b`, 'g'), variable);
    }
    for (const [alias, value] of Object.entries(globals.constants)) {
      line = line.replace(new RegExp(`\\b${alias}\\b`, 'g'), value);
    }

    line = line
      .replace(/hex\(0x([a-fA-F0-9]+)\)/g, (_, m1) => {
        return `${parseInt(m1, 16)}`;
      })
      // .replace(/color\((\d+),? (\d+),? (\d+),? (\d+)\)/g, (_, r: string, g: string, b: string, a: string) => {
      //   let rOut = parseInt(r);
      //   let bOut = parseInt(b);
      //   let gOut = parseInt(g);
      //   let aOut = parseInt(a);
      //   if (rOut > 255 || bOut > 255 || gOut > 255 || aOut > 255) { return "COLOR_ERROR(should be 0-255)"; }
      //   return `${(rOut << 24 | gOut << 16 | bOut << 8 | aOut) >>> 0}`;
      // })
      .replace(/color\(0x([a-fA-F0-9]{8})\)/g, (_, m1: string) => {
        const hex = parseInt(m1, 16);
        return `${(hex & 0xff000000) >>> 24} ${(hex & 0xff0000) >> 16} ${(hex & 0xff00) >> 8} ${hex & 0xff}`;
      })
      .replace(/str(v?)\("([\x00-\xFF]+)"\)/g, (_, vFlag: string, m1: string) => {
        const out = [];
        let currentVal = 0;
        for (const [i, ch] of m1.split("").entries()) {
          currentVal |= (ch.charCodeAt(0) << (((2 - (i % 3)) * 8) + 8)) >>> 0;
          if ((i + 1) % 3 === 0) {
            out.push(currentVal);
            currentVal = 0;
          }
        }
        out.push(currentVal);
        if (vFlag.length === 0) {
          while (out.length < 5) { out.push(0); }
          while (out.length > 5) { out.pop(); }
        } else {
          return `${out[0]}`;
        }
        return out.join(" ");
      });

    if (!file.startsWith("(")) {
      if (!outFiles[file]) { outFiles[file] = ''; }
      outFiles[file] += `${line}\n`;
    }
    return line;
  };

  const includePath: string = workspace.getConfiguration("aiscriptpad").get("includepath") as string;
  let sharedPath = includePath;
  if (includePath.startsWith('.')) {
    workspace.workspaceFolders?.map((folder) => {
      const fPath = folder.uri.path;
      if (fs.readdirSync(fPath.substring(sep === "\\" ? fPath.indexOf("/") + 1 : 0)).includes(includePath.substring(2))) {
        sharedPath = folder.uri.path + includePath.substring(1);
      }
    });
  }
  if (sep === '\\') {
    sharedPath = sharedPath.substring(sharedPath.indexOf('/') + 1);
  }

  let templates: string[] = [];
  
  if (await (await readdir(`${sharedPath}`)).includes('shared')) {
    const files = await readdir(`${sharedPath}/shared`);
    if (files.includes('templates')) {
      templates = await readdir(`${sharedPath}/shared/templates`);
    }
    if (files.includes('globals.as')) {
      const lines = (await readFile(`${sharedPath}/shared/globals.as`, 'utf8')).split(/\r?\n/g);
      for (const [lineNum, line] of lines.entries()) {
        processLine(line.trim(), "globals.as", lineNum);
      }
    }
    if (files.includes("macros.as")) {
      const lines = (await readFile(`${sharedPath}/shared/macros.as`, 'utf8')).split(/\r?\n/g);
      let currentMacroName: undefined | string = undefined;
      let currentMacroSpaces: undefined | string = undefined;
      for (const [lineNum, line] of lines.entries()) {
        if (line.trim().startsWith("#macro")) {
          const matches = line.match(/^(?<spaces>\s*)#macro\s+(?<name>[a-zA-Z_]+)\((?<args>.*)\)/)!;
          if (matches.groups!.name) {
            currentMacroName = matches.groups!.name;
            macros[matches.groups!.name] = {
              text: '',
              lets: {},
              constants: {},
              arguments: matches.groups!.args.split(",").map(arg=>arg.trim()).filter(arg=>arg.length > 0),
            };
            if (matches.groups!.spaces || matches.groups!.spaces.length === 0) {
              currentMacroSpaces = matches.groups!.spaces;
            }
          }
        } else if (currentMacroName && line.trim().startsWith("#endmacro")) {
          currentMacroName = undefined;
          currentMacroSpaces = undefined;
        } else if (currentMacroName) {
          const contentLine = line.substring(currentMacroSpaces!.length);
          macros[currentMacroName].text += contentLine + '\n';
        }
      }
    }
  }

  const files = await readdir(`${path}`);

  if (files.includes("globals.as")) {
    const lines = (await readFile(`${path}/globals.as`, 'utf8')).split(/\r?\n/g);
    for (const [lineNum, line] of lines.entries()) {
      processLine(line.trim(), "globals.as", lineNum);
    }
  }
  if (files.includes("macros.as")) {
    const lines = (await readFile(`${path}/macros.as`, 'utf8')).split(/\r?\n/g);
    let currentMacroName: undefined | string = undefined;
    let currentMacroSpaces: undefined | string = undefined;
    for (const [lineNum, line] of lines.entries()) {
      if (line.trim().startsWith("#macro")) {
        const matches = line.match(/^(?<spaces>\s*)#macro\s+(?<name>[a-zA-Z_]+)\((?<args>.*)\)/)!;
        if (matches.groups!.name) {
          currentMacroName = matches.groups!.name;
          macros[matches.groups!.name] = {
            text: '',
            lets: {},
            constants: {},
            arguments: matches.groups!.args.split(",").map(arg=>arg.trim()).filter(arg=>arg.length > 0),
          };
          if (matches.groups!.spaces || matches.groups!.spaces.length === 0) {
            currentMacroSpaces = matches.groups!.spaces;
          }
        }
      } else if (currentMacroName && line.trim().startsWith("#endmacro")) {
        currentMacroName = undefined;
        currentMacroSpaces = undefined;
      } else if (currentMacroName) {
        const contentLine = line.substring(currentMacroSpaces!.length);
        macros[currentMacroName].text += contentLine + '\n';
      }
    }
  }

  for (const file of files) {
    if (["globals.as", "macros.as", "__preprocessed"].includes(file)) { continue; }
    const lines = (await readFile(`${path}/${file}`, 'utf8')).split(/\r?\n/g);

    scopeStack.push({
      lets: {},
      constants: {}
    });

    if (!lines.some(ln => ln.trim().startsWith("id ")) && !["AIPD.aipd", "ATKD.atkd"].includes(file)) {
      if (!templates.includes(file)) {
        errors.push(`no template found for ${file}!`);
        continue;
      }

      templates.splice(templates.indexOf(file), 1);
      const templateLines = (await readFile(`${sharedPath}/shared/templates/${file}`, 'utf8')).split(/\r?\n/g);
      const snippets: typeof macros = {};
      let currentSnippetName: undefined | string = undefined;
      let currentSnippetSpaces: undefined | string = undefined;
      for (const [lineNum, line] of lines.entries()) {
        if (line.trim().startsWith("#snippet")) {
          const matches = line.match(/^(?<spaces>\s*)#snippet\s+(?<name>[a-zA-Z_]+)/)!;
          if (matches.groups!.name) {
            currentSnippetName = matches.groups!.name;
            snippets[matches.groups!.name] = {
              text: '',
              lets: {},
              constants: {},
              arguments: [],
            };
            if (matches.groups!.spaces || matches.groups!.spaces.length === 0) {
              currentSnippetSpaces = matches.groups!.spaces;
            }
          }
        } else if (currentSnippetName && line.trim().startsWith("#endsnippet")) {
          currentSnippetName = undefined;
          currentSnippetSpaces = undefined;
        } else if (currentSnippetName) {
          const contentLine = line.substring(currentSnippetSpaces!.length);
          snippets[currentSnippetName].text += contentLine + '\n';
        }
      }

      for (const [lineNum, line] of templateLines.entries()) {
        processLine(line, file, lineNum, snippets);
      }
    } else {
      for (const [lineNum, line] of lines.entries()) {
        processLine(line, file, lineNum);
      }
    }
    scopeStack.pop();
  }

  for (const template of templates) {
    const lines = (await readFile(`${sharedPath}/shared/templates/${template}`, 'utf8')).split(/\r?\n/g);

    scopeStack.push({
      lets: {},
      constants: {}
    });
    for (const [lineNum, line] of lines.entries()) {
      processLine(line, template, lineNum);
    }
    scopeStack.pop();
  }

  if (errors.length) {
    return errors;
  }

  if (fs.existsSync(`${path}/__preprocessed`)) { 
    const inPreprocessed = await readdir(`${path}/__preprocessed`);
    for (const file of inPreprocessed) {
      if (!Object.keys(outFiles).includes(file)) await unlink(`${path}/__preprocessed/${file}`);
    }
  } else {
    await mkdir(`${path}/__preprocessed`);
  }
  

  for (const [name, content] of Object.entries(outFiles)) {
    if (["globals.as", "macros.as", "__preprocessed"].includes(name)) { continue; }
    await writeFile(`${path}/__preprocessed/${name}`, content, 'utf8');
  }

  return;
}
