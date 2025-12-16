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

import {
    adaptBackendRuleToUI,
    adaptBackendTestCaseToUI,
    BackendTestCase,
    RunSnippetResponse
} from './adapters/dataAdapters';

import {
    BackendPaginatedSnippets,
    BackendSnippetListItem
} from './backend';

const API_PREFIX: string = import.meta.env.VITE_API_PREFIX ?? '';

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
            `${API_PREFIX}/snippet/filter?page=${page}&page_size=${pageSize}`,
            body
        );

        return {
            page: response.page,
            page_size: response.pageSize,
            count: response.total,
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

        const response = await httpClient.post<any>(
            `${API_PREFIX}/snippet/create/text`,
            dto
        );

        return this.adaptBackendSnippet(response);
    }

    async getSnippetById(id: string): Promise<Snippet | undefined> {
        try {
            const response = await httpClient.get<any>(
                `${API_PREFIX}/snippet/${id}`
            );
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
            `${API_PREFIX}/snippet/${id}/update/text`,
            dto
        );

        return this.adaptBackendSnippet(response);
    }

    async deleteSnippet(id: string): Promise<string> {
        await httpClient.delete(`${API_PREFIX}/snippet/${id}`);
        return id;
    }

    async shareSnippet(snippetId?: string, userId?: string): Promise<Snippet> {
        if (!snippetId) throw new Error("snippetId requerido");
        if (!userId) throw new Error("userId requerido");

        const response = await httpClient.put<any>(
            `${API_PREFIX}/snippet/${snippetId}/share`,
            { userId, action: "READ" }
        );

        return this.adaptBackendSnippet(response);
    }

    // ------------------------------------------------------------
    // ADAPTER
    // ------------------------------------------------------------

    private adaptBackendSnippet(
        backend: BackendSnippetListItem
    ): Snippet {

        const compliance: CompilationEnum =
            backend.status === "PASSED" ? "COMPILE" :
                backend.status === "FAILED" ? "NOT COMPILE" :
                    backend.status === "PENDING" ? "PENDING" :
                        "NOT CHECKED";

        return {
            id: backend.id,
            name: backend.name,
            content: backend.content,
            version: backend.version ?? "1.0",
            language: backend.language,
            extension: backend.language === "printscript" ? "pisp" : "txt",
            compliance,
            author: backend.author
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

        return httpUserClient.get<PaginatedUsers>(`/users`, params);
    }

    // ------------------------------------------------------------
    // TEST CASES
    // ------------------------------------------------------------

    async getTestCases(snippetId?: string): Promise<TestCase[]> {
        const id = snippetId ?? this.currentSnippetId;

        const data = await httpClient.get<BackendTestCase[]>(
            `${API_PREFIX}/test`,
            { snippetId: id }
        );

        return data.map(adaptBackendTestCaseToUI);
    }

    async postTestCase(
        testCase: Partial<TestCase>,
        snippetId: string
    ): Promise<TestCase> {

        const dto = {
            snippetId: snippetId || this.currentSnippetId,
            name: testCase.name ?? "New Test",
            inputs: testCase.inputs ?? [],
            expectedOutputs: testCase.expectedOutputs ?? [],
            envs: testCase.envs ?? {}
        };

        const r = await httpClient.post<BackendTestCase>(
            `${API_PREFIX}/test/create`,
            dto
        );

        return adaptBackendTestCaseToUI(r);
    }

    async removeTestCase(id: string): Promise<string> {
        await httpClient.delete(
            `${API_PREFIX}/test`,
            { testId: id }
        );
        return id;
    }

    async testSnippet(testCase: Partial<TestCase>): Promise<TestCaseResult> {
        return httpClient.post<TestCaseResult>(
            `${API_PREFIX}/test/run`,
            {
                testCaseId: testCase.testId,
                snippetId: testCase.snippetId
            }
        );
    }

    async updateTestCase(testCase: TestCase): Promise<TestCase> {
        const dto = {
            testId: testCase.testId,
            snippetId: testCase.snippetId,
            name: testCase.name,
            inputs: testCase.inputs,
            outputs: testCase.expectedOutputs,
            envs: testCase.envs || {}
        };

        const r = await httpClient.put<BackendTestCase>(
            `${API_PREFIX}/test/update`,
            dto
        );

        return adaptBackendTestCaseToUI(r);
    }

    // ------------------------------------------------------------
    // RULES
    // ------------------------------------------------------------

    async getFormatRules(): Promise<Rule[]> {
        const data = await httpClient.get<any>(
            `${API_PREFIX}/rules`,
            { type: 'FORMATTING' }
        );

        if (!Array.isArray(data)) return [];
        return data.map(adaptBackendRuleToUI);
    }

    async getLintingRules(): Promise<Rule[]> {
        const data = await httpClient.get<any>(
            `${API_PREFIX}/rules`,
            { type: 'LINT' }
        );

        if (!Array.isArray(data)) return [];
        return data.map(adaptBackendRuleToUI);
    }

    async modifyFormatRule(rules: Rule[]): Promise<Rule[]> {
        const payload = rules.map(rule => ({
            ruleId: rule.id,
            value: String(rule.value ?? '')
        }));

        return httpClient.put<Rule[]>(
            `${API_PREFIX}/rules/update`,
            payload
        );
    }

    async modifyLintingRule(rules: Rule[]): Promise<Rule[]> {
        const payload = rules.map(rule => ({
            ruleId: rule.id,
            value: String(rule.value ?? '')
        }));

        return httpClient.put<Rule[]>(
            `${API_PREFIX}/rules/update`,
            payload
        );
    }

    async initializeRules(): Promise<void> {
        await httpClient.post(
            `${API_PREFIX}/rules/initialize`,
            {}
        );
    }

    // ------------------------------------------------------------
    // MISC
    // ------------------------------------------------------------

    async formatSnippet(snippetId: string): Promise<string> {
        const status = await httpClient.get<string>(
            `${API_PREFIX}/rules/format`,
            { snippetId }
        );

        if (status === 'VALID') {
            const snip = await this.getSnippetById(snippetId);
            return snip?.content ?? '';
        }
        return '';
    }

    async getFileTypes(): Promise<FileType[]> {
        return [
            { language: "printscript", extension: "pisp" },
            { language: "javascript", extension: "js" },
            { language: "typescript", extension: "ts" }
        ];
    }

    async execSnippet(
        snippetId: string,
        inputs: string[],
        envs: Record<string, string>
    ): Promise<RunSnippetResponse> {
        return httpClient.post(
            `${API_PREFIX}/snippet/${snippetId}/execute`,
            { inputs, envs }
        );
    }
    async downloadSnippet(
        snippetId: string,
        version: "original" | "formatted"
    ): Promise<Blob> {
        return httpClient.getBlob(
            `${API_PREFIX}/snippet/${snippetId}/download`,
            { version }
        );
    }
}
