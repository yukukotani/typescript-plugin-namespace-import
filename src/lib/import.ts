import ts, { CodeFixAction, ScriptElementKind } from 'typescript/lib/tsserverlibrary';
import * as path from 'path';

export type PluginOptions = {
  paths: readonly string[];
  ignoreNamedExport?: boolean;
};

export function getCompletionEntries(info: ts.server.PluginCreateInfo): ts.CompletionEntry[] {
  const modulePaths = getModulePathsToImport(info.config.options, info.project);

  return modulePaths.map((modulePath) => {
    const name = getFileNameWithoutExt(modulePath);
    return {
      name: name,
      kind: ts.ScriptElementKind.alias,
      source: modulePath,
      sortText: name,
      hasAction: true,
      isImportStatementCompletion: true,
      data: {
        exportName: name,
        modulePath: modulePath,
      },
    };
  });
}

export function filterNamedImportEntries(
  entries: ts.CompletionEntry[],
  info: ts.server.PluginCreateInfo,
): ts.CompletionEntry[] {
  const options: PluginOptions = info.config.options;
  if (!options.ignoreNamedExport) {
    return entries;
  }

  const currentDir = info.project.getCurrentDirectory();
  const dirPaths = options.paths.map((dirPath) => path.resolve(currentDir, dirPath));
  return entries.filter((entry) => {
    return !dirPaths.some((dirPath) => entry.data?.exportName && entry.data.fileName?.startsWith(dirPath));
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

  const modulePaths = getModulePathsToImport(info.config.options, info.project);
  const modulePath = modulePaths.find((filePath) => getFileNameWithoutExt(filePath) === name);
  if (modulePath) {
    return getCodeFixActionFromPath(name, selfPath, modulePath, info.project);
  } else {
    return null;
  }
}

function getModulePathsToImport(options: PluginOptions, project: ts.server.Project): string[] {
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

function getModuleSpceifier(selfPath: string, modulePath: string, project: ts.server.Project) {
  const compilerOptions = project.getCompilerOptions();

  let specifier: string;
  if (compilerOptions.baseUrl) {
    specifier = path.relative(compilerOptions.baseUrl, modulePath);
  } else {
    specifier = './' + path.relative(path.dirname(selfPath), modulePath);
  }

  return getFilePathWithoutExt(specifier);
}

function getCodeFixActionFromPath(
  name: string,
  selfPath: string,
  modulePath: string,
  project: ts.server.Project,
): CodeFixAction {
  const moduleSpecifier = getModuleSpceifier(selfPath, modulePath, project);
  const text = `import * as ${name} from "${moduleSpecifier}";\n`;
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
