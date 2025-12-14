import {
    Box,
    Button,
    capitalize,
    CircularProgress,
    Input,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography
} from "@mui/material";
import { highlight, languages } from "prismjs";
import { useEffect, useState } from "react";
import Editor from "react-simple-code-editor";
import { Save } from "@mui/icons-material";

import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-okaidia.css";

import { CreateSnippet, CreateSnippetWithLang } from "../../utils/snippet";
import { ModalWrapper } from "../common/ModalWrapper";
import { useCreateSnippet, useGetFileTypes } from "../../utils/queries";
import { queryClient } from "../../App";

type AddSnippetModalProps = {
    open: boolean;
    onClose: () => void;
    defaultSnippet?: CreateSnippetWithLang;
};

export const AddSnippetModal = ({
                                    open,
                                    onClose,
                                    defaultSnippet
                                }: AddSnippetModalProps) => {
    const [language, setLanguage] = useState(defaultSnippet?.language ?? "printscript");
    const [code, setCode] = useState(defaultSnippet?.content ?? "");
    const [snippetName, setSnippetName] = useState(defaultSnippet?.name ?? "");
    const [snippetVersion, setSnippetVersion] = useState(defaultSnippet?.version ?? "");

    const { mutateAsync: createSnippet, isLoading } = useCreateSnippet({
        onSuccess: () => queryClient.invalidateQueries(["listSnippets"]),
    });

    const { data: fileTypes } = useGetFileTypes();

    const handleCreateSnippet = async () => {
        const newSnippet: CreateSnippet = {
            name: snippetName,
            content: code,
            version: snippetVersion || "1.0",
            language,
            extension:
                fileTypes?.find(f => f.language === language)?.extension ?? "prs",
        };

        await createSnippet(newSnippet);
        onClose();
    };

    useEffect(() => {
        if (defaultSnippet) {
            setLanguage(defaultSnippet.language);
            setCode(defaultSnippet.content);
            setSnippetName(defaultSnippet.name);
            setSnippetVersion(defaultSnippet.version || "");
        }
    }, [defaultSnippet]);

    return (
        <ModalWrapper open={open} onClose={onClose}>
            {/* HEADER */}
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h5">Add Snippet</Typography>

                <Button
                    data-testid="save-snippet-button"
                    disabled={!snippetName || !code || !language || isLoading}
                    variant="contained"
                    onClick={handleCreateSnippet}
                >
                    <Box pr={1}>
                        {isLoading ? <CircularProgress size={22} /> : <Save />}
                    </Box>
                    Save Snippet
                </Button>
            </Box>

            {/* FORM */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                {/* NAME */}
                <InputLabel>Name</InputLabel>
                <Input
                    data-testid="snippet-name-input"
                    value={snippetName}
                    onChange={e => setSnippetName(e.target.value)}
                    sx={{ width: "50%" }}
                />

                {/* LANGUAGE */}
                <InputLabel>Language</InputLabel>
                <Select
                    data-testid="snippet-language-select"
                    value={language}
                    sx={{ width: "50%" }}
                    onChange={(e: SelectChangeEvent<string>) =>
                        setLanguage(e.target.value)
                    }
                >
                    {fileTypes?.map(ft => (
                        <MenuItem
                            key={ft.language}
                            value={ft.language}
                            data-testid={`menu-option-${ft.language}`}
                        >
                            {capitalize(ft.language)}
                        </MenuItem>
                    ))}
                </Select>

                {/* CODE */}
                <InputLabel>Code Snippet</InputLabel>
                <Box sx={{ background: "black", borderRadius: 2 }}>
                    {/* SOLO PARA TESTS */}
                    <textarea
                        data-testid="add-snippet-code-textarea"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        style={{ display: "none" }}
                    />
                    <Editor
                        data-testid="add-snippet-code-editor"
                        value={code}
                        onValueChange={setCode}
                        padding={10}
                        highlight={c => highlight(c, languages.plaintext, "plaintext")}
                        style={{
                            minHeight: 300,
                            maxHeight: 600,
                            overflow: "auto",
                            fontFamily: "monospace",
                            fontSize: 17,
                            color: "#f8f8f2",
                            backgroundColor: "black",
                        }}
                    />
                </Box>
            </Box>
        </ModalWrapper>
    );
};