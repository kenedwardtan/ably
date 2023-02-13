"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const validator = require("html-validator");
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

  // <button> must have `aria-label` attribute
  const pattern1 = /(<button(?!.*?aria-label=(['"]).*?\2)[^>]*)(>)/g;
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
      message: `Button lacks a label.`,
      source: "WCAG 2.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            'Kindly add a label to your button. Adding `aria-label=""` within the button as an attribute will suffice (ex: <button aria-label=""></button>)',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

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
      source: "WCAG 2.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Please change this to <button></button>",
        },
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            'Please change the `class` attribute to `role` and add `tabindex="0"` (ex: <div role="button" tabindex="0"></div>)',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // <img> must have `alt` attribute
  const pattern3 = /(<img(?!.*?alt=(['"]).*?\2)[^>]*)(>)/g;
  while ((m = pattern3.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `All non-text content such as images, icons, charts, etc must have alternate text that describes the content.`,
      source: "WCAG 2.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: 'Please add an `alt` attribute (ex: <img alt=""/>)',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

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
      source: "WCAG 2.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: 'Please add a `name` attribute (ex: <input name=""/>)',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // HTML must have `lang` attribute
  const pattern5 = /(<html(?!.*?lang=(['"]).*?\2)[^>]*)(>)/g;
  while ((m = pattern5.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `You must programatically define the primary language of each page.`,
      source: "WCAG 2.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            'Add a `lang` attribute to the HTML tag. (ex: <html lang="en"></html>)',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

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
      source: "WCAG 2.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            "Remove this from the css. Use the appropriate HTML tag instead of <span></span>.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

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
      source: "WCAG 2.1",
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
      source: "WCAG 2.1",
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

  // Proper <div> and <p> nesting must be followed
  const pattern9 = /(<p>[\s\S\n]+?.*?)(<div>.*?<\/div>)[\s\S\n]+?(<\/p>)/g;
  while ((m = pattern9.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Is there a <div> inside <p>? This is improper tag nesting.`,
      source: "WCAG 2.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Swap. <p></p> must be INSIDE <div></div>.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // Proper opening/closing tag nesting (button, h1-6, p, b, i, u)
  const pattern10 =
    /<button>.*?[\s\n]+?<\/button>|<h1>.*?[\s\n]+?<\/h1>|<h2>.*?[\s\n]+?<\/h2>|<h3>.*?[\s\n]+?<\/h3>|<h4>.*?[\s\n]+?<\/h4>|<h5>.*?[\s\n]+?<\/h5>|<h6>.*?[\s\n]+?<\/h6>|<p>.*?[\s\n]+?<\/p>|<b>.*?[\s\n]+?<\/b>|<u>.*?[\s\n]+?<\/u>|<i>.*?[\s\n]+?<\/i>/g;
  while (
    (m = pattern10.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Attribute closing tag nesting is incorrect.`,
      source: "WCAG 2.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            "Have your attributes at the same line rather than putting the closing attribute at the next line.",
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
      source: "WCAG 2.1",
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
      source: "WCAG 2.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Please change this to <form>",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

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
      source: "WCAG 2.1",
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

  // Parsing - 4.1.1.2
  // Initializations for validator (result is a string containing errors in HTML-Validator)
  const options = {
    data: text,
    format: "text",
  };
  const result = await validator(options);
  console.log(result); // for debugging

  // Split result into array of strings for easier checking
  const errors = result.split("\n");

  errors.forEach((error, i) => {
    if (error.includes("Unclosed element") || error.includes("Stray end tag")) {
      // String error check based on HTML-Validator
      const input = errors[i + 1]; // get the error string containing numbers
      const pattern = /(\d+)/g;
      const nums = input.match(pattern).map(Number); // get start and end line and column
      const [startLine, startCol, endLine, endCol] = nums;

      const diagnostic = {
        severity: node_1.DiagnosticSeverity.Warning,
        range: {
          start: { line: startLine - 1, character: startCol - 1 },
          end: { line: endLine - 1, character: endCol },
        },
        message: "Element must have a proper opening/closing tag.",
        source: "WCAG 2.1",
      };
      if (hasDiagnosticRelatedInformationCapability) {
        diagnostic.relatedInformation = [
          {
            location: {
              uri: textDocument.uri,
              range: Object.assign({}, diagnostic.range),
            },
            message: "Please add the proper tag.",
          },
        ];
      }
      diagnostics.push(diagnostic);
    }
    // 4.1.1.1 Duplicate ID
    else if (error.includes("Duplicate ID")) {
      // String error check based on HTML-Validator
      const input = errors[i + 1]; // get the error string containing numbers
      const pattern = /(\d+)/g;
      const nums = input.match(pattern).map(Number); // get start and end line and column
      const [startLine, startCol, endLine, endCol] = nums;

      const diagnostic = {
        severity: node_1.DiagnosticSeverity.Warning,
        range: {
          start: { line: startLine - 1, character: startCol - 1 },
          end: { line: endLine - 1, character: endCol },
        },
        message: "Element must have unique IDs.",
        source: "WCAG 2.1",
      };
      if (hasDiagnosticRelatedInformationCapability) {
        diagnostic.relatedInformation = [
          {
            location: {
              uri: textDocument.uri,
              range: Object.assign({}, diagnostic.range),
            },
            message: "Please change your code so that all elements have a unique ID.",
          },
        ];
      }
      diagnostics.push(diagnostic);
    }
    // 2.4.2 Page Titled  -- Empty Title
    else if (error.includes("Element “title” must not be empty.")) {
      // String error check based on HTML-Validator
      const input = errors[i + 1]; // get the error string containing numbers
      const pattern = /(\d+)/g;
      const nums = input.match(pattern).map(Number); // get start and end line and column
      const [startLine, startCol, endLine, endCol] = nums;

      const diagnostic = {
        severity: node_1.DiagnosticSeverity.Warning,
        range: {
          start: { line: startLine - 1, character: startCol - 1 },
          end: { line: endLine - 1, character: endCol },
        },
        message: "Element title cannot be empty, must have text content",
        source: "WCAG 2.1",
      };
      if (hasDiagnosticRelatedInformationCapability) {
        diagnostic.relatedInformation = [
          {
            location: {
              uri: textDocument.uri,
              range: Object.assign({}, diagnostic.range),
            },
            message: "Please add a descriptive title to your content.",
          },
        ];
      }
      diagnostics.push(diagnostic);
    }

     // 2.4.2 Page Titled 
     else if (error.includes("is missing a required instance of child element")) {
      // String error check based on HTML-Validator
      const input = errors[i + 1]; // get the error string containing numbers
      const pattern = /(\d+)/g;
      const nums = input.match(pattern).map(Number); // get start and end line and column
      const [startLine, startCol, endLine, endCol] = nums;

      const diagnostic = {
        severity: node_1.DiagnosticSeverity.Warning,
        range: {
          start: { line: startLine - 1, character: startCol - 1 },
          end: { line: endLine - 1, character: endCol },
        },
        message: "Web pages must have a descriptive and concise title that accurately reflects the topic or purpose of the page.",
        source: "WCAG 2.1",
      };
      if (hasDiagnosticRelatedInformationCapability) {
        diagnostic.relatedInformation = [
          {
            location: {
              uri: textDocument.uri,
              range: Object.assign({}, diagnostic.range),
            },
            message: "Please add a descriptive and concise title to your web page using the 'title' element within the 'head' section.",
          },
        ];
      }
      diagnostics.push(diagnostic);
    }


    // 2.4.6: Headings and Labels - Empty Heading

    else if (error.includes("Empty heading")) {
      // String error check based on HTML-Validator
      const input = errors[i + 1]; // get the error string containing numbers
      const pattern = /(\d+)/g;
      const nums = input.match(pattern).map(Number); // get start and end line and column
      const [startLine, startCol, endLine, endCol] = nums;

      const diagnostic = {
        severity: node_1.DiagnosticSeverity.Warning,
        range: {
          start: { line: startLine - 1, character: startCol - 1 },
          end: { line: endLine - 1, character: endCol },
        },
        message: "Headings cannot be empty.",
        source: "WCAG 2.1",
      };
      if (hasDiagnosticRelatedInformationCapability) {
        diagnostic.relatedInformation = [
          {
            location: {
              uri: textDocument.uri,
              range: Object.assign({}, diagnostic.range),
            },
            message: "Please make sure to provide descriptive headings for your content.",
          },
        ];
      }
      diagnostics.push(diagnostic);
    }


  });

  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
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
