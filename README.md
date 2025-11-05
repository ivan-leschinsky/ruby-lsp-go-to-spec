# Ruby LSP - Go To Spec or Create

A VSCode extension that adds a command to quickly navigate to a spec file or create it if it doesn't exist.

## Features

- Navigate to the corresponding spec file from a source file
- Navigate to the source file from a spec file
- Automatically create a spec file with a basic template if it doesn't exist
- Automatically create a source file from a spec file

## Usage

1. Open a Ruby file in the editor
2. Press `Cmd+Option+.` (Mac) or `Ctrl+Alt+.` (Windows/Linux)
3. Or use the command "Ruby LSP: Go To Relevant File or Create" from the command palette

The extension will attempt to find the corresponding file through Ruby LSP. If the file is not found, it will offer to create it automatically.

## Requirements

- [Ruby LSP](https://marketplace.visualstudio.com/items?itemName=Shopify.ruby-lsp) must be installed and active

## Installation

1. Install dependencies:
```bash
npm install
```

2. Compile the extension:
```bash
npm run compile
```

3. Press F5 to run the extension in development mode

## Development

- `npm run compile` - compile the extension
- `npm run watch` - automatically recompile on changes
- F5 - launch the extension in debug mode
