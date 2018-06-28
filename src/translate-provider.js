import $ from 'jquery';

export default function $translateProvider() {
	let getTranslation = window.t;
	this.setTranslationFunction = lookupFunction => {
		getTranslation = lookupFunction;
	};

	this.$get = [
		'$compile',
		function($compile) {
			return {
				getParams: function(attrs) {
					var params = [];
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

				registerTranslation: function(scope, text, params, element, context, attr, shouldEscape) {
					var values = {};
					let attrMap;

					// Load an attribute map of ref -> attrs. Used for replacing attributes into tags in the right order
					// given translation. Refs are something that the backend stores to allow us to change attributes
					// on tags without triggering new translations.
					var loadAttributeMap = function(node, ref) {
						node.children().each(function() {
							let child = $(this);
							let attrs = {};

							while (this.attributes.length > 0) {
								var attrName = this.attributes[0].name;
								attrs[attrName] = child.attr(attrName);

								this.removeAttribute(attrName);
							}

							child.attr('ref', ref++);
							attrMap['' + ref] = attrs;

							loadAttributeMap(child, ref);
						});
					};

					// Fills in attributes from the map in the right order in the translated text.
					var fillInAttributes = function(node) {
						Object.keys(attrMap).forEach(function(ref) {
							const attrs = attrMap[ref];
							const refNode = node.find('[ref=' + ref + ']');
							Object.keys(attrs).forEach(function(name) {
								refNode.attr(name, attrs[name]);
							});
							refNode.removeAttr('ref');
						});
					};

					var update = function() {
						var translation;
						attrMap = {};

						if (attr) {
							translation = getTranslation(text, values, context);
							element.attr(attr, translation);
						} else {
							const original = $('<div>' + text + '</div>');

							loadAttributeMap(original, 1);

							// innerHTML does not handle br's too well (doesn't close them)
							var keyText = original.html().replace(/<br ref="([0-9]+)">/g, '<br ref="$1" />');

							// HTML characters are encoded using .html(), so we need to decode them
							var textarea = document.createElement('textarea');
							textarea.innerHTML = keyText;
							var newKeyText = textarea.value.replace(/(\S|\b)\s+(\S|\b)/g, '$1 $2').trim();
							translation = getTranslation(newKeyText, values, context, shouldEscape);

							if (original.children().length > 0) {
								// Do some voodoo to preserve angular bindings
								element.html('');
								const newElm = $('<span>' + translation + '</span>');
								// Fill in attributes before compiling
								fillInAttributes(newElm);
								// Recompile the translation stuff with the scope
								$compile(newElm)(scope);

								// Move all children - preserving bindings.
								while (newElm[0].childNodes.length > 0) {
									element[0].appendChild(newElm[0].childNodes[0]);
								}
							} else {
								element[0].innerHTML = translation;
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
				registerBodyTranslation: function(scope, element, attrs) {
					var params = this.getParams(attrs);
					var text = element.data('body-text');
					if (!text) {
						text = element.html();
						element.data('body-text', text);
					}

					if (element.data('translatedbody')) {
						return;
					}
					element.data('translatedbody', true);

					var shouldEscape = 'tEscape' in attrs;

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
				registerAttrTranslation: function(scope, element, attrs, attr) {
					const params = this.getParams(attrs);
					const dataId = 'attr-text-' + attr;

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
