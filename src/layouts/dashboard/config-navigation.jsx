import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const navConfig = [
  {
    title: 'résultats',
    path: '/',
    icon: icon('ic_analytics'),
  },
  {
    title: 'comitards',
    path: '/comitards',
    icon: icon('ic_user'),
  },
  {
    title: 'Connection',
    path: '/login',
    icon: icon('ic_lock'),
  },

];

export default navConfig;
