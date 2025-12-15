export type BackendSnippetStatus = 'TO_DO' | 'PENDING' | 'PASSED' | 'FAILED';

export type BackendSnippet = {
    id: string;
    name: string;
    language: string;
    version: string;
};

export interface BackendSnippetListItem {
    id: string;
    name: string;
    language: string;
    version: string;
    author: string;
    status: "PASSED" | "FAILED" | "PENDING";
}

export interface BackendPaginatedSnippets {
    page: number;
    pageSize: number;
    total: number;
    snippets: BackendSnippetListItem[];
}
