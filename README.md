# aiscriptpad-editor README

This is an extension developed to assist in the editing of files generated by
[AIScriptPad](https://www.dropbox.com/s/pclv5x1vmk8o6fh/AIScriptPad2.0PM.zip?dl=0),
a separate program created/modified by `Mr. AI | Sluigi123`, and `Bero`.

**The Supported File Types Include:**
- `.as`
- `.aipd`
- `.atkd`

This extension adds the following features to vscode when editing those files:

- reading configuration from a given `include` folder
  - this can be configured in settings
  - defaults to `[current workspace root]/Include` as `./Include`
- autocompletion with argument support and documentation
- hover documentation
- jump to referenced label
  - done by ctrl+clicking on `Seek` or `Jump` instructions
- syntax highlighting

## As of [0.2.0], this Extenison ALSO adds...

the ability to compile and export the scripts! **(WINDOWS ONLY)**

Open the command panel with `Ctrl+Shift+P` and choose "export data from pac file"
to extract the AI files from a pac file, and choose "compile AI to pac file"
to compile the AI files back into the pac file.

alternatively, you can right click on a folder or pac file and choose the command from
the bottom of that menu!

## [0.3.0] - Macros, Globals, and Named Variables/Constants!

So yeah I added a preprocessor. It's important to note that a `__preprocessed` folder will
now be created whenever scripts are compiled. This is to assist with debugging.

### Named Variables/Constants

Lets start with named variables / constants:

to assign a name to a variable, you can use the following format:

`#let varName = var4`

this allows you to use `varName` at a *later point in the code* and have it automatically
replaced by the variable you assigned it to when it comes time to compile. This makes things
significantly more readable.

so, after defining `varName` like that, any `varName` will be replaced with `var4`.

Constants are similar, except they get replaced by a value instead of a numbered variable

`#const my_constant = 69`

this will replace all instances of `my_constant` with `69` whenver it's used later on in the code.

You can also redeclare these with the same format if you really want to, but it's not recommended.

### Globals

Globals are just global named constants and variable names that you can define if you so desire.

Just make a `globals.as` file and put all your `#let` and `#define` statements in there. Then you
can use them in the other `.as` files without needing to redeclare them.

### Macros

Macros are just reusable pieces of code. They are **all defined in one** `macros.as`
**file** that's placed in the same place as all the other files. They start with `#macro macro_name`
and end with `#endmacro`

Here's one example that also uses named variables:

```
/*
  calculates the distance from the target position

  expects the following:
    var9 = targetXOffset
    var10 = targetYOffset
    var11 = targetXRange
    var12 = targetYRange
  modifies the following:
    var13, var14
  defines the following:
    targetXDistance (var13)
    targetYDistance (var14)
*/
#macro CALC_TARGET_DISTANCES
  #let targetXOffset = var9
  #let targetYOffset = var10
  #let targetXRange = var11
  #let targetYRange = var12
  DrawDebugPoint TopNX TopNY 255 0 0 255

  #let targetX = var13
  #let targetY = var14
  targetX = OTopNX + (targetXOffset * Direction * -1)
  targetY = OTopNY + targetYOffset
  // account for target's & own velocity
  targetX = targetX + (OXSpeed * 10) - (XSpeed * 7)
  targetY = targetY + (OYSpeed * 4) - (YSpeed * 4)
  DrawDebugRectOutline targetX targetY targetXRange targetYRange 0 255 0 255

  #let targetXDistance = var13
  #let targetYDistance = var14
  targetXDistance = targetX - TopNX
  targetYDistance = targetY - TopNY
#endmacro
```

In other files, whenever a line consisting exclusively of `CALC_TARGET_DISTANCES` is encountered,
it will be replaced by the contents of that macro. This will *also* declare/redeclare any
variable names and constants that were used inside that macro, so after using the macro in
another file, you can also use `targetXDistance` and `targetYDistance` (and the others, but
those `targetXDistance` and `targetYDistance` are the important ones)


