import ts, { CodeFixAction, InferencePriority, ScriptElementKind } from 'typescript/lib/tsserverlibrary';
import * as path from 'path';

type PluginConfig = {
  paths: readonly string[];
};

export function getCompletionEntries(info: ts.server.PluginCreateInfo): ts.CompletionEntry[] {
  const config = info.config as PluginConfig;

  const currentDir = info.project.getCurrentDirectory();
  const filePaths = config.paths.flatMap((dirPath) => {
    return info.project.readDirectory(path.resolve(currentDir, dirPath), ['.ts', '.js']);
  });

  return filePaths.map((filePath) => {
    const name = getFileNameWithoutExt(filePath);
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

export function getCompletionEntryDetails(
  name: string,
  selfPath: string,
  modulePath: string,
  project: ts.server.Project,
): ts.CompletionEntryDetails {
  const importPath = transformModulePath(selfPath, modulePath, project);
  const text = `import * as ${name} from "${getFilePathWithoutExt(importPath)}";\n`;
  const action: CodeFixAction = {
    fixName: 'namespace-import',
    description: text,
    changes: [
      {
        fileName: selfPath,
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

function getFileNameWithoutExt(filePath: string): string {
  const ext = path.extname(filePath);
  return path.basename(filePath, ext);
}

function getFilePathWithoutExt(filePath: string): string {
  const ext = path.extname(filePath);
  return filePath.slice(0, filePath.length - ext.length);
}

function transformModulePath(selfPath: string, filePath: string, project: ts.server.Project) {
  const compilerOptions = project.getCompilerOptions();
  if (compilerOptions.baseUrl) {
    return path.relative(compilerOptions.baseUrl, filePath);
  } else {
    return './' + path.relative(path.dirname(selfPath), filePath);
  }
}
