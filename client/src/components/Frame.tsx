import type { CSSProperties } from "react";
import type { ImageValue } from "@rihab/shared";
import { useSite } from "../content/ContentContext";

export type FrameRatio = "frame--land" | "frame--wide" | "frame--port" | "frame--tall" | "frame--sq";

interface Props {
  /** null/undefined when the stored data has no usable image: the frame stays, empty, so the layout holds. */
  image: ImageValue | null | undefined;
  ratio: FrameRatio;
  eager?: boolean;
  /** Show the "demo" tag on demonstration visuals (default true). */
  tag?: boolean;
  sizes?: string;
  style?: CSSProperties;
}

/**
 * Image in a fixed-ratio frame (object-fit: cover), so any replacement image
 * keeps the layout and proportions of the original design.
 */
export function Frame({ image, ratio, eager = false, tag = true, sizes, style }: Props) {
  const { content } = useSite();
  const { demoTag, demoAltPrefix } = content.site.identity;
  if (!image?.src) return <div className={`frame ${ratio}`} style={style} data-missing-image="" aria-hidden="true" />;
  const alt = image.demo && image.alt ? `${demoAltPrefix}${image.alt}` : image.alt;
  return (
    <div className={`frame ${ratio}`} style={style}>
      {image.demo && tag && <span className="demo-tag">{demoTag}</span>}
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes={image.srcSet ? sizes : undefined}
        width={image.width}
        height={image.height}
        alt={alt}
        {...(eager ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
        decoding="async"
      />
    </div>
  );
}
