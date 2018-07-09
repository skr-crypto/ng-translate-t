export default [
	'$translate',
	function($translate) {
		return {
			restrict: 'A',
			link(scope, element, attrs) {
				attrs.tAttrs.split(',').forEach(function(attr) {
					$translate.registerAttrTranslation(scope, element, attrs, attr.trim());
				});
			}
		};
	}
];
