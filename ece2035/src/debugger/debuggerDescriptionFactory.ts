import * as vscode from "vscode";

export class DebugDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {
    private context: vscode.ExtensionContext;
    private useLocalEmulator: boolean;
    private localEmulatorPath: string;

    constructor(
        context: vscode.ExtensionContext,
        useLocalEmulator: boolean,
        localEmulatorPath: string,
    ) {
        this.context = context;
        this.useLocalEmulator = useLocalEmulator;
        this.localEmulatorPath = localEmulatorPath;
    }

    createDebugAdapterDescriptor(
        session: vscode.DebugSession,
        executable: vscode.DebugAdapterExecutable | undefined,
    ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        let command: string;
        if (!this.useLocalEmulator) {
            command = this.context.globalState.get("riscvemulator") as string;
        } else {
            command = this.localEmulatorPath;
        }

        executable = new vscode.DebugAdapterExecutable(command, ["debug"]);
        return executable;
    }
}
