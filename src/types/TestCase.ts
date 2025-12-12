export interface TestCase {
    testId: string;
    snippetId: string;
    name: string;
    inputs: string[];
    expectedOutputs: string[];
    envs: Record<string, string>;
}