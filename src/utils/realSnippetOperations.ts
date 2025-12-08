import { SnippetOperations } from './snippetOperations';
import {httpClient, httpUserClient} from './httpClient';
import {
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

  async listSnippetDescriptors(page: number, pageSize: number, snippetName?: string): Promise<PaginatedSnippets> {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const url = `${baseURL}/snippet/filter`;
    const token = await this.getAuthToken();
    const body = snippetName ? JSON.stringify({ name: snippetName }) : undefined;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.text();
        errorMessage = errorData || errorMessage;
        console.error('Error response from /snippet/filter:', errorMessage);
      } catch (e) {
        console.error('Could not read error response');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      page,
      page_size: pageSize,
      count: data.length,
      snippets: data.map((item: any) =>
          this.adaptBackendSnippet(item.snippet, item.owner, item.content)
      ),
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
    const response = await httpClient.post<any>('/snippet/create/text', requestBody);
    console.log("b", response)
    // El backend devuelve un string (mensaje de éxito o error), no un objeto JSON
    // Si la respuesta es un string que contiene "Error", lanzar excepción
    if (typeof response === 'string') {
      if (response.includes('Error') || response.includes('Invalid')) {
        throw new Error(response);
      }
      // Si es un mensaje de éxito (o string vacío), el snippet se creó correctamente
      // Retornamos un objeto temporal que será reemplazado cuando se refresque la lista
    } else if (response && typeof response === 'object' && Object.keys(response).length === 0) {
      // Si es un objeto vacío, también asumimos que se creó correctamente
    }
    
    // Si llegamos aquí, el snippet se creó correctamente
    // Retornamos un objeto temporal que será reemplazado cuando se refresque la lista
    return {
      id: 'temp-' + Date.now(),
      name: createSnippet.name,
      language: createSnippet.language,
      content: createSnippet.content,
      author: 'Unknown',
      conformance: 'pending' as const,
    };
  }

  async getSnippetById(id: string): Promise<Snippet | undefined> {
    try {
      const data = await httpClient.get<any>(`/snippet/${id}`);
      // El backend ahora devuelve un DataDTO con {snippet, owner, content}
      if (data.snippet) {
        return this.adaptBackendSnippet(data.snippet, data.owner, data.content);
      }
      // Si no tiene la estructura esperada, intentar adaptar directamente
      return this.adaptBackendSnippet(data);
    } catch (error: any) {
      if (error.status === 403 || error.status === 404) return undefined;
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
    await httpClient.delete<void>(`/snippet/${targetId}`);
    return id;
  }

  async shareSnippet(snippetId?: string, userId?: string): Promise<Snippet> {
    const targetId = snippetId ?? this.currentSnippetId;
    if (!targetId) throw new Error('snippetId no seteado');
    if (!userId) throw new Error('userId no seteado');
    // El backend espera PUT en /snippet/{snippetId}/share con ShareDTO { userId, action: "READ" }
    const response = await httpClient.put<Snippet>(`/snippet/${targetId}/share`, { 
      userId,
      action: 'READ' // AuthorizationActions.READ
    });
    return response;
  }

  private adaptBackendSnippet(backendSnippet: any, owner?: string, content?: string): Snippet {
    return {
      id: backendSnippet.id,
      name: backendSnippet.name,
      content: content || '',
      language: backendSnippet.language,
      extension: backendSnippet.language === 'printscript' ? 'pisp' : 'txt',
      compliance: this.mapComplianceStatus(backendSnippet.lintStatus, backendSnippet.formatStatus),
      author: owner || 'Unknown',
    };
  }

  private mapComplianceStatus(lintStatus?: string, formatStatus?: string): 'pending' | 'failed' | 'not-compliant' | 'compliant' {
    if (lintStatus === 'VALID' && formatStatus === 'VALID') return 'compliant';
    if (lintStatus === 'INVALID' || formatStatus === 'INVALID') return 'not-compliant';
    return 'pending';
  }

  // ------------------- USERS -------------------

  async getUserFriends(name?: string, page?: number, pageSize?: number): Promise<PaginatedUsers> {
    if (!name || name.trim().length === 0) {
      // Si no hay nombre, retornar lista vacía
      return { users: [], page: page || 0, page_size: pageSize || 10, count: 0 };
    }
    
    try {
      console.log('getUserFriends - Searching for users with name:', name);
      const params: any = { name };
      if (page !== undefined) params.page = page;
      if (pageSize !== undefined) params.page_size = pageSize;
      console.log('getUserFriends - Request params:', params);
      const response = await httpUserClient.get<any>('/api/users', params);
      console.log('getUserFriends - Response:', response);
      
      // El backend devuelve una lista de UserResult, necesitamos adaptarla
      if (Array.isArray(response)) {
        const users = {
          users: response.map((user: any) => ({
            userId: user.userId || user.user_id,
            name: user.name || 'Unknown'
          })),
          page: page || 0,
          page_size: pageSize || 10,
          count: response.length
        };
        console.log('getUserFriends - Mapped users:', users);
        return users;
      }
      
      // Si ya tiene la estructura PaginatedUsers
      return response;
    } catch (error: any) {
      console.error('Error getting users:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
      console.error('Error data:', error.data);
      // Retornar lista vacía en caso de error
      return { users: [], page: page || 0, page_size: pageSize || 10, count: 0 };
    }
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
      { language: 'printscript', extension: 'prs' },
      { language: 'javascript', extension: 'js' },
      { language: 'typescript', extension: 'ts' },
    ];
  }
}
