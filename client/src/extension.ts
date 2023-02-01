/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
} from 'vscode-languageclient/node';

import * as vscode from 'vscode';




let client: LanguageClient;

export function activate(context: ExtensionContext) {
	
	const openWebview = vscode.commands.registerCommand('exampleApp.openWebview', () => {
		const panel = vscode.window.createWebviewPanel(
			'openWebview', 
			'Ably - Diagnostic Panel', 
			vscode.ViewColumn.One, 
			{ 
				enableScripts: true 
			}
		);
		panel.webview.html = getWebviewContent();
	});
	context.subscriptions.push(openWebview);
	
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions,
		},
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for javascript documents
		documentSelector: [{ scheme: 'file', language: 'html' },
											{scheme: 'file', language: 'javascript'}],
		synchronize: {
			// Notify the server about file changes to 'all' files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/*'),
		},
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}
function getWebviewContent() {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Ably</title>
  </head>
  <body>
	<h1> Ably </h1> 
	<h2>Diagnostic Panel</h2>
	<h4> Errors in code: </h4>

	  
  </body>
  </html>`;
  }

  

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
