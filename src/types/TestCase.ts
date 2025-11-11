export type TestCase = {
    id: string;
    name: string;
    inputs: string[];
    expectedOutputs: string[];
};

export type CreateTestCase = {
    id?: string;
    snippetId: string;
    name: string;
    inputs?: string[];
    expectedOutputs?: string[];
}
