import {useMemo} from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import {createTheme, ThemeProvider as MUIThemeProvider} from '@mui/material/styles';

import {typography} from './typography';
import {customShadows} from './custom-shadows';
import {palette} from './palette';
import {shadows} from './shadows';
import {overrides} from './overrides';

// ----------------------------------------------------------------------

export default function ThemeProvider({children}: any) {
    const memoizedValue = useMemo(
        () => ({
            palette: palette(),
            typography: typography(),
            shadows: shadows(),
            customShadows: customShadows(),
            shape: {borderRadius: 8},
            breakpoints: {
                values: {
                    xs: 0,
                    sm: 600,
                    md: 900,
                    lg: 1200,
                    xl: 1536,
                },
            },
        }),
        []
    );

    const theme = createTheme(memoizedValue);

    theme.components = overrides(theme);

    return (
        <MUIThemeProvider theme={theme}>
            <CssBaseline/>
            {children}
        </MUIThemeProvider>
    );
}


