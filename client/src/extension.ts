/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import * as vscode from 'vscode';
import * as fs from 'fs';

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
const tryArray = [];


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



        let messageArray = [];
        messageArray = receivedData.map(item => item.relatedInformation[0].message);
        let errorArray = [];
        errorArray = receivedData.map(item => item.message);
        let lineArray = [];

        lineArray = receivedData.map(item => item.range.start.line + 1);

        let wcagArray = [];
        wcagArray = (receivedData.map(item => item.source));

        let extractedValues = [];
        extractedValues = wcagArray.map(item => {
            const [, value] = item.split(" | ");
            return value;
        });
        // console.log(extractedValues);

        let finalArray = [];
        finalArray = receivedData.map((item, index) => {
            return `Line ${lineArray[index]}:  ${messageArray[index]}`;
        });

        /**finalArray.sort((a, b) => {
            const lineA = a.match(/Line (\d+)/)[1];
            const lineB = b.match(/Line (\d+)/)[1];
            return lineA - lineB;
        });**/

        let stringArray = "";
        stringArray = finalArray.join(' + ');
        let guidelinesString = "";
        guidelinesString = extractedValues.join(' + ');

        console.log(stringArray);
        dataLength = receivedData.length;

        return `
		<!DOCTYPE html>
<html>

<head>
    <link href='https://fonts.googleapis.com/css?family=DM Sans' rel='stylesheet'>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: 'DM Sans';
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 10px;
			margin-bottom:18px;
            position: relative;
            background: #1E1E1E;
        }

        .content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0px;
            gap: 14px;
            max-width: 300px;


        }

        .title-sec {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;


        }

        .logo {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            padding: 0px;
            gap: 6px;


        }

        .logosvg {

            width: 20.32px;
            height: 20.32px;
        }

        .title-name {
            font-family: 'DM Sans';
            font-style: normal;
            font-weight: 700;
            font-size: 14.9032px;


            color: #FFFFFF;
        }

        .suggestSection {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0px;
            gap: 18px;
            width: 246px;

        }

        .allSuggest {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;

            gap: 8px;
            border: 0.5px solid #FFFFFF;
            border-radius: 2px;
            width: 246px;
            height: 40px;

        }

        .suggestTitle {
            font-family: 'DM Sans';
            font-style: normal;
            font-weight: 700;
            font-size: 16px;
            line-height: 18px;
            padding-left: 8px;
            color: #FFFFFF;

        }

        h1 {
            font-family: 'DM Sans';
            font-style: normal;
            font-weight: 500;
            font-size: 18px;

            color: #FFFFFF;

        }

        .suggestNum {
            display: flex;
			justify-content:center;
            flex-direction: row;
            align-items: flex-center;
            width: 40px;
            height: 40px;

            background: #FFD74A;
        }

        .noSuggest {

            font-family: 'DM Sans';
            font-style: normal;
            font-weight: 800;
            font-size: 18px;
            line-height: 13px;
            /* identical to box height */

            display: flex;
            align-items: center;

            color: #000000;
        }

        .categoryDiv {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0px;
            gap: 12px;

        }


        .checkWrap {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 0px;

            width: 244px;
            height: 16px;

        }

        a:link{
            color:coral;
        }
        a:visited{
            color: rgb(53, 211, 255);
        }

        .titleWrap {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            padding: 0px;
            gap: 12px;

            width: fit-content;
            height: 16px;
        }

        .titleCheck {
            font-family: 'DM Sans';
            font-style: normal;
            font-weight: 700;
            font-size: 16px;
            /* identical to box height */


            color: #FFFFFF;
        }

        .alertCheck {


            font-family: 'DM Sans';
            font-style: normal;
            font-weight: 400;
            font-size: 12px;
            line-height: 10px;
            display: flex;
            align-items: center;
            width: 50px;
            color: #FFFEF9;
        }

        .chevronDown {
            width: 10px;
            height: 10px;


        }

        .checkWrap :hover {}

        .suggestListDiv {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0px;
            border-left: 2px solid white;
            
            gap: 14px;
        }


        .suggestList {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0px;
            gap: 8px;
            margin-left:8px;

        }

        .list {

            font-family: 'DM Sans';
            font-style: normal;
            font-weight: 400;
            font-size: 12px;
            margin-left:8px;


            color: #FFFFFF;
        }
    </style>

</head>

<body>
    <div class="content">
        <div class="title-sec">
            <div class="logo">
                <svg class="logosvg" width="21" height="21" viewBox="0 0 21 21" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10.4516" cy="10.1613" r="10.1613" fill="#0AA1D1" />
                    <path
                        d="M10.4515 6.43547C10.8557 6.43547 11.2434 6.27489 11.5293 5.98905C11.8151 5.7032 11.9757 5.31552 11.9757 4.91128C11.9757 4.50704 11.8151 4.11935 11.5293 3.83351C11.2434 3.54767 10.8557 3.38708 10.4515 3.38708C10.0472 3.38708 9.65956 3.54767 9.37372 3.83351C9.08788 4.11935 8.92729 4.50704 8.92729 4.91128C8.92729 5.31552 9.08788 5.7032 9.37372 5.98905C9.65956 6.27489 10.0472 6.43547 10.4515 6.43547ZM6.48858 4.8625C6.11594 4.70472 5.69606 4.70046 5.32029 4.85067C4.94452 5.00087 4.64327 5.29339 4.48207 5.66457C4.40234 5.84842 4.35983 6.04624 4.35697 6.24661C4.35411 6.44698 4.39096 6.64593 4.46541 6.83198C4.53985 7.01803 4.65041 7.18749 4.7907 7.33058C4.93099 7.47367 5.09824 7.58756 5.28278 7.66567L7.33062 8.53547C7.45306 8.58733 7.55753 8.67408 7.63101 8.7849C7.70449 8.89573 7.74373 9.02573 7.74384 9.1587V11.2181L6.47029 14.9147C6.40513 15.104 6.37788 15.3042 6.39011 15.504C6.40233 15.7038 6.45379 15.8993 6.54154 16.0792C6.62929 16.2591 6.75162 16.4199 6.90154 16.5526C7.05146 16.6852 7.22603 16.787 7.41529 16.8522C7.60456 16.9173 7.8048 16.9446 8.00459 16.9323C8.20438 16.9201 8.39981 16.8687 8.57972 16.7809C8.94306 16.6037 9.22111 16.2894 9.35271 15.9071L10.2916 13.1812C10.3032 13.1481 10.3248 13.1193 10.3535 13.099C10.3821 13.0787 10.4164 13.0677 10.4515 13.0677C10.4866 13.0677 10.5209 13.0787 10.5495 13.099C10.5782 13.1193 10.5998 13.1481 10.6114 13.1812L11.5503 15.9071C11.6819 16.2894 11.9599 16.6037 12.3233 16.7809C12.6866 16.9581 13.1054 16.9838 13.4877 16.8522C13.8699 16.7205 14.1842 16.4425 14.3614 16.0792C14.5387 15.7158 14.5643 15.297 14.4327 14.9147L13.1625 11.2181V9.15734C13.1626 9.02437 13.2019 8.89437 13.2753 8.78355C13.3488 8.67272 13.4533 8.58598 13.5757 8.53412L15.6202 7.66567C15.8047 7.58749 15.9719 7.47356 16.1121 7.33044C16.2523 7.18732 16.3628 7.01785 16.4372 6.83181C16.5115 6.64577 16.5483 6.44684 16.5454 6.2465C16.5425 6.04616 16.5 5.84838 16.4202 5.66457C16.259 5.29355 15.9579 5.00117 15.5823 4.85098C15.2067 4.70078 14.787 4.70493 14.4144 4.8625L13.3265 5.3245C13.0961 5.42205 12.9349 5.61105 12.8556 5.81902C12.6711 6.30737 12.3422 6.72793 11.9127 7.02474C11.4832 7.32156 10.9735 7.48054 10.4515 7.48054C9.92943 7.48054 9.41974 7.32156 8.99027 7.02474C8.56079 6.72793 8.23189 6.30737 8.04733 5.81902C8.0063 5.70908 7.94343 5.60858 7.86252 5.52359C7.7816 5.4386 7.68431 5.37088 7.57652 5.3245L6.48858 4.8625Z"
                        fill="white" />
                </svg>
                <p class="title-name"> Ab.ly </p>


            </div>

            <h1> Accessibility Insights </h1>
        </div>
        <div class="suggestSection">
            <div class="allSuggest">
                <span class="suggestTitle"> All Suggestions </span>
                <div class="suggestNum"><span id="dataContainer" class="noSuggest"></span></div>
            </div>
            <div   class="categoryDiv">
                <div class="checkWrap">
                    <div class="titleWrap">
                        <span class="titleCheck"> Perceivable
                        </span>
                        <span id ="pAlert" class="alertCheck">2 alerts
                        </span>
                    </div>
                    <svg  onclick="pClick()" id="pchevDown" class="chevronDown" width="10" height="7" viewBox="0 0 10 7" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path id="chevpath" d="M9 1.32257L5 5.32257L1 1.32257" stroke="white" stroke-width="1.5"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>



                </div>
                <div id="perceive" class="suggestListDiv">
                    <div class="suggestList">
                        <span class="list"> Hello</span>
                    </div>
                </div>
            </div>


            <div class="categoryDiv">
                <div class="checkWrap">
                    <div class="titleWrap">
                        <span class="titleCheck"> Operable
                        </span>
                        <span  id ="oAlert" class="alertCheck">2 alerts
                        </span>
                    </div>
                    <svg  onclick="oClick()" id="ochevDown" class="chevronDown" width="10" height="7" viewBox="0 0 10 7" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path id="chevpath" d="M9 1.32257L5 5.32257L1 1.32257" stroke="white" stroke-width="1.5"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>



                </div>
                <div id="operable" class="suggestListDiv">
                    <div class="suggestList">
                        <span class="list"> Hello</span>
                    </div>
                </div>
            </div>

            <div class="categoryDiv">
                <div class="checkWrap">
                    <div class="titleWrap">
                        <span class="titleCheck"> Understandable
                        </span>
                        <span id ="uAlert" class="alertCheck">2 alerts
                        </span>
                    </div>
                    <svg  onclick="pClick()" id="uchevDown"  class="chevronDown" width="10" height="7" viewBox="0 0 10 7" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path id="chevpath" d="M9 1.32257L5 5.32257L1 1.32257" stroke="white" stroke-width="1.5"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>



                </div>
                <div id="understand" class="suggestListDiv">
                    <div class="suggestList">
                        <span class="list"> Hello</span>
                    </div>
                </div>
            </div>

            <div  class="categoryDiv">
                <div class="checkWrap">
                    <div class="titleWrap">
                        <span class="titleCheck"> Robust
                        </span>
                        <span id ="rAlert" class="alertCheck">2 alerts
                        </span>
                    </div>
                    <svg   onclick="rClick()" id="rchevDown"  class="chevronDown" width="10" height="7" viewBox="0 0 10 7" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path id="chevpath" d="M9 1.32257L5 5.32257L1 1.32257" stroke="white" stroke-width="1.5"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>



                </div>
                <div id="robust" class="suggestListDiv">
                    <div class="suggestList">
                        <span class="list"> Hello</span>
                    </div>
                </div>
            </div>


        </div>

        <!-- <h1>Ably: Accessibility Insights</h1>
        <h2>All Suggestions: <span id="dataContainer"></span> </h2>


        <p id="demo"></p> -->

    </div>


    </div>



    <script>
        let dataLength1 = ${dataLength};

       
        console.log("hello");
        document.getElementById("dataContainer").innerHTML = dataLength1;

        var newArray = [];

        let guideString ='${guidelinesString}';
        const guideArray = guideString.split(' + ');

        let newString = '${stringArray}'; 
		const backToArray = newString.split(' + ');
        console.log(backToArray)

        let onetext = "";
        let twotext = "";
        let threetext = "";
        let text = "";
        let numErrors = ""; 
        let errors = [];
        let num="";
        let num2="";

        let num3="";

        let num4="";

        errors = backToArray;
        let x = 0;
        let x2 = 0;
        let x3 = 0;
        let x4 = 0;

        errors.forEach(addError);

        document.getElementById("perceive").innerHTML = onetext;
        document.getElementById("operable").innerHTML = twotext;
        document.getElementById("understand").innerHTML = threetext;
        document.getElementById("robust").innerHTML = text;
        document.getElementById("pAlert").innerHTML =  num;
        document.getElementById("rAlert").innerHTML =  num2;
        document.getElementById("oAlert").innerHTML =  num3;
        document.getElementById("uAlert").innerHTML = num4;

        function getLink(guidelineArray) {
            if (guidelineArray === "1.1.1") {
              return "https://www.notion.so/ably-extension/1-1-1-Non-text-Content-cad5db53595e4d29a25a63c98bbc55ee?pvs=4";
            } else if (guidelineArray === "1.3.1") {
              return "https://www.notion.so/ably-extension/1-3-1-Info-and-Relationships-e0872a3c4b4a400291bcc43cbf36c4b9?pvs=4";
            } else if (guidelineArray === "1.3.4") {
              return "https://www.notion.so/ably-extension/1-3-4-Orientation-1f263a2d4e4540629c5ab9b39bd8fcb8?pvs=4";
            }
             else if (guidelineArray === "1.3.5") {
              return "https://www.notion.so/ably-extension/1-3-5-Identify-Input-Purpose-ae4dde5698c24a75a9be370b7ce493dd?pvs=4";
                        }
            else if (guidelineArray === "1.4.4") {
                return "https://www.notion.so/ably-extension/1-4-4-Resize-Text-574323ba7a6d49e4bfb795c6e579d889?pvs=4"; 
            }

            else if (guidelineArray === "2.1.1") {
                return "https://www.notion.so/ably-extension/2-1-1-Keyboard-cb22702c2bd14624976cc86f45dbcdbe?pvs=4"; 
            }
            else if (guidelineArray === "2.4.2") {
                return "https://www.notion.so/ably-extension/2-4-2-Page-Titled-f5baad753ad94708acbdd9c71e797860?pvs=4"; 
            }
           
            else if (guidelineArray === "2.4.4") {
                return "https://www.notion.so/ably-extension/2-4-4-Link-Purpose-In-Context-a90dbb2d54434f22a2703aabd066d330?pvs=4"; 
            }
           
            else if (guidelineArray === "2.4.6") {
                return "https://www.notion.so/ably-extension/2-4-6-Headings-and-Labels-bd2bc9f9a93a4921bb59865a01f97e67?pvs=4"; 
            }
            else if (guidelineArray === "2.4.10") {
                return "https://www.notion.so/ably-extension/2-4-10-Section-Headings-06884c970b054da5bdc703843e47b77b?pvs=4"; 
            }
            else if (guidelineArray === "2.5.3") {
                return "https://www.notion.so/ably-extension/2-5-3-Label-in-Name-4f6b277b327f490f8b7437b8d57f3ed5?pvs=4"; 
            }
            else if (guidelineArray === "3.1.1") {
                return "https://www.notion.so/ably-extension/3-1-1-Language-of-Page-de12f51107464b75bdc7422ffbdf785b?pvs=4"; 
            }
            else if (guidelineArray === "3.2.2") {
                return "https://www.notion.so/ably-extension/3-2-2-On-Input-4031ddf46fe14a449027471d8322c65e?pvs=4"; 
            }
            else if (guidelineArray === "3.3.2") {
                return "https://www.notion.so/ably-extension/3-3-2-Labels-or-Instructions-b3d23746d5974666a190e24c6e2cd435?pvs=4"; 
            }
            else if (guidelineArray === "4.1.1") {
                return "https://www.notion.so/ably-extension/4-1-1-Parsing-ee9d4b0a991a4448b87b82c1dd8a2f5f?pvs=4"; 
            }
            else if (guidelineArray === "4.1.2") {
                return "https://www.notion.so/ably-extension/4-1-2-Name-Role-Value-bc37ee404e244f5f8a99446e3394fb46?pvs=4"; 
            }
            else if (guidelineArray === "4.1.3") {
                return "https://www.notion.so/ably-extension/4-1-3-Status-Messages-1f0c9504dd354e75825d1557af3721ea?pvs=4"; 
            }
           
            // if no matching link is found, return a default value
            return "https://www.notion.so/ably-extension/Guidelines-6c6bf966a38c4f4c8ae95f6d4c421c44";
          }


      

        function addError(item, index) {
			//console.log("guide array = " + guideArray[index] + " item = " + item);
            const link = getLink(guideArray[index]);

            if (guideArray[index].startsWith('1')){
                // guideArray[index] = Guideline Number

                onetext += "<span class="+ "list" +">"+ item + " <a href='" + link+ "'>Learn more about SC " + guideArray[index]  +"</a> </span>";
                x++
				console.log("item in 1 = " + item);
            }
            else if (guideArray[index].startsWith('2')){
                twotext += "<span class="+ "list" +">"+ item + " <a href='" + link+ "'>Learn more about SC " + guideArray[index]  +"</a> </span>";
                x2++

            }
            else if (guideArray[index].startsWith('3')){
                threetext += "<span class="+ "list" +">"+ item + "<a href='" + link+ "'>Learn more about SC " + guideArray[index]  +"</a> </span>";
                x3++

            }
            else if (guideArray[index].startsWith('4')){
                text += "<span class="+ "list" +">"+ item + "  <a href='" + link+ "'>Learn more about SC " + guideArray[index]  +"</a> </span>";
                x4++
            }

            /** console.log(guideArray[index]);
            text += "<span class="+ "list" +">"+ item + " <a href='https://www.boia.org/wcag2/cp/" + guideArray[index] + "'>Learn More</a> </span>"; */
        }
        

        document.getElementById("uAlert").innerHTML = x3 < 2 ? x3 + " alert" : x3 + " alerts";
        document.getElementById("pAlert").innerHTML = x < 2 ? x + " alert" : x + " alerts";
        document.getElementById("oAlert").innerHTML = x2 < 2 ? x2 + " alert" : x2 + " alerts";
        document.getElementById("rAlert").innerHTML = x4 < 2 ? x4 + " alert" : x4 + " alerts";

		function pClick() {
			var x = document.getElementById("perceive");
			if (x.style.display === "none") {
			  x.style.display = "";
            document.getElementById("pchevDown").style.transform="rotate(180deg)"
			} else {
			  x.style.display = "none";
              document.getElementById("pchevDown").style.transform = "rotate(360deg)"
			}
		  }

          function oClick() {
			var x = document.getElementById("operable");

			if (x.style.display === "none") {
                document.getElementById("rchevDown").style.transform="rotate(180deg)"

			  x.style.display = "";
			} else {
                document.getElementById("ochevDown").style.transform = "rotate(360deg)"
			  x.style.display = "none";
			}
		  }

         
          function uClick() {
			var x = document.getElementById("understand");
			if (x.style.display === "none") {
			  x.style.display = "";

            document.getElementById("uchevDown").style.transform="rotate(180deg)"
			} else {
                document.getElementById("uchevDown").style.transform = "rotate(360deg)"
			  x.style.display = "none";
			}
		  }


          
          function rClick() {
			var x = document.getElementById("robust");

			if (x.style.display === "none") {

            document.getElementById("rchevDown").style.transform="rotate(180deg)"
			  x.style.display = "";
			} else {
                document.getElementById("rchevDown").style.transform = "rotate(360deg)"
			  x.style.display = "none";
			}
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
