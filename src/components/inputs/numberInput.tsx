import * as React from "react";
import {
  Unstable_NumberInput as BaseNumberInput,
  NumberInputProps as BaseNumberInputProps,
} from "@mui/base/Unstable_NumberInput";
import { styled } from "@mui/system";
import { FormControl } from "@mui/material";
import FormHelperText from "@mui/material/FormHelperText";

interface NumberInputProps extends BaseNumberInputProps {
  placeholder?: string;
  isError?: boolean;
}

const NumberInput = React.forwardRef(function CustomNumberInput(
  props: NumberInputProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {

  const StyledInput = styled("input")(`
    height: 56px;
    font-size: 0.875rem;
    font-family: inherit;
    font-weight: 400;
    line-height: 1.375;
    color: ${props.isError ? "#ff0000" : grey[900]};
    background: "#fff";
    border: 1px solid  ${props.isError ? "#ff0000" : grey[200]};
    box-shadow: 0px 2px 4px "rgba(0,0,0, 0.05)";
    border-radius: 8px;
    margin: 0 8px;
    padding: 10px 12px;
    outline: 0;
    min-width: 0;
    width: 100%;
  
    text-align: center;
  
    &:hover {
      border-color: ${props.isError ? "#ff0000" : blue[400]};
    }
  
    &:focus {
      border-color: ${props.isError ? "#ff0000" : blue[400]};
    }
  
    &:focus-visible {
      outline: 0;
    }
  `
  );

  return (
    <BaseNumberInput
      slots={{
        root: StyledInputRoot,
        input: StyledInput,
        incrementButton: StyledButton,
        decrementButton: StyledButton,
      }}
      slotProps={{
        incrementButton: {
          children: "+",
          className: "increment",
        },
        decrementButton: {
          children: "-",
        },
      }}
      {...props}
      ref={ref}
    />
  );
});

interface QuantityInputProps {
  title: string;
  min?: number;
  max?: number;
  helpText?: string;
  error?: boolean;
  change: (event: any, val: any) => void;
}

export default function QuantityInput({
  title,
  helpText,
  change,
  min,
  max,
  error,
}: QuantityInputProps) {
  return (
    <>
      <FormControl sx={{ width: "100%" }}>
        <NumberInput
          placeholder={title}
          aria-label="Quantity Input"
          min={min}
          max={max}
          onChange={change}
          isError={error}
        />
        <FormHelperText sx={{ ml: "70px" }}>{helpText}</FormHelperText>
      </FormControl>
    </>
  );
}

const blue = {
  100: "#daecff",
  200: "#b6daff",
  300: "#66b2ff",
  400: "#3399ff",
  500: "#007fff",
  600: "#0072e5",
  700: "#0059B2",
  800: "#004c99",
};

const grey = {
  50: "#F3F6F9",
  100: "#E5EAF2",
  200: "#DAE2ED",
  300: "#C7D0DD",
  400: "#B0B8C4",
  500: "#9DA8B7",
  600: "#6B7A90",
  700: "#434D5B",
  800: "#303740",
  900: "#1C2025",
};

const StyledInputRoot = styled("div")(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 400;
  color: ${theme.palette.mode === "dark" ? grey[300] : grey[500]};
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  width: 100%;
`
);

// ...

const StyledButton = styled("button")(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 1.3rem;
  box-sizing: border-box;
  line-height: 1.5;
  border: 1px solid;
  border-radius: 999px;
  border-color: ${theme.palette.mode === "dark" ? grey[800] : grey[200]};
  background: ${theme.palette.mode === "dark" ? grey[900] : grey[50]};
  color: ${theme.palette.mode === "dark" ? grey[200] : grey[900]};
  width: 75px;
  height: 56px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;

  &:hover {
    cursor: pointer;
    background: ${theme.palette.mode === "dark" ? blue[700] : blue[500]};
    border-color: ${theme.palette.mode === "dark" ? blue[500] : blue[400]};
    color: ${grey[50]};
  }

  &:focus-visible {
    outline: 0;
  }

  &.increment {
    order: 1;
  }
`
);
