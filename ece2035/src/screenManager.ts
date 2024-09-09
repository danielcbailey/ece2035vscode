/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as fs from "fs";
import { TestCase } from "./testcases/testCase";

export class ScreenManager {
    private screenOpened = false;
    private context: vscode.ExtensionContext;
    private screenPanel: vscode.WebviewPanel | undefined;
    private commandHandlers: Map<string, (data: any) => void> = new Map();

    private mode: string;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.mode = "idle";
    }

    public openScreenPanel() {
        if (this.screenOpened) {
            return;
        }

        this.screenPanel = vscode.window.createWebviewPanel(
            "screenView",
            "RISC-V Screen View",
            {
                preserveFocus: true,
                viewColumn: vscode.ViewColumn.Two,
            },
            {
                enableScripts: true,
            },
        );

        const filtPath: vscode.Uri = vscode.Uri.file(
            this.context.asAbsolutePath("assets/html/screenView.html"),
        );

        this.setWebviewContent();
        this.screenOpened = true;
        this.screenPanel.onDidDispose(() => {
            this.screenOpened = false;
        });

        this.screenPanel.webview.onDidReceiveMessage((message) => {
            let handler = this.commandHandlers.get(message.command);
            if (handler) {
                handler(message.data);
            }
        });

        vscode.window.onDidChangeActiveColorTheme((e) => {
            this.setWebviewContent();
        });
    }

    public closeScreenPanel() {
        if (this.screenPanel) {
            this.screenPanel.dispose();
            this.screenOpened = false;
        }
    }

    public sendScreenMessage(command: string, data: any) {
        this.mode = "active";
        if (this.screenPanel) {
            this.screenPanel.webview.postMessage({ command: command, data: data });
        }
    }

    public registerCommandHandler(command: string, handler: (data: any) => void) {
        this.commandHandlers.set(command, handler);
    }

    public removeCommandHandler(command: string) {
        this.commandHandlers.delete(command);
    }

    public showTestCase(testCase: TestCase) {
        this.openScreenPanel();
        if (this.screenPanel) {
            let workspaceFolders = vscode.workspace.workspaceFolders;

            let data = {
                image: this.screenPanel.webview
                    .asWebviewUri(vscode.Uri.file(testCase.getImagePath()!))
                    .toString(),
                stats: testCase.stats,
                status: testCase.status,
            };
            this.screenPanel.webview.postMessage({ command: "show_past_screen", data: data });
            this.mode = "past";
        }
    }

    public getMode() {
        if (!this.screenOpened) {
            return "closed";
        }

        return this.mode;
    }

    private setWebviewContent() {
        if (!this.screenPanel) {
            return;
        }

        const filtPath: vscode.Uri = vscode.Uri.file(
            this.context.asAbsolutePath("assets/html/screenView.html"),
        );
        let contents = fs.readFileSync(filtPath.fsPath, "utf8");

        const buttonBackgroundColor = new vscode.ThemeColor("button.background");
        const buttonTextColor = new vscode.ThemeColor("button.foreground");
        const buttonBorderColor = new vscode.ThemeColor("button.border");
        const buttonHoverBackgroundColor = new vscode.ThemeColor("button.hoverBackground");

        this.screenPanel.webview.html = contents;
    }
}
