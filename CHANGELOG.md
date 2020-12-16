# Change Log

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