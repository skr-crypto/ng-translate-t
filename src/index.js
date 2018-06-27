import angular from 'angular';

import translateProvider from './translate-provider';
import tDirective from './directives/t';
import tAttrsDirective from './directives/t-attrs';

const translate = angular.module('ng-translate-t', [])
	.provider('$translate', translateProvider)
	.directive('t', tDirective)
	.directive('tAttrs', tAttrsDirective);

export default translate.name;
