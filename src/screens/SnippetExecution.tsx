import { OutlinedInput } from "@mui/material";
import { highlight, languages } from "prismjs";
import Editor from "react-simple-code-editor";
import { Bòx } from "../components/snippet-table/SnippetBox.tsx";
import { useCallback, useEffect, useState } from "react";
import { useExecSnippet } from "../utils/queries.tsx";
import { Snippet } from "../utils/snippet.ts";

type RunSnippetProps = {
    snippet: Snippet;
    setRunSnippet: (isRunning: boolean) => void;
    runSnippet: boolean;
    envs?: string[];
};

function normalizeEnvs(envList: string[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const env of envList) {
        const [key, value] = env.split("=");
        if (key && value !== undefined) map[key] = value;
    }
    return map;
}

export const SnippetExecution = ({
                                     snippet,
                                     setRunSnippet,
                                     runSnippet,
                                     envs = []
                                 }: RunSnippetProps) => {

    const snippetId = snippet.id;

    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [inputList, setInputList] = useState<string[]>([]);

    const { mutateAsync: execSnippet } = useExecSnippet();

    const execute = useCallback((inputs: string[]) => {

        execSnippet({
            snippetId,
            inputs,
            envs: normalizeEnvs(envs),
        })
            .then(response => {
                const joined = response.outputs.join("\n");
                setOutput(joined);
            })
            .catch(error => {
                setOutput(error.response?.data?.output ?? "Execution error");
                setRunSnippet(false);
            });

        setInput("");

    }, [execSnippet, snippetId, envs]);

    useEffect(() => {
        if (!runSnippet) {
            setInputList([]);
            return;
        }

        setOutput("");
        execute(inputList);

    }, [runSnippet]);

    useEffect(() => {
        if (!runSnippet) return;
        if (output.trim() !== "" && !output.endsWith("\n")) {
            setRunSnippet(false);
            setInputList([]);
        }

    }, [output, runSnippet]);

    useEffect(() => {
        setOutput("");
        setInput("");
        setInputList([]);
        setRunSnippet(false);
    }, [snippet.content]);

    const handleEnter = (event: { key: string }) => {
        if (event.key !== "Enter") return;
        if (!input.trim()) return;

        const newList = [...inputList, input.trim()];
        setInputList(newList);
        execute(newList);
    };

    return (
        <>
            <Bòx
                flex={1}
                overflow="none"
                minHeight={200}
                bgcolor="black"
                color="white"
                code={output}
            >
                <Editor
                    value={output}
                    padding={10}
                    onValueChange={() => {}}
                    highlight={(code) =>
                        highlight(code, languages.js, "javascript")
                    }
                    style={{
                        fontFamily: "monospace",
                        fontSize: 17,
                    }}
                />
            </Bòx>

            <OutlinedInput
                onKeyDown={handleEnter}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type here"
                fullWidth
            />
        </>
    );
};
