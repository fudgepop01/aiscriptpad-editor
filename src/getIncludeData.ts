import * as vscode from 'vscode';
import { sep } from 'path';
import { readdir, readFile, readdirSync } from 'fs';
import { promisify } from 'util';

const aReaddir = promisify(readdir);
const aReadFile = promisify(readFile);

const includePath: string = vscode.workspace.getConfiguration("aiscriptpad").get("includepath") as string;
let fullPath = includePath;
if (includePath.startsWith('.')) {
  vscode.workspace.workspaceFolders?.map((folder) => {
    const fPath = folder.uri.path;
    if (readdirSync(fPath.substring(sep === "\\" ? fPath.indexOf("/") + 1 : 0)).includes(includePath.substring(2))) {
      fullPath = folder.uri.path + includePath.substring(1);
    }
  });
}
if (sep === '\\') {
  fullPath = fullPath.substring(fullPath.indexOf('/') + 1); //.replace(/\//g, "\\ ");
}

export const pathToIncludes = fullPath;

const handleData = (lines: string[], callback: (line: string, doc: string) => any) => {
  let doc = '';
  lines[0] = lines[0].substring(1);
  for (const line of lines) {
    if (line.startsWith('///')) {
      doc += line.substring(3) + '\n';
    } else {
      callback(line, doc);
      doc = '';
    }
  }
};

const fileHandlers = {
  "Attacks.h": (out: any, lines: string[]) => {
    out.attacks = {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/atk (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)/);
      if (matches?.groups) {
        out.attacks[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim()
        };
      }
    });
  },
  "Chars.h": (out: any, lines: string[]) => {
    out.characters = {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/char (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)/);
      if (matches?.groups) {
        out.characters[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim()
        };
      }
    });
  },
  "Commands.h": (out: any, lines: string[]) => {
    out.commands = out.commands || {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/cmd (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)(?: (?<args>.+))?/);
      if (matches?.groups) {
        out.commands[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim(),
          arguments: (matches.groups.args) ? matches.groups.args.split(' ') : []
        };
      }
    });
  },
  "CustomCommands.h": (out: any, lines: string[]) => {
    out.commands = out.commands || {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/cmd (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)(?: (?<args>.+))?/);
      if (matches?.groups) {
        out.commands[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim(),
          arguments: (matches.groups.args) ? matches.groups.args.split(' ') : []
        };
      }
    });
  },
  "CustomFunctions.h": (out: any, lines: string[]) => {
    out.functions = out.functions || {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/func (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)/);
      if (matches?.groups) {
        out.functions[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim(),
          arguments: (matches.groups.args) ? matches.groups.args.split(' ') : []
        };
      }
    });
  },
  "CustomRequirements.h": (out: any, lines: string[]) => {
    out.requirements = out.requirements || {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/req (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)(?: (?<args>.+))?/);
      if (matches?.groups) {
        out.requirements[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim(),
          arguments: (matches.groups.args) ? matches.groups.args.split(' ') : []
        };
      }
    });
  },
  "CustomRoutines.h": (out: any, lines: string[]) => {
    out.routines = out.routines || {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/act (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)/);
      if (matches?.groups) {
        out.routines[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim()
        };
      }
    });
  },
  "Events.h": (out: any, lines: string[]) => {
    out.events = out.events || {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/event (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)/);
      if (matches?.groups) {
        out.events[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim()
        };
      }
    });
  },
  "Functions.h": (out: any, lines: string[]) => {
    out.functions = out.functions || {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/func (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)(?: (?<args>.+))?/);
      if (matches?.groups) {
        out.functions[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim(),
          arguments: (matches.groups.args) ? matches.groups.args.split(' ') : []
        };
      }
    });
  },
  "Requirements.h": (out: any, lines: string[]) => {
    out.requirements = out.requirements || {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/req (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)(?: (?<args>.+))?/);
      if (matches?.groups) {
        out.requirements[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim(),
          arguments: (matches.groups.args) ? matches.groups.args.split(' ') : []
        };
      }
    });
  },
  "Routines.h": (out: any, lines: string[]) => {
    out.routines = out.routines || {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/act (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)/);
      if (matches?.groups) {
        out.routines[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim()
        };
      }
    });
  },
  "Subactions_common.h": (out: any, lines: string[]) => {
    out.subactions = out.subactions || {};
    handleData(lines, (line, doc) => {
      const matches = line.match(/act (?<name>[\w\d]+)\s*:\s*(?<value>[\w\d]+)/);
      if (matches?.groups) {
        out.subactions[matches.groups.name] = {
          label: matches.groups.name,
          realValue: matches.groups.value.trim(),
          docs: doc.trim()
        };
      }
    });
  }
};

let out: any = undefined;
export const getIncludeData = async () => {
  if (out) { return out; }
  out = {};
  const files = (await aReaddir(fullPath)).filter(fName => fName.endsWith('.h'));

  for (const file of files) {
    const handler = (fileHandlers as any)[file];
    if (handler) {
      handler(out, (await aReadFile(`${fullPath}/${file}`, 'utf8')).replace(/\r/g, '').split('\n'));
    }
  }

  return out;
};