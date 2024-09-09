import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export function setUpDevEnvironment(context: vscode.ExtensionContext, targetDir: string) {
    // Copies the /src/exampleProject folder into the target directory
    const exampleProjectPath = path.join(context.extensionPath, "assets", "exampleProject");
    const targetProjectPath = targetDir;

    // Copy the example project
    copyFolderRecursiveSync(exampleProjectPath, targetProjectPath);
}

function copyFileSync(source: string, target: string) {
    let targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source: string, target: string) {
    let files = [];

    // Check if folder needs to be created or integrated
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    // Copy
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            let curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, path.join(target, file));
            } else {
                copyFileSync(curSource, target);
            }
        });
    }
}
