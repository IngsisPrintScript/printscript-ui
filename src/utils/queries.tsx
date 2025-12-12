import {useMutation, UseMutationResult, useQuery} from 'react-query';
import {CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet} from './snippet.ts';
import {SnippetOperations} from "./snippetOperations.ts";
import {PaginatedUsers} from "./users.ts";
// import {FakeSnippetOperations} from "./mock/fakeSnippetOperations.ts";
import {TestCase} from "../types/TestCase.ts";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";
import { RealSnippetOperations } from './realSnippetOperations.ts';
import {useAuth0} from "@auth0/auth0-react";
import {queryClient} from "../App.tsx";
import {ExecSnippetInput} from "./adapters/dataAdapters.ts";
// import {useEffect} from "react";


let snippetOperationsInstance: SnippetOperations | null = null;

export const useSnippetsOperations = () => {
  useAuth0();

  // useEffect(() => {
  //     getAccessTokenSilently()
  //         .then(token => {
  //             console.log(token)
  //         })
  //         .catch(error => console.error(error));
  // });

  if (!snippetOperationsInstance) {
    // snippetOperationsInstance = new FakeSnippetOperations(/* getAccessTokenSilently */);
    snippetOperationsInstance = new RealSnippetOperations();
  }

  return snippetOperationsInstance;
}

// ------------------- SNIPPETS -------------------

export const useGetSnippets = (page: number = 0, pageSize: number = 10, snippetName?: string) => {
  const snippetOperations = useSnippetsOperations()
  return useQuery<PaginatedSnippets, Error>(
      ['listSnippets', page, pageSize, snippetName],
      () => snippetOperations.listSnippetDescriptors(page, pageSize, snippetName)
  );
};

export const useGetSnippetById = (id: string) => {
  const snippetOperations = useSnippetsOperations()
  return useQuery<Snippet | undefined, Error>(
      ['snippet', id],
      () => snippetOperations.getSnippetById(id),
      { enabled: !!id }
  );
};

export const useCreateSnippet = ({onSuccess}: {onSuccess: () => void}): UseMutationResult<Snippet, Error, CreateSnippet> => {
  const snippetOperations = useSnippetsOperations()
  return useMutation<Snippet, Error, CreateSnippet>(
      createSnippet => snippetOperations.createSnippet(createSnippet),
      {onSuccess}
  );
};

export const useUpdateSnippetById = ({onSuccess}: {onSuccess: () => void}): UseMutationResult<Snippet, Error, { id: string; updateSnippet: UpdateSnippet }> => {
  const snippetOperations = useSnippetsOperations()
  return useMutation<Snippet, Error, { id: string; updateSnippet: UpdateSnippet }>(
      ({id, updateSnippet}) => snippetOperations.updateSnippetById(id, updateSnippet),
      {onSuccess}
  );
};

// ------------------- USERS -------------------

export const useGetUsers = (name: string = "", page: number = 0, pageSize: number = 10) => {
  const snippetOperations = useSnippetsOperations()
  return useQuery<PaginatedUsers, Error>(
      ['users', name, page, pageSize],
      () => snippetOperations.getUserFriends(name, page, pageSize)
  );
};

export const useShareSnippet = () => {
  const snippetOperations = useSnippetsOperations()
  return useMutation<Snippet, Error, { snippetId: string; userId: string }>(
      ({snippetId, userId}) => snippetOperations.shareSnippet(snippetId, userId)
  );
};

// ------------------- TEST CASES -------------------

export const useGetTestCases = (snippetId: string) => {
  const snippetOperations = useSnippetsOperations()
  return useQuery<TestCase[], Error>(
      ['testCases', snippetId],
      () => snippetOperations.getTestCases(snippetId),
      { enabled: !!snippetId }
  );
};

export const usePostTestCase = (snippetId: string) => {
  const snippetOperations = useSnippetsOperations()
  return useMutation<TestCase, Error, Partial<TestCase>>(
      (tc) => snippetOperations.postTestCase(tc, snippetId),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(['testCases', snippetId])
        }
      }
  );
};

export const useUpdateTestCase = (snippetId: string) => {
  const snippetOperations = useSnippetsOperations();

  return useMutation<TestCase, Error, TestCase>(
      (tc) => snippetOperations.updateTestCase(tc),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(['testCases', snippetId]);
        }
      }
  );
};
export const useRemoveTestCase = (snippetId: string) => {
  const snippetOperations = useSnippetsOperations()
  return useMutation<string, Error, string>(
      (id) => snippetOperations.removeTestCase(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(['testCases', snippetId])
        }
      }
  );
};
export type TestCaseResult = {
  outputs: string[];
  errors: string[];
  status: "PASSED" | "FAILED";
};

export const useTestSnippet = () => {
  const snippetOperations = useSnippetsOperations()
  return useMutation<TestCaseResult, Error, Partial<TestCase>>(
      (tc) => snippetOperations.testSnippet(tc)
  );
};

// ------------------- RULES -------------------

export const useGetFormatRules = () => {
  const snippetOperations = useSnippetsOperations()
  return useQuery<Rule[], Error>('formatRules', () => snippetOperations.getFormatRules());
};

export const useModifyFormatRules = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()
  return useMutation<Rule[], Error, Rule[]>(rule => snippetOperations.modifyFormatRule(rule), {onSuccess});
};

export const useGetLintingRules = () => {
  const snippetOperations = useSnippetsOperations()
  return useQuery<Rule[], Error>('lintingRules', () => snippetOperations.getLintingRules());
};

export const useModifyLintingRules = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()
  return useMutation<Rule[], Error, Rule[]>(rule => snippetOperations.modifyLintingRule(rule), {onSuccess});
};

export const useInitializeRules = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const snippetOperations = useSnippetsOperations();

  return useMutation<void, Error, void>(
      () => snippetOperations.initializeRules(),
      {
        onSuccess
      }
  );
};

// ------------------- MISC -------------------

export const useFormatSnippet = () => {
  const snippetOperations = useSnippetsOperations();

  return useMutation<any, Error, string>(
      (snippetId) => snippetOperations.formatSnippet(snippetId)
  );
};

export const useDeleteSnippet = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()
  return useMutation<string, Error, string>(id => snippetOperations.deleteSnippet(id), {onSuccess});
};

export const useGetFileTypes = () => {
  const snippetOperations = useSnippetsOperations()
  return useQuery<FileType[], Error>('fileTypes', () => snippetOperations.getFileTypes());
};

export const useExecSnippet = () => {
  const snippetOperations = useSnippetsOperations()
  return useMutation(({ snippetId, inputs, envs }: ExecSnippetInput) =>
      snippetOperations.execSnippet(snippetId, inputs,envs)
  );
};