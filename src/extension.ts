// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { sort } from "json-keys-sort";
import get from 'lodash.get';
import set from "lodash.set";
import { TextEncoder } from 'util';
import { commands, ExtensionContext, Uri, window, workspace } from 'vscode';

// lodash set function
interface Config {
	resourcesPath: string;
	multipleResourceFiles: boolean;
	defaultResourceName: string;
	snippet: string;
}

  
const SNIPPET = `t("$1")`;

const saveResource = (resourcePath: string, updatedResource: Record<string, unknown>) => 
	workspace.fs.writeFile(Uri.parse(resourcePath), new TextEncoder().encode(JSON.stringify(sort(updatedResource), null, 2)));

// TODO: check and interactively update configuration
	
export function activate(context: ExtensionContext) {
	let disposable = commands.registerCommand('i18n-helper.addTranslation', async () => {
		const workspacePath = workspace.workspaceFolders?.[0].uri.path;
		const config = workspace.getConfiguration('i18n-helper');
		const resourcesPath = config.get<string>('resourcesPath');
	
		if (!resourcesPath) {
			window.showErrorMessage('Please set the resources path in the settings');
			return;
		} 

		window.showInformationMessage('Hello World from i18n Helper!');

		const editor = window.activeTextEditor;
		const selectedText = editor?.document.getText(editor.selection);

		if (!selectedText) {
			window.showErrorMessage('No text selected');
			return;
		}

		const defaultPath = selectedText?.split(' ').join('_').toLowerCase().replace(/"/g, '');

		const translationPath = await window.showInputBox({
			placeHolder: defaultPath,
			prompt: "Enter the translation key or path",
			value: defaultPath
		  });

		  if (!translationPath) {
			window.showErrorMessage('Translation key is required');
			return;
		  }

		  // TODO: do not suggest default path if thetext is too long
		  const resourceName = await window.showInputBox({
			placeHolder: 'translation',
			prompt: "Enter the resource name",
			value: 'translation'
		  });

		  if (!resourceName) {
			window.showErrorMessage('A resource name is required');
			return;
		  }

		  // TODO: check if the text is already translated

		  // TODO: read settings

		  const resourcePath = `${workspacePath}/${resourcesPath}/${resourceName}.json`;

		try {
			const doc = await workspace.openTextDocument(Uri.parse(resourcePath));
			const resourceContent = JSON.parse(doc.getText());
			console.log(resourceContent);

			if (get(resourceContent, translationPath)) {
				window.showErrorMessage('The translation key already exists');
				window.showTextDocument(doc);
				return;
			} else {
				await saveResource(resourcePath, set(resourceContent, translationPath, selectedText)); 
			}
		} catch (error) {
			await saveResource(resourcePath, set({}, translationPath, selectedText)); 
		}

		const wrappedSnippet = `{${SNIPPET}}`;

		editor?.edit(editBuilder => {
			editBuilder.replace(editor.selection, (/^".+"$/.test(selectedText) ? SNIPPET : wrappedSnippet).replace('$1', translationPath));
		});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
