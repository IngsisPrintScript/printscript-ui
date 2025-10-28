import { SnippetOperations } from './snippetOperations';
import { httpClient } from './httpClient';
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

export class RealSnippetOperations implements SnippetOperations {
  
  private currentSnippetId: string | null = null;
  
  
  setCurrentSnippetId(id: string | null): void {
    this.currentSnippetId = id;
  }
 
  async listSnippetDescriptors(
    page: number,
    pageSize: number,
    snippetName?: string
  ): Promise<PaginatedSnippets> {
    try {
      // Backend usa GET con body para filtros (raro pero así está)
      const filterBody = snippetName ? { name: snippetName } : null;
      
      // Backend espera GET con @RequestBody pero el navegador no permite body en GET
      // Usamos POST como workaround para enviar el body
      const baseURL = process.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const url = `${baseURL}/snippets/list`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: filterBody ? JSON.stringify(filterBody) : "{}"
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // El backend devuelve List<Snippet>
      return {
        page,
        page_size: pageSize,
        count: data.length,
        snippets: data.map((snippet: any) => this.adaptBackendSnippet(snippet)),
      };
    } catch (error) {
      console.error('Error listing snippets:', error);
      throw error;
    }
  }

  
  private adaptBackendSnippet(backendSnippet: any): Snippet {
    return {
      id: backendSnippet.id,
      name: backendSnippet.name,
      content: backendSnippet.contentUrl || '', // El contenido viene en contentUrl
      language: backendSnippet.language,
      extension: backendSnippet.language === 'printscript' ? 'prs' : 'txt', // TODO: Mapear correctamente
      compliance: this.mapComplianceStatus(backendSnippet.lintStatus, backendSnippet.formatStatus),
      author: backendSnippet.snippetOwnerId || 'Unknown',
    };
  }

  private mapComplianceStatus(
    lintStatus?: string,
    formatStatus?: string
  ): 'pending' | 'failed' | 'not-compliant' | 'compliant' {
    if (lintStatus === 'VALID' && formatStatus === 'VALID') return 'compliant';
    if (lintStatus === 'INVALID' || formatStatus === 'INVALID') return 'not-compliant';
    if (lintStatus === 'LINTING' || formatStatus === 'FORMATTING') return 'pending';
    return 'pending';
  }

  async createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
    try {
      const requestBody = {
        name: createSnippet.name,
        description: '', // La UI no tiene description, usar vacío
        language: createSnippet.language,
        version: '1.0', // Version por defecto
        content: createSnippet.content,
      };

      const response = await httpClient.post<any>(
        '/snippets/create/text',
        requestBody
      );
      

      return this.adaptBackendSnippet(response);
    } catch (error) {
      console.error('Error creating snippet:', error);
      throw error;
    }
  }


  async getSnippetById(id: string): Promise<Snippet | undefined> {
    try {
      // Obtenemos el Snippet completo con todos los datos
      const snippetData = await httpClient.get<any>(`/snippets/snippet`, { id });
      const contentData = await httpClient.get<{name: string, description: string, language: string, content: string}>(`/snippets/${id}`);
      
      // Combinamos los datos
      return this.adaptBackendSnippet({
        ...snippetData,
        content: contentData.content,
      });
    } catch (error) {
      console.error('Error getting snippet:', error);
      return undefined;
    }
  }

  async updateSnippetById(
    id: string,
    updateSnippet: UpdateSnippet
  ): Promise<Snippet> {
    try {
      // Primero obtenemos el snippet para tener los otros campos
      const currentSnippet = await this.getSnippetById(id);
      if (!currentSnippet) {
        throw new Error('Snippet not found');
      }

      const requestBody = {
        name: currentSnippet.name,
        description: '', // La UI no maneja description
        language: currentSnippet.language,
        version: '1.0',
        content: updateSnippet.content,
      };

      const response = await httpClient.put<any>(
        `/snippets/${id}/update/text`,
        requestBody
      );
      
      return this.adaptBackendSnippet(response);
    } catch (error) {
      console.error('Error updating snippet:', error);
      throw error;
    }
  }


  async deleteSnippet(id: string): Promise<string> {
    try {
      await httpClient.delete<void>(`/snippets/${id}`);
      return id;
    } catch (error) {
      console.error('Error deleting snippet:', error);
      throw error;
    }
  }

  async getUserFriends(
    name?: string,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedUsers> {
    try {
      const params: any = {};
      if (name) params.name = name;
      if (page !== undefined) params.page = page;
      if (pageSize !== undefined) params.page_size = pageSize;

      const response = await httpClient.get<PaginatedUsers>(
        '/users',
        params
      );
      return response;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  async shareSnippet(snippetId: string, userId: string): Promise<Snippet> {
    try {
      const response = await httpClient.post<Snippet>(
        `/snippets/${snippetId}/share`,
        { userId }
      );
      return response;
    } catch (error) {
      console.error('Error sharing snippet:', error);
      throw error;
    }
  }

  async getFormatRules(): Promise<Rule[]> {
    try {
      return [
        { id: '1', name: 'indentation', isActive: true, value: 3 },
        { id: '2', name: 'open-if-block-on-same-line', isActive: false },
        { id: '3', name: 'max-line-length', isActive: true, value: 100 },
        { id: '4', name: 'no-trailing-spaces', isActive: false },
        { id: '5', name: 'no-multiple-empty-lines', isActive: false },
      ];
    } catch (error) {
      console.error('Error getting format rules:', error);
      return [];
    }
  }


  async getLintingRules(): Promise<Rule[]> {
    try {
      return [
        { id: '1', name: 'no-expressions-in-print-line', isActive: true },
        { id: '2', name: 'no-unused-vars', isActive: true },
        { id: '3', name: 'no-undef-vars', isActive: false },
        { id: '4', name: 'no-unused-params', isActive: false },
      ];
    } catch (error) {
      console.error('Error getting linting rules:', error);
      return [];
    }
  }

  async formatSnippet(snippetContent: string): Promise<string> {
    try {
      if (!this.currentSnippetId) {
        console.error('Format requires snippetId but none is set. Call setCurrentSnippetId() first.');
        throw new Error('Format requires snippetId but none is set');
      }

      // El backend devuelve el estado (VALID, INVALID, etc), no el código formateado
      // Necesitamos obtener el contenido después del formateo
      const status = await httpClient.get<any>(`/format/${this.currentSnippetId}`);
      
      // Si el formateo fue exitoso, necesitamos re-obtener el snippet
      if (status === 'VALID' || status === 'FORMATTING') {
        const snippet = await this.getSnippetById(this.currentSnippetId);
        return snippet?.content || snippetContent;
      }
      
      return snippetContent;
    } catch (error) {
      console.error('Error formatting snippet:', error);
      throw error;
    }
  }


  async getTestCases(): Promise<TestCase[]> {
    try {
      // Backend no tiene endpoint de GET visible
      // Retornamos array vacío por ahora
      return [];
    } catch (error) {
      console.error('Error getting test cases:', error);
      return [];
    }
  }

  async postTestCase(testCase: Partial<TestCase>): Promise<TestCase> {
    try {
      // TODO: Necesitamos snippetId para crear el test
      // La interfaz de TestCase no tiene snippetId
      const createDTO = [{
        snippetId: 'placeholder', // TODO: Obtener snippetId de alguna forma
        name: testCase.name,
        input: testCase.input,
        output: testCase.output,
      }];

      const response = await httpClient.post<any>(
        '/test/create',
        createDTO
      );
      return response;
    } catch (error) {
      console.error('Error creating test case:', error);
      throw error;
    }
  }


  async removeTestCase(id: string): Promise<string> {
    try {
      return id;
    } catch (error) {
      console.error('Error removing test case:', error);
      throw error;
    }
  }

  async testSnippet(testCase: Partial<TestCase>): Promise<TestCaseResult> {
    try {
      console.warn('Test snippet needs snippetId as path param', testCase);
      return 'fail';
    } catch (error) {
      console.error('Error testing snippet:', error);
      return 'fail';
    }
  }


  async getFileTypes(): Promise<FileType[]> {
    // Backend no tiene endpoint /file-types, retornamos valores por defecto
    return [
      { language: 'printscript', extension: 'prs' },
      { language: 'javascript', extension: 'js' },
      { language: 'typescript', extension: 'ts' },
    ];
  }


  async modifyFormatRule(newRules: Rule[]): Promise<Rule[]> {
    try {
      // Adaptar Rule[] a UpdateDTO[]
      const updateDTOs = newRules.map(rule => ({
        Id: rule.id,
        value: rule.value,
        active: rule.isActive,
      }));

      await httpClient.put<void>('/format/update', updateDTOs);
      return newRules;
    } catch (error) {
      console.error('Error modifying format rules:', error);
      throw error;
    }
  }

  async modifyLintingRule(newRules: Rule[]): Promise<Rule[]> {
    try {
      // Adaptar Rule[] a UpdateDTO[]
      const updateDTOs = newRules.map(rule => ({
        Id: rule.id,
        value: rule.value,
        active: rule.isActive,
      }));

      await httpClient.put<void>('/lint/update', updateDTOs);
      return newRules;
    } catch (error) {
      console.error('Error modifying linting rules:', error);
      throw error;
    }
  }
}

