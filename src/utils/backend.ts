export type BackendSnippetStatus = 'TO_DO' | 'PENDING' | 'PASSED' | 'FAILED';

export type BackendSnippet = {
    id: string;
    name: string;
    language: string;
    version: string;
};

export type BackendSnippetWithLintData = {
    snippet: BackendSnippet;
    valid: BackendSnippetStatus;
    user: string;
    content: string;
};

export type BackendPaginatedSnippets = {
    page: number;
    page_size: number;
    count: number;
    snippets: BackendSnippetWithLintData[];
};
