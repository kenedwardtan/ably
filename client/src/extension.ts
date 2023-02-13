/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import * as vscode from 'vscode';


import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

let receivedData;


export async function activate(context: vscode.ExtensionContext) {

	const provider = new ColorsViewProvider(context.extensionUri);

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
		{ scheme: 'file', language: 'javascript' }],
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



	//console.log("------ REFRESH -----");

	client.start();
	//client.sendNotification("custom/refreshClient", {});
	let done = 1;
	client.onReady().then(() => {
		
		client.onNotification("custom/loadFiles", (files: Array<string>) => {
			//console.log("loading files " + JSON.stringify(files));
			receivedData = files[0];
			console.log(receivedData);
			if (done != 2) {
				context.subscriptions.push(
					vscode.window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider));
			}


			done = 2;
			//fix this?
			provider.callView();


		});

	});



}
let dataLength = 0;
const tryArray=[];


class ColorsViewProvider implements vscode.WebviewViewProvider {


	public static readonly viewType = 'calicoColors.colorsView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken,
	) {
		this._view = webviewView;
		

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};



		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);


		//console.log(webviewView);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'colorSelected':
					{
						vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
						break;
					}
			}
		});
	}

	public callView() {
		this.updateView(this._view);
	}

	public updateView(webviewView: vscode.WebviewView) {
		//console.log("here");
		this._view = webviewView;
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {

		let messageArray =[]; 
		messageArray = receivedData.map(item => item.relatedInformation[0].message);
		let errorArray=[];
		errorArray = receivedData.map(item => item.message);
		let lineArray = [];

		lineArray = receivedData.map(item => item.range.start.line);

		let wcagArray=[];
		wcagArray = (receivedData.map(item => item.source));

		let extractedValues =[];
		extractedValues = wcagArray.map(item => {
			const [, value] = item.split(" | ");
			return value;
		});
		// console.log(extractedValues);

		let finalArray=[];
		finalArray = receivedData.map((item, index) => {
			return `Line ${lineArray[index]}:  ${messageArray[index]}`;
		});

		finalArray.sort((a, b) => {
			const lineA = a.match(/Line (\d+)/)[1];
			const lineB = b.match(/Line (\d+)/)[1];
			return lineA - lineB;
		});

		
		
		let stringArray="";
		stringArray = finalArray.join(' + ');
		let guidelinesString = "";
		guidelinesString = extractedValues.join(' + ');

		console.log(stringArray);	
		dataLength = receivedData.length;

		return `<!DOCTYPE html>
		<html>
		<head>
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<style>
		.transition, ul li i:before, ul li i:after, p {
			transition: all 0.25s ease-in-out;
		  }
		  
		  .flipIn, ul li, h1 {
			animation: flipdown 0.5s ease both;
		  }
		  
		  .no-select, h2 {
			-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
			-webkit-touch-callout: none;
			-webkit-user-select: none;
			-khtml-user-select: none;
			-moz-user-select: none;
			-ms-user-select: none;
			user-select: none;
		  }
		  
		  html {
			width: 100%;
			height: 100%;
			perspective: 900;
			overflow-y: scroll;
			background-color: #252526;
			
		  
		  }
		  
		  body {
			min-height: 0;
			display: inline-block;
			position: relative;
			left: 50%;
			margin: 90px 0;
			transform: translate(-50%, 0);
			background-color: #252526;
		
			
		  }
		  
		  
		  @media (max-width: 550px) {
			body {
			  box-sizing: border-box;
			  transform: translate(0, 0);
			  max-width: 100%;
			  min-height: 100%;
			  margin: 0;
			  left: 0;
			  font-family: 'Open Sans';
			}
		  }
		  
		  h1, h2 {
			color: white;
			
		  }
		  
		  h1 {
			text-transform: uppercase;
			font-size: 24px;
			font-weight: 700;
		  }
		  
		  h2 {
			font-size: 18px;
			font-weight: 300;
			letter-spacing: 1px;
			display: block;
			background-color: #252526;
			margin: 0;
			cursor: pointer;
		  }
		  
		  p {
			color: white;
			font-size: 12px;
			line-height: auto;
			position: relative;
			overflow: hidden;
			max-height: 800px;
			opacity: 1;
			transform: translate(0, 0);
			margin-top: 14px;
			z-index: 2;
		  }
		  
		  ul {
			list-style: none;
			perspective: 900;
			padding: 0;
			margin: 0;
			font-family: 'Open Sans';
		  }
		  ul li {
			position: relative;
			padding: 0;
			margin: 0;
			padding-bottom: 4px;
			padding-top: 8px;
			font-family: 'Open Sans';
		  }
		  
		  ul li:last-of-type {
			padding-bottom: 0;
		  }
		  ul li i {
			position: absolute;
			transform: translate(-6px, 0);
			margin-top: 16px;
			right: 0;
		  }
		  ul li i:before, ul li i:after {
			content: "";
			position: absolute;
			background-color: white;
			width: 3px;
			height: 9px;
		  }
		  ul li i:before {
			transform: translate(-2px, 0) rotate(45deg);
		  }
		  ul li i:after {
			transform: translate(2px, 0) rotate(-45deg);
		  }
		  ul li input[type=checkbox] {
			position: absolute;
			cursor: pointer;
			width: 100%;
			height: 100%;
			z-index: 1;
			opacity: 0;
		  }
		  ul li input[type=checkbox]:checked ~ p {
			margin-top: 0;
			max-height: 0;
			opacity: 0;
			transform: translate(0, 50%);
		  }
		  ul li input[type=checkbox]:checked ~ i:before {
			transform: translate(2px, 0) rotate(45deg);
		  }
		  ul li input[type=checkbox]:checked ~ i:after {
			transform: translate(-2px, 0) rotate(-45deg);
		  }
		  
		  @keyframes flipdown {
			0% {
			  opacity: 0;
			  transform-origin: top center;
			  transform: rotateX(-90deg);
			}
			5% {
			  opacity: 1;
			}
			80% {
			  transform: rotateX(8deg);
			}
			83% {
			  transform: rotateX(6deg);
			}
			92% {
			  transform: rotateX(-3deg);
			}
			100% {
			  transform-origin: top center;
			  transform: rotateX(0deg);
			}
		  }
		</style>
		</head>
		<body>
		
				<h1>Ably: Accessibility Insights</h1>
				<h2>All Suggestions: <span id="dataContainer"></span> </h2>
			
			
			<p id="demo"></p>

			</div>
			


			<script>
			let dataLength1 = ${dataLength};
			console.log("hello");
  			document.getElementById("dataContainer").innerHTML = dataLength1;
			
			var newArray = [];
			
			let guideString ='${guidelinesString}';
			const guideArray =  guideString.split(' + ');

			let newString = '${stringArray}'; 
			const backToArray = newString.split(' + ');
			console.log(backToArray)

				let text = "";
				let fruits =[] ;
				fruits = backToArray;
				fruits.forEach(myFunction);

				document.getElementById("demo").innerHTML = text;

				
				function myFunction(item, index) {
				console.log(guideArray[index]);
				text +=  item + " <a href='https://www.boia.org/wcag2/cp/"+guideArray[index]+"'>Learn More</a> <br><br>"; 
				}

			</script>

		
		</body>
		</html>
		
		`;
	}
}




export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
