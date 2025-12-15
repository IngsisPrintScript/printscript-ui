import { Box, Divider, Tab, Tabs, Typography } from "@mui/material";
import { ModalWrapper } from "../common/ModalWrapper.tsx";
import { SyntheticEvent, useState } from "react";
import { AddRounded } from "@mui/icons-material";
import {useGetTestCases, usePostTestCase, useRemoveTestCase, useUpdateTestCase} from "../../utils/queries.tsx";
import { TabPanel } from "./TabPanel.tsx";

type TestSnippetModalProps = {
    open: boolean;
    onClose: () => void;
    snippetId: string;
};

export const TestSnippetModal = ({ open, onClose, snippetId }: TestSnippetModalProps) => {
    const [value, setValue] = useState(0);

    const { data: testCases } = useGetTestCases(snippetId);
    const { mutateAsync: postTestCase } = usePostTestCase(snippetId);
    const { mutateAsync: deleteTestCase } = useRemoveTestCase(snippetId);
    const { mutateAsync: updateTest } = useUpdateTestCase(snippetId);

    const handleChange = (_: SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const newTestIndex = testCases?.length ?? 0;

    return (
        <ModalWrapper open={open} onClose={onClose}>
            <Typography variant="h5">Test snippet</Typography>
            <Divider />

            <Box mt={2} display="flex">
                {/* TABS */}
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={value}
                    onChange={handleChange}
                    sx={{ borderRight: 1, borderColor: "divider" }}
                >
                    {/* EXISTING TESTS */}
                    {testCases?.map((testCase, index) => (
                        <Tab key={testCase.testId} label={testCase.name} value={index} />
                    ))}

                    {/* ADD NEW TEST */}
                    <Tab
                        icon={<AddRounded />}
                        value={newTestIndex}
                        aria-label="Add test case"
                    />
                </Tabs>

                {/* PANELS FOR EXISTING TESTS */}
                {testCases?.map((testCase, index) => (
                    <TabPanel
                        key={testCase.testId}
                        index={index}
                        value={value}
                        test={testCase}
                        saveTest={(partial) =>
                            updateTest({
                                ...testCase,
                                ...partial,
                                snippetId
                            })
                        }
                        removeTest={() => deleteTestCase(testCase.testId)}
                    />
                ))}

                {/* PANEL FOR NEW TEST */}
                <TabPanel
                    index={newTestIndex}
                    value={value}
                    saveTest={(test) => postTestCase({ ...test, snippetId })}
                />
            </Box>
        </ModalWrapper>
    );
};