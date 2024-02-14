import * as React from 'react';
import {unstable_useNumberInput as useNumberInput, UseNumberInputParameters,} from '@mui/base/unstable_useNumberInput';
import {unstable_useForkRef as useForkRef} from '@mui/utils';
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {styled} from "@mui/system";
import {FormControl, FormHelperText} from "@mui/material";

const CustomNumberInput = React.forwardRef(function CustomNumberInput(
    props: UseNumberInputParameters & { title: string, helpText?: string, error?: boolean },
    ref: React.ForwardedRef<HTMLInputElement>,
) {
    const {
        getRootProps,
        getInputProps,
        getIncrementButtonProps,
        getDecrementButtonProps,
    } = useNumberInput(props);

    const inputProps = getInputProps();

    // Make sure that both the forwarded ref and the ref returned from the getInputProps are applied on the input element
    inputProps.ref = useForkRef(inputProps.ref, ref);

    return (
        <FormControl sx={{width: "100%"}}>
            <StyledInputRoot {...getRootProps()}>
                <StyledButton color={props.error ? "error" : "primary"} variant="outlined"
                              size="large" {...getDecrementButtonProps()} className="decrement">
                    -
                </StyledButton>
                <StyledDiv>
                    <StyledTextField fullWidth error={props.error} label={props.title} {...inputProps} />
                    <FormHelperText error={props.error}>{props.helpText}</FormHelperText>
                </StyledDiv>

                <StyledButton color={props.error ? "error" : "primary"} variant="outlined"
                              size="large" {...getIncrementButtonProps()} className="increment">
                    +
                </StyledButton>
            </StyledInputRoot>
        </FormControl>

    );
});

interface QuantityInputProps {
    title: string;
    min?: number;
    max?: number;
    helpText?: string;
    error?: boolean;
    defaultValue?: number; 
    change: (event: React.FocusEvent<HTMLInputElement> | React.PointerEvent | React.KeyboardEvent, val: number | undefined) => void;
}

export default function UseNumberInputWithTitle({title, min, max, error, change, helpText, defaultValue}: QuantityInputProps) {
    return (
        <>
            <CustomNumberInput aria-label="Quantity Input" title={title} min={min} onChange={change} max={max}
                               error={error} helpText={helpText} defaultValue={defaultValue}/>
        </>

    );
}

const StyledInputRoot = styled('div')(() => ({
    display: 'flex',
    alignItems: 'start',
    width: "100%",
}));

const StyledTextField = styled(TextField)(() => ({
}));

const StyledDiv = styled('div')(({theme}) => ({
        width: "100%",
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
    }
));

const StyledButton = styled(Button)(({theme}) => ({
        height: theme.spacing(7),
        minWidth: theme.spacing(1),
    }
));