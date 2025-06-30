import * as vscode from 'vscode';
import { whammServer } from './whammServer';

export class ExtensionContext{
	static context: vscode.ExtensionContext; 
	static api: whammServer.Exports;
}
