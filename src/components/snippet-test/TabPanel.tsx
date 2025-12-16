import { useEffect, useState } from "react";
import { TestCase } from "../../types/TestCase.ts";
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    TextField,
} from "@mui/material";
import { BugReport, Delete, Save } from "@mui/icons-material";
import { useTestSnippet } from "../../utils/queries.tsx";

type TabPanelProps = {
    index: number;
    value: number;
    test?: TestCase;
    saveTest: (test: Partial<TestCase>) => Promise<void>;
    removeTest?: () => void;
};

export const TabPanel = ({
                             value,
                             index,
                             test,
                             saveTest,
                             removeTest
                         }: TabPanelProps) => {

    const [testData, setTestData] = useState<Partial<TestCase>>({
        name: "",
        inputs: [],
        expectedOutputs: [],
        envs: {}
    });

    const { mutateAsync: testSnippet, data } = useTestSnippet();

    useEffect(() => {
        if (!test) return;

        setTestData({
            name: test.name,
            inputs: test.inputs,
            expectedOutputs: test.expectedOutputs,
            envs: test.envs ?? {}
        });
    }, [test?.testId]);

    const handleEnvChange = (envString: string) => {
        const envs: Record<string, string> = {};

        envString
            .split(";")
            .map(v => v.trim())
            .filter(Boolean)
            .forEach(pair => {
                const [k, v] = pair.split("=");
                if (k && v) envs[k.trim()] = v.trim();
            });

        setTestData(prev => ({ ...prev, envs }));
    };

    const envString = Object.entries(testData.envs ?? {})
        .map(([k, v]) => `${k}=${v}`)
        .join(";");

    const renderStatus = () => {
        if (!data) return <Chip label="Pending" color="warning" size="small" />;

        return data.status === "PASSED"
            ? <Chip label="Pass" color="success" size="small" />
            : <Chip label="Fail" color="error" size="small" />;
    };

    return (
        <div hidden={value !== index} style={{ width: "100%" }}>
            {value === index && (
                <Box sx={{ px: 3 }} display="flex" flexDirection="column" gap={2}>

                    <TextField
                        label="Name"
                        size="small"
                        value={testData.name ?? ""}
                        onChange={e => setTestData({ ...testData, name: e.target.value })}
                    />

                    <Autocomplete
                        multiple
                        freeSolo
                        size="small"
                        value={testData.inputs ?? []}
                        onChange={(_, v) => setTestData({ ...testData, inputs: v })}
                        renderInput={p => <TextField {...p} label="Inputs" />}
                        options={[]}
                    />

                    <Autocomplete
                        multiple
                        freeSolo
                        size="small"
                        value={testData.expectedOutputs ?? []}
                        onChange={(_, v) => setTestData({ ...testData, expectedOutputs: v })}
                        renderInput={p => <TextField {...p} label="Expected Outputs" />}
                        options={[]}
                    />

                    <TextField
                        label="Environment Variables"
                        size="small"
                        placeholder="VAR=123;FOO=bar"
                        value={envString}
                        onChange={e => handleEnvChange(e.target.value)}
                    />

                    <Box display="flex" gap={1} alignItems="center">
                        {removeTest && test?.testId && (
                            <Button color="error" startIcon={<Delete />} onClick={removeTest}>
                                Remove
                            </Button>
                        )}

                        <Button
                            startIcon={<Save />}
                            disabled={!testData.name}
                            onClick={() => saveTest(testData)}
                        >
                            Save
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<BugReport />}
                            disabled={!test?.testId}
                            onClick={() =>
                                testSnippet({ testId: test!.testId, snippetId: test!.snippetId })
                            }
                        >
                            Test
                        </Button>

                        <Box flexGrow={1} />
                        {renderStatus()}
                    </Box>
                </Box>
            )}
        </div>
    );
};
