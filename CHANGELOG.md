# Change Log

## 1.1.2

- fixed snippets not going through if there is a number in them
  - this would explain a lot of my own pain and suffering with AI mods lmao

## 1.1.0

- added `calc()` preprocessor instruction enabling for calculations to be made
  - this can also contain numeric global values, allowing for things like one global value to be offset by another

## 1.0.0

### BREAKING CHANGES

- updated the `AIScriptCLA` build to correctly handle exporting and compiling of etc files with more than one AI such as Popo (nana) and Wario (warioman).
  - This means that you'll want to put the ai scripts (`----.AS`) in a folder titled `ai_[character name here]`
  - for instance, for captain falcon, you would put your files in a folder titled `ai_captain`

this also means that the size of the executable bundled with this extension has increased - now you only need the dotnetcore3.1 runtime which can be downloaded [here](https://dotnet.microsoft.com/download/dotnet-core/3.1).

### New Additions

- Batch export/compile commands accessible via the command palette. 
  - For export you select the folders with a `.pac` file that you wish to extract the AI files from
  - For compile you choose the folders with `ai_[character name]` folders alongside the `.pac` file for that character, *then* (optionally) choose a folder for the output of the files to go

## 0.6.3

- added a way to display output from console.log statements within scripts

## 0.6.2

- updated error handling to include support for script errors

## 0.6.1

- with the creation of scripts, constants may now have more utility. Therefor, I have removed the limitation specifying that they must be numeric.
  - This means a const can now have whatever text you want after the `=` sign. Have fun!

## 0.6.0

- added the ability to create custom javascript preprocessor scripts that can be executed with javascript
  - these have access to all global constants, allowing things to be precalculated
  - these functions should take inputs and have access to all global constants with a variable named `$globals`.
    - ex. if there is a constant named "foo" with a value of 8, you can access it with `$globals.foo` and get `8`.

## 0.5.2

- allowed for snippets within snippets
- fixed the "go to definition" feature with the `Seek` and `Goto` commands 

## 0.5.1

- added support for default snippets

## 0.5.0

- added support for shared/templated files
- fixed bug where arguments passed through macros wouldn't be processed properly, causing ambiguous errors

## 0.4.0

- added support for templated macros

## 0.3.0

- added macro support

## 0.2.3

- added confirmation message when stuff compiles / exports successfully
- made the comment shortcut use // instead of # like I should've done from the beginning

## 0.2.0 / 0.2.1

- added ability to compile and export the scripts! **(WINDOWS ONLY)**
  - can right click on a folder or pac file and choose the command too
    - export data from pac file
    - compile AI to pac file

## 0.1.0

- reading configuration from a given `include` folder
  - this can be configured in settings
  - defaults to `[current workspace root]/Include` as `./Include`
- autocompletion with argument support and documentation
- hover documentation
- jump to referenced label
  - done by ctrl+clicking on `Seek` or `Jump` instructions
- syntax highlighting