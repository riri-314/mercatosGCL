import {useTheme, type Breakpoint} from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// ----------------------------------------------------------------------

export function useResponsive(start: Breakpoint, end: Breakpoint, query?: string) {
    const theme = useTheme();

    const mediaUp = useMediaQuery(theme.breakpoints.up(start));
    const mediaDown = useMediaQuery(theme.breakpoints.down(start));
    const mediaBetween = useMediaQuery(theme.breakpoints.between(start, end));
    const mediaOnly = useMediaQuery(theme.breakpoints.only(start));

    if (query === 'up') {
        return mediaUp;
    }

    if (query === 'down') {
        return mediaDown;
    }

    if (query === 'between') {
        return mediaBetween;
    }

    return mediaOnly;
}

// ----------------------------------------------------------------------

export function useWidth() {
    const theme = useTheme();
    const keys: Breakpoint[] = ['xl', 'lg', 'md', 'sm', 'xs'];
    const matches = [
        useMediaQuery(theme.breakpoints.up('xl')),
        useMediaQuery(theme.breakpoints.up('lg')),
        useMediaQuery(theme.breakpoints.up('md')),
        useMediaQuery(theme.breakpoints.up('sm')),
        useMediaQuery(theme.breakpoints.up('xs')),
    ];
    return keys.find((_, index) => matches[index]) ?? 'xs';
}
