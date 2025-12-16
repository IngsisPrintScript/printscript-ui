import { Box, Divider, Tab, Tabs, Typography } from "@mui/material";
import { ModalWrapper } from "../common/ModalWrapper.tsx";
import {SyntheticEvent, useEffect, useState} from "react";
import { AddRounded } from "@mui/icons-material";
import {
    useGetTestCases,
    usePostTestCase,
    useRemoveTestCase,
    useUpdateTestCase
} from "../../utils/queries.tsx";
import { TabPanel } from "./TabPanel.tsx";
import {TestCase} from "../../types/TestCase.ts";

type Props = {
    open: boolean;
    onClose: () => void;
    snippetId: string;
};

export const TestSnippetModal = ({ open, onClose, snippetId }: Props) => {
    const [value, setValue] = useState(0);

    const { data: testCases = [] } = useGetTestCases(snippetId);
    const { mutateAsync: postTestCase } = usePostTestCase(snippetId);
    const { mutateAsync: deleteTestCase } = useRemoveTestCase(snippetId);
    const { mutateAsync: updateTest } = useUpdateTestCase(snippetId);

    const handleChange = (_: SyntheticEvent, v: number) => setValue(v);

    const handleCreateTest = async (test: Partial<TestCase>): Promise<void> => {
        await postTestCase({ ...test, snippetId });
    };

    useEffect(() => {
        if (testCases.length > 0) {
            setValue(testCases.length - 1);
        }
    }, [testCases.length]);

    return (
        <ModalWrapper open={open} onClose={onClose}>
            <Typography variant="h5">Test snippet</Typography>
            <Divider />

            <Box mt={2} display="flex">
                <Tabs
                    orientation="vertical"
                    value={value}
                    onChange={handleChange}
                    sx={{ borderRight: 1, borderColor: "divider" }}
                >
                    {testCases.map((t, i) => (
                        <Tab key={t.testId} label={t.name} value={i} />
                    ))}
                    <Tab icon={<AddRounded />} value={testCases.length} />
                </Tabs>

                {testCases.map((testCase, index) => (
                    <TabPanel
                        key={testCase.testId}
                        index={index}
                        value={value}
                        test={testCase}
                        saveTest={async (partial) => {
                            await updateTest({
                                ...testCase,
                                ...partial,
                                snippetId
                            });
                        }}
                        removeTest={() => deleteTestCase(testCase.testId)}
                    />
                ))}

                <TabPanel
                    index={testCases.length}
                    value={value}
                    saveTest={handleCreateTest}
                />
            </Box>
        </ModalWrapper>
    );
};
