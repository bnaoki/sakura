# SakuraJS
SakuraJS is a build tool that makes it easier to write modular code that will run both on the server-side (i.e. node.js) and the client-side.
**NOTE: this README is a WIP, more comprehensive documentation to come**

## Usage
```bash
npm install -g sakura
sakura -f ./sakura.json
```

### Options
-w, --watch
Watch will hang the process and rerun whenever there are changes in configured watchDir

-f, --file <file>
Path to sakura config file to run. If unspecified, defauls to CWD/sakura.json

--single-run <bud-index>
Bud index position in config. When set, sakura runs for the single corresponding bud at the 
specified index and skips all other buds.

--spin
Spins the process so that it doesn't exit. Applicable for --single-run only.

## Config file
Specify the config file using the -f option. If unspecified, sakura will look for a file named sakura.json in the current working directory.
```bash
sakura -f ./my-sakura-config-file.json
```
A sakura config file is a JSON file with a list of entries of "buds"
**Sample sakura.json config file:**
```json
{
  "buds": [
    {
      "_type": "static",
      "watchDir": "deps",
      "files": [
        "deps/dep-file1.js",
        "deps/dep-file2.js",
        "deps/dep-file3.js"
      ],
      "destFile": "build/app-deps.js",
      "minDestFile": "build/app-deps.min.js"
    },
    {
      "_type": "dynamic",
      "watchDir": "src",
      "inputs": [
        "src/app-main.js"
      ],
      "ignores": [
        "regex:/node_modules/"
      ],
      "shim": {
        "underscore": "_",
        "backbone": "Backbone",
        "handlebars": "Handlebars"
      },
      "destFile": "build/app.js",
      "minDestFile": "build/app.min.js"
    },
    {
      "_type": "handlebars",
      "watchDir": "templates",
      "files": [
        "templates/app-template1.handlebars",
        "templates/app-template2.handlebars",
        "templates/app-template3.handlebars"
      ],
      "destFile": "build/app-templates.js",
      "minDestFile": "build/app-templates.min.js"
    }
  ]
}
```

### Bud types
#### dynamic
Given a list of input files, expands all direct + transitive dependencies and outputs all files in order such that, for any given module, no module will appear before any of its dependents.

#### static
A simple bud that concatenates configured list of files.

#### handlebars
Runs the handlebars precompiler (http://handlebarsjs.com/precompilation.html) for the configured set of files.
