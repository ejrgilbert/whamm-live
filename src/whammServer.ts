/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, u64, i32, ptr, result } from '@vscode/wasm-component-model';

export namespace Types {
	export type Options = {
		asMonitorModule: boolean;
	};

	export enum Mode {
		before = 'before',
		after = 'after',
		alt = 'alt',
		entry = 'entry',
		exit = 'exit'
	}

	export type ScriptLoc = {
		l: u32;
		c: u32;
	};

	export type AppLoc = {
		byteOffset: u64;
		mode: Mode;
	};

	export type Probe = {
		appLoc: AppLoc;
		scriptLoc: ScriptLoc;
		wat: string;
	};

	/**
	 * variant operation {
	 * 	add(operands),
	 * 	sub(operands),
	 * 	mul(operands),
	 * 	div(operands)
	 * }
	 */
	export namespace ErrorCode {
		export const invalid = 'invalid' as const;
		export type Invalid = { readonly tag: typeof invalid; readonly value: string } & _common;
		export function Invalid(value: string): Invalid {
			return new VariantImpl(invalid, value) as Invalid;
		}

		export const unexpected = 'unexpected' as const;
		export type Unexpected = { readonly tag: typeof unexpected; readonly value: string } & _common;
		export function Unexpected(value: string): Unexpected {
			return new VariantImpl(unexpected, value) as Unexpected;
		}

		export const noChange = 'noChange' as const;
		export type NoChange = { readonly tag: typeof noChange; readonly value: string } & _common;
		export function NoChange(value: string): NoChange {
			return new VariantImpl(noChange, value) as NoChange;
		}

		export type _tt = typeof invalid | typeof unexpected | typeof noChange;
		export type _vt = string | string | string;
		type _common = Omit<VariantImpl, 'tag' | 'value'>;
		export function _ctor(t: _tt, v: _vt): ErrorCode {
			return new VariantImpl(t, v) as ErrorCode;
		}
		class VariantImpl {
			private readonly _tag: _tt;
			private readonly _value: _vt;
			constructor(t: _tt, value: _vt) {
				this._tag = t;
				this._value = value;
			}
			get tag(): _tt {
				return this._tag;
			}
			get value(): _vt {
				return this._value;
			}
			isInvalid(): this is Invalid {
				return this._tag === ErrorCode.invalid;
			}
			isUnexpected(): this is Unexpected {
				return this._tag === ErrorCode.unexpected;
			}
			isNoChange(): this is NoChange {
				return this._tag === ErrorCode.noChange;
			}
		}
	}
	export type ErrorCode = ErrorCode.Invalid | ErrorCode.Unexpected | ErrorCode.NoChange;
	export namespace ErrorCode {
		export class Error_ extends $wcm.ResultError<ErrorCode> {
			constructor(cause: ErrorCode) {
				super(`ErrorCode: ${cause}`, cause);
			}
		}
	}
}
export type Types = {
};
export namespace whammServer {
	export type Options = Types.Options;
	export type Probe = Types.Probe;
	export type ErrorCode = Types.ErrorCode;
	export const ErrorCode = Types.ErrorCode;
	export type Imports = {
		log: (msg: string) => void;
	};
	export namespace Imports {
		export type Promisified = $wcm.$imports.Promisify<Imports>;
	}
	export namespace imports {
		export type Promisify<T> = $wcm.$imports.Promisify<T>;
	}
	export type Exports = {
		/**
		 * @throws ErrorCode.Error_
		 */
		setup: (appName: string, appBytes: Uint8Array, opts: Options) => string;
		/**
		 * @throws ErrorCode.Error_
		 */
		run: (script: string, appName: string) => Probe[];
		/**
		 * @throws ErrorCode.Error_
		 */
		wat2wat: (content: string) => string;
		/**
		 * @throws ErrorCode.Error_
		 */
		wasm2wat: (content: Uint8Array) => string;
	};
	export namespace Exports {
		export type Promisified = $wcm.$exports.Promisify<Exports>;
	}
	export namespace exports {
		export type Promisify<T> = $wcm.$exports.Promisify<T>;
	}
}

export namespace Types.$ {
	export const Options = new $wcm.RecordType<Types.Options>([
		['asMonitorModule', $wcm.bool],
	]);
	export const Mode = new $wcm.EnumType<Types.Mode>(['before', 'after', 'alt', 'entry', 'exit']);
	export const ScriptLoc = new $wcm.RecordType<Types.ScriptLoc>([
		['l', $wcm.u32],
		['c', $wcm.u32],
	]);
	export const AppLoc = new $wcm.RecordType<Types.AppLoc>([
		['byteOffset', $wcm.u64],
		['mode', Mode],
	]);
	export const Probe = new $wcm.RecordType<Types.Probe>([
		['appLoc', AppLoc],
		['scriptLoc', ScriptLoc],
		['wat', $wcm.wstring],
	]);
	export const ErrorCode = new $wcm.VariantType<Types.ErrorCode, Types.ErrorCode._tt, Types.ErrorCode._vt>([['invalid', $wcm.wstring], ['unexpected', $wcm.wstring], ['noChange', $wcm.wstring]], Types.ErrorCode._ctor);
}
export namespace Types._ {
	export const id = 'vscode:example/types' as const;
	export const witName = 'types' as const;
	export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
		['Options', $.Options],
		['Mode', $.Mode],
		['ScriptLoc', $.ScriptLoc],
		['AppLoc', $.AppLoc],
		['Probe', $.Probe],
		['ErrorCode', $.ErrorCode]
	]);
	export type WasmInterface = {
	};
}
export namespace whammServer.$ {
	export const Options = Types.$.Options;
	export const Probe = Types.$.Probe;
	export const ErrorCode = Types.$.ErrorCode;
	export namespace imports {
		export const log = new $wcm.FunctionType<whammServer.Imports['log']>('log',[
			['msg', $wcm.wstring],
		], undefined);
	}
	export namespace exports {
		export const setup = new $wcm.FunctionType<whammServer.Exports['setup']>('setup',[
			['appName', $wcm.wstring],
			['appBytes', new $wcm.Uint8ArrayType()],
			['opts', Options],
		], new $wcm.ResultType<string, whammServer.ErrorCode>($wcm.wstring, ErrorCode, Types.ErrorCode.Error_));
		export const run = new $wcm.FunctionType<whammServer.Exports['run']>('run',[
			['script', $wcm.wstring],
			['appName', $wcm.wstring],
		], new $wcm.ResultType<whammServer.Probe[], whammServer.ErrorCode>(new $wcm.ListType<whammServer.Probe>(Probe), ErrorCode, Types.ErrorCode.Error_));
		export const wat2wat = new $wcm.FunctionType<whammServer.Exports['wat2wat']>('wat2wat',[
			['content', $wcm.wstring],
		], new $wcm.ResultType<string, whammServer.ErrorCode>($wcm.wstring, ErrorCode, Types.ErrorCode.Error_));
		export const wasm2wat = new $wcm.FunctionType<whammServer.Exports['wasm2wat']>('wasm2wat',[
			['content', new $wcm.Uint8ArrayType()],
		], new $wcm.ResultType<string, whammServer.ErrorCode>($wcm.wstring, ErrorCode, Types.ErrorCode.Error_));
	}
}
export namespace whammServer._ {
	export const id = 'vscode:example/whamm-server' as const;
	export const witName = 'whamm-server' as const;
	export type $Root = {
		'log': (msg_ptr: i32, msg_len: i32) => void;
	};
	export namespace imports {
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['log', $.imports.log]
		]);
		export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
			['Types', Types._]
		]);
		export function create(service: whammServer.Imports, context: $wcm.WasmContext): Imports {
			return $wcm.$imports.create<Imports>(_, service, context);
		}
		export function loop(service: whammServer.Imports, context: $wcm.WasmContext): whammServer.Imports {
			return $wcm.$imports.loop<whammServer.Imports>(_, service, context);
		}
	}
	export type Imports = {
		'$root': $Root;
	};
	export namespace exports {
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['setup', $.exports.setup],
			['run', $.exports.run],
			['wat2wat', $.exports.wat2wat],
			['wasm2wat', $.exports.wasm2wat]
		]);
		export function bind(exports: Exports, context: $wcm.WasmContext): whammServer.Exports {
			return $wcm.$exports.bind<whammServer.Exports>(_, exports, context);
		}
	}
	export type Exports = {
		'setup': (appName_ptr: i32, appName_len: i32, appBytes_ptr: i32, appBytes_len: i32, opts_Options_asMonitorModule: i32, result: ptr<result<string, ErrorCode>>) => void;
		'run': (script_ptr: i32, script_len: i32, appName_ptr: i32, appName_len: i32, result: ptr<result<Probe[], ErrorCode>>) => void;
		'wat2wat': (content_ptr: i32, content_len: i32, result: ptr<result<string, ErrorCode>>) => void;
		'wasm2wat': (content_ptr: i32, content_len: i32, result: ptr<result<string, ErrorCode>>) => void;
	};
	export function bind(service: whammServer.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<whammServer.Exports>;
	export function bind(service: whammServer.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<whammServer.Exports.Promisified>;
	export function bind(service: whammServer.Imports | whammServer.Imports.Promisified, code: $wcm.Code, portOrContext?: $wcm.RAL.ConnectionPort | $wcm.ComponentModelContext, context?: $wcm.ComponentModelContext | undefined): Promise<whammServer.Exports> | Promise<whammServer.Exports.Promisified> {
		return $wcm.$main.bind(_, service, code, portOrContext, context);
	}
}