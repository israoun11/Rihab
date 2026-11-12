import { useSite } from "../content/ContentContext";

/** The site's name with its burgundy mark, or the logo uploaded in the dashboard. */
export function WordmarkContent() {
  const { identity } = useSite().content.site;
  if (identity.logo) {
    return <img className="wordmark__logo" src={identity.logo.src} alt={identity.logo.alt || identity.name} width={identity.logo.width} height={identity.logo.height} />;
  }
  return (
    <>
      {identity.name}
      <i aria-hidden="true"></i>
    </>
  );
}
