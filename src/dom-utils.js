// Load an attribute map of ref -> attrs. Used for replacing attributes into tags in the right order
// given translation. Refs are something that the backend stores to allow us to change attributes
// on tags without triggering new translations.
export const loadAttributeMap = (node, ref) => {
	const attrMap = {};
	Array.prototype.forEach.call(node.children, child => {
		const attrs = {};

		while (child.attributes.length > 0) {
			var attrName = child.attributes[0].name;
			attrs[attrName] = child.getAttribute(attrName);

			child.removeAttribute(attrName);
		}

		child.setAttribute('ref', ref++);
		attrMap['' + ref] = attrs;

		Object.assign(attrMap, loadAttributeMap(child, ref));
	});
	return attrMap;
};

// Fills in attributes from the map in the right order in the translated text.
export const fillInAttributes = ($node, attributes) => {
	Object.keys(attributes).forEach(ref => {
		const attrs = attributes[ref];
		const $refNode = $node.find('[ref="' + ref + '"]');
		Object.keys(attrs).forEach(name => {
			$refNode.attr(name, attrs[name]);
		});
		$refNode.removeAttr('ref');
	});
};
