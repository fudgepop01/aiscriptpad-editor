import * as fs from 'fs';
const { readdir, readFile, writeFile, mkdir, access } = fs.promises;

export const preprocess = async (path: string) => {
  const macros: {
    [key: string]: {
      text: string,
      lets: {[key: string]: string},
      constants: {[key: string]: string}
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

  const processLine = (line: string, file: string, lineNum: number) => {
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
      return;
    }
    else if (line.trim().startsWith("#let")) {
      const matches = line.trim().match(/#let\s+(?<alias>[a-zA-Z_]+)\s*=\s*(?<variable>var[0-9]+)/);
      if (!matches!.groups!.alias) {
        errors.push(`${errStart}let-variable must have a name`);
      }
      if (!matches!.groups!.variable) {
        errors.push(`${errStart}let must have an associated variable`);
      }
      if (isError) { return "error"; }
      if (file === "globals.as") { globals.lets[matches!.groups!.alias] = matches!.groups!.variable; }
      else { addLetToScope(matches!.groups!); }
      return;
    }
    else if (line.trim().startsWith("#const")) {
      const matches = line.trim().match(/#const\s+(?<alias>[a-zA-Z_]+)\s*=\s*(?<value>[0-9]+(?:\.[0-9]+)?)/);
      if (!matches!.groups!.alias) {
        errors.push(`${errStart}const must have a name`);
      }
      if (!matches!.groups!.value) {
        errors.push(`${errStart}const must have a numeric value`);
      }
      if (isError) { return "error"; }
      if (file === "globals.as") { globals.constants[matches!.groups!.alias] = matches!.groups!.value; }
      else { addConstToScope(matches!.groups!); }
      return;
    }
    for (const [macroName, parsedMacro] of Object.entries(macros)) {
      if (line.trim() === macroName) {
        line = parsedMacro.text;
        const ssTarget = scopeStack[scopeStack.length - 1];
        ssTarget.lets = { ...ssTarget.lets, ...parsedMacro.lets };
        ssTarget.constants = { ...ssTarget.constants, ...parsedMacro.constants };
        updateScopeItems();
        if (!outFiles[file]) { outFiles[file] = ''; }
        outFiles[file] += `${line}\n`;
        return line;
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

    if (!outFiles[file]) { outFiles[file] = ''; }
    outFiles[file] += `${line}\n`;
    return line;
  };

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
        const matches = line.match(/^(?<spaces>\s*)#macro\s+(?<name>[a-zA-Z_]+)/)!;
        if (matches.groups!.name) {
          currentMacroName = matches.groups!.name;
          macros[matches.groups!.name] = {
            text: '',
            lets: {},
            constants: {},
          };
          if (matches.groups!.spaces || matches.groups!.spaces.length === 0) {
            currentMacroSpaces = matches.groups!.spaces;
          }
          scopeStack.push({
            lets: {},
            constants: {}
          });
        }
      } else if (currentMacroName && line.trim().startsWith("#endmacro")) {
        macros[currentMacroName].lets = currentScopeItems.lets;
        macros[currentMacroName].constants = currentScopeItems.constants;
        scopeStack.pop();
        updateScopeItems();
        currentMacroName = undefined;
        currentMacroSpaces = undefined;
      } else if (currentMacroName) {
        const contentLine = line.substring(currentMacroSpaces!.length);
        const processedLine = processLine(contentLine, "macros.as", lineNum);
        if (processedLine) { macros[currentMacroName].text += processedLine + '\n'; }
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
    for (const [lineNum, line] of lines.entries()) {
      processLine(line, file, lineNum);
    }
    scopeStack.pop();
  }

  if (errors.length) {
    return errors;
  }

  if (!fs.existsSync(`${path}/__preprocessed`)) { await mkdir(`${path}/__preprocessed`); }

  for (const [name, content] of Object.entries(outFiles)) {
    if (["globals.as", "macros.as", "__preprocessed"].includes(name)) { continue; }
    await writeFile(`${path}/__preprocessed/${name}`, content, 'utf8');
  }

  return;
}
