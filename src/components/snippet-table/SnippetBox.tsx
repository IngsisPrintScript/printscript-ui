import {ReactNode, useEffect, useState} from "react";
import {Box, BoxProps} from "@mui/material";
import cocoImg from "../../assets/coco.png";

type SnippetBoxProps = {
  code: string;
  children: ReactNode;
} & BoxProps

const SnippetBox = (props: SnippetBoxProps) => {
  const {code, children} = props;
  const [showBox, setShowBox] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (code.includes("snake_case_variable")) {
        setShowBox(true)
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [code]);

  return (
      <Box {...props}>
        {
          showBox ? (
              <Box display="flex" justifyContent="center" alignItems="center">
                <img src={cocoImg} alt="Coco misterioso" style={{ width: 120, height: 120 }} />
              </Box>
          ) : children
        }
      </Box>
  )
}

export const Bòx = SnippetBox
