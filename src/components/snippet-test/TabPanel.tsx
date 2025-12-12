import { useEffect, useState } from "react";
import { TestCase } from "../../types/TestCase";
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    TextField,
    Typography
} from "@mui/material";
import { BugReport, Delete, Save } from "@mui/icons-material";
import { useTestSnippet } from "../../utils/queries";

type TabPanelProps = {
    index: number;
    value: number;
    test?: TestCase;
    saveTest: (test: Partial<TestCase>) => void;
    removeTest?: () => void;
};

export const TabPanel = ({
                             value,
                             index,
                             test,
                             saveTest,
                             removeTest
                         }: TabPanelProps) => {

    const [testData, setTestData] = useState<Partial<TestCase>>(
        test ?? {
            name: "",
            inputs: [],
            expectedOutputs: [],
            envs: {}
        }
    );

    const { mutateAsync: testSnippet, data } = useTestSnippet();

    /**
     * Sincroniza el test recibido por props con el estado local
     */
    useEffect(() => {
        if (!test) return;

        setTestData({
            name: test.name,
            inputs: test.inputs,
            expectedOutputs: test.expectedOutputs,
            envs: test.envs ?? {}
        });
    }, [test]);

    /**
     * Maneja cambios en el input de variables de entorno
     */
    const handleEnvChange = (envString: string) => {
        const pairs = envString
            .split(";")
            .map(v => v.trim())
            .filter(v => v.length > 0);

        const envMap: Record<string, string> = {};
        pairs.forEach(p => {
            const [k, v] = p.split("=");
            if (k && v) {
                envMap[k.trim()] = v.trim();
            }
        });

        setTestData(prev => ({
            ...prev,
            envs: envMap
        }));
    };

    /**
     * String derivado desde envs (no necesita estado propio)
     */
    const envString = Object.entries(testData.envs ?? {})
        .map(([k, v]) => `${k}=${v}`)
        .join(";");

    const renderStatus = () => {
        if (!data) {
            return <Chip label="Pending" color="warning" size="small" />;
        }

        switch (data.status) {
            case "PASSED":
                return <Chip label="Pass" color="success" size="small" />;
            case "FAILED":
                return <Chip label="Fail" color="error" size="small" />;
            default:
                return <Chip label="Pending" color="warning" size="small" />;
        }
    };

    return (
        <div hidden={value !== index} style={{ width: "100%", height: "100%" }}>
            {value === index && (
                <Box
                    sx={{ px: 3 }}
                    display="flex"
                    flexDirection="column"
                    gap={2}
                >

                    {/* NAME */}
                    <Box>
                        <Typography fontWeight="bold">Name</Typography>
                        <TextField
                            size="small"
                            value={testData.name ?? ""}
                            onChange={(e) =>
                                setTestData({
                                    ...testData,
                                    name: e.target.value
                                })
                            }
                        />
                    </Box>

                    {/* INPUTS */}
                    <Box>
                        <Typography fontWeight="bold">Inputs</Typography>
                        <Autocomplete
                            multiple
                            freeSolo
                            size="small"
                            value={testData.inputs ?? []}
                            onChange={(_, value) =>
                                setTestData({
                                    ...testData,
                                    inputs: value
                                })
                            }
                            renderTags={(value, getProps) =>
                                value.map((v, i) => (
                                    <Chip
                                        label={v}
                                        {...getProps({ index: i })}
                                    />
                                ))
                            }
                            renderInput={(params) =>
                                <TextField {...params} />
                            }
                            options={[]}
                        />
                    </Box>

                    {/* EXPECTED OUTPUTS */}
                    <Box>
                        <Typography fontWeight="bold">Expected Outputs</Typography>
                        <Autocomplete
                            multiple
                            freeSolo
                            size="small"
                            value={testData.expectedOutputs ?? []}
                            onChange={(_, value) =>
                                setTestData({
                                    ...testData,
                                    expectedOutputs: value
                                })
                            }
                            renderTags={(value, getProps) =>
                                value.map((v, i) => (
                                    <Chip
                                        label={v}
                                        {...getProps({ index: i })}
                                    />
                                ))
                            }
                            renderInput={(params) =>
                                <TextField {...params} />
                            }
                            options={[]}
                        />
                    </Box>

                    {/* ENVS */}
                    <Box>
                        <Typography fontWeight="bold">
                            Environment Variables
                        </Typography>
                        <TextField
                            size="small"
                            placeholder="VAR=123;FOO=bar"
                            value={envString}
                            onChange={(e) =>
                                handleEnvChange(e.target.value)
                            }
                            helperText="Formato: VAR=123;FOO=bar"
                        />
                    </Box>

                    {/* ACTIONS */}
                    <Box display="flex" alignItems="center" gap={1}>

                        {removeTest && test?.testId && (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                onClick={removeTest}
                            >
                                Remove
                            </Button>
                        )}

                        <Button
                            variant="outlined"
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
                                testSnippet({
                                    testId: test!.testId,
                                    snippetId: test!.snippetId
                                })
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
