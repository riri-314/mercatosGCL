import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";

type IconName =
  | "activity"
  | "people"
  | "book"
  | "arrow"
  | "search"
  | "menu"
  | "close"
  | "clock"
  | "cup"
  | "refresh"
  | "login";
const paths: Record<IconName, React.ReactNode> = {
  activity: (
    <>
      <path d="M4 19V9m5 10V5m5 14v-7m5 7V3" />
      <path d="m3 7 6-4 5 5 6-6" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m3 10v-3a6 6 0 0 0-2-4" />
    </>
  ),
  book: (
    <>
      <path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z" />
    </>
  ),
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  cup: (
    <>
      <path d="M8 3h8v6a4 4 0 0 1-8 0Zm4 10v7m-4 1h8M8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6 6a8 8 0 0 1 14 6M4 12a8 8 0 0 0 14 6" />
    </>
  ),
  login: <path d="M14 4h6v16h-6M3 12h12m-4-4 4 4-4 4" />,
};
export default function ClubIcon({
  name,
  ...props
}: SvgIconProps & { name: IconName }) {
  return (
    <SvgIcon
      {...props}
      viewBox="0 0 24 24"
      sx={{
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.6,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props.sx,
      }}
    >
      {paths[name]}
    </SvgIcon>
  );
}
