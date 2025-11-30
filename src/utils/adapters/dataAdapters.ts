import { Snippet, ComplianceEnum } from '../snippet';
import { FileType } from '../../types/FileType';
import { Rule } from '../../types/Rule';
import { TestCase } from '../../types/TestCase';


export interface BackendSnippet {
  id: string;
  name: string;
  description: string;
  language: string;
  version?: string;
  content: string;
  contentUrl?: string;
  snippetOwnerId?: string;
  lintStatus?: 'NOT_LINTED' | 'LINTING' | 'VALID' | 'INVALID';
  formatStatus?: 'NOT_LINTED' | 'FORMATTING' | 'VALID' | 'INVALID';
  author?: string;
}

export interface BackendFileType {
  language: string;
  extension: string;
}

export interface BackendRule {
  id: string;
  name: string;
  enabled: boolean;
  value?: string | number;
}

export interface BackendTestCase {
  id: string;
  name: string;
  input?: string[];
  output?: string[];
}


function mapComplianceEnum(
  lintStatus?: string,
  formatStatus?: string
): ComplianceEnum {
  if (lintStatus === 'VALID' && formatStatus === 'VALID') {
    return 'compliant';
  }
  if (lintStatus === 'INVALID' || formatStatus === 'INVALID') {
    return 'not-compliant';
  }
  if (lintStatus === 'LINTING' || formatStatus === 'FORMATTING') {
    return 'pending';
  }
  return 'pending';
}

export type TestRunResultDTO = {
  status: 'PASSED' | 'FAILED';
  message?: string;
  outputs: string[];
  inputs: string[];
};

export type SnippetTestsStatusDTO = {
  snippetId: string;
  snippetName: string;
  testStatuses: TestValidateDTO[];
};

export type TestValidateDTO = {
  testId: string;
  status: 'PASSED' | 'FAILED';
};

export function adaptBackendSnippetToUI(backendSnippet: BackendSnippet): Snippet {
  // TODO: Extraer author de snippetOwnerId si es necesario
  const author = backendSnippet.author || backendSnippet.snippetOwnerId || 'Unknown';
  
  // TODO: Extraer extension del language
  const extension = getExtensionFromLanguage(backendSnippet.language);
  
  return {
    id: backendSnippet.id,
    name: backendSnippet.name,
    content: backendSnippet.content,
    language: backendSnippet.language,
    extension: extension,
    compliance: mapComplianceEnum(backendSnippet.lintStatus, backendSnippet.formatStatus),
    author: author,
  };
}


export function adaptBackendFileTypeToUI(backendFileType: BackendFileType): FileType {
  return {
    language: backendFileType.language,
    extension: backendFileType.extension,
  };
}


export function adaptBackendRuleToUI(backendRule: BackendRule): Rule {
  return {
    id: backendRule.id,
    name: backendRule.name,
    isActive: backendRule.enabled,
    value: backendRule.value,
  };
}


export function adaptBackendTestCaseToUI(backendTestCase: BackendTestCase): TestCase {
  return {
    id: backendTestCase.id,
    name: backendTestCase.name,
    inputs: backendTestCase.input ?? [],
    expectedOutputs: backendTestCase.output ?? [],
  };
}


function getExtensionFromLanguage(language: string): string {
  const extensions: Record<string, string> = {
    printscript: 'prs',
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
  };
  return extensions[language.toLowerCase()] || 'txt';
}


