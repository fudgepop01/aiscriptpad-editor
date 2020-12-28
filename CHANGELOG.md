# Change Log

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