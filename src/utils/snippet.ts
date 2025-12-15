import {Pagination} from "./pagination.ts";
import {FileType} from "../types/FileType.ts";

export type CompilationEnum =
    'PENDING'   |
    'COMPILE'    |
    'NOT COMPILE'    |
    'NOT CHECKED'

export type SnippetProperty = 'OWNER' | 'SHARED' | 'BOTH'

export type CreateSnippet = {
  name: string;
  content: string;
  version: string;
  language: string;
  extension: string;
}

export type CreateSnippetWithLang = CreateSnippet & { language: string }

export type UpdateSnippet = {
  name: string
  version: string
  language: string
  content: string
}

export type Snippet = CreateSnippet & {
  id: string
} & SnippetStatus

type SnippetStatus = {
  compliance: CompilationEnum;
  author: string;
}
export type PaginatedSnippets = Pagination & {
  snippets: Snippet[]
}

export const getFileLanguage = (fileTypes: FileType[], fileExt?: string) => {
  return fileExt && fileTypes?.find(x => x.extension == fileExt)
}

export type SnippetFilters = {
    page: number
    page_size: number
    name?: string
    language?: string
    compliance?: 'valid' | 'invalid'
    property?: 'OWNER' | 'SHARED' | 'BOTH'
    sortBy?: 'NAME' | 'LANGUAGE' | 'VALID'
    order?: 'ASC' | 'DESC'
}