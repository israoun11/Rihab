/**
 * Content schema: the single source of truth for every editable text and image
 * on the public website. The admin dashboard builds its forms from it, the API
 * validates against it, and the public site reads values typed from it.
 *
 * Pages → sections → fields. Adding a field here (and a default value in
 * defaults.ts) makes it editable in the dashboard with no other change.
 */

export interface ImageValue {
  /** Either a bundled asset (/assets/img/...) or an uploaded file (/media/<id>). */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Optional responsive sources for bundled assets. Cleared when the image is replaced. */
  srcSet?: string;
  /** Demonstration visuals carry a "demo" tag on the site until they are replaced. */
  demo?: boolean;
}

export interface TextFieldDef {
  readonly type: "text";
  readonly label: string;
  readonly help?: string;
  /** false: the same value in every language (e-mail, phone, numbers). Texts are translatable by default. */
  readonly i18n?: false;
  /** Multi-line input. */
  readonly multiline?: boolean;
  /** Supports *italique*, **gras**, line breaks and {email} / {phone} tokens. */
  readonly rich?: boolean;
  readonly optional?: boolean;
}

export interface UrlFieldDef {
  readonly type: "url";
  readonly label: string;
  readonly help?: string;
}

export interface ImageFieldDef {
  readonly type: "image";
  readonly label: string;
  /** CSS aspect ratio of the frame the image is shown in, used for the preview. */
  readonly ratio: string;
  readonly help?: string;
  /** When true the image can be removed and the section renders without it. */
  readonly optional?: boolean;
}

export interface StringListFieldDef {
  readonly type: "stringList";
  readonly label: string;
  readonly itemLabel: string;
  readonly help?: string;
  readonly i18n?: false;
}

/** Colour, stored as #RRGGBB. Same in every language. */
export interface ColorFieldDef {
  readonly type: "color";
  readonly label: string;
  readonly help?: string;
}

/** One value from a fixed list. Same in every language. */
export interface SelectFieldDef {
  readonly type: "select";
  readonly label: string;
  readonly help?: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}

/** On / off switch. Same in every language. */
export interface BooleanFieldDef {
  readonly type: "boolean";
  readonly label: string;
  readonly help?: string;
}

/** Order and visibility of a fixed set of blocks (page sections, menu entries). */
export interface LayoutFieldDef {
  readonly type: "layout";
  readonly label: string;
  readonly help?: string;
  readonly items: readonly { readonly key: string; readonly label: string }[];
}

export interface LayoutItem {
  key: string;
  visible: boolean;
}

export interface ListFieldDef {
  readonly type: "list";
  readonly label: string;
  readonly itemLabel: string;
  readonly help?: string;
  readonly fields: { readonly [key: string]: LeafFieldDef };
}

export type LeafFieldDef =
  | TextFieldDef
  | UrlFieldDef
  | ImageFieldDef
  | StringListFieldDef
  | ColorFieldDef
  | SelectFieldDef
  | BooleanFieldDef
  | LayoutFieldDef;
export type FieldDef = LeafFieldDef | ListFieldDef;

export interface SectionDef {
  readonly label: string;
  readonly description?: string;
  readonly fields: { readonly [key: string]: FieldDef };
}

export interface PageDef {
  readonly label: string;
  /** Public path of the page, shown in the dashboard as a "voir la page" link. */
  readonly path: string;
  readonly sections: { readonly [key: string]: SectionDef };
}

const seo = {
  label: "Référencement (onglet du navigateur et moteurs de recherche)",
  fields: {
    title: { type: "text", label: "Titre de la page" },
    description: { type: "text", label: "Description", multiline: true },
  },
} as const satisfies SectionDef;

const ctaWithLink = {
  label: "Bandeau d’appel à l’action (bas de page)",
  fields: {
    title: { type: "text", label: "Titre", rich: true, multiline: true },
    primary: { type: "text", label: "Bouton principal" },
    secondary: { type: "text", label: "Lien secondaire" },
  },
} as const satisfies SectionDef;

const ctaSingle = {
  label: "Bandeau d’appel à l’action (bas de page)",
  fields: {
    title: { type: "text", label: "Titre", rich: true, multiline: true },
    primary: { type: "text", label: "Bouton" },
  },
} as const satisfies SectionDef;

const pageHead = {
  label: "En-tête de page",
  fields: {
    label: { type: "text", label: "Surtitre" },
    title: { type: "text", label: "Titre", rich: true, multiline: true },
    lead: { type: "text", label: "Introduction", multiline: true },
  },
} as const satisfies SectionDef;

const RICH_HELP = "Retour à la ligne pour couper le titre, *texte* pour l’italique.";
const PROSE_HELP = "Une ligne vide sépare les paragraphes. **texte** pour le gras, *texte* pour l’italique.";

/** Order and visibility of the sections of a page (the page header / hero always stays first). */
function layoutSection<const I extends readonly { readonly key: string; readonly label: string }[]>(items: I) {
  return {
    label: "Sections de la page (ordre et affichage)",
    description: "Réordonnez les sections avec les flèches, décochez une section pour la masquer. L’en-tête de la page reste toujours en premier.",
    fields: {
      sections: { type: "layout", label: "Sections", items },
    },
  } as const;
}

/** Google Fonts offered in the design settings (the first one is the original). */
export const FONT_OPTIONS = {
  sans: ["Hanken Grotesk", "Inter", "DM Sans", "Manrope", "Work Sans", "Jost"],
  serif: ["Instrument Serif", "Cormorant Garamond", "Playfair Display", "DM Serif Display", "Fraunces", "Libre Caslon Text"],
  arabicSans: ["IBM Plex Sans Arabic", "Noto Kufi Arabic", "Tajawal", "Cairo", "Almarai"],
  arabicSerif: ["Noto Naskh Arabic", "Amiri", "Reem Kufi", "Markazi Text", "Lateef"],
} as const;
const fontOptions = (list: readonly string[]) => list.map((f) => ({ value: f, label: f }));

export const CONTENT_SCHEMA = {
  site: {
    label: "Éléments communs",
    path: "/",
    sections: {
      identity: {
        label: "Identité",
        fields: {
          name: { type: "text", label: "Nom affiché (logo, pied de page)" },
          homeLinkLabel: { type: "text", label: "Libellé du logo pour les lecteurs d’écran" },
          skipLink: { type: "text", label: "Lien d’accès direct au contenu" },
          demoTag: { type: "text", label: "Étiquette des images de démonstration" },
          demoAltPrefix: { type: "text", label: "Préfixe du texte alternatif des images de démonstration" },
          logo: {
            type: "image",
            label: "Logo (remplace le nom dans la barre de navigation et le pied de page)",
            ratio: "4 / 1",
            optional: true,
            help: "PNG ou WebP sur fond transparent, clair sur fond sombre. Sans logo, le nom est affiché.",
          },
          favicon: { type: "image", label: "Icône de l’onglet du navigateur (favicon)", ratio: "1 / 1", optional: true, help: "Image carrée, 512 × 512 px de préférence." },
        },
      },
      seo: {
        label: "Référencement commun",
        fields: {
          shareImage: {
            type: "image",
            label: "Image de partage (réseaux sociaux)",
            ratio: "1.91 / 1",
            optional: true,
            help: "Affichée quand un lien du site est partagé. 1200 × 630 px recommandés.",
          },
        },
      },
      design: {
        label: "Apparence (couleurs et polices)",
        description: "Couleurs et polices de tout le site. « Rétablir le contenu d’origine » remet l’apparence d’origine.",
        fields: {
          ink: { type: "color", label: "Fond principal (sombre)" },
          surface: { type: "color", label: "Fond des blocs surélevés" },
          paper: { type: "color", label: "Texte principal et fonds clairs" },
          wine: { type: "color", label: "Couleur d’accent" },
          wineHover: { type: "color", label: "Couleur d’accent au survol" },
          muted: { type: "color", label: "Texte secondaire sur fond sombre" },
          mutedPaper: { type: "color", label: "Texte secondaire sur fond clair" },
          sans: { type: "select", label: "Police du texte", options: fontOptions(FONT_OPTIONS.sans) },
          serif: { type: "select", label: "Police des titres", options: fontOptions(FONT_OPTIONS.serif) },
          arabicSans: { type: "select", label: "Police du texte (arabe)", options: fontOptions(FONT_OPTIONS.arabicSans) },
          arabicSerif: { type: "select", label: "Police des titres (arabe)", options: fontOptions(FONT_OPTIONS.arabicSerif) },
        },
      },
      contact: {
        label: "Coordonnées",
        description: "Utilisées dans le menu, le pied de page, la page Contact et le formulaire.",
        fields: {
          email: { type: "text", label: "Adresse e-mail", i18n: false },
          phone: { type: "text", label: "Téléphone (affiché)", i18n: false },
          whatsapp: { type: "text", label: "Numéro WhatsApp", help: "Chiffres uniquement, avec l’indicatif pays. Exemple : 21629545981", i18n: false },
          location: { type: "text", label: "Ville" },
        },
      },
      nav: {
        label: "Navigation",
        description: "Libellés, ordre et affichage des liens du menu (barre de navigation, menu mobile et pied de page).",
        fields: {
          items: {
            type: "layout",
            label: "Liens du menu (ordre et affichage)",
            help: "Contact apparaît dans le menu mobile et le pied de page ; sur ordinateur, c’est le bouton de la barre.",
            items: [
              { key: "home", label: "Accueil" },
              { key: "about", label: "À propos" },
              { key: "services", label: "Services" },
              { key: "projects", label: "Projets" },
              { key: "formations", label: "Formations" },
              { key: "contact", label: "Contact" },
            ],
          },
          ctaVisible: { type: "boolean", label: "Afficher le bouton de la barre de navigation" },
          home: { type: "text", label: "Accueil" },
          about: { type: "text", label: "À propos" },
          services: { type: "text", label: "Services" },
          projects: { type: "text", label: "Projets" },
          formations: { type: "text", label: "Formations" },
          contact: { type: "text", label: "Contact (menu mobile et pied de page)" },
          cta: { type: "text", label: "Bouton de la barre de navigation" },
          menu: { type: "text", label: "Bouton du menu mobile" },
          close: { type: "text", label: "Bouton de fermeture du menu mobile" },
          mainLabel: { type: "text", label: "Nom du menu principal (lecteurs d’écran)" },
          mobileLabel: { type: "text", label: "Nom du menu mobile (lecteurs d’écran)" },
          language: { type: "text", label: "Nom du sélecteur de langue (lecteurs d’écran)" },
        },
      },
      footer: {
        label: "Pied de page",
        fields: {
          tagline: { type: "text", label: "Activité" },
          text: { type: "text", label: "Phrase", multiline: true },
          navTitle: { type: "text", label: "Titre de la colonne Navigation" },
          socialTitle: { type: "text", label: "Titre de la colonne Réseaux" },
          contactTitle: { type: "text", label: "Titre de la colonne Contact" },
          coords: { type: "text", label: "Coordonnées géographiques" },
          newTab: { type: "text", label: "Mention « nouvel onglet » (lecteurs d’écran)" },
        },
      },
      notFound: {
        label: "Page introuvable (erreur 404)",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre", rich: true, multiline: true, help: RICH_HELP },
          text: { type: "text", label: "Texte", multiline: true },
          link: { type: "text", label: "Lien vers l’accueil" },
        },
      },
      social: {
        label: "Réseaux sociaux",
        fields: {
          links: {
            type: "list",
            label: "Liens",
            itemLabel: "Réseau",
            fields: {
              label: { type: "text", label: "Nom" },
              url: { type: "url", label: "Adresse (https://…)" },
            },
          },
        },
      },
    },
  },

  home: {
    label: "Accueil",
    path: "/",
    sections: {
      seo,
      layout: layoutSection([
        { key: "about", label: "À propos" },
        { key: "services", label: "Services" },
        { key: "projects", label: "Projets (diaporama)" },
        { key: "formations", label: "Formations" },
        { key: "contact", label: "Contact" },
      ]),
      hero: {
        label: "Section d’ouverture",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre", rich: true, multiline: true, help: "Chaque ligne s’affiche sur sa propre ligne. *texte* pour l’italique." },
          text: { type: "text", label: "Texte", multiline: true },
          primaryCta: { type: "text", label: "Bouton (vers Projets)" },
          secondaryCta: { type: "text", label: "Lien (vers Contact)" },
          cue: { type: "text", label: "Indication de défilement (vers À propos)" },
          hint: { type: "text", label: "Indication du survol" },
          place: { type: "text", label: "Lieu (bas droite)" },
          image: { type: "image", label: "Photographie révélée au survol", ratio: "3 / 4" },
        },
      },
      about: {
        label: "À propos (sur l’accueil)",
        description: "Aperçu de la page À propos, deuxième section de l’accueil.",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre", rich: true, multiline: true, help: RICH_HELP },
          portrait: { type: "image", label: "Portrait", ratio: "3 / 4" },
          lead: { type: "text", label: "Introduction", multiline: true },
          text: { type: "text", label: "Texte", rich: true, multiline: true, help: PROSE_HELP },
          link: { type: "text", label: "Bouton vers la page À propos" },
          detailImage: { type: "image", label: "Image de détail", ratio: "4 / 5", optional: true },
          caption: { type: "text", label: "Légende de l’image de détail", optional: true },
        },
      },
      services: {
        label: "Services (aperçu sur l’accueil)",
        description: "Les services affichés viennent de la page Services (titres et descriptions courtes). Seuls les premiers sont montrés.",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre", rich: true, multiline: true, help: RICH_HELP },
          count: { type: "text", label: "Nombre de services affichés", help: "Un chiffre, par exemple 3.", i18n: false },
          text: { type: "text", label: "Phrase d’accompagnement", multiline: true },
          button: { type: "text", label: "Bouton vers la page Services" },
        },
      },
      projects: {
        label: "Projets (diaporama sur l’accueil)",
        description: "Le diaporama présente tous les projets, dans l’ordre de l’onglet Projets, avec leur image d’ouverture.",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre", rich: true, multiline: true, help: RICH_HELP },
          text: { type: "text", label: "Texte d’introduction", multiline: true },
          link: { type: "text", label: "Lien de chaque projet" },
          interval: { type: "text", label: "Durée d’affichage de chaque projet (secondes)", help: "Entre 3 et 15. Par défaut : 6.", i18n: false },
          button: { type: "text", label: "Bouton vers la page Projets" },
          carouselLabel: { type: "text", label: "Nom du diaporama (lecteurs d’écran)" },
          roleDescription: { type: "text", label: "Type d’élément annoncé (lecteurs d’écran)", help: "Par exemple « carrousel »." },
        },
      },
      formations: {
        label: "Formations (aperçu sur l’accueil)",
        description: "Masquée par défaut : activez-la dans « Sections de la page ». Le statut et les thèmes viennent de la page Formations.",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre", rich: true, multiline: true, help: RICH_HELP },
          text: { type: "text", label: "Texte", rich: true, multiline: true, help: PROSE_HELP },
          meta: { type: "text", label: "Mention à côté du bouton" },
          button: { type: "text", label: "Bouton vers la page Formations" },
        },
      },
      contact: {
        label: "Contact (aperçu sur l’accueil)",
        description: "Le titre reprend celui de la page Contact.",
        fields: {
          primary: { type: "text", label: "Bouton vers la page Contact" },
          secondary: { type: "text", label: "Lien WhatsApp" },
        },
      },
    },
  },

  about: {
    label: "À propos",
    path: "/a-propos",
    sections: {
      seo,
      layout: layoutSection([
        { key: "bio", label: "Présentation" },
        { key: "timeline", label: "Parcours" },
        { key: "approach", label: "Approche" },
        { key: "tools", label: "Outils & savoir-faire" },
        { key: "cta", label: "Bandeau d’appel à l’action" },
      ]),
      head: pageHead,
      bio: {
        label: "Présentation",
        fields: {
          portrait: { type: "image", label: "Portrait", ratio: "3 / 4" },
          lead: { type: "text", label: "Introduction", multiline: true },
          text: { type: "text", label: "Texte", rich: true, multiline: true, help: PROSE_HELP },
          link: { type: "text", label: "Lien vers Contact" },
        },
      },
      timeline: {
        label: "Parcours",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre" },
          items: {
            type: "list",
            label: "Étapes",
            itemLabel: "Étape",
            fields: {
              when: { type: "text", label: "Période" },
              what: { type: "text", label: "Intitulé" },
              where: { type: "text", label: "Lieu ou précision" },
            },
          },
        },
      },
      approach: {
        label: "Approche",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre" },
          text: { type: "text", label: "Texte", rich: true, multiline: true, help: PROSE_HELP },
        },
      },
      tools: {
        label: "Outils & savoir-faire",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre" },
          software: { type: "stringList", label: "Logiciels", itemLabel: "Logiciel" },
          skills: { type: "stringList", label: "Compétences", itemLabel: "Compétence" },
          softwareAria: { type: "text", label: "Nom de la liste des logiciels (lecteurs d’écran)" },
          skillsAria: { type: "text", label: "Nom de la liste des compétences (lecteurs d’écran)" },
        },
      },
      cta: ctaWithLink,
    },
  },

  services: {
    label: "Services",
    path: "/services",
    sections: {
      seo,
      layout: layoutSection([
        { key: "list", label: "Domaines d’intervention et périmètre" },
        { key: "audiences", label: "Pour qui" },
        { key: "steps", label: "Déroulement" },
        { key: "cta", label: "Bandeau d’appel à l’action" },
      ]),
      head: pageHead,
      list: {
        label: "Domaines d’intervention",
        fields: {
          items: {
            type: "list",
            label: "Services",
            itemLabel: "Service",
            fields: {
              title: { type: "text", label: "Titre" },
              description: { type: "text", label: "Description", multiline: true },
              deliverables: { type: "stringList", label: "Livrables possibles", itemLabel: "Livrable" },
            },
          },
          deliverablesAria: { type: "text", label: "Nom des listes de livrables (lecteurs d’écran)" },
        },
      },
      scope: {
        label: "Périmètre de mission",
        fields: {
          label: { type: "text", label: "Surtitre" },
          text: { type: "text", label: "Texte", multiline: true },
        },
      },
      audiences: {
        label: "Pour qui",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre", rich: true, multiline: true, help: RICH_HELP },
          items: {
            type: "list",
            label: "Publics",
            itemLabel: "Public",
            fields: {
              title: { type: "text", label: "Titre" },
              text: { type: "text", label: "Texte", multiline: true },
            },
          },
        },
      },
      steps: {
        label: "Déroulement",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre", rich: true, multiline: true },
          items: {
            type: "list",
            label: "Étapes",
            itemLabel: "Étape",
            fields: {
              title: { type: "text", label: "Titre" },
              text: { type: "text", label: "Texte", multiline: true },
            },
          },
        },
      },
      cta: ctaSingle,
    },
  },

  projects: {
    label: "Projets (liste)",
    path: "/projets",
    sections: {
      seo,
      layout: layoutSection([
        { key: "listing", label: "Liste des projets" },
        { key: "cta", label: "Bandeau d’appel à l’action" },
      ]),
      head: pageHead,
      listing: {
        label: "Liste des projets",
        description: "Les projets et leurs catégories se gèrent dans l’onglet « Projets ».",
        fields: {
          filterLabel: { type: "text", label: "Libellé des filtres" },
          filterAria: { type: "text", label: "Nom du groupe de filtres (lecteurs d’écran)" },
          allLabel: { type: "text", label: "Filtre « tous les projets »" },
          cardLink: { type: "text", label: "Lien des cartes projet" },
          filterStatusOne: { type: "text", label: "Annonce du filtre (1 projet)", help: "{n} est remplacé par le nombre." },
          filterStatusMany: { type: "text", label: "Annonce du filtre (plusieurs projets)", help: "{n} est remplacé par le nombre." },
        },
      },
      cta: ctaSingle,
    },
  },

  projectDetail: {
    label: "Projets (fiche détaillée)",
    path: "/projets",
    sections: {
      layout: layoutSection([
        { key: "gallery", label: "Galerie d’images" },
        { key: "next", label: "Projet suivant" },
        { key: "cta", label: "Bandeau d’appel à l’action" },
      ]),
      labels: {
        label: "Libellés communs aux fiches projet",
        fields: {
          breadcrumb: { type: "text", label: "Fil d’Ariane" },
          place: { type: "text", label: "Libellé « Lieu »" },
          category: { type: "text", label: "Libellé « Catégorie »" },
          context: { type: "text", label: "Libellé « Contexte »" },
          intro: { type: "text", label: "Surtitre de la description" },
          demoNote: { type: "text", label: "Note sur les images de démonstration", multiline: true, help: "Affichée seulement tant qu’une image de démonstration reste sur la fiche." },
          next: { type: "text", label: "Libellé « Projet suivant »" },
        },
      },
      cta: ctaWithLink,
    },
  },

  formations: {
    label: "Formations",
    path: "/formations",
    sections: {
      seo,
      layout: layoutSection([
        { key: "image", label: "Image" },
        { key: "courses", label: "Formations logiciels" },
        { key: "upcoming", label: "À venir" },
      ]),
      head: pageHead,
      image: {
        label: "Image",
        description: "Image seule affichée sous l’en-tête de la page. Sans image, la section n’apparaît pas sur le site.",
        fields: {
          image: {
            type: "image",
            label: "Image",
            ratio: "16 / 9",
            optional: true,
            help: "Format paysage recommandé (au moins 2000 px de large).",
          },
        },
      },
      courses: {
        label: "Formations logiciels",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre" },
          items: {
            type: "list",
            label: "Logiciels",
            itemLabel: "Logiciel",
            fields: {
              logo: {
                type: "image",
                label: "Logo",
                ratio: "1 / 1",
                optional: true,
                help: "Logo carré, de préférence en PNG ou SVG sur fond transparent.",
              },
              name: { type: "text", label: "Nom" },
              text: { type: "text", label: "Description", multiline: true, help: "Un retour à la ligne s’affiche tel quel." },
              button: { type: "text", label: "Bouton" },
            },
          },
        },
      },
      upcoming: {
        label: "À venir",
        fields: {
          label: { type: "text", label: "Surtitre" },
          title: { type: "text", label: "Titre", rich: true, multiline: true, help: RICH_HELP },
          status: { type: "text", label: "Statut" },
          text: { type: "text", label: "Texte", multiline: true },
          topics: {
            type: "list",
            label: "Thèmes",
            itemLabel: "Thème",
            fields: {
              label: { type: "text", label: "Numéro" },
              title: { type: "text", label: "Intitulé" },
            },
          },
          audience: { type: "text", label: "Public visé" },
          button: { type: "text", label: "Bouton" },
          topicsAria: { type: "text", label: "Nom de la liste des thèmes (lecteurs d’écran)" },
        },
      },
    },
  },

  contact: {
    label: "Contact",
    path: "/contact",
    sections: {
      seo,
      intro: {
        label: "Présentation",
        fields: {
          title: { type: "text", label: "Titre", rich: true, multiline: true, help: RICH_HELP },
          text: { type: "text", label: "Texte", multiline: true },
          studioLabel: { type: "text", label: "Libellé « Atelier »" },
          phoneLabel: { type: "text", label: "Libellé « Téléphone »" },
          emailLabel: { type: "text", label: "Libellé « E-mail »" },
          copy: { type: "text", label: "Bouton « Copier »" },
          copied: { type: "text", label: "Confirmation « Copié »" },
          whatsapp: { type: "text", label: "Bouton WhatsApp" },
          emailLink: { type: "text", label: "Lien e-mail" },
        },
      },
      form: {
        label: "Formulaire",
        fields: {
          ariaLabel: { type: "text", label: "Nom du formulaire (lecteurs d’écran)" },
          name: { type: "text", label: "Champ « Nom »" },
          email: { type: "text", label: "Champ « E-mail »" },
          phone: { type: "text", label: "Champ « Téléphone »" },
          optional: { type: "text", label: "Mention « facultatif »" },
          type: { type: "text", label: "Champ « Type de projet »" },
          typePlaceholder: { type: "text", label: "Choix par défaut de la liste" },
          typeOptions: { type: "stringList", label: "Types de projet proposés", itemLabel: "Type" },
          location: { type: "text", label: "Champ « Localisation »" },
          locationPlaceholder: { type: "text", label: "Exemple du champ « Localisation »" },
          message: { type: "text", label: "Champ « Message »" },
          messagePlaceholder: { type: "text", label: "Exemple du champ « Message »", multiline: true },
          formationOption: { type: "text", label: "Type présélectionné par les liens « formations »", help: "Doit être l’un des types de projet proposés ci-dessus." },
          formationPreset: { type: "text", label: "Message prérempli (lien « formations »)" },
          note: { type: "text", label: "Note sous le formulaire", rich: true, multiline: true, help: "{email} est remplacé par l’adresse e-mail. **texte** pour le gras." },
          submit: { type: "text", label: "Bouton d’envoi" },
          submitting: { type: "text", label: "Bouton pendant la préparation" },
          handoffTitle: { type: "text", label: "Titre après validation" },
          handoffText: { type: "text", label: "Texte après validation", multiline: true },
          handoffMail: { type: "text", label: "Bouton messagerie" },
          handoffWhatsapp: { type: "text", label: "Bouton WhatsApp" },
          copyBefore: { type: "text", label: "Texte avant « Copier le message »" },
          copyButton: { type: "text", label: "Bouton « Copier le message »" },
          copyAfter: { type: "text", label: "Texte après « Copier le message »", help: "{email} est remplacé par l’adresse e-mail." },
          copyDone: { type: "text", label: "Confirmation de copie" },
          copyFallback: { type: "text", label: "Message si la copie automatique échoue" },
          copyTextLabel: { type: "text", label: "Libellé du texte à copier (lecteurs d’écran)" },
          mailSubjectProject: { type: "text", label: "Objet de l’e-mail (projet)", help: "{type} est remplacé par le type de projet." },
          mailSubjectFormation: { type: "text", label: "Objet de l’e-mail (formation)" },
          subjectLabel: { type: "text", label: "Mot « Objet » dans le message copié" },
        },
      },
      errors: {
        label: "Messages d’erreur du formulaire",
        fields: {
          summaryOne: { type: "text", label: "Résumé (un champ)" },
          summaryMany: { type: "text", label: "Résumé (plusieurs champs)", help: "{n} est remplacé par le nombre." },
          name: { type: "text", label: "Nom manquant" },
          emailMissing: { type: "text", label: "E-mail manquant" },
          emailInvalid: { type: "text", label: "E-mail invalide" },
          phone: { type: "text", label: "Téléphone invalide" },
          type: { type: "text", label: "Type manquant" },
          location: { type: "text", label: "Localisation manquante" },
          message: { type: "text", label: "Message trop court" },
        },
      },
    },
  },
} as const satisfies { readonly [page: string]: PageDef };

/* ------------------------------------------------------------------------ */
/* Types derived from the schema                                             */
/* ------------------------------------------------------------------------ */

type LeafValue<F> = F extends { type: "text" } | { type: "url" } | { type: "color" } | { type: "select" }
  ? string
  : F extends { type: "boolean" }
    ? boolean
  : F extends { type: "layout" }
    ? LayoutItem[]
  : F extends { type: "image"; optional: true }
    ? ImageValue | null
    : F extends { type: "image" }
      ? ImageValue
      : F extends { type: "stringList" }
        ? string[]
        : never;

export type FieldValue<F> = F extends { type: "list"; fields: infer S }
  ? Array<{ -readonly [K in keyof S]: LeafValue<S[K]> }>
  : LeafValue<F>;

export type SectionValue<S> = S extends { fields: infer F } ? { -readonly [K in keyof F]: FieldValue<F[K]> } : never;
export type PageValue<P> = P extends { sections: infer S } ? { -readonly [K in keyof S]: SectionValue<S[K]> } : never;

export type ContentSchema = typeof CONTENT_SCHEMA;
export type PageKey = keyof ContentSchema;
export type SiteContent = { -readonly [K in PageKey]: PageValue<ContentSchema[K]> };

export const PAGE_KEYS = Object.keys(CONTENT_SCHEMA) as PageKey[];

export function getSectionDef(page: string, section: string): SectionDef | undefined {
  if (!Object.prototype.hasOwnProperty.call(CONTENT_SCHEMA, page)) return undefined;
  const p = (CONTENT_SCHEMA as Record<string, PageDef>)[page];
  if (!p || !Object.prototype.hasOwnProperty.call(p.sections, section)) return undefined;
  return p.sections[section];
}
