/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, u64, i32, ptr, result } from '@vscode/wasm-component-model';

export namespace Types {
	export enum InjectType {
		typeInject = 'typeInject',
		importInject = 'importInject',
		exportInject = 'exportInject',
		memoryInject = 'memoryInject',
		dataInject = 'dataInject',
		globalInject = 'globalInject',
		funcInject = 'funcInject',
		localInject = 'localInject',
		tableInject = 'tableInject',
		elementInject = 'elementInject',
		probeInject = 'probeInject'
	}

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
	export type LineCol = {
		l: u32;
		c: u32;
	};

	export type Span = {
		lc0: LineCol;
		lc1: LineCol;
	};

	export namespace Cause {
		export const userPos = 'userPos' as const;
		export type UserPos = { readonly tag: typeof userPos; readonly value: LineCol } & _common;
		export function UserPos(value: LineCol): UserPos {
			return new VariantImpl(userPos, value) as UserPos;
		}

		export const userSpan = 'userSpan' as const;
		export type UserSpan = { readonly tag: typeof userSpan; readonly value: Span } & _common;
		export function UserSpan(value: Span): UserSpan {
			return new VariantImpl(userSpan, value) as UserSpan;
		}

		export const userProbe = 'userProbe' as const;
		export type UserProbe = { readonly tag: typeof userProbe; readonly value: Span } & _common;
		export function UserProbe(value: Span): UserProbe {
			return new VariantImpl(userProbe, value) as UserProbe;
		}

		export const whamm = 'whamm' as const;
		export type Whamm = { readonly tag: typeof whamm } & _common;
		export function Whamm(): Whamm {
			return new VariantImpl(whamm, undefined) as Whamm;
		}

		export type _tt = typeof userPos | typeof userSpan | typeof userProbe | typeof whamm;
		export type _vt = LineCol | Span | Span | undefined;
		type _common = Omit<VariantImpl, 'tag' | 'value'>;
		export function _ctor(t: _tt, v: _vt): Cause {
			return new VariantImpl(t, v) as Cause;
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
				return this._tag === Cause.userPos;
			}
			isUserSpan(): this is UserSpan {
				return this._tag === Cause.userSpan;
			}
			isUserProbe(): this is UserProbe {
				return this._tag === Cause.userProbe;
			}
			isWhamm(): this is Whamm {
				return this._tag === Cause.whamm;
			}
		}
	}
	export type Cause = Cause.UserPos | Cause.UserSpan | Cause.UserProbe | Cause.Whamm;

	/**
	 * injection record types
	 */
	export type ImportRecord = {
		module: string;
		name: string;
		typeRef: string;
		cause: Cause;
	};

	export type ExportRecord = {
		name: string;
		kind: string;
		index: u32;
		cause: Cause;
	};

	export type TypeRecord = {
		ty: string;
		cause: Cause;
	};

	export type MemoryRecord = {
		id: u32;

		/**
		 * ToDo -- may not need (it's ordered in a list)
		 */
		initial: u64;
		maximum?: u64 | undefined;
		cause: Cause;
	};

	export type ActiveDataRecord = {
		memoryIndex: u32;
		offsetExpr: string[];
		data: Uint8Array;
		cause: Cause;
	};

	export type PassiveDataRecord = {
		data: Uint8Array;
		cause: Cause;
	};

	export type GlobalRecord = {
		id: u32;
		ty: string;
		shared: boolean;
		mutable: boolean;
		initExpr: string[];
		cause: Cause;
	};

	export type FunctionRecord = {
		id: u32;
		fname?: string | undefined;
		sig: [string[], string[]];
		locals: string[];
		body: string[];
		cause: Cause;
	};

	export type LocalRecord = {
		targetFid: u32;
		ty: string;
		cause: Cause;
	};

	export type TableRecord = {
		cause: Cause;
	};

	export type ElementRecord = {
		cause: Cause;
	};

	export type OpProbeRecord = {
		targetFid: u32;
		targetOpcodeIdx: u32;
		mode: string;
		body: string[];
		cause: Cause;
	};

	export type FuncProbeRecord = {
		targetFid: u32;
		mode: string;
		body: string[];
		cause: Cause;
	};

	export namespace Injection {
		export const importType = 'importType' as const;
		export type ImportType = { readonly tag: typeof importType; readonly value: ImportRecord } & _common;
		export function ImportType(value: ImportRecord): ImportType {
			return new VariantImpl(importType, value) as ImportType;
		}

		export const exportType = 'exportType' as const;
		export type ExportType = { readonly tag: typeof exportType; readonly value: ExportRecord } & _common;
		export function ExportType(value: ExportRecord): ExportType {
			return new VariantImpl(exportType, value) as ExportType;
		}

		export const typeType = 'typeType' as const;
		export type TypeType = { readonly tag: typeof typeType; readonly value: TypeRecord } & _common;
		export function TypeType(value: TypeRecord): TypeType {
			return new VariantImpl(typeType, value) as TypeType;
		}

		export const memoryType = 'memoryType' as const;
		export type MemoryType = { readonly tag: typeof memoryType; readonly value: MemoryRecord } & _common;
		export function MemoryType(value: MemoryRecord): MemoryType {
			return new VariantImpl(memoryType, value) as MemoryType;
		}

		export const activeDataType = 'activeDataType' as const;
		export type ActiveDataType = { readonly tag: typeof activeDataType; readonly value: ActiveDataRecord } & _common;
		export function ActiveDataType(value: ActiveDataRecord): ActiveDataType {
			return new VariantImpl(activeDataType, value) as ActiveDataType;
		}

		export const passiveDataType = 'passiveDataType' as const;
		export type PassiveDataType = { readonly tag: typeof passiveDataType; readonly value: PassiveDataRecord } & _common;
		export function PassiveDataType(value: PassiveDataRecord): PassiveDataType {
			return new VariantImpl(passiveDataType, value) as PassiveDataType;
		}

		export const globalType = 'globalType' as const;
		export type GlobalType = { readonly tag: typeof globalType; readonly value: GlobalRecord } & _common;
		export function GlobalType(value: GlobalRecord): GlobalType {
			return new VariantImpl(globalType, value) as GlobalType;
		}

		export const functionType = 'functionType' as const;
		export type FunctionType = { readonly tag: typeof functionType; readonly value: FunctionRecord } & _common;
		export function FunctionType(value: FunctionRecord): FunctionType {
			return new VariantImpl(functionType, value) as FunctionType;
		}

		export const localType = 'localType' as const;
		export type LocalType = { readonly tag: typeof localType; readonly value: LocalRecord } & _common;
		export function LocalType(value: LocalRecord): LocalType {
			return new VariantImpl(localType, value) as LocalType;
		}

		export const tableType = 'tableType' as const;
		export type TableType = { readonly tag: typeof tableType; readonly value: TableRecord } & _common;
		export function TableType(value: TableRecord): TableType {
			return new VariantImpl(tableType, value) as TableType;
		}

		export const elementType = 'elementType' as const;
		export type ElementType = { readonly tag: typeof elementType; readonly value: ElementRecord } & _common;
		export function ElementType(value: ElementRecord): ElementType {
			return new VariantImpl(elementType, value) as ElementType;
		}

		export const opProbeType = 'opProbeType' as const;
		export type OpProbeType = { readonly tag: typeof opProbeType; readonly value: OpProbeRecord } & _common;
		export function OpProbeType(value: OpProbeRecord): OpProbeType {
			return new VariantImpl(opProbeType, value) as OpProbeType;
		}

		export const funcProbeType = 'funcProbeType' as const;
		export type FuncProbeType = { readonly tag: typeof funcProbeType; readonly value: FuncProbeRecord } & _common;
		export function FuncProbeType(value: FuncProbeRecord): FuncProbeType {
			return new VariantImpl(funcProbeType, value) as FuncProbeType;
		}

		export type _tt = typeof importType | typeof exportType | typeof typeType | typeof memoryType | typeof activeDataType | typeof passiveDataType | typeof globalType | typeof functionType | typeof localType | typeof tableType | typeof elementType | typeof opProbeType | typeof funcProbeType;
		export type _vt = ImportRecord | ExportRecord | TypeRecord | MemoryRecord | ActiveDataRecord | PassiveDataRecord | GlobalRecord | FunctionRecord | LocalRecord | TableRecord | ElementRecord | OpProbeRecord | FuncProbeRecord;
		type _common = Omit<VariantImpl, 'tag' | 'value'>;
		export function _ctor(t: _tt, v: _vt): Injection {
			return new VariantImpl(t, v) as Injection;
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
			isImportType(): this is ImportType {
				return this._tag === Injection.importType;
			}
			isExportType(): this is ExportType {
				return this._tag === Injection.exportType;
			}
			isTypeType(): this is TypeType {
				return this._tag === Injection.typeType;
			}
			isMemoryType(): this is MemoryType {
				return this._tag === Injection.memoryType;
			}
			isActiveDataType(): this is ActiveDataType {
				return this._tag === Injection.activeDataType;
			}
			isPassiveDataType(): this is PassiveDataType {
				return this._tag === Injection.passiveDataType;
			}
			isGlobalType(): this is GlobalType {
				return this._tag === Injection.globalType;
			}
			isFunctionType(): this is FunctionType {
				return this._tag === Injection.functionType;
			}
			isLocalType(): this is LocalType {
				return this._tag === Injection.localType;
			}
			isTableType(): this is TableType {
				return this._tag === Injection.tableType;
			}
			isElementType(): this is ElementType {
				return this._tag === Injection.elementType;
			}
			isOpProbeType(): this is OpProbeType {
				return this._tag === Injection.opProbeType;
			}
			isFuncProbeType(): this is FuncProbeType {
				return this._tag === Injection.funcProbeType;
			}
		}
	}
	export type Injection = Injection.ImportType | Injection.ExportType | Injection.TypeType | Injection.MemoryType | Injection.ActiveDataType | Injection.PassiveDataType | Injection.GlobalType | Injection.FunctionType | Injection.LocalType | Injection.TableType | Injection.ElementType | Injection.OpProbeType | Injection.FuncProbeType;

	/**
	 * whamm error types
	 */
	export namespace LineColLocation {
		export const pos = 'pos' as const;
		export type Pos = { readonly tag: typeof pos; readonly value: [u64, u64] } & _common;
		export function Pos(value: [u64, u64]): Pos {
			return new VariantImpl(pos, value) as Pos;
		}

		export const span = 'span' as const;
		export type Span = { readonly tag: typeof span; readonly value: [[u64, u64], [u64, u64]] } & _common;
		export function Span(value: [[u64, u64], [u64, u64]]): Span {
			return new VariantImpl(span, value) as Span;
		}

		export type _tt = typeof pos | typeof span;
		export type _vt = [u64, u64] | [[u64, u64], [u64, u64]];
		type _common = Omit<VariantImpl, 'tag' | 'value'>;
		export function _ctor(t: _tt, v: _vt): LineColLocation {
			return new VariantImpl(t, v) as LineColLocation;
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
			isPos(): this is Pos {
				return this._tag === LineColLocation.pos;
			}
			isSpan(): this is Span {
				return this._tag === LineColLocation.span;
			}
		}
	}
	export type LineColLocation = LineColLocation.Pos | LineColLocation.Span;

	export type CodeLocation = {
		isErr: boolean;
		message?: string | undefined;
		lineCol: LineColLocation;
		lineStr?: string | undefined;
		line2Str?: string | undefined;
	};

	export type WhammError = {
		matchRule?: string | undefined;
		fatal: boolean;
		errLoc?: CodeLocation | undefined;
		infoLoc?: CodeLocation | undefined;
		ty: string;
	};
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
		run: (script: string, appName: string, scriptPath: string) => Probe[];
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
	export const InjectType = new $wcm.EnumType<Types.InjectType>(['typeInject', 'importInject', 'exportInject', 'memoryInject', 'dataInject', 'globalInject', 'funcInject', 'localInject', 'tableInject', 'elementInject', 'probeInject']);
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
	export const LineCol = new $wcm.RecordType<Types.LineCol>([
		['l', $wcm.u32],
		['c', $wcm.u32],
	]);
	export const Span = new $wcm.RecordType<Types.Span>([
		['lc0', LineCol],
		['lc1', LineCol],
	]);
	export const Cause = new $wcm.VariantType<Types.Cause, Types.Cause._tt, Types.Cause._vt>([['userPos', LineCol], ['userSpan', Span], ['userProbe', Span], ['whamm', undefined]], Types.Cause._ctor);
	export const ImportRecord = new $wcm.RecordType<Types.ImportRecord>([
		['module', $wcm.wstring],
		['name', $wcm.wstring],
		['typeRef', $wcm.wstring],
		['cause', Cause],
	]);
	export const ExportRecord = new $wcm.RecordType<Types.ExportRecord>([
		['name', $wcm.wstring],
		['kind', $wcm.wstring],
		['index', $wcm.u32],
		['cause', Cause],
	]);
	export const TypeRecord = new $wcm.RecordType<Types.TypeRecord>([
		['ty', $wcm.wstring],
		['cause', Cause],
	]);
	export const MemoryRecord = new $wcm.RecordType<Types.MemoryRecord>([
		['id', $wcm.u32],
		['initial', $wcm.u64],
		['maximum', new $wcm.OptionType<u64>($wcm.u64)],
		['cause', Cause],
	]);
	export const ActiveDataRecord = new $wcm.RecordType<Types.ActiveDataRecord>([
		['memoryIndex', $wcm.u32],
		['offsetExpr', new $wcm.ListType<string>($wcm.wstring)],
		['data', new $wcm.Uint8ArrayType()],
		['cause', Cause],
	]);
	export const PassiveDataRecord = new $wcm.RecordType<Types.PassiveDataRecord>([
		['data', new $wcm.Uint8ArrayType()],
		['cause', Cause],
	]);
	export const GlobalRecord = new $wcm.RecordType<Types.GlobalRecord>([
		['id', $wcm.u32],
		['ty', $wcm.wstring],
		['shared', $wcm.bool],
		['mutable', $wcm.bool],
		['initExpr', new $wcm.ListType<string>($wcm.wstring)],
		['cause', Cause],
	]);
	export const FunctionRecord = new $wcm.RecordType<Types.FunctionRecord>([
		['id', $wcm.u32],
		['fname', new $wcm.OptionType<string>($wcm.wstring)],
		['sig', new $wcm.TupleType<[string[], string[]]>([new $wcm.ListType<string>($wcm.wstring), new $wcm.ListType<string>($wcm.wstring)])],
		['locals', new $wcm.ListType<string>($wcm.wstring)],
		['body', new $wcm.ListType<string>($wcm.wstring)],
		['cause', Cause],
	]);
	export const LocalRecord = new $wcm.RecordType<Types.LocalRecord>([
		['targetFid', $wcm.u32],
		['ty', $wcm.wstring],
		['cause', Cause],
	]);
	export const TableRecord = new $wcm.RecordType<Types.TableRecord>([
		['cause', Cause],
	]);
	export const ElementRecord = new $wcm.RecordType<Types.ElementRecord>([
		['cause', Cause],
	]);
	export const OpProbeRecord = new $wcm.RecordType<Types.OpProbeRecord>([
		['targetFid', $wcm.u32],
		['targetOpcodeIdx', $wcm.u32],
		['mode', $wcm.wstring],
		['body', new $wcm.ListType<string>($wcm.wstring)],
		['cause', Cause],
	]);
	export const FuncProbeRecord = new $wcm.RecordType<Types.FuncProbeRecord>([
		['targetFid', $wcm.u32],
		['mode', $wcm.wstring],
		['body', new $wcm.ListType<string>($wcm.wstring)],
		['cause', Cause],
	]);
	export const Injection = new $wcm.VariantType<Types.Injection, Types.Injection._tt, Types.Injection._vt>([['importType', ImportRecord], ['exportType', ExportRecord], ['typeType', TypeRecord], ['memoryType', MemoryRecord], ['activeDataType', ActiveDataRecord], ['passiveDataType', PassiveDataRecord], ['globalType', GlobalRecord], ['functionType', FunctionRecord], ['localType', LocalRecord], ['tableType', TableRecord], ['elementType', ElementRecord], ['opProbeType', OpProbeRecord], ['funcProbeType', FuncProbeRecord]], Types.Injection._ctor);
	export const LineColLocation = new $wcm.VariantType<Types.LineColLocation, Types.LineColLocation._tt, Types.LineColLocation._vt>([['pos', new $wcm.TupleType<[u64, u64]>([$wcm.u64, $wcm.u64])], ['span', new $wcm.TupleType<[[u64, u64], [u64, u64]]>([new $wcm.TupleType<[u64, u64]>([$wcm.u64, $wcm.u64]), new $wcm.TupleType<[u64, u64]>([$wcm.u64, $wcm.u64])])]], Types.LineColLocation._ctor);
	export const CodeLocation = new $wcm.RecordType<Types.CodeLocation>([
		['isErr', $wcm.bool],
		['message', new $wcm.OptionType<string>($wcm.wstring)],
		['lineCol', LineColLocation],
		['lineStr', new $wcm.OptionType<string>($wcm.wstring)],
		['line2Str', new $wcm.OptionType<string>($wcm.wstring)],
	]);
	export const WhammError = new $wcm.RecordType<Types.WhammError>([
		['matchRule', new $wcm.OptionType<string>($wcm.wstring)],
		['fatal', $wcm.bool],
		['errLoc', new $wcm.OptionType<Types.CodeLocation>(CodeLocation)],
		['infoLoc', new $wcm.OptionType<Types.CodeLocation>(CodeLocation)],
		['ty', $wcm.wstring],
	]);
}
export namespace Types._ {
	export const id = 'vscode:example/types' as const;
	export const witName = 'types' as const;
	export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
		['InjectType', $.InjectType],
		['Options', $.Options],
		['Mode', $.Mode],
		['ScriptLoc', $.ScriptLoc],
		['AppLoc', $.AppLoc],
		['Probe', $.Probe],
		['ErrorCode', $.ErrorCode],
		['LineCol', $.LineCol],
		['Span', $.Span],
		['Cause', $.Cause],
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
		['Injection', $.Injection],
		['LineColLocation', $.LineColLocation],
		['CodeLocation', $.CodeLocation],
		['WhammError', $.WhammError]
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
			['scriptPath', $wcm.wstring],
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
		'run': (script_ptr: i32, script_len: i32, appName_ptr: i32, appName_len: i32, scriptPath_ptr: i32, scriptPath_len: i32, result: ptr<result<Probe[], ErrorCode>>) => void;
		'wat2wat': (content_ptr: i32, content_len: i32, result: ptr<result<string, ErrorCode>>) => void;
		'wasm2wat': (content_ptr: i32, content_len: i32, result: ptr<result<string, ErrorCode>>) => void;
	};
	export function bind(service: whammServer.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<whammServer.Exports>;
	export function bind(service: whammServer.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<whammServer.Exports.Promisified>;
	export function bind(service: whammServer.Imports | whammServer.Imports.Promisified, code: $wcm.Code, portOrContext?: $wcm.RAL.ConnectionPort | $wcm.ComponentModelContext, context?: $wcm.ComponentModelContext | undefined): Promise<whammServer.Exports> | Promise<whammServer.Exports.Promisified> {
		return $wcm.$main.bind(_, service, code, portOrContext, context);
	}
}