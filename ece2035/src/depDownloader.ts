import * as vscode from "vscode";

import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";
import { deactivateLanguageClient } from "./languageClient/languageClient";

const baseUrl = "https://ece2035vscode.s3.us-east-2.amazonaws.com/";

export function checkDependencies(context: vscode.ExtensionContext) {
    getApi().then((api: any) => {
        // getting latest version string
        api.downloadFile(
            vscode.Uri.parse(baseUrl + "version.txt"),
            "riscv-version.txt",
            context,
        ).then((fileUri: vscode.Uri) => {
            // read the file
            let fs = require("fs");
            let version = fs.readFileSync(fileUri.fsPath, "utf8");
            if (version === context.globalState.get("riscvemulatorVersion")) {
                // no update available
                return;
            } else if (context.globalState.get("riscvemulatorVersion") === undefined) {
                // setting the version for the first time
                context.globalState.update("riscvemulatorVersion", version);
            }

            // prompt the user to update
            vscode.window
                .showInformationMessage(
                    "A new version of the RISC-V Emulator is available. Would you like to update?",
                    "Yes",
                    "No",
                )
                .then((value) => {
                    if (value === "Yes") {
                        // download it - first must get the system type (OS and architecture)
                        // then download the correct file
                        let os = process.platform;
                        let arch = process.arch;

                        let url = baseUrl + "riscvemulator-";
                        if (os === "win32") {
                            url += "win-";
                            // } else if (os === "darwin") {
                            //     url += "mac-";
                            // } else if (os === "linux") {
                            //     url += "linux-";
                        } else {
                            vscode.window.showErrorMessage(
                                "Your operating system is not supported.",
                            );
                            return;
                        }

                        if (arch === "x64") {
                            url += "x64.exe";
                            // } else if (arch === "arm64") {
                            //     url += "arm64";
                            // } else if (arch === "arm") {
                            //     url += "arm";
                        } else {
                            vscode.window.showErrorMessage(
                                "Your CPU architecture is not supported.",
                            );
                            return;
                        }

                        // deactivate the language client
                        deactivateLanguageClient();

                        // download the file
                        vscode.window.showInformationMessage("Downloading RISC-V Emulator...");
                        api.downloadFile(vscode.Uri.parse(url), "riscvemulator.exe", context).then(
                            (fileUri: vscode.Uri) => {
                                context.globalState.update("riscvemulator", fileUri.fsPath);
                                context.globalState.update("riscvemulatorVersion", version);
                                vscode.window.showInformationMessage(
                                    "RISC-V Emulator downloaded. Have fun!",
                                );

                                // reload the extension
                                vscode.commands.executeCommand("workbench.action.reloadWindow");
                            },
                        );
                    }
                });
        });

        let emulatorInstalled = context.globalState.get("riscvemulator") !== undefined;

        if (!emulatorInstalled) {
            // download it - first must get the system type (OS and architecture)
            // then download the correct file
            let os = process.platform;
            let arch = process.arch;

            let url = baseUrl + "riscvemulator-";
            if (os === "win32") {
                url += "win-";
                // } else if (os === "darwin") {
                //     url += "mac-";
                // } else if (os === "linux") {
                //     url += "linux-";
            } else {
                vscode.window.showErrorMessage("Your operating system is not supported.");
                return;
            }

            if (arch === "x64") {
                url += "x64.exe";
                // } else if (arch === "arm64") {
                //     url += "arm64";
                // } else if (arch === "arm") {
                //     url += "arm";
            } else {
                vscode.window.showErrorMessage("Your CPU architecture is not supported.");
                return;
            }

            // download the file
            vscode.window.showInformationMessage("Downloading RISC-V Emulator...");
            api.downloadFile(vscode.Uri.parse(url), "riscvemulator.exe", context).then(
                (fileUri: vscode.Uri) => {
                    context.globalState.update("riscvemulator", fileUri.fsPath);
                    vscode.window.showInformationMessage("RISC-V Emulator downloaded. Have fun!");

                    // reload the extension
                    vscode.commands.executeCommand("workbench.action.reloadWindow");
                },
            );
        }
    });
}
