import ts, { CodeFixAction, InferencePriority, ScriptElementKind } from 'typescript/lib/tsserverlibrary';
import * as path from 'path';

type PluginOptions = {
  paths: readonly string[];
};

export function getCompletionEntries(info: ts.server.PluginCreateInfo): ts.CompletionEntry[] {
  const filePaths = getPathsToImport(info.config.options, info.project);

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
  const action: CodeFixAction = getCodeFixActionFromPath(name, selfPath, modulePath, project);
  return {
    name: name,
    kind: ScriptElementKind.alias,
    kindModifiers: '',
    displayParts: [],
    codeActions: [action],
  };
}

export function getCodeFixActionByName(
  selfPath: string,
  start: number,
  end: number,
  info: ts.server.PluginCreateInfo,
): CodeFixAction | null {
  const name = info.languageService.getProgram()?.getSourceFile(selfPath)?.text.slice(start, end);
  if (!name) {
    return null;
  }

  const filePaths = getPathsToImport(info.config.options, info.project);
  const modulePath = filePaths.find((filePath) => getFileNameWithoutExt(filePath) === name);
  if (modulePath) {
    return getCodeFixActionFromPath(name, selfPath, modulePath, info.project);
  } else {
    return null;
  }
}

function getPathsToImport(options: PluginOptions, project: ts.server.Project): string[] {
  const currentDir = project.getCurrentDirectory();

  return options.paths.flatMap((dirPath) => {
    return project.readDirectory(path.resolve(currentDir, dirPath), ['.ts', '.js']);
  });
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

function getCodeFixActionFromPath(
  name: string,
  selfPath: string,
  modulePath: string,
  project: ts.server.Project,
): CodeFixAction {
  const importPath = transformModulePath(selfPath, modulePath, project);
  const text = `import * as ${name} from "${getFilePathWithoutExt(importPath)}";\n`;
  return {
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
}
