import * as namespaceImportPlugin from './lib/import';

declare global {
  namespace ts {
    interface CompletionEntryData {
      modulePath?: string;
    }
  }
}

function init() {
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

      original.entries = [...original.entries, ...namespaceImportPlugin.getCompletionEntries(info)];
      return original;
    };

    const getCompletionEntryDetails = info.languageService.getCompletionEntryDetails;
    info.languageService.getCompletionEntryDetails = (fileName, position, name, options, source, preferences, data) => {
      log('getCompletionEntryDetails', { fileName, position, name, options, source });
      if (data?.modulePath == null) {
        return getCompletionEntryDetails(fileName, position, name, options, source, preferences, data);
      }

      return namespaceImportPlugin.getCompletionEntryDetails(name, fileName, data.modulePath, info.project);
    };
  }

  return { create };
}

export = init;
