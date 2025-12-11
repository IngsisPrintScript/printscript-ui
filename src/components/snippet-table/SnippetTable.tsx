import {
  Box,
  Button,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow
} from "@mui/material";

import {AddSnippetModal} from "./AddSnippetModal";
import {useRef, useState} from "react";
import {Add, Search} from "@mui/icons-material";
import {LoadingSnippetRow, SnippetRow} from "./SnippetRow";
import {
  CreateSnippetWithLang,
  getFileLanguage,
  Snippet
} from "../../utils/snippet";
import {usePaginationContext} from "../../contexts/paginationContext";
import {useSnackbarContext} from "../../contexts/snackbarContext";
import {useGetFileTypes} from "../../utils/queries";

type SnippetTableProps = {
  handleClickSnippet: (id: string) => void;
  snippets?: Snippet[];
  loading: boolean;
  handleSearchSnippet: (text: string) => void;
};

export const SnippetTable = ({
                               snippets,
                               handleClickSnippet,
                               loading,
                               handleSearchSnippet
                             }: SnippetTableProps) => {

  const [addModalOpened, setAddModalOpened] = useState(false);
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [defaultSnippet, setDefaultSnippet] = useState<CreateSnippetWithLang>();

  const popoverRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {page, page_size, count, handleChangePageSize, handleGoToPage} = usePaginationContext();
  const {createSnackbar} = useSnackbarContext();
  const {data: fileTypes} = useGetFileTypes();

  const loadFileSnippet = async (target: EventTarget & HTMLInputElement) => {
    const file = target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop();
    const fileType = getFileLanguage(fileTypes ?? [], ext);

    if (!fileType) {
      createSnackbar("error", `File type ${ext} not supported`);
      return;
    }

    const content = await file.text();
    setDefaultSnippet({
      name: file.name.replace(/\.[^/.]+$/, ""),
      content,
      version: "1.0",
      language: fileType.language,
      extension: fileType.extension
    });

    setAddModalOpened(true);
    target.value = "";
  };

  return (
      <>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Box sx={{background: "white", width: "30%", display: "flex"}}>
            <InputBase
                sx={{ml: 1, flex: 1}}
                placeholder="Search"
                onChange={e => handleSearchSnippet(e.target.value)}
            />
            <IconButton sx={{p: "10px"}}>
              <Search/>
            </IconButton>
          </Box>

          <Button
              ref={popoverRef}
              variant="contained"
              onClick={() => setPopoverOpened(true)}
          >
            <Add/> Add Snippet
          </Button>
        </Box>

        <Table sx={{borderSpacing: "0 10px", borderCollapse: "separate"}}>
          <TableHead>
            <TableRow>
              <StyledCell>Name</StyledCell>
              <StyledCell>Language</StyledCell>
              <StyledCell>Author</StyledCell>
              <StyledCell>Conformance</StyledCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading
                ? Array.from({length: 10}).map((_, i) => <LoadingSnippetRow key={i}/>)
                : snippets?.map(sn => (
                    <SnippetRow
                        key={sn.id}
                        snippet={sn}
                        onClick={() => handleClickSnippet(sn.id)}
                    />
                ))
            }
          </TableBody>

          <TablePagination
              count={count}
              page={page}
              rowsPerPage={page_size}
              onPageChange={(_, p) => handleGoToPage(p)}
              onRowsPerPageChange={e => handleChangePageSize(+e.target.value)}
          />
        </Table>

        {/* MODAL */}
        <AddSnippetModal
            open={addModalOpened}
            onClose={() => setAddModalOpened(false)}
            defaultSnippet={defaultSnippet}
        />

        {/* MENU */}
        <Menu
            anchorEl={popoverRef.current}
            open={popoverOpened}
            onClose={() => setPopoverOpened(false)}
        >
          <MenuItem onClick={() => setAddModalOpened(true)}>Create snippet</MenuItem>
          <MenuItem onClick={() => inputRef.current?.click()}>Load snippet from file</MenuItem>
        </Menu>

        <input
            hidden
            type="file"
            ref={inputRef}
            onChange={e => loadFileSnippet(e.target)}
        />
      </>
  );
};

const StyledCell = styled(TableCell)`
  border: 0;
  font-weight: bold;
`;
