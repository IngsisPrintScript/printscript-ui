import { SnippetOperations } from './snippetOperations';
import {httpClient, httpUserClient} from './httpClient';
import {
    CompilationEnum,
    CreateSnippet,
    PaginatedSnippets,
    Snippet,
    UpdateSnippet,
} from './snippet';
import { PaginatedUsers } from './users';
import { TestCase } from '../types/TestCase';
import { TestCaseResult } from './queries';
import { FileType } from '../types/FileType';
import { Rule } from '../types/Rule';
import { getToken } from '../auth/tokenProvider';
import { adaptBackendTestCaseToUI, BackendTestCase } from './adapters/dataAdapters.ts';
import {BackendPaginatedSnippets, BackendSnippetWithLintData} from "./backend.ts";

export class RealSnippetOperations implements SnippetOperations {
  private currentSnippetId: string | null = null;
  private tokenProvider?: () => Promise<string>;
  constructor(tokenProvider?: () => Promise<string>) {
    this.tokenProvider = tokenProvider;
  }

  setCurrentSnippetId(id: string | null): void {
    this.currentSnippetId = id;
  }

  private async getAuthToken(): Promise<string> {
    if (this.tokenProvider) {
      const token = await this.tokenProvider();
      if (!token) throw new Error('Token no available');
      return token;
    }
    const token = await getToken();
    if (!token) throw new Error('Token no available');
    return token;
  }


  // ------------------- SNIPPETS -------------------

    async listSnippetDescriptors(
        page: number,
        pageSize: number,
        snippetName?: string
    ): Promise<PaginatedSnippets> {

        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const token = await this.getAuthToken();

        const filter = snippetName
            ? { name: snippetName }
            : {};

        const response = await fetch(
            `${baseURL}/filter?page=${page}&page_size=${pageSize}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(filter),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data: BackendPaginatedSnippets = await response.json();

        return {
            page: data.page,
            page_size: data.page_size,
            count: data.count,
            snippets: data.snippets.map(backend =>
                this.adaptBackendSnippet(backend)
            )
        };
    }

  async createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
    const requestBody = {
      name: createSnippet.name,
      description: '',
      language: createSnippet.language,
      version: '1.0',
      content: createSnippet.content,
    };
    console.log(requestBody)
    const response = await httpClient.post<any>('/create/text', requestBody);
    console.log("b")
    return this.adaptBackendSnippet(response);
  }

  async getSnippetById(id: string): Promise<Snippet | undefined> {
    try {
      const { data } = await httpClient.get<any>(`/${id}`);
      return this.adaptBackendSnippet(data);
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 404) return undefined;
      throw error;
    }
  }

  async updateSnippetById(id: string, updateSnippet: UpdateSnippet, snippetId?: string): Promise<Snippet> {
    const targetId = snippetId ?? this.currentSnippetId ?? id;
    if (!targetId) throw new Error('snippetId no seteado');

    const requestBody = {
      name: updateSnippet.name,
      description: '',
      language: updateSnippet.language,
      version: updateSnippet.version,
      content: updateSnippet.content,
    };
    const response = await httpClient.put<any>(`/${targetId}/update/text`, requestBody);
    return this.adaptBackendSnippet(response);
  }

  async deleteSnippet(id: string, snippetId?: string): Promise<string> {
    const targetId = snippetId ?? this.currentSnippetId ?? id;
    if (!targetId) throw new Error('snippetId no seteado');
    await httpClient.delete<void>(`/${targetId}`);
    return id;
  }

  async shareSnippet(snippetId?: string, userId?: string): Promise<Snippet> {
    const targetId = snippetId ?? this.currentSnippetId;
    if (!targetId) throw new Error('snippetId no seteado');
    if (!userId) throw new Error('userId no seteado');
    const response = await httpClient.post<Snippet>(`/${targetId}/share`, { userId });
    return response;
  }

    private adaptBackendSnippet(backend: BackendSnippetWithLintData): Snippet {
        const backendStatus = backend.valid;

        const compliance: CompilationEnum =
            backendStatus === 'PASSED' ? 'passed' :
                backendStatus === 'FAILED' ? 'failed' :
                    backendStatus === 'PENDING' ? 'pending' :
                        'to-do';

        return {
            id: backend.snippet.id,
            name: backend.snippet.name,
            content: backend.content || '',
            language: backend.snippet.language,
            extension: backend.snippet.language === 'printscript' ? 'pisp' : 'txt',
            compliance,
            author: backend.user,
        };
    }

    // ------------------- USERS -------------------

  async getUserFriends(name?: string, page?: number, pageSize?: number): Promise<PaginatedUsers> {
    const params: any = {};
    if (name) params.name = name;
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.page_size = pageSize;
    return await httpUserClient.get<PaginatedUsers>('/users', params);
  }

  // ------------------- TEST CASES -------------------

  async getTestCases(snippetId?: string): Promise<TestCase[]> {
    const id = snippetId ?? this.currentSnippetId;
    if (!id) throw new Error('snippetId no seteado');
    const response = await httpClient.get<BackendTestCase[]>(`/test/${id}`);
    return response.map(adaptBackendTestCaseToUI);
  }

  async postTestCase(testCase: Partial<TestCase>, snippetId?: string): Promise<TestCase> {
    const id = snippetId ?? this.currentSnippetId;
    if (!id) throw new Error('snippetId no seteado');

    const TestDTO = {
      snippetId: id,
      name: testCase.name ?? 'Unnamed Test',
      input: testCase.inputs ?? [],
      output: testCase.expectedOutputs ?? [],
    };
    const response = await httpClient.post<BackendTestCase>('/test/create', TestDTO);
    return adaptBackendTestCaseToUI(response);
  }

  async updateTestCase(testCase: Partial<TestCase>, snippetId?: string): Promise<TestCase> {
    const id = snippetId ?? this.currentSnippetId;
    if (!id) throw new Error('snippetId no seteado');

    const updateDTO = {
      testId: testCase.id,
      snippetId: id,
      name: testCase.name,
      inputs: testCase.inputs,
      outputs: testCase.expectedOutputs,
    };
    const response = await httpClient.put<BackendTestCase>('/test/update', updateDTO);
    return adaptBackendTestCaseToUI(response);
  }

  async removeTestCase(id: string): Promise<string> {
    await httpClient.delete<void>(`/test/${id}`);
    return id;
  }

  async testSnippet(testCase: Partial<TestCase>, snippetId?: string): Promise<TestCaseResult> {
    const id = snippetId ?? this.currentSnippetId;
    if (!id) throw new Error('snippetId no seteado');

    const body = { testCaseId: testCase.id, snippetId: id };
    await httpClient.post<void>(`/test/run/${id}`, body);
    return 'success';
  }

  // ------------------- RULES -------------------

  async getFormatRules(): Promise<Rule[]> {
    return [
      { id: '1', name: 'indentation', isActive: true, value: 3 },
      { id: '2', name: 'open-if-block-on-same-line', isActive: false },
      { id: '3', name: 'max-line-length', isActive: true, value: 100 },
      { id: '4', name: 'no-trailing-spaces', isActive: false },
      { id: '5', name: 'no-multiple-empty-lines', isActive: false },
    ];
  }

  async getLintingRules(): Promise<Rule[]> {
    return [
      { id: '1', name: 'no-expressions-in-print-line', isActive: true },
      { id: '2', name: 'no-unused-vars', isActive: true },
      { id: '3', name: 'no-undef-vars', isActive: false },
      { id: '4', name: 'no-unused-params', isActive: false },
    ];
  }

  async modifyFormatRule(newRules: Rule[]): Promise<Rule[]> {
    const updateDTOs = newRules.map(rule => ({ Id: rule.id, value: rule.value, active: rule.isActive }));
    await httpClient.put<void>('/format/update', updateDTOs);
    return newRules;
  }

  async modifyLintingRule(newRules: Rule[]): Promise<Rule[]> {
    const updateDTOs = newRules.map(rule => ({ Id: rule.id, value: rule.value, active: rule.isActive }));
    await httpClient.put<void>('/lint/update', updateDTOs);
    return newRules;
  }

  // ------------------- MISC -------------------

  async formatSnippet(snippetContent: string, snippetId?: string): Promise<string> {
    const id = snippetId ?? this.currentSnippetId;
    if (!id) throw new Error('snippetId no seteado');

    const status = await httpClient.get<any>(`/format/${id}`);
    if (status === 'VALID' || status === 'FORMATTING') {
      const snippet = await this.getSnippetById(id);
      return snippet?.content || snippetContent;
    }
    return snippetContent;
  }

  async getFileTypes(): Promise<FileType[]> {
    return [
      { language: 'printscript', extension: 'pisp' },
      { language: 'javascript', extension: 'js' },
      { language: 'typescript', extension: 'ts' },
    ];
  }
}
