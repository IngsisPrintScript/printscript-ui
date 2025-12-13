import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography
} from "@mui/material";
import { useGetFormatRules, useModifyFormatRules } from "../../utils/queries.tsx";
import { queryClient } from "../../App.tsx";
import { Rule } from "../../types/Rule.ts";

const FormattingRulesList = () => {
  const [rules, setRules] = useState<Rule[]>([]);

  const { data, isLoading } = useGetFormatRules();
  const { mutateAsync, isLoading: isLoadingMutate } = useModifyFormatRules({
    onSuccess: () => queryClient.invalidateQueries('formatRules')
  });

  useEffect(() => {
    if (!data) return;

    setRules(
        data.map(rule => ({
          ...rule,
          isActive: rule.isActive ?? false,
          value:
              rule.value ??
              (typeof rule.value === 'number' ? 0 : '')
        }))
    );
  }, [data]);

  const handleValueChange = (rule: Rule, newValue: string | number) => {
    setRules(prev =>
        prev.map(r =>
            r.name === rule.name ? { ...r, value: newValue } : r
        )
    );
  };

  const handleNumberChange =
      (rule: Rule) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        handleValueChange(rule, isNaN(value) ? 0 : value);
      };

  const toggleRule = (rule: Rule) => () => {
    setRules(prev =>
        prev.map(r =>
            r.name === rule.name ? { ...r, isActive: !r.isActive } : r
        )
    );
  };

  return (
      <Card sx={{ padding: 2, margin: 2 }}>
        <Typography variant="h6">Formatting rules</Typography>

        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {isLoading || isLoadingMutate ? (
              <Typography sx={{ height: 80 }}>Loading...</Typography>
          ) : (
              rules.map(rule => (
                  <ListItem key={rule.name} disablePadding sx={{ height: 40 }}>
                    <Checkbox
                        edge="start"
                        checked={rule.isActive}
                        disableRipple
                        onChange={toggleRule(rule)}
                    />

                    <ListItemText primary={rule.name} />

                    {typeof rule.value === 'number' && (
                        <TextField
                            type="number"
                            variant="standard"
                            value={rule.value}
                            onChange={handleNumberChange(rule)}
                            disabled={!rule.isActive}
                        />
                    )}

                    {typeof rule.value === 'string' && (
                        <TextField
                            variant="standard"
                            value={rule.value}
                            onChange={e =>
                                handleValueChange(rule, e.target.value)
                            }
                            disabled={!rule.isActive}
                        />
                    )}
                  </ListItem>
              ))
          )}
        </List>

        <Button
            disabled={isLoading || isLoadingMutate}
            variant="contained"
            onClick={() => mutateAsync(rules)}
        >
          Save
        </Button>
      </Card>
  );
};

export default FormattingRulesList;
