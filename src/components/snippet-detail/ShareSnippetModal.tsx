import {Autocomplete, Box, Button, Divider, TextField, Typography} from "@mui/material";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {useGetUsers} from "../../utils/queries.tsx";
import {useEffect, useState} from "react";
import {User} from "../../utils/users.ts";

type ShareSnippetModalProps = {
  open: boolean;
  onClose: () => void;
  onShare: (userId: string) => void;
  loading: boolean;
};

export const ShareSnippetModal = ({open, onClose, onShare, loading}: ShareSnippetModalProps) => {
  const [name, setName] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | undefined>();

  const {data, isLoading} = useGetUsers(debouncedName, 0, 5);

  // Debounce para evitar spam al backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(name);
    }, 500);

    return () => clearTimeout(timer);
  }, [name]);

  // Si el input cambia manualmente, limpiar selección
  const handleInputChange = (_: unknown, newValue: string | null) => {
    setName(newValue || "");
    setSelectedUser(undefined);
  };

  // Cuando selecciona una persona de la lista
  const handleSelectUser = (_: unknown, newValue: User | null) => {
    setSelectedUser(newValue || undefined);
  };

  return (
      <ModalWrapper open={open} onClose={onClose}>
        <Typography variant="h5">Share your snippet</Typography>
        <Divider/>
        <Box mt={2}>
          <Autocomplete
              renderInput={(params) => <TextField {...params} label="Type the user's name"/>}
              options={data?.users ?? []}
              loading={isLoading}
              value={selectedUser ?? null}
              onInputChange={handleInputChange}
              onChange={handleSelectUser}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.userId === value.userId}
          />

          <Box mt={4} display="flex" justifyContent="flex-end">
            <Button onClick={onClose} variant="outlined">Cancel</Button>

            <Button
                disabled={!selectedUser || loading}
                onClick={() => selectedUser && onShare(selectedUser.userId)}
                sx={{ml: 2}}
                variant="contained"
            >
              Share
            </Button>
          </Box>
        </Box>
      </ModalWrapper>
  );
};