import {
    Box,
    Button,
    CircularProgress,
    Divider,
    Typography,
} from "@mui/material";
import { ModalWrapper } from "../common/ModalWrapper.tsx";

type DownloadModalProps = {
    open: boolean;
    onClose: () => void;
    onDownloadOriginal: () => void;
    onDownloadFormatted: () => void;
    isLoadingFormatted: boolean;
};

export const DownloadModal = ({
                                  open,
                                  onClose,
                                  onDownloadOriginal,
                                  onDownloadFormatted,
                                  isLoadingFormatted,
                              }: DownloadModalProps) => {
    return (
        <ModalWrapper open={open} onClose={onClose}>
            <Typography variant="h5">Download Snippet</Typography>
            <Divider />

            <Box mt={2} display="flex" flexDirection="column" gap={2}>
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={onDownloadOriginal}
                >
                    Download Snippet
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={isLoadingFormatted}
                    onClick={onDownloadFormatted}
                    startIcon={
                        isLoadingFormatted ? <CircularProgress size={20} color="inherit" /> : undefined
                    }
                >
                    Download Original
                </Button>
            </Box>

            <Box mt={2} display="flex" justifyContent="flex-end">
                <Button onClick={onClose} variant="outlined" color="primary">
                    Cancel
                </Button>
            </Box>
        </ModalWrapper>
    );
};