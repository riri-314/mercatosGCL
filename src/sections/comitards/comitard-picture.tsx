import { useEffect, useState } from "react";
import { Box, SxProps, Theme } from "@mui/material";
import LazyLoad from "react-lazy-load";

interface FadeImageProps {
  src?: string;
  alt?: string;
  absolute?: boolean; // if true → fills parent (for cards)
  objectFit?: "cover" | "contain";
  shimmer?: boolean; // enable / disable shimmer
  sx?: SxProps<Theme>;
}

export default function FadeImage({
  src,
  alt = "",
  absolute = true,
  objectFit = "cover",
  shimmer = true,
  sx,
}: FadeImageProps) {
  const [loaded, setLoaded] = useState(false);

  // Reset when src changes
  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <LazyLoad>
      <Box
        sx={{
          position: absolute ? "absolute" : "relative",
          inset: absolute ? 0 : undefined,
          width: 1,
          height: 1,
          overflow: "hidden",
          ...sx,
        }}
      >
        {/* Placeholder */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(110deg, rgba(0,0,0,0.06) 8%, rgba(0,0,0,0.10) 18%, rgba(0,0,0,0.06) 33%)",
            backgroundSize: shimmer ? "200% 100%" : undefined,
            animation:
              shimmer && !loaded
                ? "fadeImageShimmer 1.2s linear infinite"
                : "none",
            opacity: loaded ? 0 : 1,
            transition: "opacity 180ms ease-out",
          }}
        />

        {/* Actual image */}
        <Box
          component="img"
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          sx={{
            position: absolute ? "absolute" : "relative",
            inset: absolute ? 0 : undefined,
            width: 1,
            height: 1,
            objectFit,
            opacity: loaded ? 1 : 0,
            transition: "opacity 220ms ease-out",
            willChange: "opacity",
          }}
        />

        {/* Keyframes */}
        {shimmer && (
          <Box
            sx={{
              "@keyframes fadeImageShimmer": {
                "0%": { backgroundPosition: "200% 0" },
                "100%": { backgroundPosition: "-200% 0" },
              },
            }}
          />
        )}
      </Box>
    </LazyLoad>
  );
}