import { useState } from "react";
import { TestCase } from "../../types/TestCase.ts";
import { Autocomplete, Box, Button, Chip, TextField, Typography } from "@mui/material";
import { BugReport, Delete, Save } from "@mui/icons-material";
import { useTestSnippet } from "../../utils/queries.tsx";

type TabPanelProps = {
    index: number;
    value: number;
    test?: TestCase;
    saveTest: (test: Partial<TestCase>) => void;
    removeTest?: () => void;
};

export const TabPanel = ({ value, index, test, saveTest, removeTest }: TabPanelProps) => {
    const [testData, setTestData] = useState<Partial<TestCase>>(
        test ?? { name: "", inputs: [], expectedOutputs: [] }
    );

    const { mutateAsync: testSnippet, data } = useTestSnippet();

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            style={{ width: "100%", height: "100%" }}
        >
            {value === index && (
                <Box sx={{ px: 3 }} display="flex" flexDirection="column" gap={2}>

                    {/* NAME */}
                    <Box>
                        <Typography fontWeight="bold">Name</Typography>
                        <TextField
                            size="small"
                            value={testData.name ?? ""}
                            onChange={(e) => setTestData({ ...testData, name: e.target.value })}
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
                            onChange={(_, value) => setTestData({ ...testData, inputs: value })}
                            renderTags={(value, getProps) =>
                                value.map((v, i) => <Chip label={v} {...getProps({ index: i })} />)
                            }
                            renderInput={(params) => <TextField {...params} />}
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
                                setTestData({ ...testData, expectedOutputs: value })
                            }
                            renderTags={(value, getProps) =>
                                value.map((v, i) => <Chip label={v} {...getProps({ index: i })} />)
                            }
                            renderInput={(params) => <TextField {...params} />}
                            options={[]}
                        />
                    </Box>

                    {/* BUTTONS */}
                    <Box display="flex" gap={1}>
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
                            onClick={() => saveTest(testData)}
                            disabled={!testData.name}
                        >
                            Save
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<BugReport />}
                            onClick={() => testSnippet(testData)}
                        >
                            Test
                        </Button>

                        {data && (data === "success"
                            ? <Chip label="Pass" color="success" />
                            : <Chip label="Fail" color="error" />)}
                    </Box>
                </Box>
            )}
        </div>
    );
};