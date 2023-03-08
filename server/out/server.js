"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const validator = require("@pamkirsten/html-validator");
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager.
const documents = new node_1.TextDocuments(
  vscode_languageserver_textdocument_1.TextDocument
);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
  const capabilities = params.capabilities;
  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );
  const result = {
    capabilities: {
      textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
      },
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
});
connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      node_1.DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log("Workspace folder change event received.");
    });
  }
});
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;
// Cache the settings of all open documents
const documentSettings = new Map();
connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = change.settings.languageServerExample || defaultSettings;
  }
  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});
function getDocumentSettings(resource) {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: "languageServerExample",
    });
    documentSettings.set(resource, result);
  }
  return result;
}
// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument) {
  // In this simple example we get the settings for every validate run.
  const settings = await getDocumentSettings(textDocument.uri);
  const text = textDocument.getText();


  // 2.5.3

  // <button> must have `aria-label` attribute
  const pattern1 = /(<(a|audio|button|details|embed|input|textarea|keygen|label|select|object|video|menuitem|meter|output|progress|datalist|fieldset|legend|article|aside|footer|header|main|nav|section|area|form|iframe|img|figure|summary|table|td|th))(?![^>]*\saria-label=["'][^"']*["']|[^>]*\saria-label=[^"'])/gi

  let m;

  let problems = 0;
  const diagnostics = [];
  while ((m = pattern1.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Element lacks a label.`,
      source: "WCAG 2.1 | 2.5.3",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            'Kindly add an `aria-label=""` to your element. (ex: &lt;button aria-label=""&gt&lt;/button&gt)',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // 2.1.1
  // if a <div> has the `class="button"` attribute
  const pattern2 = /(<div(?=.*?class="button")[^>]*)(>)/g;
  while ((m = pattern2.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `All functionality should be operable with a keyboard. Choose between the two options.`,
      source: "WCAG 2.1 | 2.1.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Please change this to &lt;button&gt&lt;/button&gt",
        },
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            'Please change the `class` attribute to `role` and add `tabindex="0"` (ex: &lt;div role="button" tabindex="0"&gt&lt;/div&gt)',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // 1.3.5
  // Input must have `name` attribute
  const pattern4 = /(<input(?!.*?name=(['"]).*?\2)[^>]*)(>)/g;
  while ((m = pattern4.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Headings and labels should be descriptive.`,
      source: "WCAG 2.1 | 1.3.5",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: 'Please add a `name` attribute (ex: &lt;input name=""/&gt)',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // 1.3.1
  // if a span has a font attribute
  const pattern6 = /(span {[\s\S\n]+?.*?)(font-.*?)[\s\S\n]+?(})/g;
  while ((m = pattern6.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Span has a 'font' style. Try making it simpler and more intuitive.`,
      source: "WCAG 2.1 | 1.3.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            "Remove this from the css. Use the appropriate HTML tag instead of &lt;span&gt&lt;/span>.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // 1.3.4
  // if width uses px
  const pattern7 = /(width:.*?px.*?)/g;
  while ((m = pattern7.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Content should adapt to different screen sizes and display orientation.`,
      source: "WCAG 2.1 | 1.3.4",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            "If this is your main width, opt to change it into a percentage. Add a media query to cater to other screen sizes.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // 1.4.4
  // if font size uses px
  const pattern8 = /((font-size:.*?px.*?))/g;
  while ((m = pattern8.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Text content should be scalable to 200% without any loss of information or functionality.`,
      source: "WCAG 2.1 | 1.4.4",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            "Please change your font size unit from px to em to scale the content effectively.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }


  // 1.3.5.1 Identify Input Purpose
  const pattern11 = /(<input(?=.*?type=(['"]).*?\2)[^>]*)(>)/g;
  while (
    (m = pattern11.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Are you using the proper HTML type for input element?`,
      source: "WCAG 2.1 | 1.3.5",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Use the appropriate type for input.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // 2.1.1.2 Keyboard
  const pattern12 = /(<div(?=.*?class="form")[^>]*)(>)/g;
  while (
    (m = pattern12.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `All functionality should be operable with a keyboard. Choose between the two options.`,
      source: "WCAG 2.1 | 2.1.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Please change this to &lt;form&gt",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // 2.4.7
  // focus-visible
  const pattern13 =
    /([^\r\n,{}]+)(:focus-visible ({[\s\S\n]+?.*?)(.*?-color:.*?)[^>])*(})/g;
  while (
    (m = pattern13.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `All interactive elements should have a clearly visible focus indicator.`,
      source: "WCAG 2.1 | 2.4.7",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            "Please use clear focus indicators such as background-color or text-color.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // Initializations for validator (result is a string containing errors in HTML-Validator)
  const Woptions = {
    data: text,
    validator: 'WHATWG',
    format: "text",
  };
  const Wresult = await validator(Woptions);
  //console.log(Wresult.errors); // for debugging

  let WerrorMessages = '';

  Wresult.errors.forEach((error) => {
    const errorMessage = `Error: ${error.message}\nFrom line ${error.line}, column ${error.column}; to line ${error.line}, column ${error.offset + 1}\n`;
    WerrorMessages += errorMessage;
  });
  //console.log("----------- WHATWG START ------- ")
  //console.log(WerrorMessages);
  //console.log("----------- WHATWG END ------- ")


  // Initializations for validator (result is a string containing errors in HTML-Validator)
  const options = {
    data: text,
    format: "text",
  };
  const result = await validator(options);
  //console.log(result); // for debugging

  // Split result into array of strings for easier checking
  //const Lerrors = result.split("\n");

  const resultsCombined = WerrorMessages + result;
  const tryerrors = resultsCombined.split("\n");
  //console.log(tryerrors);

  //const errors = result.split("\n");
  const errors = tryerrors;
  console.log(errors);

  //console.log("~~~~ COMBINED ~~~~")
  //console.log(combinedErrors);
  //console.log("~~~~ COMBINED END ~~~~")

  // Function for finding the line and column (parameter: error)
  const findLineAndColumn = (error) => {
    const pattern =
      /From line (\d+), column (\d+); to line (\d+), column (\d+)/;
    const match = error.match(pattern);
    if (!match) return null;
    const [, startLine, startCol, endLine, endCol] = match;
    return {
      start: { line: Number(startLine) - 1, character: Number(startCol) - 1 },
      end: { line: Number(endLine) - 1, character: Number(endCol) },
    };
  };

  errors.forEach((error, i) => {
    let diagnostic;
    let errorMsg;
    let suggestMsg;
    let source;

    // keil
    if (error.includes("An “img” element must have an “alt” attribute")) {
      // 1.1.1
      errorMsg = "Images must have an alt attribute.";
      suggestMsg = "Please add an appropriate alt attribute.";
      source = "WCAG 2.1 | 1.1.1";
    } else if (
      // 4.1.1.2
      error.includes("Unclosed element") ||
      error.includes("Stray end tag")
    ) {
      errorMsg = "Element must have a proper opening/closing tag.";
      suggestMsg = "Please add the appropriate HTML tag to complete.";
      source = "WCAG 2.1 | 4.1.1";
    }

    // 4.1.1 - Duplicate ID

    else if (error.includes("Duplicate ID")) {
      errorMsg = "Element must have unique IDs.";
      suggestMsg = "Please make sure all your attributes have different and unique IDs.";
      source = "WCAG 2.1 | 4.1.1";
    }

    // 2.4.2 - Page Title
    else if (error.includes("Element “title” must not be empty.")) {
      errorMsg = "Element title cannot be empty, must have text content";
      suggestMsg = "Please add a descriptive title to your content.";
      source = "WCAG 2.1 | 2.4.2";
    }

    else if (error.includes("missing a required instance of child element")) {
      errorMsg = "Element title cannot be empty, must have text content";
      suggestMsg = "Please add a descriptive title to your content.";
      source = "WCAG 2.1 | 2.4.2";
    }

    else if (error.includes("is missing a required instance of child element")) {
      errorMsg = "Web pages must have a descriptive and concise title that accurately reflects the topic or purpose of the page.";
      suggestMsg = "Please add a descriptive and concise title to your web page using the 'title' element within the 'head' section.";
      source = "WCAG 2.1 | 2.4.2";
    }


    else {
      return;
    }


    // call function for range
    const location = findLineAndColumn(errors[i + 1]);
    if (!location) return;

    // diagnostic object for error message
    diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: location,
      message: errorMsg,
      source: source,
    };

    // related diagnostic info object for suggestion message
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: location,
          },
          message: suggestMsg,
        },
      ];
    }

    diagnostics.push(diagnostic);
  });

  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });



  var files = diagnostics;

  connection.sendNotification("custom/loadFiles", [files]);



}
connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VSCode
  connection.console.log("We received an file change event");
});
// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition) => {
  // The pass parameter contains the position of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  return [
    {
      label: "TypeScript",
      kind: node_1.CompletionItemKind.Text,
      data: 1,
    },
    {
      label: "JavaScript",
      kind: node_1.CompletionItemKind.Text,
      data: 2,
    },
  ];
});
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
  if (item.data === 1) {
    item.detail = "TypeScript details";
    item.documentation = "TypeScript documentation";
  } else if (item.data === 2) {
    item.detail = "JavaScript details";
    item.documentation = "JavaScript documentation";
  }
  return item;
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map
