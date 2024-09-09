import * as vscode from "vscode";

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from "vscode-languageclient/node";

let languageClient: LanguageClient;

export function activateLanguageClient(
    context: vscode.ExtensionContext,
    useLocalEmulator: boolean,
    localEmulatorPath: string,
) {
    let command: string;
    if (!useLocalEmulator) {
        command = context.globalState.get("riscvemulator") as string;
    } else {
        command = localEmulatorPath;
    }

    const serverOptions: ServerOptions = {
        command: command,
        args: ["languageServer"], // "debug"
    };

    const clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: "file", language: "riscv" }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher("**/.clientrc"),
        },
    };

    languageClient = new LanguageClient(
        "RISCVLanguageServer",
        "RISC-V Language Server",
        serverOptions,
        clientOptions,
    );

    languageClient.start();
}

export function deactivateLanguageClient(): Thenable<void> | undefined {
    if (!languageClient) {
        return undefined;
    }
    return languageClient.stop();
}
