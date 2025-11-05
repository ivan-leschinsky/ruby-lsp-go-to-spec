# Change Log

All notable changes to the "ruby-lsp-go-to-spec" extension will be documented in this file.

## [0.1.0] - 2025-11-05

### Added
- Initial release
- Command to navigate to spec file or create it if it doesn't exist
- Keyboard shortcut: `Cmd+Option+.` (Mac) or `Ctrl+Alt+.` (Windows/Linux)
- Automatic spec file generation with RSpec template
- Support for bidirectional navigation (source ↔ spec)
- Integration with Ruby LSP for finding relevant files
- Automatic directory creation for new spec files
- Smart class/module name detection from source files

### Features
- Works with Rails projects (app/ and spec/ directories)
- Works with Ruby gems (lib/ and spec/ directories)
- Generates proper RSpec describe blocks
- Prompts user before creating new files
