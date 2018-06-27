# ng-translate-t
![coverage-badge][coverage-badge]

[![semantic-release][semantic-release-badge]][semantic-release]
[![Commitizen friendly][commitizen-badge]][commitizen]

Angular module to provide convenient translation directives.



## Installation
Install via npm
```
npm i ng-translate-t
```

## Usage
```html
<script>
angular.module('app', ['ng-translate-t'])
  .config($translateProvider => {
    //
    $translateProvider.setTranslationFunction((text, params, context) => {
      return ;
    });
  });
</script>

<div ng-app="app">
  <div t>Text to translate</div>
</div>
```

## License
AAAAAAAAAAA

[coverage-badge]: https://img.shields.io/badge/coverage-100%25-brightgreen.svg
[semantic-release]: https://github.com/semantic-release/semantic-release
[semantic-release-badge]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[commitizen]: http://commitizen.github.io/cz-cli/
[commitizen-badge]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
