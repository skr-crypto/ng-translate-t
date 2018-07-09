import $ from 'jquery';
import { loadAttributeMap, fillInAttributes } from './dom-utils';

export default function $translateProvider() {
	let getTranslation = window.t;
	this.setTranslationFunction = lookupFunction => {
		getTranslation = lookupFunction;
	};

	this.$get = [
		'$compile',
		function($compile) {
			return {
				getParams(attrs) {
					const params = [];
					Object.keys(attrs).forEach(function(key) {
						if (key === 't' || key === 'tContext' || key === 'tAttrs') {
							return;
						}
						if (
							key.length > 2 &&
							key.charAt(0) === 't' &&
							key.charAt(1) === key.charAt(1).toUpperCase()
						) {
							params.push({
								param: key.charAt(1).toLowerCase() + key.substring(2),
								expr: attrs[key]
							});
						}
					});
					return params;
				},

				registerTranslation(scope, text, params, element, context, attr, shouldEscape) {
					const values = {};

					const update = () => {
						let translation;

						if (attr) {
							translation = getTranslation(text, values, context);
							element.attr(attr, translation);
						} else {
							const original = $(`<div>${text}</div>`);
							translation = getTranslation(text, values, context, shouldEscape);

							if (original.children().length === 0) {
								element[0].innerHTML = translation;
								return;
							}

							const attrMap = loadAttributeMap(original[0], 1);

							// innerHTML does not handle br's too well (doesn't close them)
							const keyText = original.html().replace(/<br ref="([0-9]+)">/g, '<br ref="$1" />');

							// HTML characters are encoded using .html(), so we need to decode them
							const textarea = document.createElement('textarea');
							textarea.innerHTML = keyText;
							const newKeyText = textarea.value.replace(/(\S|\b)\s+(\S|\b)/g, '$1 $2').trim();
							translation = getTranslation(newKeyText, values, context, shouldEscape);

							// Do some voodoo to preserve angular bindings
							element.html('');
							const newElm = $(`<span>${translation}</span>`);
							// Fill in attributes before compiling
							fillInAttributes(newElm, attrMap);
							// Recompile the translation stuff with the scope
							$compile(newElm)(scope);

							// Move all children - preserving bindings.
							while (newElm[0].childNodes.length > 0) {
								element[0].appendChild(newElm[0].childNodes[0]);
							}
						}
					};

					// Watch and deserialize scope values:
					params.forEach(function(p) {
						values[p.param] = scope[p.expr] === undefined ? '' : scope[p.expr];

						scope.$watch(p.expr, function(value) {
							values[p.param] = value === undefined ? '' : value;
							if (/^([1-9][0-9]*|0)$/.test(values[p.param])) {
								values[p.param] = parseInt(values[p.param], 10);
							}
							update();
						});
					});

					update();
				},
				registerBodyTranslation(scope, element, attrs) {
					const params = this.getParams(attrs);
					let text = element.data('body-text');
					if (!text) {
						text = element.html();
						element.data('body-text', text);
					}

					if (element.data('translatedbody')) {
						return;
					}
					element.data('translatedbody', true);

					const shouldEscape = 'tEscape' in attrs;

					this.registerTranslation(
						scope,
						text,
						params,
						element,
						attrs.tContext,
						null,
						shouldEscape
					);
				},
				registerAttrTranslation(scope, element, attrs, attr) {
					const params = this.getParams(attrs);
					const dataId = `attr-text-${attr}`;

					let text = element.data(dataId);
					if (!text) {
						text = element.attr(attr);
						element.data(dataId, text);
					}

					this.registerTranslation(scope, text, params, element, attrs.tContext, attr);
				}
			};
		}
	];
}
