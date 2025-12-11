import { SnippetOperations } from './snippetOperations';
import { httpClient, httpUserClient } from './httpClient';

import {
    CompilationEnum,
    CreateSnippet,
    PaginatedSnippets,
    Snippet,
    UpdateSnippet
} from './snippet';

import { PaginatedUsers } from './users';
import { TestCase } from '../types/TestCase';
import { TestCaseResult } from './queries';
import { FileType } from '../types/FileType';
import { Rule } from '../types/Rule';

import { adaptBackendTestCaseToUI, BackendTestCase } from './adapters/dataAdapters';
import { BackendPaginatedSnippets, BackendSnippetWithLintData } from './backend';

export class RealSnippetOperations implements SnippetOperations {

    private currentSnippetId: string | null = null;

    setCurrentSnippetId(id: string | null): void {
        this.currentSnippetId = id;
    }
// ------------------------------------------------------------
    // SNIPPETS
    // ------------------------------------------------------------

    async listSnippetDescriptors(
        page: number,
        pageSize: number,
        snippetName?: string
    ): Promise<PaginatedSnippets> {

        const body = snippetName ? { name: snippetName } : {};

        const response = await httpClient.post<BackendPaginatedSnippets>(
            `/snippet/filter?page=${page}&page_size=${pageSize}`,
            body
        );

        return {
            page: response.page,
            page_size: response.page_size,
            count: response.count,
            snippets: response.snippets.map(s => this.adaptBackendSnippet(s))
        };
    }

    async createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
        const dto = {
            name: createSnippet.name,
            description: "",
            language: createSnippet.language,
            version: "1.0",
            content: createSnippet.content
        };

        const response = await httpClient.post<any>(`/snippet/create/text`, dto);
        return this.adaptBackendSnippet(response);
    }

    async getSnippetById(id: any): Promise<Snippet | undefined> {
        try {
            const response = await httpClient.get<any>(`/snippet/${id}`);
            return this.adaptBackendSnippet(response);
        } catch (err: any) {
            if (err.status === 403 || err.status === 404) return undefined;
            throw err;
        }
    }

    async updateSnippetById(
        id: string,
        updateSnippet: UpdateSnippet
    ): Promise<Snippet> {
        const dto = {
            name: updateSnippet.name,
            description: "",
            language: updateSnippet.language,
            version: updateSnippet.version,
            content: updateSnippet.content
        };

        const response = await httpClient.put<any>(
            `/snippet/${id}/update/text`,
            dto
        );

        return this.adaptBackendSnippet(response);
    }

    async deleteSnippet(id: string): Promise<string> {
        await httpClient.delete(`/snippet/${id}`);
        return id;
    }

    async shareSnippet(snippetId?: string, userId?: string): Promise<Snippet> {
        if (!snippetId) throw new Error("snippetId requerido");
        if (!userId) throw new Error("userId requerido");

        const response = await httpClient.put<any>(
            `/snippet/${snippetId}/share`,
            { userId, action: "READ" }
        );

        return this.adaptBackendSnippet(response);
    }

    // ------------------------------------------------------------
    // ADAPTER SNIPPET
    // ------------------------------------------------------------

    private adaptBackendSnippet(backend: BackendSnippetWithLintData): Snippet {
        const status = backend.valid;

        const compliance: CompilationEnum =
            status === "PASSED" ? "PASSED" :
                status === "FAILED" ? "FAILED" :
                    status === "PENDING" ? "PENDING" :
                        "PENDING";

        return {
            id: backend.snippet.id,
            name: backend.snippet.name,
            content: backend.content ?? "",
            language: backend.snippet.language,
            extension: backend.snippet.language === "printscript" ? "pisp" : "txt",
            compliance,
            author: backend.user
        };
    }

    // ------------------------------------------------------------
    // USERS
    // ------------------------------------------------------------

    async getUserFriends(
        name?: string,
        page?: number,
        pageSize?: number
    ): Promise<PaginatedUsers> {

        const params: any = {};
        if (name) params.name = name;
        if (page !== undefined) params.page = page;
        if (pageSize !== undefined) params.page_size = pageSize;

        return await httpUserClient.get<PaginatedUsers>(`/users`, params);
    }

    // ------------------------------------------------------------
    // TEST CASES
    // ------------------------------------------------------------

    async getTestCases(snippetId?: string): Promise<TestCase[]> {
        const id = snippetId ?? this.currentSnippetId;
        const data = await httpClient.get<BackendTestCase[]>(`/test?snippetId=${id}`);
        return data.map(adaptBackendTestCaseToUI);
    }

    async postTestCase(testCase: Partial<TestCase>, snippetId?: string): Promise<TestCase> {
        const id = snippetId ?? this.currentSnippetId;

        const dto = {
            snippetId: id,
            name: testCase.name ?? "Unnamed Test",
            input: testCase.inputs ?? [],
            output: testCase.expectedOutputs ?? []
        };

        const r = await httpClient.post<BackendTestCase>(`/test/create`, dto);
        return adaptBackendTestCaseToUI(r);
    }

    async updateTestCase(testCase: Partial<TestCase>, snippetId?: string): Promise<TestCase> {
        const id = snippetId ?? this.currentSnippetId;

        const dto = {
            testId: testCase.id,
            snippetId: id,
            name: testCase.name,
            inputs: testCase.inputs,
            outputs: testCase.expectedOutputs
        };

        const r = await httpClient.put<BackendTestCase>(`/test/update`, dto);
        return adaptBackendTestCaseToUI(r);
    }

    async removeTestCase(id: string): Promise<string> {
        await httpClient.delete(`/test?testId=${id}`);
        return id;
    }

    async testSnippet(testCase: Partial<TestCase>, snippetId?: string): Promise<TestCaseResult> {
        const id = snippetId ?? this.currentSnippetId;
        await httpClient.post(`/test/run`, { testCaseId: testCase.id, snippetId: id });
        return "success";
    }

    // ------------------------------------------------------------
    // RULES
    // ------------------------------------------------------------

    async getFormatRules(): Promise<Rule[]> {
        return []; // implementar cuando rule-service esté listo
    }

    async getLintingRules(): Promise<Rule[]> {
        return []; // implementar cuando rule-service esté listo
    }

    async modifyFormatRule(rules: Rule[]): Promise<Rule[]> {
        await httpClient.put(`/rules/update`, rules);
        return rules;
    }

    async modifyLintingRule(rules: Rule[]): Promise<Rule[]> {
        await httpClient.put(`/rules/update`, rules);
        return rules;
    }

    // ------------------------------------------------------------
    // MISC
    // ------------------------------------------------------------

    async formatSnippet(snippetContent: string, snippetId?: string): Promise<string> {
        const id = snippetId ?? this.currentSnippetId;
        const status = await httpClient.get(`/rules/format?snippetId=${id}`);

        if (status === "VALID") {
            const snip = await this.getSnippetById(id);
            return snip?.content ?? snippetContent;
        }
        return snippetContent;
    }

    async getFileTypes(): Promise<FileType[]> {
        return [
            { language: "printscript", extension: "pisp" },
            { language: "javascript", extension: "js" },
            { language: "typescript", extension: "ts" }
        ];
    }
}
