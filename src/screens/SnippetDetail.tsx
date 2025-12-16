import { useEffect, useState } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-okaidia.css";
import { DownloadModal } from "../components/snippet-detail/DownloadModal.tsx";
import { downloadBlob } from "../utils/download";

import {
    Alert,
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import {
    BugReport,
    Delete,
    Download,
    PlayArrow,
    Save,
    Share,
    StopRounded
} from "@mui/icons-material";

import ReadMoreIcon from "@mui/icons-material/ReadMore";

import {
    useDownloadSnippet,
    useFormatSnippet,
    useGetSnippetById,
    useShareSnippet,
    useUpdateSnippetById
} from "../utils/queries.tsx";

import { Bòx } from "../components/snippet-table/SnippetBox.tsx";
import { ShareSnippetModal } from "../components/snippet-detail/ShareSnippetModal.tsx";
import { TestSnippetModal } from "../components/snippet-test/TestSnippetModal.tsx";
import { DeleteConfirmationModal } from "../components/snippet-detail/DeleteConfirmationModal.tsx";
import { SnippetExecution } from "./SnippetExecution.tsx";
import { queryClient } from "../App.tsx";

type SnippetDetailProps = {
    id: string;
    handleCloseModal: () => void;
};

// const DownloadButton = ({ snippet }: { snippet?: Snippet }) => {
//     if (!snippet) return null;
//
//     const file = new Blob([snippet.content], { type: "text/plain" });
//
//     return (
//         <Tooltip title="Download">
//             <IconButton data-testid="snippet-download-button">
//                 <a
//                     download={`${snippet.name}.${snippet.extension}`}
//                     href={URL.createObjectURL(file)}
//                     target="_blank"
//                     rel="noreferrer"
//                     style={{ display: "flex", color: "inherit" }}
//                 >
//                     <Download />
//                 </a>
//             </IconButton>
//         </Tooltip>
//     );
// };

export const SnippetDetail = ({ id, handleCloseModal }: SnippetDetailProps) => {
    const [code, setCode] = useState("");
    const [openShare, setOpenShare] = useState(false);
    const [openTest, setOpenTest] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [runSnippet, setRunSnippet] = useState(false);
    const [openDownload, setOpenDownload] = useState(false);

    const { data: snippet, isLoading } = useGetSnippetById(id);
    const { mutate: shareSnippet, isLoading: loadingShare } = useShareSnippet();

    const {
        mutateAsync: downloadSnippet,
        isLoading: downloadingFormatted,
    } = useDownloadSnippet();

    const { mutate: formatSnippet, isLoading: isFormatLoading, data: formatted } =
        useFormatSnippet();

    const { mutate: updateSnippet, isLoading: saving } =
        useUpdateSnippetById({
            onSuccess: () => queryClient.invalidateQueries(["snippet", id])
        });

    useEffect(() => {
        if (snippet) setCode(snippet.content);
    }, [snippet]);

    useEffect(() => {
        if (formatted) setCode(formatted);
    }, [formatted]);

    const handleShare = (userId: string) => {
        shareSnippet({ snippetId: id, userId });
        setOpenShare(false);
    };


    return (
        <Box p={4} minWidth="60vw">
            <Box display="flex" justifyContent="flex-end">
                <CloseIcon
                    onClick={handleCloseModal}
                    style={{ cursor: "pointer" }}
                />
            </Box>

            {isLoading ? (
                <>
                    <Typography variant="h4">Loading...</Typography>
                    <CircularProgress />
                </>
            ) : (
                <>
                    <Typography variant="h4" fontWeight="bold">
                        {snippet?.name ?? "Snippet"}
                    </Typography>

                    {/* ACTION BAR */}
                    <Box display="flex" gap={1} p={1}>
                        <Tooltip title="Share">
                            <IconButton
                                data-testid="snippet-share-button"
                                onClick={() => setOpenShare(true)}
                            >
                                <Share />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Test">
                            <IconButton
                                data-testid="snippet-test-button"
                                onClick={() => setOpenTest(true)}
                            >
                                <BugReport />
                            </IconButton>
                        </Tooltip>

                        {/*<DownloadButton snippet={snippet} />*/}
                        <Tooltip title="Download">
                            <IconButton
                                data-testid="snippet-download-button"
                                onClick={() => setOpenDownload(true)}
                            >
                                <Download />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={runSnippet ? "Stop" : "Run"}>
                            <IconButton
                                data-testid="snippet-run-button"
                                onClick={() => setRunSnippet(!runSnippet)}
                            >
                                {runSnippet ? <StopRounded /> : <PlayArrow />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Format snippet">
                            <IconButton
                                data-testid="snippet-format-button"
                                onClick={() => formatSnippet(id)}
                                disabled={isFormatLoading}
                            >
                                <ReadMoreIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Save changes">
                            <IconButton
                                data-testid="snippet-save-button"
                                color="primary"
                                disabled={saving || snippet?.content === code}
                                onClick={() =>
                                    updateSnippet({
                                        id,
                                        updateSnippet: {
                                            name: snippet?.name ?? "",
                                            language: snippet?.language ?? "",
                                            version: snippet?.version ?? "",
                                            content: code
                                        }
                                    })
                                }
                            >
                                <Save />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete snippet">
                            <IconButton
                                data-testid="snippet-delete-button"
                                onClick={() => setOpenDelete(true)}
                            >
                                <Delete color="error" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* CODE EDITOR */}
                    <Bòx
                        code={code}
                        flex={1}
                        minHeight="500px"
                        bgcolor="black"
                        color="white"
                        p={2}
                        borderRadius={2}
                    >
                        <Editor
                            data-testid="snippet-code-editor"
                            value={code}
                            padding={12}
                            onValueChange={setCode}
                            highlight={(c) => highlight(c, languages.js, "javascript")}
                            style={{
                                fontFamily: "monospace",
                                minHeight: "500px",
                                fontSize: 16
                            }}
                        />
                    </Bòx>

                    {/* OUTPUT */}
                    <Box mt={2}>
                        <Alert severity="info">Output</Alert>
                        <Box data-testid="snippet-output">
                            {snippet && (
                                <SnippetExecution
                                    snippet={snippet}
                                    runSnippet={runSnippet}
                                    setRunSnippet={setRunSnippet}
                                />
                            )}
                        </Box>
                    </Box>
                </>
            )}

            {/* MODALS */}
            <ShareSnippetModal
                loading={loadingShare}
                open={openShare}
                onClose={() => setOpenShare(false)}
                onShare={handleShare}
            />

            <TestSnippetModal
                open={openTest}
                snippetId={id}
                onClose={() => setOpenTest(false)}
            />

            <DeleteConfirmationModal
                open={openDelete}
                onClose={() => setOpenDelete(false)}
                id={snippet?.id ?? ""}
                setCloseDetails={handleCloseModal}
            />
            {snippet && (
                <DownloadModal
                    open={openDownload}
                    onClose={() => setOpenDownload(false)}
                    isLoadingFormatted={downloadingFormatted}
                    onDownloadOriginal={async () => {
                        const blob = await downloadSnippet({
                            snippetId: id,
                            version: "original",
                        });
                        downloadBlob(blob, `${snippet.name}.${snippet.extension}`);
                        setOpenDownload(false);
                    }}
                    onDownloadFormatted={async () => {
                        const blob = await downloadSnippet({
                            snippetId: id,
                            version: "formatted",
                        });
                        downloadBlob(
                            blob,
                            `${snippet.name}-formatted.${snippet.extension}`
                        );
                        setOpenDownload(false);
                    }}
                />
            )}
        </Box>
    );
};