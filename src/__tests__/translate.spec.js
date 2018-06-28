/**
 *  @jest-environment jsdom
 **/
import angular from 'angular';
import 'angular-mocks';

import translateModule from '../index';

const getValue = el => {
	const ta = document.createElement('textarea');
	// fix html encoding:
	ta.innerHTML = el.html();
	// fix quote escapes:
	const unescaped = ta.value.replace(/"\\"/g, '\\"').replace(/\\""/g, '\\"');
	return unescaped;
};

const ref = (text, params, context) => JSON.stringify({ text, params, context });

describe('translation directives', () => {
	let $compile;
	let $rootScope;
	let $translate;

	const compileAndDigest = (html, baseScope) => {
		const scope = $rootScope.$new();
		Object.assign(scope, baseScope || {});
		const element = $compile(html)(scope);
		scope.$apply();
		return { element, scope };
	};

	beforeEach(() => {
		angular.mock.module.sharedInjector();
		angular.mock.module(translateModule, function($translateProvider) {
			$translateProvider.setTranslationFunction(ref);
		});
		angular.mock.inject(function(_$compile_, _$rootScope_, _$translate_) {
			$compile = _$compile_;
			$rootScope = _$rootScope_;
			$translate = _$translate_;
		});
	});

	describe('t', () => {
		it('replaces innerHTML with lookup', () => {
			const { element } = compileAndDigest('<div t>Open my app</div>');
			expect(getValue(element)).toEqual(ref('Open my app', {}));
		});

		it('replaces innerHTML with lookup and t-context', () => {
			const { element } = compileAndDigest('<div t t-context="Hi">Open my app</div>');
			expect(getValue(element)).toEqual(ref('Open my app', {}, 'Hi'));
		});

		it('handles complex strings w/ refs', () => {
			const { element } = compileAndDigest('<div t>Open my app<span id="1">foo</span> </div>');
			expect(getValue(element)).toEqual(ref('Open my app<span ref="1">foo</span>', {}));
		});

		it('handles attr params', () => {
			const { element } = compileAndDigest('<div t t-hello-world="world">Open my app</div>', {
				world: 'hi'
			});
			expect(getValue(element)).toEqual(ref('Open my app', { helloWorld: 'hi' }));
		});

		it('handles numeric attr params', () => {
			const { element } = compileAndDigest('<div t t-param="foo">Open my app</div>', { foo: '10' });
			expect(getValue(element)).toEqual(ref('Open my app', { param: 10 }));
		});

		it('handles undefined attrs', () => {
			const { element } = compileAndDigest('<div t t-param="foo">Open my app</div>', {});
			expect(getValue(element)).toEqual(ref('Open my app', { param: '' }));
		});

		it('handles scope updates', () => {
			const { element, scope } = compileAndDigest('<div t t-param="foo">Open my app</div>', {
				foo: 'bar'
			});
			expect(getValue(element)).toEqual(ref('Open my app', { param: 'bar' }));
			scope.foo = 'baz';
			scope.$apply();
			expect(getValue(element)).toEqual(ref('Open my app', { param: 'baz' }));
			scope.foo = undefined;
			scope.$apply();
			// undefined becomes empty string:
			expect(getValue(element)).toEqual(ref('Open my app', { param: '' }));
		});

		it('replaces inline whitespaces with single whitespace', () => {
			const { element } = compileAndDigest(`<p
			class="description"
			t t-context="Messages when no groups available"
	>You haven't created any groups yet. Groups are used to organise which companies
			<br>receive which questions. Create a group by clicking the "manage groups"-button
			<br>above
	</p>`);
			expect(getValue(element)).toEqual(
				ref(
					'You haven\'t created any groups yet. Groups are used to organise which companies <br ref="1">receive which questions. Create a group by clicking the "manage groups"-button <br ref="2">above',
					{},
					'Messages when no groups available'
				)
			);
		});

		it('gracefully handles double compilation', () => {
			const { element, scope } = compileAndDigest('<div t t-param="foo">Open my app</div>', {
				foo: 'bar'
			});
			$translate.registerBodyTranslation(scope, element, {});
			scope.$apply();
		});
	});

	describe('t-attrs', () => {
		it('replaces element attributes', () => {
			const { element } = compileAndDigest(
				'<div t-context="context" t-attrs="foo,bar" foo="Hi" bar="Baz"></div>'
			);
			expect(element.attr('foo')).toEqual(ref('Hi', {}, 'context'));
			expect(element.attr('bar')).toEqual(ref('Baz', {}, 'context'));
		});

		it('gracefully handles double compilation', () => {
			const { element, scope } = compileAndDigest('<div t-attrs="foo" foo="hi">Open my app</div>');
			$translate.registerAttrTranslation(scope, element, {}, 'foo');
			scope.$apply();
		});
	});
});
