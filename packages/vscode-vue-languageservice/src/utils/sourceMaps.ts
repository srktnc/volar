import { Range } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import type * as html from 'vscode-html-languageservice';
import type * as css from 'vscode-css-languageservice';

export interface MapedRange {
	start: number,
	end: number,
}

export enum MapedMode {
	Offset,
	Gate,
	In,
}

export interface Mapping<T = undefined> {
	data: T,
	mode: MapedMode,
	sourceRange: MapedRange,
	targetRange: MapedRange,
}

export class SourceMap<MapedData = unknown> extends Set<Mapping<MapedData>> {
	constructor(
		public sourceDocument: TextDocument,
		public targetDocument: TextDocument,
	) {
		super();
	}
	public isSource(range: Range) {
		return this.maps(range, true, true).length > 0;
	}
	public isTarget(range: Range) {
		return this.maps(range, false, true).length > 0;
	}
	public targetToSource(range: Range) {
		const result = this.maps(range, false, true);
		if (result.length) return result[0];
	}
	public targetToSource2(range: MapedRange) {
		const result = this.maps2(range, false, true);
		if (result.length) return result[0];
	}
	public sourceToTarget(range: Range) {
		const result = this.maps(range, true, true);
		if (result.length) return result[0];
	}
	public sourceToTarget2(range: MapedRange) {
		const result = this.maps2(range, true, true);
		if (result.length) return result[0];
	}
	public targetToSources(range: Range) {
		return this.maps(range, false);
	}
	public targetToSources2(range: MapedRange) {
		return this.maps2(range, false);
	}
	public sourceToTargets(range: Range) {
		return this.maps(range, true);
	}
	public sourceToTargets2(range: MapedRange) {
		return this.maps2(range, true);
	}
	private maps(range: Range, sourceToTarget: boolean, returnFirstResult?: boolean) {
		const result: {
			maped: Mapping<MapedData>,
			range: Range,
		}[] = [];
		const toDoc = sourceToTarget ? this.targetDocument : this.sourceDocument;
		const fromDoc = sourceToTarget ? this.sourceDocument : this.targetDocument;
		const fromRange = {
			start: fromDoc.offsetAt(range.start),
			end: fromDoc.offsetAt(range.end),
		};
		for (const maped of this) {
			const mapedToRange = sourceToTarget ? maped.targetRange : maped.sourceRange;
			const mapedFromRange = sourceToTarget ? maped.sourceRange : maped.targetRange;
			if (maped.mode === MapedMode.Gate) {
				if (fromRange.start === mapedFromRange.start && fromRange.end === mapedFromRange.end) {
					const offsets = [mapedToRange.start, mapedToRange.end];
					const toRange = Range.create(
						toDoc.positionAt(Math.min(offsets[0], offsets[1])),
						toDoc.positionAt(Math.max(offsets[0], offsets[1])),
					);
					result.push({
						maped,
						range: toRange,
					});
					if (returnFirstResult) return result;
				}
			}
			else if (maped.mode === MapedMode.Offset) {
				if (fromRange.start >= mapedFromRange.start && fromRange.end <= mapedFromRange.end) {
					const offsets = [mapedToRange.start + fromRange.start - mapedFromRange.start, mapedToRange.end + fromRange.end - mapedFromRange.end];
					const toRange = Range.create(
						toDoc.positionAt(Math.min(offsets[0], offsets[1])),
						toDoc.positionAt(Math.max(offsets[0], offsets[1])),
					);
					result.push({
						maped,
						range: toRange,
					});
					if (returnFirstResult) return result;
				}
			}
			else if (maped.mode === MapedMode.In) {
				if (fromRange.start >= mapedFromRange.start && fromRange.end <= mapedFromRange.end) {
					const offsets = [mapedToRange.start, mapedToRange.end];
					const toRange = Range.create(
						toDoc.positionAt(Math.min(offsets[0], offsets[1])),
						toDoc.positionAt(Math.max(offsets[0], offsets[1])),
					);
					result.push({
						maped,
						range: toRange,
					});
					if (returnFirstResult) return result;
				}
			}
		}
		return result;
	}
	private maps2(fromRange: MapedRange, sourceToTarget: boolean, returnFirstResult?: boolean) {
		const result: {
			maped: Mapping<MapedData>,
			range: MapedRange,
		}[] = [];
		for (const maped of this) {
			const mapedToRange = sourceToTarget ? maped.targetRange : maped.sourceRange;
			const mapedFromRange = sourceToTarget ? maped.sourceRange : maped.targetRange;
			if (maped.mode === MapedMode.Gate) {
				if (fromRange.start === mapedFromRange.start && fromRange.end === mapedFromRange.end) {
					const offsets = [mapedToRange.start, mapedToRange.end];
					result.push({
						maped,
						range: {
							start: Math.min(offsets[0], offsets[1]),
							end: Math.max(offsets[0], offsets[1]),
						},
					});
					if (returnFirstResult) return result;
				}
			}
			else if (maped.mode === MapedMode.Offset) {
				if (fromRange.start >= mapedFromRange.start && fromRange.end <= mapedFromRange.end) {
					const offsets = [mapedToRange.start + fromRange.start - mapedFromRange.start, mapedToRange.end + fromRange.end - mapedFromRange.end];
					result.push({
						maped,
						range: {
							start: Math.min(offsets[0], offsets[1]),
							end: Math.max(offsets[0], offsets[1]),
						},
					});
					if (returnFirstResult) return result;
				}
			}
			else if (maped.mode === MapedMode.In) {
				if (fromRange.start >= mapedFromRange.start && fromRange.end <= mapedFromRange.end) {
					const offsets = [mapedToRange.start, mapedToRange.end];
					result.push({
						maped,
						range: {
							start: Math.min(offsets[0], offsets[1]),
							end: Math.max(offsets[0], offsets[1]),
						},
					});
					if (returnFirstResult) return result;
				}
			}
		}
		return result;
	}
}

export enum MapedNodeTypes {
	ElementTag,
	Prop,
	Slot,
}

export interface TsMappingData {
	vueTag?: 'template' | 'script' | 'scriptSetup' | 'style',
	type?: MapedNodeTypes,
	isNoDollarRef?: boolean,
	showLink?: boolean,
	capabilities: {
		basic?: boolean,
		references?: boolean,
		definitions?: boolean,
		diagnostic?: boolean,
		formatting?: boolean,
		rename?: boolean,
		completion?: boolean,
		semanticTokens?: boolean,
		foldingRanges?: boolean,
		referencesCodeLens?: boolean,
	},
}

export class TsSourceMap extends SourceMap<TsMappingData> {
	constructor(
		public sourceDocument: TextDocument,
		public targetDocument: TextDocument,
		public isInterpolation: boolean,
		public capabilities: {
			foldingRanges: boolean,
			formatting: boolean,
			documentSymbol: boolean,
		},
	) {
		super(sourceDocument, targetDocument);
	}
}

export class CssSourceMap extends SourceMap<undefined> {
	constructor(
		public sourceDocument: TextDocument,
		public targetDocument: TextDocument,
		public stylesheet: css.Stylesheet,
		public module: boolean,
		public scoped: boolean,
		public links: { textDocument: TextDocument, stylesheet: css.Stylesheet}[],
		public capabilities: {
			foldingRanges: boolean,
			formatting: boolean,
		},
	) {
		super(sourceDocument, targetDocument);
	}
}

export class HtmlSourceMap extends SourceMap<undefined> {
	constructor(
		public sourceDocument: TextDocument,
		public targetDocument: TextDocument,
		public htmlDocument: html.HTMLDocument,
	) {
		super(sourceDocument, targetDocument);
	}
}

export class PugSourceMap extends SourceMap<undefined> {
	constructor(
		public sourceDocument: TextDocument,
		public targetDocument: TextDocument,
		public html: string | undefined,
		public mapper: ((htmlStart: number, htmlEnd: number) => number | undefined) | undefined,
	) {
		super(sourceDocument, targetDocument);
	}
}
