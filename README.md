# AB.LY Extension

Thank you for installing the AB.LY Extension.
This is an extension developed by **Bryan Camarillo**, **Keil Finez**, **Pamela Olalia**, and **Kenneth Tan** aimed to help developers like yourself make more accessible code.

## What is accessible code?

We define accessible code as code that follows the existing _Web Content Accessibility Guidelines 2.1_ (WCAG 2.1) which allows users with a wide range of abilities and disabilities to use websites and web apps without excessive dependence on third party workarounds. Developing accessible code helps all users of the internet to use, navigate, and interact with sites and apps by making them more structured and properly labeled.

## How do people with disabilities use, navigate, and interact with sites and apps?

People with disabilities, particularly those with impaired vision, do these tasks with the help of assistive tools like screen-readers—which help these people dictate which part of a website they're in, as well as what it contents are not just visually but structurally. What does that mean? If sites and apps are coded with accessibility in mind, people with disabilities are guided with what contents are available, whether it may be buttons, headers, forms, and images.

## What does this extension do?

Now that you've installed this extension, this will help you spot inaccessible code as its purpose is to _lint_ or mark a particular line of code and offer you suggestions as to how you can make them accessible. The features provided in this extension will hopefully guide you throughout your project—in terms of accessibility.

## What does this look like?

There are two features that you want to focus your attention on when using this extension. The first feature that this extension provides is linting where it marks or underlines your inaccessible code, while the second one is a sidebar that keeps track of the number of accessibility violations you have as well as a scoring feature that is based on said number.

Since you've successfully installed this extension, let's introduce what your environment should look like.

!["sample environment in vscode"](https://i.ibb.co/mXjXDBk/ably01.png)

Figure 1. Sample environment in VSCode

The current page shows an existing HTML with pre-written _inaccessible_ code. Let's mark each section that needs attention.

!["labeled sections in the sample environment"](https://i.ibb.co/php7Kz3/ably02.png)

Figure 2. Labeled sections in the sample environment

As seen inside the purple box, linted lines—those with accessibility violations—are marked by a yellow underline. This is then related to the warning report at the bottom, marked with a blue box, showing which **accessibility guideline/s are violated**, which **line and column** do they occur (indicated by the lint), and a **suggestion** on how to resolve the violation. Then finally, on the left-hand side, is a sidebar that shows the number of inaccessible code, lists all suggestions, and displays the code's overall accessibility score.

### Linting

!["lint example and its corresponding warning"](https://i.ibb.co/HNQpzSW/ably03.png)

Figure 3. Linted code with its corresponding warning

This is what linting looks like. A yellow jagged underline marks each line of code that violates the accessibility guidelines. Each line corresponds to a warning that's indicated below. These warnings occur in the same order as the violated code, meaning from top to bottom.

### AB.LY Sidebar

!["ab.ly sidebar contents"](https://i.ibb.co/6y0zY2Y/ably04.png)

Figure 4. AB.LY sidebar

This is what the sidebar looks like. At the top-right corner, is the code's overall accessibility score percentage. Then, the rest of the sidebar is used to display all suggestions which are segregated into four categories based on WCAG 2.1: Perceivable, Operable, Understandable, and Robust.

## Others

This extension was built upon Microsoft's implementation of the Language Server Protocol. This implementation allows the communication of the client side (developer side) and the server side (backend side) to allow the two aforementioned features to work.

Here is the documented sample code in which this extension was based on, as well as all related technical information regarding its implementation: https://code.visualstudio.com/api/language-extensions/language-server-extension-guide

## Disclaimer

This extension is accomplished in accordance to the creators' thesis submission. Note that this may have incomplete features that is not accounted for. This is to mainly provide an idea that helping developers through real-time assistance as well as learning may be provided through this extension, and is subject for more further improvements when possible.
