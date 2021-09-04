import TsServerLibrary from 'typescript/lib/tsserverlibrary';

function init({ typescript: ts }: { typescript: typeof TsServerLibrary }) {
  function create(info: ts.server.PluginCreateInfo) {
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
      };
      original.entries.push(entry);

      return original;
    };
  }

  return { create };
}

export = init;
