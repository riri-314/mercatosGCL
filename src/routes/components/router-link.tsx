import {forwardRef} from 'react';
import {Link, type LinkProps} from 'react-router-dom';

// ----------------------------------------------------------------------

const RouterLink = forwardRef<HTMLAnchorElement, Omit<LinkProps, 'to'> & { href: LinkProps['to'] }>(
    ({href, ...other}, ref) => <Link ref={ref} to={href} {...other} />
);

export default RouterLink;
