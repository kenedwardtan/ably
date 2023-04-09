"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path = require("path");
const vscode_1 = require("vscode");
const vscode = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
let receivedData;
async function activate(context) {
    const provider = new ColorsViewProvider(context.extensionUri);
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
            options: debugOptions,
        },
    };
    // Options to control the language client
    const clientOptions = {
        // Register the server for javascript documents
        documentSelector: [{ scheme: 'file', language: 'html' },
            { scheme: 'file', language: 'javascript' }],
        synchronize: {
            // Notify the server about file changes to 'all' files contained in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/*'),
        },
    };
    // Create the language client and start the client.
    client = new node_1.LanguageClient('languageServerExample', 'Language Server Example', serverOptions, clientOptions);
    //console.log("------ REFRESH -----");
    client.start();
    //client.sendNotification("custom/refreshClient", {});
    let done = 1;
    client.onReady().then(() => {
        client.onNotification("custom/loadFiles", (files) => {
            //console.log("loading files " + JSON.stringify(files));
            // console.log(files);
            receivedData = files[0];
            // console.log(receivedData);
            //const score = receivedData.pop();
            // console.log(receivedData);
            //console.log("SCORE "+score); // Output: 3
            if (done != 2) {
                context.subscriptions.push(vscode.window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider));
            }
            done = 2;
            provider.callView();
        });
    });
}
exports.activate = activate;
let dataLength = 0;
const TotalScore = 0;
const scorePercent = 0;
const tryArray = [];
class ColorsViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
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
    callView() {
        this.updateView(this._view);
    }
    updateView(webviewView) {
        //console.log("here");
        this._view = webviewView;
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }
    _getHtmlForWebview(webview) {
        const score = receivedData.pop();
        // console.log("SCORE: " + score);
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
        // console.log(stringArray);
        dataLength = receivedData.length;
        //console.log(receivedData); 
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

        .ably-score {
            display: inline-block;
            margin: 10px;
            padding-left: 32px;
            padding-top: 8px;
        }

        .ably-score-circle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 55px;
            height: 55px;
            border-radius: 50%;
            background-color: #2ecc71;
        }

        .ably-score-value {
            font-size: 14px;
            font-weight: 800;
            color: black;
        }

        .ably-score-label {
            display: block;
            font-size: 8px;
            color: black;
            text-align: center;
            margin-top: 5px;
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
            <img src="https://i.ibb.co/h1MSWN9/ABLY-Logo-Primary-3x.png" alt="Ably logo.png" border="0" style="width: 1em"/>
                <p class="title-name"> Ab.ly </p>
                <div class="ably-score">
                    <div class="ably-score-circle">
                        <span class="ably-score-value">1</span> <span style="color:black; font-size: 12px">%</span>
                    </div>
            </div>
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
                    <svg  onclick="uClick()" id="uchevDown"  class="chevronDown" width="10" height="7" viewBox="0 0 10 7" fill="none"
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
        // Total of Errors
        let ErrorTotal = ${dataLength};

        // Total of Elements and their Scoring
        let totalScore = ${score};

        // Final Score Percentage
        let scorePercent = 100 - Math.round((ErrorTotal / totalScore) * 100);
        if (scorePercent < 0) {
        scorePercent = 0;
        }

        const scoreCircle = document.querySelector('.ably-score-circle');


        if (scorePercent >= 71) {
            scoreCircle.style.backgroundColor = '#02BA00'; // Green
        } else if (scorePercent >= 30 && scorePercent <= 70) {
            scoreCircle.style.backgroundColor = '#FFCF02'; 
        } else {
            scoreCircle.style.backgroundColor = '#FF1E0E'; 
        }

        

        console.log(scorePercent);

        // Get the ably score element
        var ablyScore = document.querySelector('.ably-score-value');

        // Set the score value
        ablyScore.innerHTML = scorePercent;

        document.getElementById("dataContainer").innerHTML = ErrorTotal;

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
                document.getElementById("ochevDown").style.transform="rotate(180deg)"

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
ColorsViewProvider.viewType = 'calicoColors.colorsView';
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map