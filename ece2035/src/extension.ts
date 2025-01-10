// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { DebugDescriptorFactory } from './debugger/debuggerDescriptionFactory';
import { DebugConfigurationProvider } from './debugger/debuggerProvider';

import { activateLanguageClient, deactivateLanguageClient } from './languageClient/languageClient';

import { checkDependencies } from './depDownloader';
import { setUpDevEnvironment } from './devEnvironment';

import { TestCasesManager } from './testcases/testCaseExplorer';
import { ScreenManager } from './screenManager';
import { TestCase } from './testcases/testCase';
import { getResolvedLaunchConfig } from './utils';
import { DEFAULT_LAUNCH_CONFIG } from './defaults';

const disposables: vscode.Disposable[] = [];
var globalContext: vscode.ExtensionContext;
var screenManager: ScreenManager;
var testCasesManager: TestCasesManager;
var currentSeed: number = 0;
var showingTestCase: TestCase | undefined;

const configuration = vscode.workspace.getConfiguration("riscv");
const emulatorPath: string = configuration.get("emulatorPath") || "";
const useLocalEmulator = emulatorPath.length !== 0;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	if (useLocalEmulator) {
		console.debug("Local emulator parameter found, overriding emulator path");
	}

	globalContext = context;
	screenManager = new ScreenManager(context);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ece2035" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let openCommand = vscode.commands.registerCommand('ece2035.openscreen', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		screenManager.openScreenPanel();
	});

	testCasesManager = new TestCasesManager(context, useLocalEmulator, emulatorPath);
	testCasesManager.updatedResultCallback = newTestResult;

	let newAssignmentCommand = vscode.commands.registerCommand('ece2035.newAssignment', setupDevEnvironmentCommand);
	let runTestCaseCommand = vscode.commands.registerCommand('ece2035.runTestCase', runTestCase);
	let debugTestCaseCommand = vscode.commands.registerCommand('ece2035.debugTestCase', debugTestCase);
	let deleteTestCaseCommand = vscode.commands.registerCommand('ece2035.deleteTestCase', deleteTestCase);
	let viewTestCaseCommand = vscode.commands.registerCommand('ece2035.viewTestCase', viewTestCase);
	let runAllTestCasesCommand = vscode.commands.registerCommand('ece2035.runAllTestCases', runAllTestCases);

	let runCommand = vscode.commands.registerCommand("ece2035.runFile", runFile);

	const configProvider = new DebugConfigurationProvider();
	const descriptionFactory = new DebugDescriptorFactory(context, useLocalEmulator, emulatorPath);
	disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory("riscv-vm", descriptionFactory));
	disposables.push(vscode.debug.registerDebugConfigurationProvider("riscv-vm", configProvider));
	console.log("activated");

	checkDependencies(context);

	context.subscriptions.push(openCommand, newAssignmentCommand, runCommand, runAllTestCasesCommand);
	context.subscriptions.push(runTestCaseCommand, debugTestCaseCommand, deleteTestCaseCommand, viewTestCaseCommand);
	activateLanguageClient(context, useLocalEmulator, emulatorPath);

	context.subscriptions.push(vscode.window.registerTreeDataProvider('riscvtestcases', testCasesManager));

	vscode.debug.onDidReceiveDebugSessionCustomEvent((event) => {
		console.log("Received event: " + event.event);
		if (event.event === "riscv_screen") {
			screenManager.sendScreenMessage("screen_update", event.body);

			if (event.body.status === "passed") {
				testCasesManager.reportUpdatedStatus(currentSeed.toString(), "pass", {
					di: event.body.stats.di,
					si: event.body.stats.si,
					reg: event.body.stats.reg,
					mem: event.body.stats.mem
				});
			} else if (event.body.status === "failed") {
				testCasesManager.reportUpdatedStatus(currentSeed.toString(), "fail", {
					di: event.body.stats.di,
					si: event.body.stats.si,
					reg: event.body.stats.reg,
					mem: event.body.stats.mem
				});
			}
		} else if (event.event === "riscv_context") {
			currentSeed = event.body.seed;
			screenManager.sendScreenMessage("context_update", event.body);
		}
	});

	vscode.debug.onDidStartDebugSession(debugStartedEvent);

	screenManager.registerCommandHandler("save_testcase", (data) => {
		// popup for the title
		vscode.window.showInputBox({ prompt: "Enter a title for the test case" }).then((title) => {
			if (!title) {
				title = "Untitled Testcase";
			}
			testCasesManager.addNewTestCase(title, data.seed.toString(), "unknown", data.image);
		});
	});


	screenManager.registerCommandHandler("readMemory", (data) => {
		console.log("ready triggered");
	});
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log("deactived");
	disposables.forEach(d => d.dispose());
	deactivateLanguageClient();
}

var screenOpened = false;
function debugStartedEvent(event: vscode.DebugSession) {
	if (event.type === "riscv-vm") {
		screenManager.openScreenPanel();
	}
}

function runFile(uri: vscode.Uri) {
	const config = getResolvedLaunchConfig()[0] || DEFAULT_LAUNCH_CONFIG;

	vscode.debug.startDebugging(vscode.workspace.getWorkspaceFolder(uri), config);
}

function setupDevEnvironmentCommand() {
	// prompt user for directory
	const options: vscode.OpenDialogOptions = {
		canSelectMany: false, // Allow selection of only one folder
		openLabel: 'Select a directory to create the project in',
		canSelectFiles: false, // Do not allow file selection
		canSelectFolders: true, // Allow folder selection
	};

	vscode.window.showOpenDialog(options).then(fileUri => {
		if (fileUri && fileUri[0]) {
			setUpDevEnvironment(globalContext, fileUri[0].fsPath);

			// open the new project in a new window
			vscode.commands.executeCommand('vscode.openFolder', fileUri[0], false);
		}
	});
}

function runTestCase(item: any) {
	console.log("Running test case: " + item.description);
	testCasesManager.runTestCaseHandler(item);
}

function debugTestCase(item: any) {
	console.log("Debugging test case: " + item.description);
	testCasesManager.debugTestCaseHandler(item);
}

function runAllTestCases() {
	testCasesManager.handleRunAllTestCases();
}

function deleteTestCase(item: any) {
	console.log("Deleting test case: " + item.description);
	testCasesManager.deleteTestCase(item);
}

function viewTestCase(item: any) {
	showingTestCase = item;
	screenManager.showTestCase(item);
}

function newTestResult(item: TestCase) {
	if (!showingTestCase) {
		return;
	}

	if (item.description === showingTestCase.description && screenManager.getMode() === "past") {
		viewTestCase(item);
	}
}
