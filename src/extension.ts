import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  console.log('Ruby LSP Go To Spec extension is now active');

  const disposable = vscode.commands.registerCommand(
    'rubyLsp.goToRelevantFileOrCreate',
    async () => {
      const activeEditor = vscode.window.activeTextEditor;

      if (!activeEditor) {
        vscode.window.showInformationMessage('No active editor');
        return;
      }

      const uri = activeEditor.document.uri;
      const currentFilePath = uri.fsPath;

      // Get Ruby LSP client from the main extension
      const rubyLspExtension = vscode.extensions.getExtension('Shopify.ruby-lsp');

      if (!rubyLspExtension) {
        vscode.window.showErrorMessage('Ruby LSP extension not found');
        return;
      }

      // Activate the extension if it's not already active
      if (!rubyLspExtension.isActive) {
        await rubyLspExtension.activate();
      }

      // Try to get LSP client through goToRelevantFile command
      try {
        // Try to use the existing command to get relevant files
        const result = await vscode.commands.executeCommand<string[] | undefined>(
          'rubyLsp.goToRelevantFile'
        );

        if (result && result.length > 0) {
          // Files found, open them
          await openFiles(result);
          return;
        }
      } catch (error) {
        console.log('Failed to get relevant files through command:', error);
      }

      // If relevant files not found, create spec file
      await createSpecFile(currentFilePath);
    }
  );

  context.subscriptions.push(disposable);
}

async function openFiles(locations: string[]) {
  for (const location of locations) {
    const uri = vscode.Uri.parse(location);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, {
      preview: false,
      preserveFocus: locations.length > 1,
    });
  }
}

async function createSpecFile(currentFilePath: string) {
  const fileName = path.basename(currentFilePath);
  const dirName = path.dirname(currentFilePath);
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    vscode.window.showErrorMessage('Workspace not found');
    return;
  }

  // Determine if the current file is a spec file
  const isSpecFile = currentFilePath.includes('/spec/') || fileName.endsWith('_spec.rb');

  let targetPath: string;
  let targetContent: string;

  if (isSpecFile) {
    // If we're in a spec file, create the corresponding source file
    targetPath = getSourcePathFromSpec(currentFilePath, workspaceFolder.uri.fsPath);
    targetContent = generateSourceFileContent(fileName);
  } else {
    // If we're in a source file, create a spec file
    targetPath = getSpecPathFromSource(currentFilePath, workspaceFolder.uri.fsPath);
    targetContent = generateSpecFileContent(currentFilePath, fileName);
  }

  // Check if the file exists
  if (fs.existsSync(targetPath)) {
    // File exists, just open it
    const uri = vscode.Uri.file(targetPath);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    return;
  }

  // Ask the user if they want to create the file
  const answer = await vscode.window.showInformationMessage(
    `File ${path.basename(targetPath)} doesn't exist. Create it?`,
    'Yes',
    'No'
  );

  if (answer !== 'Yes') {
    return;
  }

  // Create the directory if it doesn't exist
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Create the file
  fs.writeFileSync(targetPath, targetContent);

  // Open the created file
  const uri = vscode.Uri.file(targetPath);
  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document);

  vscode.window.showInformationMessage(`File ${path.basename(targetPath)} created`);
}

function getSpecPathFromSource(sourcePath: string, workspaceRoot: string): string {
  // Convert source file path to spec file path
  const relativePath = path.relative(workspaceRoot, sourcePath);

  // Remove app/ lib/ or other prefixes
  let specRelativePath = relativePath;

  if (relativePath.startsWith('app/')) {
    specRelativePath = relativePath.substring(4);
  } else if (relativePath.startsWith('lib/')) {
    specRelativePath = relativePath.substring(4);
  }

  // Add _spec before .rb
  const specFileName = path.basename(specRelativePath, '.rb') + '_spec.rb';
  const specDirName = path.dirname(specRelativePath);

  return path.join(workspaceRoot, 'spec', specDirName, specFileName);
}

function getSourcePathFromSpec(specPath: string, workspaceRoot: string): string {
  // Convert spec file path to source file path
  const relativePath = path.relative(workspaceRoot, specPath);

  // Remove spec/ prefix
  let sourceRelativePath = relativePath;

  if (relativePath.startsWith('spec/')) {
    sourceRelativePath = relativePath.substring(5);
  }

  // Remove _spec from filename
  const sourceFileName = path.basename(sourceRelativePath).replace('_spec.rb', '.rb');
  const sourceDirName = path.dirname(sourceRelativePath);

  // Try to find in app/ or lib/
  const appPath = path.join(workspaceRoot, 'app', sourceDirName, sourceFileName);
  if (fs.existsSync(appPath)) {
    return appPath;
  }

  const libPath = path.join(workspaceRoot, 'lib', sourceDirName, sourceFileName);
  if (fs.existsSync(libPath)) {
    return libPath;
  }

  // Default to app/ path
  return appPath;
}

function generateSpecFileContent(sourcePath: string, fileName: string): string {
  // Extract class name from filename
  const className = fileName
    .replace('.rb', '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // Read the source file to try to find the actual class/module name
  let actualClassName = className;
  try {
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const classMatch = content.match(/class\s+(\w+)/);
    const moduleMatch = content.match(/module\s+(\w+)/);

    if (classMatch) {
      actualClassName = classMatch[1];
    } else if (moduleMatch) {
      actualClassName = moduleMatch[1];
    }
  } catch (error) {
    // If we can't read the file, use the default name
  }

  return `# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ${actualClassName} do
  describe "#method_name" do
    it "does something" do
      # Arrange

      # Act

      # Assert
      expect(true).to be true
    end
  end
end
`;
}

function generateSourceFileContent(fileName: string): string {
  const className = fileName
    .replace('_spec.rb', '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return `# frozen_string_literal: true

class ${className}
  def initialize
    # initialization code
  end
end
`;
}

export function deactivate() {}
