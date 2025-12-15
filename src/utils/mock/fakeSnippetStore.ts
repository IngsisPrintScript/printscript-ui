import {CompilationEnum, CreateSnippet, Snippet, UpdateSnippet} from '../snippet'
import {v4 as uuid} from 'uuid'
import {PaginatedUsers} from "../users.ts";
import {TestCase} from "../../types/TestCase.ts";
import {TestCaseResult} from "../queries.tsx";
import {FileType} from "../../types/FileType.ts";
import {Rule} from "../../types/Rule.ts";

const INITIAL_SNIPPETS: Snippet[] = [
  {
    id: '9af91631-cdfc-4341-9b8e-3694e5cb3672',
    name: 'Super Snippet',
    content: 'let a : number = 5;\nlet b : number = 5;\n\nprintln(a + b);',
    version: '1.0',
    compliance: 'PENDING',
    author: 'John Doe',
    language: 'printscript',
    extension: 'prs'
  },
  {
    id: 'c48cf644-fbc1-4649-a8f4-9dd7110640d9',
    name: 'Extra cool Snippet',
    content: 'let a : number = 5;\nlet b : number = 5;\n\nprintln(a + b);',
    version: '1.0',
    compliance: 'NOT COMPILE',
    author: 'John Doe',
    language: 'printscript',
    extension: 'prs'
  },
  {
    id: '34bf4b7a-d4a1-48be-bb26-7d9a3be46227',
    name: 'Boaring Snippet',
    content: 'let a : number = 5;\nlet b : number = 5;\n\nprintln(a + b);',
    version: '1.0',
    compliance: 'COMPILE',
    author: 'John Doe',
    language: 'printscript',
    extension: 'prs'
  }
]

const paginatedUsers: PaginatedUsers = {
  count: 5,
  page: 1,
  page_size: 10,
  users: [
    {
      name: "Chona",
      userId: "1"
    },
    {
      name: "Fede",
      userId: "2"
    },
    {
      name: "Mateo",
      userId: "3"
    },
    {
      name: "Tomi",
      userId: "4"
    },
    {
      name: "Berrets",
      userId: "5"
    }
  ]
}

const INITIAL_FORMATTING_RULES: Rule[] = [
  {
    id: '1',
    name: "indentation",
    isActive: true,
    value: 3
  },
  {
    id: '2',
    name: "open-if-block-on-same-line",
    isActive: false,
  },
  {
    id: '3',
    name: "max-line-length",
    isActive: true,
    value: 100
  },
  {
    id: '4',
    name: "no-trailing-spaces",
    isActive: false,
  },
  {
    id: '5',
    name: "no-multiple-empty-lines",
    isActive: false,
  }
]

const INITIAL_LINTING_RULES: Rule[] = [
  {
    id: '1',
    name: "no-expressions-in-print-line",
    isActive: true,
  },
  {
    id: '2',
    name: "no-unused-vars",
    isActive: true,
  },
  {
    id: '3',
    name: "no-undef-vars",
    isActive: false,
  },
  {
    id: '4',
    name: "no-unused-params",
    isActive: false,
  },
]

const fakeTestCases: TestCase[] = [
  {
    testId: uuid(),
    snippetId: "1",
    name: "Test Case 1",
    inputs: ["A", "B"],
    expectedOutputs: ["C", "D"],
    envs: {}
  },
  {
    testId: uuid(),
    snippetId: "1",
    name: "Test Case 2",
    inputs: ["E", "F"],
    expectedOutputs: ["G", "H"],
    envs: {}
  }
]

const fileTypes: FileType[] = [
  {
    language: "printscript",
    extension: "prs",
  },
  {
    language: "python",
    extension: "py",
  },
  {
    language: "java",
    extension: "java",
  },
  {
    language: 'golang',
    extension: 'go'
  }
]

export class FakeSnippetStore {
  private readonly snippetMap: Map<string, Snippet> = new Map()
  private readonly testCaseMap: Map<string, TestCase> = new Map()
  private formattingRules: Rule[] = [];
  private lintingRules: Rule[] = [];

  constructor() {
    INITIAL_SNIPPETS.forEach(snippet => {
      this.snippetMap.set(snippet.id, snippet)
    })

    fakeTestCases.forEach(testCase => {
      this.testCaseMap.set(testCase.testId, testCase)
    })

    this.formattingRules = INITIAL_FORMATTING_RULES
    this.lintingRules = INITIAL_LINTING_RULES
  }

  listSnippetDescriptors(): Snippet[] {
    return Array.from(this.snippetMap, ([, value]) => value)
  }

  createSnippet(createSnippet: CreateSnippet): Snippet {
    const id = uuid();
    const newSnippet = {
      id,
      compliance: 'compliant' as CompilationEnum,
      author: 'yo',
      ...createSnippet
    }
    this.snippetMap.set(id, newSnippet)

    return newSnippet
  }

  getSnippetById(id: string): Snippet | undefined {
    return this.snippetMap.get(id)
  }

  updateSnippet(id: string, updateSnippet: UpdateSnippet): Snippet {
    const existingSnippet = this.snippetMap.get(id)

    if (existingSnippet === undefined)
      throw Error(`Snippet with id ${id} does not exist`)

    const newSnippet = {
      ...existingSnippet,
      ...updateSnippet
    }
    this.snippetMap.set(id, newSnippet)

    return newSnippet
  }

  getUserFriends(name: string, page: number, pageSize: number) {
    return {
      ...paginatedUsers,
      page: page,
      pageSize: pageSize,
      users: paginatedUsers.users.filter(x => x.name.includes(name))
    };
  }

  getFormatRules(): Rule[] {
    return this.formattingRules
  }

  getLintingRules(): Rule[] {
    return this.lintingRules
  }

  formatSnippet(snippetContent: string): string {
    return `//Mocked format of snippet :) \n${snippetContent}`
  }

  getTestCases(): TestCase[] {
    return Array.from(this.testCaseMap, ([, value]) => value)
  }

  postTestCase(testCase: Partial<TestCase>): TestCase {
    const testId = testCase.testId ?? uuid()

    const newTestCase: TestCase = {
      testId,
      snippetId: testCase.snippetId ?? "1",
      name: testCase.name ?? "New Test",
      inputs: testCase.inputs ?? [],
      expectedOutputs: testCase.expectedOutputs ?? [],
      envs: testCase.envs ?? {}
    }

    this.testCaseMap.set(testId, newTestCase)
    return newTestCase
  }

  removeTestCase(id: string): string {
    this.testCaseMap.delete(id)
    return id
  }

  deleteSnippet(id: string): string {
    this.snippetMap.delete(id)
    return id
  }

  testSnippet(): TestCaseResult {
    return {
      status: Math.random() > 0.5 ? "PASSED" : "FAILED",
      outputs: ["mock output"],
      errors: []
    }
  }

  getFileTypes(): FileType[] {
    return fileTypes
  }

  modifyFormattingRule(newRules: Rule[]): Rule[] {
    this.formattingRules = newRules;
    return newRules;
  }

  modifyLintingRule(newRules: Rule[]): Rule[] {
    this.lintingRules = newRules
    return newRules
  }
}
