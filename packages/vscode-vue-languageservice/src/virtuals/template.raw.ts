import { TextDocument } from 'vscode-languageserver-textdocument';
import { syntaxToLanguageId } from '@volar/shared';
import { computed, Ref } from '@vue/reactivity';
import { IDescriptor } from '../types';
import { MapedMode, HtmlSourceMap, PugSourceMap } from '../utils/sourceMaps';
import * as globalServices from '../globalServices';

export function useTemplateRaw(
	getUnreactiveDoc: () => TextDocument,
	template: Ref<IDescriptor['template']>,
	templateData: Ref<{
		html?: string,
		htmlToTemplate?: (start: number, end: number) => number | undefined,
	} | undefined>,
) {
	let version = 0;
	const textDocument = computed(() => {
		if (template.value) {
			const vueDoc = getUnreactiveDoc();
			const langId = syntaxToLanguageId(template.value.lang);
			const uri = vueDoc.uri + '.' + template.value.lang;
			const content = template.value.content;
			const document = TextDocument.create(uri, langId, version++, content);
			return document;
		}
	});
	const htmlSourceMap = computed(() => {
		if (textDocument.value?.languageId === 'html' && textDocument.value && template.value) {
			const vueDoc = getUnreactiveDoc();
			const htmlDocument = globalServices.html.parseHTMLDocument(textDocument.value);
			const sourceMap = new HtmlSourceMap(
				vueDoc,
				textDocument.value,
				htmlDocument,
			);
			sourceMap.add({
				data: undefined,
				mode: MapedMode.Offset,
				sourceRange: {
					start: template.value.loc.start,
					end: template.value.loc.end,
				},
				targetRange: {
					start: 0,
					end: template.value.loc.end - template.value.loc.start,
				},
			});
			return sourceMap;
		}
	});
	const pugSourceMap = computed(() => {
		if (textDocument.value?.languageId === 'jade' && template.value && templateData.value && templateData.value.htmlToTemplate) {
			const vueDoc = getUnreactiveDoc();
			const sourceMap = new PugSourceMap(
				vueDoc,
				textDocument.value,
				templateData.value.html,
				templateData.value.htmlToTemplate,
			);
			sourceMap.add({
				data: undefined,
				mode: MapedMode.Offset,
				sourceRange: {
					start: template.value.loc.start,
					end: template.value.loc.end,
				},
				targetRange: {
					start: 0,
					end: template.value.loc.end - template.value.loc.start,
				},
			});
			return sourceMap;
		}
	});
	return {
		textDocument,
		htmlSourceMap,
		pugSourceMap,
	};
}
