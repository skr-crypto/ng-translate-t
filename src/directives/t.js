export default [
	'$translate',
	function($translate) {
		return {
			terminal: true,
			restrict: 'AECM',
			link(scope, element, attrs) {
				$translate.registerBodyTranslation(scope, element, attrs);
			}
		};
	}
];
