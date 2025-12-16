import { Box, Divider, Tab, Tabs, Typography } from "@mui/material";
import { ModalWrapper } from "../../../../../../Downloads/printscript-ui/src/components/common/ModalWrapper.tsx";
import { SyntheticEvent, useState } from "react";
import { AddRounded } from "@mui/icons-material";
import {
    useGetTestCases,
    usePostTestCase,
    useRemoveTestCase,
    useUpdateTestCase
} from "../../utils/queries.tsx";
import { TabPanel } from "./TabPanel.tsx";

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

    const handleCreateTest = async (test: any) => {
        await postTestCase({ ...test, snippetId });
        setValue(testCases.length);
    };

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

                {testCases.map((t, i) => (
                    <TabPanel
                        id
                        key={t.testId}
                        index={i}
                        value={value}
                        test={t}
                        saveTest={(partial) =>
                            updateTest({ ...t, ...partial, snippetId })
                        }
                        removeTest={() => deleteTestCase(t.testId)}
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
