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

function countAttributes(html) {
  const rules = [
    { name: 'area', score: 1 },
    { name: 'background-position-x', score: 1 },
    { name: 'background-position-y', score: 1 },
    { name: 'background-size', score: 1 },
    { name: 'border-radius', score: 1 },
    { name: 'button', score: 1 },
    { name: 'font-size', score: 1 },
    { name: 'height', score: 1 },
    { name: 'html', score: 1 },
    { name: 'img', score: 1 },
    { name: 'input', score: 5 },
    { name: 'left', score: 1 },
    { name: 'letter-spacing', score: 1 },
    { name: 'line-height', score: 1 },
    { name: 'margin', score: 1 },
    { name: 'max-height', score: 1 },
    { name: 'min-height', score: 1 },
    { name: 'min-width', score: 1 },
    { name: 'opacity', score: 1 },
    { name: 'outline-offset', score: 1 },
    { name: 'padding', score: 1 },
    { name: 'right', score: 1 },
    { name: 'select', score: 3 },
    { name: 'text-indent', score: 1 },
    { name: 'textarea', score: 1 },
    { name: 'title', score: 1 },
    { name: 'top', score: 1 },
    { name: 'transform-origin', score: 1 },
    { name: 'width', score: 1 },
    { name: 'z-index', score: 1 },
  ];

  const counts = {};
  let total = 0;

  for (const { name, score } of rules) {
    const regex = new RegExp(`<${name}[^>]*>`, 'gi');
    const count = (html.match(regex) || []).length;
    counts[name] = count;
    total += count * score;
   // console.log(count);
    //console.log("elements");

  }
  for (const { name, score } of rules) {
    const regex = new RegExp(`${name}:`, 'gi');
    const count = (html.match(regex) || []).length;
    //console.log(count);
    counts[name] = count;
    //console.log(count);
    total += count * score;

  }
  return total;
}





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
documents.onDidSave((change) => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument) {
  // In this simple example we get the settings for every validate run.
  const settings = await getDocumentSettings(textDocument.uri);
  const text = textDocument.getText();


  let m;
  let problems = 0;
  const diagnostics = [];


  // 1.3.1 - Info and Relationships
  // nav landmark element should have a ul element (list)
  const pattern1311 = /<nav[^>]*>(?:(?!<\/?ul)[\s\S])*<\/nav>/g;
  while (
    (m = pattern1311.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Navbars should be more accessible. Provide structure and semantic meaning to the navigation links.`,
      source: "WCAG 2.1 | 1.3.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Please use lists.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // <footer> should be the last landmark element before the closing body tag
  const pattern1312 = /<footer\b[\s\S]*?<\/footer>(?:(?!(header|main|nav|aside|article|section|footer)\b)[\s\S])*?(<header\b[\s\S]*?<\/header>|<main\b[\s\S]*?<\/main>|<nav\b[\s\S]*?<\/nav>|<aside\b[\s\S]*?<\/aside>|<article\b[\s\S]*?<\/article>|<section\b[\s\S]*?<\/section>|<footer\b[\s\S]*?<\/footer>)[\s\S]*?<\/body>[\s\S]*?<\/html>/g;
  while (
    (m = pattern1312.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `The footer element must be in its proper place. There should also be only one footer element per page.`,
      source: "WCAG 2.1 | 1.3.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Place the footer element after all other landmark elements and remove duplicates of the footer element, if any.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // main landmark element should have role="main"
  const pattern1313 = /^(?!.*<main.*role=["']main["'].*>).*<main.*>/g;
  while (
    (m = pattern1313.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `The main landmark element must have additional context.`,
      source: "WCAG 2.1 | 1.3.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Add the appropriate role, main, to the landmark element.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // header landmark element should have role="banner"
  const pattern1314 = /^(?!.*<header.*role=["']banner["'].*>).*<header.*>/g;
  while (
    (m = pattern1314.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `The header landmark element must have additional context.`,
      source: "WCAG 2.1 | 1.3.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Add the appropriate role, banner, to the landmark element.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // nav landmark element should have role="navigation"
  const pattern1315 = /^(?!.*<nav.*role=["']navigation["'].*>).*<nav.*>/g;
  while (
    (m = pattern1315.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `The nav landmark element must have additional context.`,
      source: "WCAG 2.1 | 1.3.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Add the appropriate role, navigation, to the landmark element.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // aside landmark element should have role="complementary"
  const pattern1316 = /^(?!.*<aside.*role=["']complementary["'].*>).*<aside.*>/g;
  while (
    (m = pattern1316.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `The aside landmark element must have additional context.`,
      source: "WCAG 2.1 | 1.3.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Add the appropriate role, complementary, to the landmark element.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // footer landmark element should have role="contentinfo"
  const pattern1317 = /^(?!.*<footer.*role=["']contentinfo["'].*>).*<footer.*>/g;
  while (
    (m = pattern1317.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `The footer landmark element must have additional context.`,
      source: "WCAG 2.1 | 1.3.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Add the appropriate role, contentinfo, to the landmark element.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // span shouldn't have a font attribute
  const pattern1318 = /(span {[\s\S\n]+?.*?)(font-.*?)[\s\S\n]+?(})/g;
  while ((m = pattern1318.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Span has a 'font' attribute. Try making it simpler and more intuitive.`,
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
            "Remove this from its style. Use the appropriate HTML tag instead of &lt;span&gt;&lt;/span&gt;.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // 1.3.4
  // Checks if background-position-x, background-position-y, background-size, 
  // border-radius, font-size, height, left, letter-spacing, line-height, margin, 
  // max-height, max-width, min-height, min-width, opacity, outline-offset, padding, right, 
  // text-indent, top, transform-origin, width, and z-index uses px
  const pattern1341 = /(background-position-x|background-position-y|background-size|border-radius|height|left|letter-spacing|line-height|margin|max-height|min-height|min-width|opacity|outline-offset|padding|right|text-indent|top|transform-origin|(?<!max-)(width)|z-index):.*?\d+px.*?/g;
  while ((m = pattern1341.exec(text)) && problems < settings.maxNumberOfProblems) {
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
            "Use % for sizes to ensure compatibility with different orientations and add a media query for other screen sizes.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }



  // 1.3.5 - Identify Input Purpose
  // Input must have a name attribute
  const pattern1351 = /(<input(?!.*?name=(['"]).*?\2)[^>]*)(>)/g;
  while ((m = pattern1351.exec(text)) && problems < settings.maxNumberOfProblems) {
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
          message: 'Please add a `name` attribute (ex: &lt;input name=""/&gt;)',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // input elements must have a type attribute
  const pattern1352 = /<(input|textarea|select)(?![^>]*\btype=)([^>]*|)>[ \n]*<\/\1\s*>$/g;
  while (
    (m = pattern1352.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Input elements must have a type attributed to identify their purpose.`,
      source: "WCAG 2.1 | 1.3.5",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Use an appropriate type for input.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }


  // 1.4.4
  // font-size shouldn't use px or pt
  const pattern8 = /(font-size:.*?\d+(px|pt).*?)/g;
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
            "Please change your font size unit from px to other much more flexible units such as rem or em to scale the content effectively.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }


  // 2.1.1 - Keyboard
  // if a <div> has the `class="button"` attribute
  const pattern2111 = /(<div(?=.*?class="button")[^>]*)(>)/g;
  while ((m = pattern2111.exec(text)) && problems < settings.maxNumberOfProblems) {
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
          message: "Please change this to &lt;button&gt;&lt;/button&gt;",
        },
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message:
            'Please change the `class` attribute to `role` and add `tabindex="0"` (ex: &lt;div role="button" tabindex="0"&gt;&lt;/div&gt;)',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // if a <div> has the `class="form"` attribute
  const pattern2112 = /(<div(?=.*?class="form")[^>]*)(>)/g;
  while (
    (m = pattern2112.exec(text)) &&
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
          message: "Please change this to &lt;form&gt;",
        },
      ];
    }
    diagnostics.push(diagnostic);

  }


  // 2.5.3 - Label in name
  // button elements must have an aria-label or aria-labelledby attribute
  const pattern2531 = /<button(?![^>]*(?:aria-label|aria-labelledby)[^>]*)(?:(?<=\sname=)[^>\s]+)?(?:(?<=\svalue=)['"][^'"]*['"])?(?:\s+aria-label=(?:""|''))?[^>]*>/g;
  while ((m = pattern2531.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `The button element needs more context.`,
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
            'Add the appropriate aria-label to the input element.',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // input elements must have an aria-label or aria-labelledby attribute
  const pattern2532 = /<input(?![^>]*(?:aria-label|aria-labelledby)[^>]*)(?:(?<=\sname=)[^>\s]+)?(?:(?<=\svalue=)['"][^'"]*['"])?(?:\s+aria-label=(?:""|''))?[^>]*>/g;
  while (
    (m = pattern2532.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `The input element needs more context.`,
      source: "WCAG 2.1 | 1.3.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Add the appropriate aria-label to the input element.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // textarea elements must have an aria-label or aria-labelledby attribute
  const pattern2533 = /<textarea(?![^>]*(?:aria-label|aria-labelledby)[^>]*)(?:(?<=\sname=)[^>\s]+)?(?:(?<=\svalue=)['"][^'"]*['"])?(?:\s+aria-label=(?:""|''))?[^>]*>/g;
  while (
    (m = pattern2533.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `The textarea element needs more context.`,
      source: "WCAG 2.1 | 1.3.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Add the appropriate aria-label to the textarea element.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }

  // select elements must have an aria-label or aria-labelledby attribute
  const pattern2534 = /<select(?![^>]*(?:aria-label|aria-labelledby)[^>]*)(?:(?<=\sname=)[^>\s]+)?(?:(?<=\svalue=)['"][^'"]*['"])?(?:\s+aria-label=(?:""|''))?[^>]*>/g;
  while (
    (m = pattern2534.exec(text)) &&
    problems < settings.maxNumberOfProblems
  ) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `The select element needs more context.`,
      source: "WCAG 2.1 | 1.3.1",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Add the appropriate aria-label to the select element.",
        },
      ];
    }
    diagnostics.push(diagnostic);
  }


  // 4.1.3 - Status Messagess
  const pattern413 = /<div\s+(?=[^>]*\brole=["']status["'])(?![^>]*\baria-live=["'])[^\s>]*>/g;
  while ((m = pattern413.exec(text)) && problems < settings.maxNumberOfProblems) {
    problems++;
    const diagnostic = {
      severity: node_1.DiagnosticSeverity.Warning,
      range: {
        start: textDocument.positionAt(m.index),
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `Status messages should both have an aria-live attribute and "status" as its role attribute.`,
      source: "WCAG 2.1 | 4.1.3",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: 'Please add an `aria-live` attribute.',
        },
      ];
    }
    diagnostics.push(diagnostic);
  }
  const Woptions = {
    data: text,
    validator: 'WHATWG',
    format: "text",
  };
  const Wresult = await validator(Woptions);

  let WerrorMessages = '';

  Wresult.errors.forEach((error) => {
    const errorMessage = `Error: ${error.message}\nFrom line ${error.line}, column ${error.column}; to line ${error.line}, column ${error.offset + 1}\n`;
    WerrorMessages += errorMessage;
  });

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
  // console.log(errors);

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

    // 1.1.1 - img alt
    if (error.includes("An “img” element must have an “alt” attribute")) {
      errorMsg = "Image elements should have an alt attribute.";
      suggestMsg = "Please add an `alt` attribute to your area element to ensure accessibility.";
      source = "WCAG 2.1 | 1.1.1";
    }

    else if (
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
    // 3.1.1 - Language of Parts

    else if (error.includes("Consider adding a “lang” attribute to the “html” start tag to declare the language of this document.")) {
      errorMsg =
        "You must programatically define the primary language of each page.";
      suggestMsg =
        "Please add a lang attribute to the HTML tag and state the primary language.";
      source = "WCAG 2.1 | 3.1.1";
    }

    // 1.1.1 - Area alt
    else if (error.includes("Element “area” is missing required attribute “alt”")) {
      errorMsg = "'Area' elements should have an alt attribute.";
      suggestMsg = "Please add an `alt` attribute to your area element to ensure accessibility.";
      source = "WCAG 2.1 | 1.1.1";
    }

    else if (error.includes("Element “area” is missing required attribute “href”")) {
      errorMsg = "'Area' elements should have an href attribute.";
      suggestMsg = "Make sure there is an `href` present in your area element.";
      source = "WCAG 2.1 | 1.1.1";
    }

    // 1.1.1 - Input Missing Label

    else if (error.includes("<input> element does not have a <label>")) {
      errorMsg = "Input is missing a label";
      suggestMsg = "Please add a label attribute to your input.";
      source = "WCAG 2.1 | 1.1.1";
    }


    // 2.4.2 - Page Titled Long Title
    else if (error.includes("title text cannot be longer than 70 characters")) {
      errorMsg = "Title text cannot be longer than 70 characters.";
      suggestMsg = "Please limit your webpage title to below 70 characters for better SEO.";
      source = "WCAG 2.1 | 2.4.2";
    }

    // 2.4.4 - Link Purpose

    else if (error.includes("Anchor link must have a text describing its purpose")) {
      errorMsg = "Anchor link must have a text describing its purpose.";
      suggestMsg = "Please add either an `alt` tribute inside your anchor link or a text describing it.";
      source = "WCAG 2.1 | 2.4.4";
    }


    // 2.4.6: Headings and Labels - Empty Heading

    else if (
      error.includes("Empty Heading")
    ) {
      errorMsg = "Headings cannot be empty.";
      suggestMsg = "Please make sure to provide descriptive headings for your content.";
      source = "WCAG 2.1 | 2.4.6";
    }


    //2.4.10

    else if (error.includes("Heading level can only increase by one, expected <h2> but got <h3>")) {
      errorMsg = "Heading level can only increase by one.";
      suggestMsg = "Please check if your headings start at h1 and if it only increases one level at a time. (h1>h6)";
      source = "WCAG 2.1 | 2.4.10";
    }




    // 1.1.1 - Area alt
    else if (error.includes("Element “area” is missing required attribute “alt”")) {
      errorMsg = "'Area' elements should have an alt attribute.";
      suggestMsg = "Please add an `alt` attribute to your area element to ensure accessibility.";
      source = "WCAG 2.1 | 1.1.1";
    }

    else if (error.includes("Element “area” is missing required attribute “href”")) {
      errorMsg = "'Area' elements should have an href attribute.";
      suggestMsg = "Make sure there is an `href` present in your area element.";
      source = "WCAG 2.1 | 1.1.1";
    }

    // 1.1.1 - Input Missing Label

    else if (error.includes("<input> element does not have a <label>")) {
      errorMsg = "Input is missing a label";
      suggestMsg = "Please add a label attribute to your input.";
      source = "WCAG 2.1 | 1.1.1";
    }

    // 3.2.2 - Input Missing Label

    else if (error.includes("<form> element must have a submit button")) {
      errorMsg = "Form elements must have a submit button";
      suggestMsg = "Please add submit button on your form group.";
      source = "WCAG 2.1 | 3.2.2";
    }

    // 3.3.2 - Labels or Instructions
    else if (error.includes("<textarea> element does not have a <label>")) {
      errorMsg = "Textarea is missing a label";
      suggestMsg = "Please add a label attribute to your input.";
      source = "WCAG 2.1 | 3.3.2";
    }

    else if (error.includes("<input> element does not have a <label>")) {
      errorMsg = "Input is missing a label";
      suggestMsg = "Please add a label attribute to your input.";
      source = "WCAG 2.1 | 3.3.2";
    }

    else if (error.includes("<select> element does not have a <label>")) {
      errorMsg = "Select is missing a label";
      suggestMsg = "Please add a label attribute to your input.";
      source = "WCAG 2.1 | 3.3.2";
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

  const html = text;
  const score = countAttributes(html);

//  console.log("SCORE");

//  console.log(score); // Output: 14






  var files = diagnostics;
  files.push(score);


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
