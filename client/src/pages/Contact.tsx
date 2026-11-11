import { useSite } from "../content/ContentContext";
import { useSeo } from "../hooks/useSeo";
import { useEntrances } from "../hooks/useEntrances";
import { ContactSection } from "../components/ContactSection";

export function Contact() {
  const { content } = useSite();
  useSeo(content.contact.seo.title, content.contact.seo.description);
  useEntrances([]);
  return (
    <main id="contenu" style={{ paddingTop: "var(--nav-h)" }}>
      <ContactSection headingTag="h1" />
    </main>
  );
}
