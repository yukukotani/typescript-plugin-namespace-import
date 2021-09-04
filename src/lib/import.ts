import ts from 'typescript/lib/tsserverlibrary';
import * as path from 'path';

export function getCompletionEntries(info: ts.server.PluginCreateInfo): ts.CompletionEntry[] {
  const currentDir = info.project.getCurrentDirectory();
  const filePaths = info.project.readDirectory(path.resolve(currentDir, 'src/services'));

  return filePaths.map((filePath) => {
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    return {
      name: name,
      kind: ts.ScriptElementKind.alias,
      source: filePath,
      sortText: name,
      hasAction: true,
      isImportStatementCompletion: true,
      data: {
        exportName: name,
        modulePath: filePath,
      },
    };
  });
}
