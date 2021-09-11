# typescript-plugin-namespace-import

[![npm](https://img.shields.io/npm/v/typescript-plugin-namespace-import)](https://www.npmjs.com/package/typescript-plugin-namespace-import)
[![license](https://img.shields.io/npm/l/typescript-plugin-namespace-import)](https://github.com/Monchi/typescript-plugin-namespace-import/blob/master/LICENSE)

A [TypeScript Language Service Plugin](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin) to auto-complete and insert [Namespace Import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#import_an_entire_modules_contents).

![namespace](https://user-images.githubusercontent.com/16265411/132126846-9b2ab85b-45ad-427e-aac4-c6c408e53aa5.gif)

## Motivation

[日本語の記事 / Japanese Article](https://zenn.dev/yuku/articles/4d2f665cf42385)

We often use an object as a namespace.

```typescript
// someLogics.ts
export const someLogics = {
  calculate() { ... },
  print() { ... },
};

// main.ts
import { someLogics } from "./someLogics.ts";

someLogics.calculate()
// `someLogics` is auto-completable without import!
```

This is good way in developer experience, but it obstruct tree-shaking. In this case, `someLogics.print` will be included in bundle although it's not used.

To keep tree-shaking working, we can use [Namespace Import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#import_an_entire_modules_contents).

```typescript
// someLogics.ts
export function calculate() { ... }
export function print() { ... }

// main.ts
import * as someLogics from "./someLogics.ts";

someLogics.calculate()
// `someLogics` is NOT auto-completable without import :(
```

Now we can tree-shake `someLogics.print`. However, developer experience get worse because we can't auto-complete `someLogics` without import statement. We need to write import statement by ourselves.

typescript-plugin-namespace-import resolves this problem by making Namespace Import auto-completable.

## Installation

Install with npm/yarn.

```sh
npm install -D typescript-plugin-namespace-import
# or yarn add -D typescript-plugin-namespace-import
```

Then add this plugin in `tsconfig.json`.

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "typescript-plugin-namespace-import",
        "options": {
          "paths": ["src/logics"]
        }
      }
    ]
  }
}
```

`paths` option is required. See below for detail.

## Options

### paths (required)

Value: `string[]`

Specify directory in relative path to the project's root (`tsconfig.json`'s dir). All `.ts` or `.js` files in the directories can be Namespace Imported with auto-completion.

Example:

```json
"options": {
  "paths": ["src/logics"]
}
```

### ignoreNamedExport

Value: `boolean`

If true, named export from files in `paths` won't be shown in auto-completion.

Example:

```json
"options": {
  "paths": ["src/logics"],
  "ignoreNamedExport": true
}
```

### nameTransform

Value: `"upperCamelCase" | "lowerCamelCase"`

Transform import name. If not set, the filename will be used as an import name.

Example:

```json
"options": {
  "paths": ["src/logics"],
  "nameTransform": "lowerCamelCase"
}
```

Then `SomeLogic.ts` will be imported like `import * as someLogic from "./SomeLogic"`.
