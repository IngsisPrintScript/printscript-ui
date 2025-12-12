import {useEffect, useState} from "react";
import Editor from "react-simple-code-editor";
import {highlight, languages} from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-okaidia.css";
import {Alert, Box, CircularProgress, IconButton, Tooltip, Typography} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

import {
  useFormatSnippet,
  useGetSnippetById,
  useShareSnippet,
  useUpdateSnippetById
} from "../utils/queries.tsx";

import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {BugReport, Delete, Download, PlayArrow, Save, Share, StopRounded} from "@mui/icons-material";
import {ShareSnippetModal} from "../components/snippet-detail/ShareSnippetModal.tsx";
import {TestSnippetModal} from "../components/snippet-test/TestSnippetModal.tsx";
import {Snippet} from "../utils/snippet.ts";
import {SnippetExecution} from "./SnippetExecution.tsx";
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import {queryClient} from "../App.tsx";
import {DeleteConfirmationModal} from "../components/snippet-detail/DeleteConfirmationModal.tsx";


type SnippetDetailProps = {
  id: string;
  handleCloseModal: () => void;
};

const DownloadButton = ({snippet}: { snippet?: Snippet }) => {
  if (!snippet) return null;
  const file = new Blob([snippet.content], {type: 'text/plain'});
  return (
      <Tooltip title={"Download"}>
        <IconButton sx={{ cursor: "pointer" }}>
          <a
              download={`${snippet.name}.${snippet.extension}`}
              target="_blank"
              rel="noreferrer"
              href={URL.createObjectURL(file)}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                alignItems: "center",
              }}
          >
            <Download/>
          </a>
        </IconButton>
      </Tooltip>
  );
};

export const SnippetDetail = ({id, handleCloseModal}: SnippetDetailProps) => {
  const [code, setCode] = useState("");
  const [openShare, setOpenShare] = useState(false);
  const [openTest, setOpenTest] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [runSnippet, setRunSnippet] = useState(false);

  const {data: snippet, isLoading} = useGetSnippetById(id);
  const {mutate: shareSnippet, isLoading: loadingShare} = useShareSnippet();
  const {mutate: formatSnippet, isLoading: isFormatLoading, data: formatted} = useFormatSnippet();
  const {mutate: updateSnippet, isLoading: saving} = useUpdateSnippetById({
    onSuccess: () => queryClient.invalidateQueries(["snippet", id])
  });

  useEffect(() => {
    if (snippet) setCode(snippet.content);
  }, [snippet]);

  useEffect(() => {
    if (formatted) setCode(formatted);
  }, [formatted]);

  const handleShare = (userId: string) => {
    shareSnippet({snippetId: id, userId});
    setOpenShare(false);
  };

  return (
      <Box p={4} minWidth={"60vw"}>
        <Box width={"100%"} p={2} display={"flex"} justifyContent={"flex-end"}>
          <CloseIcon onClick={handleCloseModal} style={{cursor: "pointer"}}/>
        </Box>

        {isLoading ? (
            <>
              <Typography variant="h4" fontWeight="bold">Loading...</Typography>
              <CircularProgress/>
            </>
        ) : (
            <>
              <Typography variant="h4" fontWeight="bold">
                {snippet?.name ?? "Snippet"}
              </Typography>

              {/* Action bar */}
              <Box display="flex" gap={1} p={1}>
                <Tooltip title={"Share"}>
                  <IconButton onClick={() => setOpenShare(true)}><Share/></IconButton>
                </Tooltip>

                <Tooltip title={"Test"}>
                  <IconButton onClick={() => setOpenTest(true)}><BugReport/></IconButton>
                </Tooltip>

                <DownloadButton snippet={snippet}/>

                <Tooltip title={runSnippet ? "Stop" : "Run"}>
                  <IconButton onClick={() => setRunSnippet(!runSnippet)}>
                    {runSnippet ? <StopRounded/> : <PlayArrow/>}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Format snippet">
                  <IconButton
                      onClick={() => formatSnippet(id)}
                      disabled={isFormatLoading}
                  >
                    <ReadMoreIcon/>
                  </IconButton>
                </Tooltip>

                <Tooltip title={"Save changes"}>
                  <IconButton
                      color="primary"
                      disabled={saving || snippet?.content === code}
                      onClick={() =>
                          updateSnippet({
                            id,
                            updateSnippet: {
                              name: snippet?.name ?? "",
                              language: snippet?.language ?? "",
                              version: snippet?.version ?? "",
                              content: code,
                            }
                          })
                      }
                  >
                    <Save/>
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete snippet">
                  <IconButton onClick={() => setOpenDelete(true)}>
                    <Delete color="error"/>
                  </IconButton>
                </Tooltip>
              </Box>

              {/* ⚡ CODE EDITOR INSIDE BÒX */}
              <Bòx
                  flex={1}
                  minHeight={"500px"}
                  bgcolor="black"
                  color="white"
                  code={code}
                  p={2}
                  borderRadius={2}
              >
                <Editor
                    value={code}
                    padding={12}
                    onValueChange={(c) => setCode(c)}
                    highlight={(c) => highlight(c, languages.js, "javascript")}
                    style={{
                      fontFamily: "monospace",
                      minHeight: "500px",
                      fontSize: 16,
                    }}
                />
              </Bòx>

              {/* Executions */}
              <Box mt={2}>
                <Alert severity="info">Output</Alert>
                <SnippetExecution snippet={snippet!} runSnippet={runSnippet} setRunSnippet={setRunSnippet}/>
              </Box>
            </>
        )}

        {/* Modals */}
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
      </Box>
  );
};
