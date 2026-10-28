import * as React from "react";
import {
  unstable_useNumberInput as useNumberInput,
  UseNumberInputParameters,
} from "@mui/base/unstable_useNumberInput";
import { unstable_useForkRef as useForkRef } from "@mui/utils";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { styled } from "@mui/system";
import { FormControl, FormHelperText } from "@mui/material";

const CustomNumberInput = React.forwardRef(function CustomNumberInput(
  props: UseNumberInputParameters & {
    title: string;
    helpText?: string;
    error?: boolean;
  },
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  // Keep zero as a real controlled value: the base hook initializes its editable
  // text to an empty string for an uncontrolled defaultValue of zero.
  const [currentValue, setCurrentValue] = React.useState<number | null>(
    props.defaultValue ?? null,
  );
  const {
    getRootProps,
    getInputProps,
    getIncrementButtonProps,
    getDecrementButtonProps,
  } = useNumberInput({
    ...props,
    value: props.value !== undefined ? props.value : currentValue,
    onChange: (event, value) => {
      setCurrentValue(value);
      props.onChange?.(event, value);
    },
  });

  const inputProps = getInputProps();

  // Make sure that both the forwarded ref and the ref returned from the getInputProps are applied on the input element
  inputProps.ref = useForkRef(inputProps.ref, ref);

  return (
    <>
      <FormControl sx={{ width: "100%" }}>
        <StyledInputRoot {...getRootProps()}>
          <StyledButton
            color={props.error ? "error" : "primary"}
            variant="outlined"
            size="large"
            {...getDecrementButtonProps()}
            aria-label={`Diminuer ${props.title}`}
            className="decrement"
          >
            -
          </StyledButton>
          <StyledDiv>
            <StyledTextField
              fullWidth
              inputProps={{ inputMode: "numeric" }}
              error={props.error}
              label={props.title}
              {...inputProps}
            />
            <FormHelperText error={props.error}>
              {props.helpText}
            </FormHelperText>
          </StyledDiv>

          <StyledButton
            color={props.error ? "error" : "primary"}
            variant="outlined"
            size="large"
            {...getIncrementButtonProps()}
            aria-label={`Augmenter ${props.title}`}
            className="increment"
          >
            +
          </StyledButton>
        </StyledInputRoot>
      </FormControl>
    </>
  );
});

interface QuantityInputProps {
  title: string;
  min?: number;
  max?: number;
  helpText?: string;
  error?: boolean;
  defaultValue?: number;
  change: (
    event:
      | React.FocusEvent<HTMLInputElement>
      | React.PointerEvent
      | React.KeyboardEvent,
    val: any,
  ) => void;
}

export default function UseNumberInputWithTitle({
  title,
  min,
  max,
  error,
  change,
  helpText,
  defaultValue,
}: QuantityInputProps) {
  return (
    <>
      <CustomNumberInput
        aria-label="Quantity Input"
        title={title}
        min={min}
        max={max}
        error={error}
        helpText={helpText}
        defaultValue={defaultValue}
        onChange={change}
      />
    </>
  );
}

const StyledInputRoot = styled("div")(() => ({
  display: "flex",
  alignItems: "start",
  width: "100%",
  gap: 8,
}));

const StyledTextField = styled(TextField)(() => ({}));

const StyledDiv = styled("div")(() => ({
  flex: 1,
  minWidth: 0,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  height: theme.spacing(7),
  width: 44,
  minWidth: 44,
  flexShrink: 0,
  padding: 0,
  fontSize: 20,
}));
