import TsServerLibrary, { CodeFixAction, ScriptElementKind } from 'typescript/lib/tsserverlibrary';
import * as path from 'path';

declare global {
  namespace ts {
    interface CompletionEntryData {
      modulePath?: string;
    }
  }
}

function stripExt(filePath: string) {
  return filePath.slice(0, filePath.lastIndexOf('.'));
}

function init({ typescript: ts }: { typescript: typeof TsServerLibrary }) {
  function create(info: TsServerLibrary.server.PluginCreateInfo) {
    const log = (...params: unknown[]) => {
      const text = params.map((p) => (p ? JSON.stringify(p) : p)).join(' ');
      info.project.projectService.logger.info(`[namespace-import] ${text}`);
    };

    log('Start init');

    const getCompletionsAtPosition = info.languageService.getCompletionsAtPosition;
    info.languageService.getCompletionsAtPosition = (fileName, position, options) => {
      log('getCompletionsAtPosition', { fileName, position, options });
      const original = getCompletionsAtPosition(fileName, position, options);
      if (original == null) {
        return original;
      }

      const entry: ts.CompletionEntry = {
        name: 'TestService',
        kind: ts.ScriptElementKind.alias,
        source: '/Users/yukukotani/ghq/github.com/ubie-inc/yukustory/packages/client/src/TestService.ts',
        sortText: 'TestService',
        hasAction: true,
        isImportStatementCompletion: true,
        data: {
          exportName: 'TestService',
          modulePath: '/Users/yukukotani/ghq/github.com/ubie-inc/yukustory/packages/client/src/TestService.ts',
        },
      };
      original.entries.push(entry);

      return original;
    };

    const getCompletionEntryDetails = info.languageService.getCompletionEntryDetails;
    info.languageService.getCompletionEntryDetails = (fileName, position, name, options, source, preferences, data) => {
      log('getCompletionEntryDetails', { fileName, position, name, options, source });
      if (name === 'TestService' && data?.modulePath) {
        const importPath = path.relative(path.dirname(fileName), data.modulePath);
        const text = `import * as ${name} from "${stripExt(importPath)}";\n`;
        const action: CodeFixAction = {
          fixName: 'namespace-import',
          description: text,
          changes: [
            {
              fileName: fileName,
              textChanges: [
                {
                  span: {
                    start: 0,
                    length: 0,
                  },
                  newText: text,
                },
              ],
            },
          ],
          commands: [],
        };
        return {
          name: name,
          kind: ScriptElementKind.alias,
          kindModifiers: '',
          displayParts: [],
          codeActions: [action],
        };
      }

      return getCompletionEntryDetails(fileName, position, name, options, source, preferences, data);
    };
  }

  return { create };
}

export = init;
