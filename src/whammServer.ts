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

	export namespace Mode {
		export const before = 'before' as const;
		export type Before = { readonly tag: typeof before } & _common;
		export function Before(): Before {
			return new VariantImpl(before, undefined) as Before;
		}

		export const after = 'after' as const;
		export type After = { readonly tag: typeof after } & _common;
		export function After(): After {
			return new VariantImpl(after, undefined) as After;
		}

		export const alt = 'alt' as const;
		export type Alt = { readonly tag: typeof alt } & _common;
		export function Alt(): Alt {
			return new VariantImpl(alt, undefined) as Alt;
		}

		export const entry = 'entry' as const;
		export type Entry = { readonly tag: typeof entry } & _common;
		export function Entry(): Entry {
			return new VariantImpl(entry, undefined) as Entry;
		}

		export const exit = 'exit' as const;
		export type Exit = { readonly tag: typeof exit } & _common;
		export function Exit(): Exit {
			return new VariantImpl(exit, undefined) as Exit;
		}

		export type _tt = typeof before | typeof after | typeof alt | typeof entry | typeof exit;
		export type _vt = undefined;
		type _common = Omit<VariantImpl, 'tag' | 'value'>;
		export function _ctor(t: _tt, v: _vt): Mode {
			return new VariantImpl(t, v) as Mode;
		}
		class VariantImpl {
			private readonly _tag: _tt;
			private readonly _value?: _vt;
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
			isBefore(): this is Before {
				return this._tag === Mode.before;
			}
			isAfter(): this is After {
				return this._tag === Mode.after;
			}
			isAlt(): this is Alt {
				return this._tag === Mode.alt;
			}
			isEntry(): this is Entry {
				return this._tag === Mode.entry;
			}
			isExit(): this is Exit {
				return this._tag === Mode.exit;
			}
		}
	}
	export type Mode = Mode.Before | Mode.After | Mode.Alt | Mode.Entry | Mode.Exit;

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
	export enum ErrorCode {
		invalid = 'invalid',
		unexpected = 'unexpected'
	}
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
		setup: (app: string, script: string, opts: Options) => string;
		/**
		 * @throws ErrorCode.Error_
		 */
		run: () => Probe[];
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
	export const Mode = new $wcm.VariantType<Types.Mode, Types.Mode._tt, Types.Mode._vt>([['before', undefined], ['after', undefined], ['alt', undefined], ['entry', undefined], ['exit', undefined]], Types.Mode._ctor);
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
	export const ErrorCode = new $wcm.EnumType<Types.ErrorCode>(['invalid', 'unexpected']);
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
			['app', $wcm.wstring],
			['script', $wcm.wstring],
			['opts', Options],
		], new $wcm.ResultType<string, whammServer.ErrorCode>($wcm.wstring, ErrorCode, Types.ErrorCode.Error_));
		export const run = new $wcm.FunctionType<whammServer.Exports['run']>('run', [], new $wcm.ResultType<whammServer.Probe[], whammServer.ErrorCode>(new $wcm.ListType<whammServer.Probe>(Probe), ErrorCode, Types.ErrorCode.Error_));
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
			['run', $.exports.run]
		]);
		export function bind(exports: Exports, context: $wcm.WasmContext): whammServer.Exports {
			return $wcm.$exports.bind<whammServer.Exports>(_, exports, context);
		}
	}
	export type Exports = {
		'setup': (app_ptr: i32, app_len: i32, script_ptr: i32, script_len: i32, opts_Options_asMonitorModule: i32, result: ptr<result<string, ErrorCode>>) => void;
		'run': (result: ptr<result<Probe[], ErrorCode>>) => void;
	};
	export function bind(service: whammServer.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<whammServer.Exports>;
	export function bind(service: whammServer.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<whammServer.Exports.Promisified>;
	export function bind(service: whammServer.Imports | whammServer.Imports.Promisified, code: $wcm.Code, portOrContext?: $wcm.RAL.ConnectionPort | $wcm.ComponentModelContext, context?: $wcm.ComponentModelContext | undefined): Promise<whammServer.Exports> | Promise<whammServer.Exports.Promisified> {
		return $wcm.$main.bind(_, service, code, portOrContext, context);
	}
}