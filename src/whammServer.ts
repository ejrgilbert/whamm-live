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

	/**
	 * injected related tyoes
	 */
	export enum FuncBodyInstrumentationMode {
		before = 'before',
		after = 'after',
		alternate = 'alternate',
		semanticAfter = 'semanticAfter',
		blockEntry = 'blockEntry',
		blockExit = 'blockExit',
		blockAlt = 'blockAlt'
	}

	export enum FuncInstrumentationMode {
		entry = 'entry',
		exit = 'exit'
	}

	export type LineColData = {
		l: u32;
		c: u32;
	};

	export type SpanData = {
		lc0: LineColData;
		lc1: LineColData;
	};

	export namespace WhammCause {
		export const userPos = 'userPos' as const;
		export type UserPos = { readonly tag: typeof userPos; readonly value: SpanData } & _common;
		export function UserPos(value: SpanData): UserPos {
			return new VariantImpl(userPos, value) as UserPos;
		}

		export const userSpan = 'userSpan' as const;
		export type UserSpan = { readonly tag: typeof userSpan; readonly value: SpanData } & _common;
		export function UserSpan(value: SpanData): UserSpan {
			return new VariantImpl(userSpan, value) as UserSpan;
		}

		export const userProbe = 'userProbe' as const;
		export type UserProbe = { readonly tag: typeof userProbe; readonly value: SpanData } & _common;
		export function UserProbe(value: SpanData): UserProbe {
			return new VariantImpl(userProbe, value) as UserProbe;
		}

		export const whamm = 'whamm' as const;
		export type Whamm = { readonly tag: typeof whamm } & _common;
		export function Whamm(): Whamm {
			return new VariantImpl(whamm, undefined) as Whamm;
		}

		export type _tt = typeof userPos | typeof userSpan | typeof userProbe | typeof whamm;
		export type _vt = SpanData | SpanData | SpanData | undefined;
		type _common = Omit<VariantImpl, 'tag' | 'value'>;
		export function _ctor(t: _tt, v: _vt): WhammCause {
			return new VariantImpl(t, v) as WhammCause;
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
			isUserPos(): this is UserPos {
				return this._tag === WhammCause.userPos;
			}
			isUserSpan(): this is UserSpan {
				return this._tag === WhammCause.userSpan;
			}
			isUserProbe(): this is UserProbe {
				return this._tag === WhammCause.userProbe;
			}
			isWhamm(): this is Whamm {
				return this._tag === WhammCause.whamm;
			}
		}
	}
	export type WhammCause = WhammCause.UserPos | WhammCause.UserSpan | WhammCause.UserProbe | WhammCause.Whamm;

	/**
	 * injection record types
	 */
	export type ImportRecord = {
		module: string;
		name: string;
		typeRef: string;
		cause: WhammCause;
	};

	export type ExportRecord = {
		name: string;
		kind: string;
		index: u32;
		cause: WhammCause;
	};

	export type TypeRecord = {
		ty: string;
		cause: WhammCause;
	};

	export type MemoryRecord = {
		id: u32;

		/**
		 * ToDo -- may not need (it's ordered in a list)
		 */
		initial: u64;
		maximum?: u64 | undefined;
		cause: WhammCause;
	};

	export type ActiveDataRecord = {
		memoryIndex: u32;
		offsetExpr: string[];
		data: Uint8Array;
		cause: WhammCause;
	};

	export type PassiveDataRecord = {
		data: Uint8Array;
		cause: WhammCause;
	};

	export type GlobalRecord = {
		id: u32;
		ty: string;
		shared: boolean;
		mutable: boolean;
		initExpr: string[];
		cause: WhammCause;
	};

	export type FunctionRecord = {
		id: u32;
		fname?: string | undefined;
		sig: [string[], string[]];
		locals: string[];
		body: string[];
		cause: WhammCause;
	};

	export type LocalRecord = {
		targetFid: u32;
		ty: string;
		cause: WhammCause;
	};

	export type TableRecord = {
		cause: WhammCause;
	};

	export type ElementRecord = {
		cause: WhammCause;
	};

	export type OpProbeRecord = {
		targetFid: u32;
		targetOpcodeIdx: u32;
		mode: FuncBodyInstrumentationMode;
		body: string[];
		cause: WhammCause;
	};

	export type FuncProbeRecord = {
		targetFid: u32;
		mode: FuncInstrumentationMode;
		body: string[];
		cause: WhammCause;
	};

	export enum WhammDataType {
		importType = 'importType',
		exportType = 'exportType',
		typeType = 'typeType',
		memoryType = 'memoryType',
		activeDataType = 'activeDataType',
		passiveDataType = 'passiveDataType',
		globalType = 'globalType',
		functionType = 'functionType',
		localType = 'localType',
		tableType = 'tableType',
		elementType = 'elementType',
		opProbeType = 'opProbeType',
		funcProbeType = 'funcProbeType'
	}

	/**
	 * TODO
	 * Need to configure how variant can be used instead of this gross struct
	 * Note: Using a variant gives an error
	 */
	export type WhammInjection = {
		dataType: WhammDataType;
		importData?: ImportRecord | undefined;
		exportData?: ExportRecord | undefined;
		typeData?: TypeRecord | undefined;
		memoryData?: MemoryRecord | undefined;
		activeData?: ActiveDataRecord | undefined;
		passiveData?: PassiveDataRecord | undefined;
		globalData?: GlobalRecord | undefined;
		functionData?: FunctionRecord | undefined;
		localData?: LocalRecord | undefined;
		tableData?: TableRecord | undefined;
		elementData?: ElementRecord | undefined;
		opProbeData?: OpProbeRecord | undefined;
		funcProbeData?: FuncProbeRecord | undefined;
	};

	export type InjectionPair = {
		injectionType: string;
		injectionValue: WhammInjection[];
	};

	/**
	 * whamm error types
	 */
	export type ErrorCodeLocation = {
		isErr: boolean;
		message?: string | undefined;
		lineCol: SpanData;
		lineStr?: string | undefined;
		line2Str?: string | undefined;
	};

	export type WhammApiError = {
		errLoc?: ErrorCodeLocation | undefined;
		infoLoc?: ErrorCodeLocation | undefined;
		message: string;
	};

	export namespace ErrorWrapper {
		export const apiError = 'apiError' as const;
		export type ApiError = { readonly tag: typeof apiError; readonly value: WhammApiError[] } & _common;
		export function ApiError(value: WhammApiError[]): ApiError {
			return new VariantImpl(apiError, value) as ApiError;
		}

		export type _tt = typeof apiError;
		export type _vt = WhammApiError[];
		type _common = Omit<VariantImpl, 'tag' | 'value'>;
		export function _ctor(t: _tt, v: _vt): ErrorWrapper {
			return new VariantImpl(t, v) as ErrorWrapper;
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
			isApiError(): this is ApiError {
				return this._tag === ErrorWrapper.apiError;
			}
		}
	}
	export type ErrorWrapper = ErrorWrapper.ApiError;
	export namespace ErrorWrapper {
		export class Error_ extends $wcm.ResultError<ErrorWrapper> {
			constructor(cause: ErrorWrapper) {
				super(`ErrorWrapper: ${cause}`, cause);
			}
		}
	}
}
export type Types = {
};
export namespace whammServer {
	export type Options = Types.Options;
	export type ErrorCode = Types.ErrorCode;
	export const ErrorCode = Types.ErrorCode;
	export type InjectionPair = Types.InjectionPair;
	export type ErrorWrapper = Types.ErrorWrapper;
	export const ErrorWrapper = Types.ErrorWrapper;
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
		setup: (appName: string, appBytes: Uint8Array, script: string, opts: Options) => string;
		end: (appName: string) => void;
		/**
		 * No hash map support in wit. So, we usea list of key-value pairs
		 *
		 * @throws ErrorWrapper.Error_
		 */
		run: (script: string, appName: string, scriptPath: string) => InjectionPair[];
		noChange: (newScript: string, appName: string) => boolean;
		updateWhamm: (newScript: string, appName: string) => void;
		/**
		 * @throws ErrorCode.Error_
		 */
		wat2watandwasm: (content: string) => [string, Uint8Array];
		/**
		 * @throws ErrorCode.Error_
		 */
		wasm2watandwasm: (content: Uint8Array) => [string, Uint8Array];
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
	export const ErrorCode = new $wcm.VariantType<Types.ErrorCode, Types.ErrorCode._tt, Types.ErrorCode._vt>([['invalid', $wcm.wstring], ['unexpected', $wcm.wstring], ['noChange', $wcm.wstring]], Types.ErrorCode._ctor);
	export const FuncBodyInstrumentationMode = new $wcm.EnumType<Types.FuncBodyInstrumentationMode>(['before', 'after', 'alternate', 'semanticAfter', 'blockEntry', 'blockExit', 'blockAlt']);
	export const FuncInstrumentationMode = new $wcm.EnumType<Types.FuncInstrumentationMode>(['entry', 'exit']);
	export const LineColData = new $wcm.RecordType<Types.LineColData>([
		['l', $wcm.u32],
		['c', $wcm.u32],
	]);
	export const SpanData = new $wcm.RecordType<Types.SpanData>([
		['lc0', LineColData],
		['lc1', LineColData],
	]);
	export const WhammCause = new $wcm.VariantType<Types.WhammCause, Types.WhammCause._tt, Types.WhammCause._vt>([['userPos', SpanData], ['userSpan', SpanData], ['userProbe', SpanData], ['whamm', undefined]], Types.WhammCause._ctor);
	export const ImportRecord = new $wcm.RecordType<Types.ImportRecord>([
		['module', $wcm.wstring],
		['name', $wcm.wstring],
		['typeRef', $wcm.wstring],
		['cause', WhammCause],
	]);
	export const ExportRecord = new $wcm.RecordType<Types.ExportRecord>([
		['name', $wcm.wstring],
		['kind', $wcm.wstring],
		['index', $wcm.u32],
		['cause', WhammCause],
	]);
	export const TypeRecord = new $wcm.RecordType<Types.TypeRecord>([
		['ty', $wcm.wstring],
		['cause', WhammCause],
	]);
	export const MemoryRecord = new $wcm.RecordType<Types.MemoryRecord>([
		['id', $wcm.u32],
		['initial', $wcm.u64],
		['maximum', new $wcm.OptionType<u64>($wcm.u64)],
		['cause', WhammCause],
	]);
	export const ActiveDataRecord = new $wcm.RecordType<Types.ActiveDataRecord>([
		['memoryIndex', $wcm.u32],
		['offsetExpr', new $wcm.ListType<string>($wcm.wstring)],
		['data', new $wcm.Uint8ArrayType()],
		['cause', WhammCause],
	]);
	export const PassiveDataRecord = new $wcm.RecordType<Types.PassiveDataRecord>([
		['data', new $wcm.Uint8ArrayType()],
		['cause', WhammCause],
	]);
	export const GlobalRecord = new $wcm.RecordType<Types.GlobalRecord>([
		['id', $wcm.u32],
		['ty', $wcm.wstring],
		['shared', $wcm.bool],
		['mutable', $wcm.bool],
		['initExpr', new $wcm.ListType<string>($wcm.wstring)],
		['cause', WhammCause],
	]);
	export const FunctionRecord = new $wcm.RecordType<Types.FunctionRecord>([
		['id', $wcm.u32],
		['fname', new $wcm.OptionType<string>($wcm.wstring)],
		['sig', new $wcm.TupleType<[string[], string[]]>([new $wcm.ListType<string>($wcm.wstring), new $wcm.ListType<string>($wcm.wstring)])],
		['locals', new $wcm.ListType<string>($wcm.wstring)],
		['body', new $wcm.ListType<string>($wcm.wstring)],
		['cause', WhammCause],
	]);
	export const LocalRecord = new $wcm.RecordType<Types.LocalRecord>([
		['targetFid', $wcm.u32],
		['ty', $wcm.wstring],
		['cause', WhammCause],
	]);
	export const TableRecord = new $wcm.RecordType<Types.TableRecord>([
		['cause', WhammCause],
	]);
	export const ElementRecord = new $wcm.RecordType<Types.ElementRecord>([
		['cause', WhammCause],
	]);
	export const OpProbeRecord = new $wcm.RecordType<Types.OpProbeRecord>([
		['targetFid', $wcm.u32],
		['targetOpcodeIdx', $wcm.u32],
		['mode', FuncBodyInstrumentationMode],
		['body', new $wcm.ListType<string>($wcm.wstring)],
		['cause', WhammCause],
	]);
	export const FuncProbeRecord = new $wcm.RecordType<Types.FuncProbeRecord>([
		['targetFid', $wcm.u32],
		['mode', FuncInstrumentationMode],
		['body', new $wcm.ListType<string>($wcm.wstring)],
		['cause', WhammCause],
	]);
	export const WhammDataType = new $wcm.EnumType<Types.WhammDataType>(['importType', 'exportType', 'typeType', 'memoryType', 'activeDataType', 'passiveDataType', 'globalType', 'functionType', 'localType', 'tableType', 'elementType', 'opProbeType', 'funcProbeType']);
	export const WhammInjection = new $wcm.RecordType<Types.WhammInjection>([
		['dataType', WhammDataType],
		['importData', new $wcm.OptionType<Types.ImportRecord>(ImportRecord)],
		['exportData', new $wcm.OptionType<Types.ExportRecord>(ExportRecord)],
		['typeData', new $wcm.OptionType<Types.TypeRecord>(TypeRecord)],
		['memoryData', new $wcm.OptionType<Types.MemoryRecord>(MemoryRecord)],
		['activeData', new $wcm.OptionType<Types.ActiveDataRecord>(ActiveDataRecord)],
		['passiveData', new $wcm.OptionType<Types.PassiveDataRecord>(PassiveDataRecord)],
		['globalData', new $wcm.OptionType<Types.GlobalRecord>(GlobalRecord)],
		['functionData', new $wcm.OptionType<Types.FunctionRecord>(FunctionRecord)],
		['localData', new $wcm.OptionType<Types.LocalRecord>(LocalRecord)],
		['tableData', new $wcm.OptionType<Types.TableRecord>(TableRecord)],
		['elementData', new $wcm.OptionType<Types.ElementRecord>(ElementRecord)],
		['opProbeData', new $wcm.OptionType<Types.OpProbeRecord>(OpProbeRecord)],
		['funcProbeData', new $wcm.OptionType<Types.FuncProbeRecord>(FuncProbeRecord)],
	]);
	export const InjectionPair = new $wcm.RecordType<Types.InjectionPair>([
		['injectionType', $wcm.wstring],
		['injectionValue', new $wcm.ListType<Types.WhammInjection>(WhammInjection)],
	]);
	export const ErrorCodeLocation = new $wcm.RecordType<Types.ErrorCodeLocation>([
		['isErr', $wcm.bool],
		['message', new $wcm.OptionType<string>($wcm.wstring)],
		['lineCol', SpanData],
		['lineStr', new $wcm.OptionType<string>($wcm.wstring)],
		['line2Str', new $wcm.OptionType<string>($wcm.wstring)],
	]);
	export const WhammApiError = new $wcm.RecordType<Types.WhammApiError>([
		['errLoc', new $wcm.OptionType<Types.ErrorCodeLocation>(ErrorCodeLocation)],
		['infoLoc', new $wcm.OptionType<Types.ErrorCodeLocation>(ErrorCodeLocation)],
		['message', $wcm.wstring],
	]);
	export const ErrorWrapper = new $wcm.VariantType<Types.ErrorWrapper, Types.ErrorWrapper._tt, Types.ErrorWrapper._vt>([['apiError', new $wcm.ListType<Types.WhammApiError>(WhammApiError)]], Types.ErrorWrapper._ctor);
}
export namespace Types._ {
	export const id = 'vscode:example/types' as const;
	export const witName = 'types' as const;
	export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
		['Options', $.Options],
		['ErrorCode', $.ErrorCode],
		['FuncBodyInstrumentationMode', $.FuncBodyInstrumentationMode],
		['FuncInstrumentationMode', $.FuncInstrumentationMode],
		['LineColData', $.LineColData],
		['SpanData', $.SpanData],
		['WhammCause', $.WhammCause],
		['ImportRecord', $.ImportRecord],
		['ExportRecord', $.ExportRecord],
		['TypeRecord', $.TypeRecord],
		['MemoryRecord', $.MemoryRecord],
		['ActiveDataRecord', $.ActiveDataRecord],
		['PassiveDataRecord', $.PassiveDataRecord],
		['GlobalRecord', $.GlobalRecord],
		['FunctionRecord', $.FunctionRecord],
		['LocalRecord', $.LocalRecord],
		['TableRecord', $.TableRecord],
		['ElementRecord', $.ElementRecord],
		['OpProbeRecord', $.OpProbeRecord],
		['FuncProbeRecord', $.FuncProbeRecord],
		['WhammDataType', $.WhammDataType],
		['WhammInjection', $.WhammInjection],
		['InjectionPair', $.InjectionPair],
		['ErrorCodeLocation', $.ErrorCodeLocation],
		['WhammApiError', $.WhammApiError],
		['ErrorWrapper', $.ErrorWrapper]
	]);
	export type WasmInterface = {
	};
}
export namespace whammServer.$ {
	export const Options = Types.$.Options;
	export const ErrorCode = Types.$.ErrorCode;
	export const InjectionPair = Types.$.InjectionPair;
	export const ErrorWrapper = Types.$.ErrorWrapper;
	export namespace imports {
		export const log = new $wcm.FunctionType<whammServer.Imports['log']>('log',[
			['msg', $wcm.wstring],
		], undefined);
	}
	export namespace exports {
		export const setup = new $wcm.FunctionType<whammServer.Exports['setup']>('setup',[
			['appName', $wcm.wstring],
			['appBytes', new $wcm.Uint8ArrayType()],
			['script', $wcm.wstring],
			['opts', Options],
		], new $wcm.ResultType<string, whammServer.ErrorCode>($wcm.wstring, ErrorCode, Types.ErrorCode.Error_));
		export const end = new $wcm.FunctionType<whammServer.Exports['end']>('end',[
			['appName', $wcm.wstring],
		], undefined);
		export const run = new $wcm.FunctionType<whammServer.Exports['run']>('run',[
			['script', $wcm.wstring],
			['appName', $wcm.wstring],
			['scriptPath', $wcm.wstring],
		], new $wcm.ResultType<whammServer.InjectionPair[], whammServer.ErrorWrapper>(new $wcm.ListType<whammServer.InjectionPair>(InjectionPair), ErrorWrapper, Types.ErrorWrapper.Error_));
		export const noChange = new $wcm.FunctionType<whammServer.Exports['noChange']>('no-change',[
			['newScript', $wcm.wstring],
			['appName', $wcm.wstring],
		], $wcm.bool);
		export const updateWhamm = new $wcm.FunctionType<whammServer.Exports['updateWhamm']>('update-whamm',[
			['newScript', $wcm.wstring],
			['appName', $wcm.wstring],
		], undefined);
		export const wat2watandwasm = new $wcm.FunctionType<whammServer.Exports['wat2watandwasm']>('wat2watandwasm',[
			['content', $wcm.wstring],
		], new $wcm.ResultType<[string, Uint8Array], whammServer.ErrorCode>(new $wcm.TupleType<[string, Uint8Array]>([$wcm.wstring, new $wcm.Uint8ArrayType()]), ErrorCode, Types.ErrorCode.Error_));
		export const wasm2watandwasm = new $wcm.FunctionType<whammServer.Exports['wasm2watandwasm']>('wasm2watandwasm',[
			['content', new $wcm.Uint8ArrayType()],
		], new $wcm.ResultType<[string, Uint8Array], whammServer.ErrorCode>(new $wcm.TupleType<[string, Uint8Array]>([$wcm.wstring, new $wcm.Uint8ArrayType()]), ErrorCode, Types.ErrorCode.Error_));
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
			['end', $.exports.end],
			['run', $.exports.run],
			['noChange', $.exports.noChange],
			['updateWhamm', $.exports.updateWhamm],
			['wat2watandwasm', $.exports.wat2watandwasm],
			['wasm2watandwasm', $.exports.wasm2watandwasm]
		]);
		export function bind(exports: Exports, context: $wcm.WasmContext): whammServer.Exports {
			return $wcm.$exports.bind<whammServer.Exports>(_, exports, context);
		}
	}
	export type Exports = {
		'setup': (appName_ptr: i32, appName_len: i32, appBytes_ptr: i32, appBytes_len: i32, script_ptr: i32, script_len: i32, opts_Options_asMonitorModule: i32, result: ptr<result<string, ErrorCode>>) => void;
		'end': (appName_ptr: i32, appName_len: i32) => void;
		'run': (script_ptr: i32, script_len: i32, appName_ptr: i32, appName_len: i32, scriptPath_ptr: i32, scriptPath_len: i32, result: ptr<result<InjectionPair[], ErrorWrapper>>) => void;
		'no-change': (newScript_ptr: i32, newScript_len: i32, appName_ptr: i32, appName_len: i32) => i32;
		'update-whamm': (newScript_ptr: i32, newScript_len: i32, appName_ptr: i32, appName_len: i32) => void;
		'wat2watandwasm': (content_ptr: i32, content_len: i32, result: ptr<result<[string, Uint8Array], ErrorCode>>) => void;
		'wasm2watandwasm': (content_ptr: i32, content_len: i32, result: ptr<result<[string, Uint8Array], ErrorCode>>) => void;
	};
	export function bind(service: whammServer.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<whammServer.Exports>;
	export function bind(service: whammServer.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<whammServer.Exports.Promisified>;
	export function bind(service: whammServer.Imports | whammServer.Imports.Promisified, code: $wcm.Code, portOrContext?: $wcm.RAL.ConnectionPort | $wcm.ComponentModelContext, context?: $wcm.ComponentModelContext | undefined): Promise<whammServer.Exports> | Promise<whammServer.Exports.Promisified> {
		return $wcm.$main.bind(_, service, code, portOrContext, context);
	}
}