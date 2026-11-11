import type { ImageValue, SiteContent } from "./schema.js";

/** Narrow no-break space used before French ? ! : ; */
const NB = " ";

const portrait = (alt: string): ImageValue => ({
  src: "/assets/img/rihab-portrait.jpg",
  srcSet: "/assets/img/rihab-portrait-640.jpg 640w, /assets/img/rihab-portrait.jpg 957w",
  width: 957,
  height: 1280,
  alt,
});

const PROCESS_TEXT =
  "Chaque projet commence par une rencontre. Vos habitudes, vos envies et les contraintes du lieu deviennent le point de départ de la conception.\n\nPlans, visualisations 3D, choix des matériaux et accompagnement technique permettent ensuite de préciser les décisions, étape par étape.";

/**
 * Initial content, taken word for word from the original static site.
 * Any value saved in the dashboard overrides the matching value here.
 */
export const DEFAULT_CONTENT: SiteContent = {
  site: {
    identity: {
      name: "Rihab Baabou",
      homeLinkLabel: "Rihab Baabou, accueil",
      skipLink: "Aller au contenu",
      demoTag: "Image de démonstration",
      demoAltPrefix: "Image de démonstration à remplacer : ",
    },
    contact: {
      email: "baabourihab@gmail.com",
      phone: "+216 29 545 981",
      whatsapp: "21629545981",
      location: "Gabès, Tunisie",
    },
    nav: {
      home: "Accueil",
      about: "À propos",
      services: "Services",
      projects: "Projets",
      formations: "Formations",
      contact: "Contact",
      cta: "Parlons de votre projet",
      menu: "Menu",
      close: "Fermer",
    },
    footer: {
      tagline: "Architecture d’intérieur & formation",
      text: "Des espaces pensés avec sensibilité, conçus avec précision.",
      navTitle: "Navigation",
      socialTitle: "Réseaux",
      contactTitle: "Contact",
      coords: "Gabès · 33°53′ N, 10°06′ E",
      newTab: " (nouvel onglet)",
    },
    notFound: {
      label: "Erreur 404",
      title: "Cette page\n*n’existe pas.*",
      text: "L’adresse a peut-être changé. Retrouvez les projets et les services depuis l’accueil.",
      link: "Retour à l’accueil",
    },
    social: {
      links: [
        { label: "LinkedIn", url: "https://www.linkedin.com/in/rihab-baabou/" },
        { label: "Behance", url: "https://www.behance.net/ryhabaabouabde" },
        { label: "Facebook", url: "https://www.facebook.com/rihab.baabou.2025/" },
        { label: "TikTok", url: "https://www.tiktok.com/@rihab_baabou" },
      ],
    },
  },

  home: {
    seo: {
      title: "Rihab Baabou · Architecture d’intérieur à Gabès",
      description:
        "Rihab Baabou, architecte d’intérieur et enseignante à Gabès, Tunisie. Espaces résidentiels et commerciaux, conception, visualisation 3D et formation.",
    },
    hero: {
      label: "Rihab Baabou · Architecture d’intérieur",
      title: "L’espace prend forme.\n*Votre histoire aussi.*",
      text: "Des espaces résidentiels et commerciaux pensés pour conjuguer esthétique, fonctionnalité et émotion.",
      primaryCta: "Explorer les projets",
      secondaryCta: "Parlons de votre projet",
      cue: "Défiler pour découvrir",
      hint: "Déplacez le curseur pour révéler l’espace",
      place: "Gabès, Tunisie",
      image: portrait(""),
    },
    about: {
      label: "À propos",
      title: "Une sensibilité créative.\n*Le souci du détail.*",
      portrait: portrait("Portrait de Rihab Baabou, architecte d’intérieur, assise à son bureau"),
      lead: "Architecte d’intérieur basée à Gabès, je conçois des lieux qui prennent leur sens dans votre quotidien.",
      text: "Mon approche associe écoute, recherche d’ambiances et précision technique. Volumes, matières et lumière se répondent pour créer un ensemble cohérent, fidèle à votre identité.",
      link: "Découvrir notre histoire",
      detailImage: null,
      caption: "",
    },
    services: {
      label: "Expertises",
      title: "Concevoir l’ensemble.\n*Affiner chaque détail.*",
      count: "3",
      text: "Chaque mission est définie selon votre projet, de la première esquisse au suivi technique.",
      button: "Découvrir nos services",
    },
    projects: {
      label: "Sélection de projets",
      title: "Des idées qui *prennent forme.*",
      text: "Des espaces de vie et des lieux professionnels, explorés à travers leurs usages, leurs ambiances et leurs détails.",
      link: "Découvrir le projet",
      interval: "6",
      meta: "Résidentiel · Commercial",
      button: "Voir tous les projets",
      carouselLabel: "Projets à la une",
      prev: "Projet précédent",
      next: "Projet suivant",
      goTo: "Afficher le projet {n} : {title}",
    },
    formations: {
      label: "Transmission",
      title: "Le design se pratique.\n*Et se partage.*",
      text: "En parallèle de ma pratique, j’enseigne le dessin technique et les outils de conception aux futurs designers.\n\nCet engagement se prolongera à travers des formations en architecture d’intérieur, dessin technique et visualisation 3D.",
      meta: "Enseignement à l’ISAM Gabès et à l’IMSET",
      button: "Découvrir les formations",
    },
    contact: {
      primary: "Parlons de votre projet",
      secondary: "Échanger sur WhatsApp",
    },
  },

  about: {
    seo: {
      title: "À propos · Rihab Baabou",
      description:
        "Parcours de Rihab Baabou, architecte d’intérieur à Gabès, fondatrice de La Tienda Interior Design Studio et enseignante à l’ISAM Gabès et à l’IMSET.",
    },
    head: {
      label: "À propos",
      title: "Concevoir avec sensibilité,\n*dessiner avec précision.*",
      lead: "Architecte d’intérieur et enseignante, basée à Gabès.",
    },
    bio: {
      portrait: portrait("Portrait de Rihab Baabou, architecte d’intérieur, assise à son bureau"),
      lead: "Je suis Rihab Baabou, architecte d’intérieur à Gabès. Je conçois des espaces résidentiels et commerciaux qui partent de la manière dont on les vit.",
      text:
        "Formée à l’Institut Supérieur des Arts et Métiers de Gabès, j’y ai suivi une licence en architecture intérieure, puis un mastère professionnel en design d’intérieur.\n\n" +
        "En octobre 2023, j’ai fondé **La Tienda Interior Design Studio**, mon studio d’architecture intérieure. J’y accompagne des projets d’aménagement, de la recherche d’ambiance jusqu’aux dessins techniques.\n\n" +
        "En parallèle, j’enseigne des matières liées au design à l’**ISAM Gabès** et à l’**IMSET**.",
      link: "Parlons de votre projet",
    },
    timeline: {
      label: "Parcours",
      title: "Formation et pratique",
      items: [
        { when: "2018 – 2021", what: "Licence en architecture intérieure", where: "ISAM Gabès" },
        { when: "2021 – 2023", what: "Mastère professionnel en design d’intérieur", where: "ISAM Gabès" },
        { when: "Depuis octobre 2023", what: "Fondatrice de La Tienda Interior Design Studio", where: "Studio d’architecture intérieure" },
        { when: "En parallèle", what: "Enseignement des matières liées au design", where: "ISAM Gabès · IMSET" },
      ],
    },
    approach: {
      label: "Approche",
      title: "Écouter d’abord, puis préciser chaque choix.",
      text: PROCESS_TEXT,
    },
    tools: {
      label: "Outils & savoir-faire",
      title: "Une base technique solide.",
      software: ["AutoCAD", "SketchUp", "Lumion", "V-Ray", "D5 Render"],
      skills: ["Dessins techniques", "Matériaux", "Éclairage", "Coordination de projet"],
    },
    cta: {
      title: `Un projet en tête${NB}?\n*Parlons-en.*`,
      primary: "Parlons de votre projet",
      secondary: "Voir les projets",
    },
  },

  services: {
    seo: {
      title: "Services · Rihab Baabou",
      description:
        "Conception et aménagement, design et visualisation 3D, documentation et coordination : les services d’architecture intérieure de Rihab Baabou.",
    },
    head: {
      label: "Services",
      title: "Concevoir l’ensemble.\n*Affiner chaque détail.*",
      lead: "Trois domaines d’intervention, combinés selon les besoins de chaque projet.",
    },
    list: {
      items: [
        {
          title: "Conception & aménagement",
          description: "Organisation des espaces, plans d’aménagement, recherche de concepts et définition des ambiances.",
          deliverables: [
            "Écoute des besoins et analyse des usages",
            "Organisation des espaces et circulations",
            "Plans d’aménagement",
            "Recherche de concept et définition des ambiances",
          ],
        },
        {
          title: "Design & visualisation 3D",
          description: "Modélisation, rendus, sélection des matériaux, mobilier, éclairage et harmonisation des finitions.",
          deliverables: [
            "Modélisation 3D des espaces",
            "Rendus de présentation",
            "Sélection des matériaux, du mobilier et de l’éclairage",
            "Harmonisation des finitions",
          ],
        },
        {
          title: "Documentation & coordination",
          description:
            "Dessins techniques, échanges avec les entreprises et fournisseurs, et suivi de l’exécution selon la mission définie.",
          deliverables: [
            "Dessins techniques",
            "Échanges avec les entreprises et les fournisseurs",
            "Suivi de l’exécution selon la mission définie",
          ],
        },
      ],
    },
    scope: {
      label: "Périmètre de mission",
      text: "Le contenu de chaque mission est défini avec vous, projet par projet, selon la nature du lieu, vos attentes et l’accompagnement souhaité. Les éléments listés ci-dessus sont des livrables possibles, pas un forfait figé.",
    },
    audiences: {
      label: "Pour qui",
      title: "Des lieux de vie\n*et des lieux de travail.*",
      items: [
        { title: "Particuliers", text: "Une maison, un appartement ou une pièce à repenser autour de vos usages." },
        { title: "Commerces & lieux professionnels", text: "Boutiques, cafés, restaurants et espaces professionnels à aménager." },
        { title: "Collaborations", text: "Architectes, entreprises ou porteurs de projet à la recherche d’une architecte d’intérieur." },
      ],
    },
    steps: {
      label: "Déroulement",
      title: "Étape par étape.",
      items: [
        { title: "Écouter", text: "Comprendre vos besoins, vos usages et vos priorités." },
        { title: "Concevoir", text: "Organiser l’espace et développer une direction créative." },
        { title: "Visualiser", text: "Explorer les volumes, les matières et la lumière." },
        { title: "Accompagner", text: "Préciser les choix techniques et coordonner les échanges selon la mission définie." },
      ],
    },
    cta: {
      title: "Définissons ensemble\n*votre mission.*",
      primary: "Discuter de mon projet",
    },
  },

  projects: {
    seo: {
      title: "Projets · Rihab Baabou",
      description: "Projets d’architecture intérieure de Rihab Baabou : espaces résidentiels et commerciaux à Gabès et Sousse.",
    },
    head: {
      label: "Projets",
      title: "Des idées qui\n*prennent forme.*",
      lead: "Des espaces de vie et des lieux professionnels, explorés à travers leurs usages, leurs ambiances et leurs détails.",
    },
    listing: {
      filterLabel: "Filtrer",
      filterAria: "Filtrer les projets",
      allLabel: "Tous",
      cardLink: "Découvrir le projet",
      filterStatusOne: "{n} projet affiché",
      filterStatusMany: "{n} projets affichés",
    },
    cta: {
      title: "Votre espace pourrait\n*être le suivant.*",
      primary: "Parlons de votre projet",
    },
  },

  projectDetail: {
    labels: {
      breadcrumb: "Projets",
      place: "Lieu",
      category: "Catégorie",
      context: "Contexte",
      intro: "Le projet",
      demoNote: "Les images de cette page sont des visuels de démonstration, en attente des rendus et photographies du projet.",
      next: "Projet suivant",
    },
    cta: {
      title: `Un espace à imaginer${NB}?\n*Parlons-en.*`,
      primary: "Parlons de votre projet",
      secondary: "Tous les projets",
    },
  },

  formations: {
    seo: {
      title: "Formations · Rihab Baabou",
      description:
        "Rihab Baabou enseigne le dessin technique et les outils de conception. Des formations en architecture d’intérieur, dessin technique et visualisation 3D sont en préparation.",
    },
    head: {
      label: "Formations",
      title: "Le design se pratique.\n*Et se partage.*",
      lead: "Enseignante à l’ISAM Gabès et à l’IMSET, je prépare des formations pour les étudiants et les jeunes designers.",
    },
    image: { image: null },
    courses: {
      label: "Master the industry-leading tools",
      title: "Professional Software Courses",
      items: [
        { logo: null, name: "SketchUp", text: "Model with confidence.\nCreate accurate 3D models and bring your ideas to life.", button: "Learn more" },
        { logo: null, name: "Lumion", text: "Envision in real time.\nProduce stunning renders, animations and walkthroughs.", button: "Learn more" },
        { logo: null, name: "V-Ray", text: "Render with realism.\nMaster lighting, materials and photorealistic rendering.", button: "Learn more" },
        { logo: null, name: "AutoCAD", text: "Draft with precision.\nCreate technical drawings and construction documents.", button: "Learn more" },
        { logo: null, name: "Unreal Engine", text: "Step into immersive design.\nBuild real-time experiences and interactive spaces.", button: "Learn more" },
      ],
    },
    upcoming: {
      label: "À venir",
      title: "Trois thèmes\n*en préparation.*",
      status: "Formations en préparation",
      text: "Les programmes, formats et dates ne sont pas encore fixés. Laissez vos coordonnées pour être informé de leur ouverture.",
      topics: [
        { label: "Thème 1", title: "Conception & aménagement" },
        { label: "Thème 2", title: "Dessin technique & AutoCAD" },
        { label: "Thème 3", title: "Modélisation & visualisation 3D" },
      ],
      audience: "Pour les étudiants et les designers en début de parcours",
      button: "Être informé des prochaines formations",
    },
  },

  contact: {
    seo: {
      title: "Contact · Rihab Baabou",
      description:
        "Contactez Rihab Baabou, architecte d’intérieur à Gabès : téléphone, e-mail, WhatsApp et formulaire de demande de projet.",
    },
    intro: {
      title: `Et si nous imaginions\n*votre espace${NB}?*`,
      text: `Un intérieur à repenser, un commerce à aménager ou une idée à explorer${NB}: parlons de votre projet.`,
      studioLabel: "Atelier",
      phoneLabel: "Téléphone",
      emailLabel: "E-mail",
      copy: "Copier",
      copied: "Copié",
      whatsapp: "Échanger sur WhatsApp",
      emailLink: "Envoyer un e-mail",
    },
    form: {
      ariaLabel: "Demande de projet",
      name: "Nom et prénom",
      email: "Adresse e-mail",
      phone: "Téléphone",
      optional: "(facultatif)",
      type: "Type de projet",
      typePlaceholder: "Choisir…",
      typeOptions: ["Résidentiel", "Commercial", "Formation", "Autre"],
      location: "Localisation du projet",
      locationPlaceholder: "Ville ou région",
      message: "Message",
      messagePlaceholder: "Présentez votre espace, vos attentes et le calendrier envisagé.",
      formationPreset: "Je souhaite être informé(e) des prochaines formations.",
      note: "Ce formulaire prépare votre message, puis vous l’envoyez depuis votre messagerie ou WhatsApp. Il ne transmet encore rien directement. Vous pouvez aussi écrire à **{email}**.",
      submit: "Envoyer ma demande",
      submitting: "Préparation de votre demande…",
      handoffTitle: "Votre message est prêt, il reste à l’envoyer.",
      handoffText:
        "Choisissez comment le transmettre. Rien n’est envoyé tant que vous ne validez pas l’envoi dans votre messagerie ou dans WhatsApp.",
      handoffMail: "Ouvrir dans ma messagerie",
      handoffWhatsapp: "Envoyer via WhatsApp",
      copyBefore: "La messagerie ne s’ouvre pas ?",
      copyButton: "Copier le message",
      copyAfter: "puis collez-le dans un e-mail à {email}.",
      copyDone: "Message copié",
      copyFallback: "Texte sélectionné, copiez-le",
      copyTextLabel: "Texte du message",
      mailSubjectProject: "Demande de projet · {type}",
      mailSubjectFormation: "Formations",
    },
    errors: {
      summaryOne: "Un champ à compléter.",
      summaryMany: "{n} champs à compléter.",
      name: "Indiquez votre nom et prénom.",
      emailMissing: "Indiquez votre adresse e-mail.",
      emailInvalid: "Vérifiez le format de l’adresse e-mail (exemple : nom@domaine.com).",
      phone: "Vérifiez le numéro, ou laissez ce champ vide.",
      type: "Choisissez un type de projet.",
      location: "Indiquez la ville ou la région du projet.",
      message: "Décrivez votre projet en quelques mots (10 caractères minimum).",
    },
  },
};
