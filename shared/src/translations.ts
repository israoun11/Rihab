import type { ImageValue, SiteContent } from "./schema.js";
import { DEFAULT_CONTENT as FR } from "./defaults.js";

/**
 * English and Arabic versions of the default content (defaults.ts holds the
 * French original). Same structure as the French content, so TypeScript makes
 * sure no text is left untranslated. Values that do not depend on the language
 * (images, colours, e-mail, phone, section order…) are taken from the French
 * content; only their texts (and image descriptions) are translated here.
 */

const alt = (img: ImageValue, text: string): ImageValue => ({ ...img, alt: text });

export const DEFAULT_CONTENT_EN: SiteContent = {
  site: {
    identity: {
      ...FR.site.identity,
      homeLinkLabel: "Rihab Baabou, home",
      skipLink: "Skip to content",
      demoTag: "Demonstration image",
      demoAltPrefix: "Demonstration image to be replaced: ",
    },
    seo: FR.site.seo,
    design: FR.site.design,
    contact: { ...FR.site.contact, location: "Gabès, Tunisia" },
    nav: {
      ...FR.site.nav,
      home: "Home",
      about: "About",
      services: "Services",
      projects: "Projects",
      formations: "Training",
      contact: "Contact",
      cta: "Let’s talk about your project",
      menu: "Menu",
      close: "Close",
      mainLabel: "Main navigation",
      mobileLabel: "Mobile navigation",
      language: "Site language",
    },
    footer: {
      tagline: "Interior architecture & training",
      text: "Spaces imagined with sensitivity, designed with precision.",
      navTitle: "Navigation",
      socialTitle: "Social",
      contactTitle: "Contact",
      coords: "Gabès · 33°53′ N, 10°06′ E",
      newTab: " (new tab)",
    },
    notFound: {
      label: "Error 404",
      title: "This page\n*does not exist.*",
      text: "The address may have changed. Find the projects and services from the home page.",
      link: "Back to the home page",
    },
    social: FR.site.social,
  },

  home: {
    layout: FR.home.layout,
    seo: {
      title: "Rihab Baabou · Interior architecture in Gabès",
      description:
        "Rihab Baabou, interior architect and teacher in Gabès, Tunisia. Residential and commercial spaces, design, 3D visualisation and training.",
    },
    hero: {
      ...FR.home.hero,
      label: "Rihab Baabou · Interior architecture",
      title: "Space takes shape.\n*So does your story.*",
      text: "Residential and commercial spaces designed to bring together aesthetics, function and emotion.",
      primaryCta: "Explore the projects",
      secondaryCta: "Let’s talk about your project",
      cue: "Scroll to discover",
      hint: "Move the cursor to reveal the space",
      place: "Gabès, Tunisia",
    },
    about: {
      ...FR.home.about,
      label: "About",
      title: "A creative sensibility.\n*An eye for detail.*",
      portrait: alt(FR.home.about.portrait, "Portrait of Rihab Baabou, interior architect, sitting at her desk"),
      lead: "An interior architect based in Gabès, I design places that find their meaning in your everyday life.",
      text: "My approach combines listening, the search for atmospheres and technical precision. Volumes, materials and light answer one another to create a coherent whole, true to your identity.",
      link: "Discover our story",
      caption: "",
    },
    services: {
      ...FR.home.services,
      label: "Expertise",
      title: "Design the whole.\n*Refine every detail.*",
      text: "Each assignment is defined around your project, from the first sketch to technical follow-up.",
      button: "Discover our services",
    },
    projects: {
      ...FR.home.projects,
      label: "Selected projects",
      title: "Ideas that *take shape.*",
      text: "Living spaces and professional places, explored through their uses, their atmospheres and their details.",
      link: "Discover the project",
      button: "See all projects",
      carouselLabel: "Featured projects",
      roleDescription: "carousel",
    },
    formations: {
      label: "Sharing",
      title: "Design is practised.\n*And shared.*",
      text: "Alongside my practice, I teach technical drawing and design tools to future designers.\n\nThis commitment will continue through training courses in interior architecture, technical drawing and 3D visualisation.",
      meta: "Teaching at ISAM Gabès and IMSET",
      button: "Discover the training courses",
    },
    contact: {
      primary: "Let’s talk about your project",
      secondary: "Chat on WhatsApp",
    },
  },

  about: {
    layout: FR.about.layout,
    seo: {
      title: "About · Rihab Baabou",
      description:
        "The background of Rihab Baabou, interior architect in Gabès, founder of La Tienda Interior Design Studio and teacher at ISAM Gabès and IMSET.",
    },
    head: {
      label: "About",
      title: "Designing with sensitivity,\n*drawing with precision.*",
      lead: "Interior architect and teacher, based in Gabès.",
    },
    bio: {
      ...FR.about.bio,
      portrait: alt(FR.about.bio.portrait, "Portrait of Rihab Baabou, interior architect, sitting at her desk"),
      lead: "I am Rihab Baabou, an interior architect in Gabès. I design residential and commercial spaces that start from the way people live in them.",
      text:
        "I trained at the Higher Institute of Arts and Crafts of Gabès, where I completed a bachelor’s degree in interior architecture, then a professional master’s degree in interior design.\n\n" +
        "In October 2023, I founded **La Tienda Interior Design Studio**, my interior architecture studio. There I support fit-out projects, from the search for an atmosphere to the technical drawings.\n\n" +
        "Alongside this, I teach design-related subjects at **ISAM Gabès** and **IMSET**.",
      link: "Let’s talk about your project",
    },
    timeline: {
      label: "Background",
      title: "Education and practice",
      items: [
        { when: "2018 – 2021", what: "Bachelor’s degree in interior architecture", where: "ISAM Gabès" },
        { when: "2021 – 2023", what: "Professional master’s degree in interior design", where: "ISAM Gabès" },
        { when: "Since October 2023", what: "Founder of La Tienda Interior Design Studio", where: "Interior architecture studio" },
        { when: "In parallel", what: "Teaching design-related subjects", where: "ISAM Gabès · IMSET" },
      ],
    },
    approach: {
      label: "Approach",
      title: "Listen first, then refine every choice.",
      text: "Every project begins with a meeting. Your habits, your wishes and the constraints of the place become the starting point of the design.\n\nPlans, 3D visualisations, the choice of materials and technical support then make it possible to refine the decisions, step by step.",
    },
    tools: {
      ...FR.about.tools,
      label: "Tools & know-how",
      title: "A solid technical foundation.",
      skills: ["Technical drawings", "Materials", "Lighting", "Project coordination"],
      softwareAria: "Software",
      skillsAria: "Skills",
    },
    cta: {
      title: "A project in mind?\n*Let’s talk.*",
      primary: "Let’s talk about your project",
      secondary: "See the projects",
    },
  },

  services: {
    layout: FR.services.layout,
    seo: {
      title: "Services · Rihab Baabou",
      description:
        "Design and space planning, design and 3D visualisation, documentation and coordination: the interior architecture services of Rihab Baabou.",
    },
    head: {
      label: "Services",
      title: "Design the whole.\n*Refine every detail.*",
      lead: "Three areas of work, combined according to the needs of each project.",
    },
    list: {
      items: [
        {
          title: "Design & space planning",
          description: "Organisation of spaces, layout plans, concept research and definition of atmospheres.",
          deliverables: [
            "Listening to needs and analysing uses",
            "Organisation of spaces and circulation",
            "Layout plans",
            "Concept research and definition of atmospheres",
          ],
        },
        {
          title: "Design & 3D visualisation",
          description: "Modelling, renderings, selection of materials, furniture and lighting, and harmonisation of finishes.",
          deliverables: [
            "3D modelling of the spaces",
            "Presentation renderings",
            "Selection of materials, furniture and lighting",
            "Harmonisation of finishes",
          ],
        },
        {
          title: "Documentation & coordination",
          description: "Technical drawings, exchanges with contractors and suppliers, and follow-up of the works according to the defined assignment.",
          deliverables: [
            "Technical drawings",
            "Exchanges with contractors and suppliers",
            "Follow-up of the works according to the defined assignment",
          ],
        },
      ],
      deliverablesAria: "Possible deliverables",
    },
    scope: {
      label: "Scope of the assignment",
      text: "The content of each assignment is defined with you, project by project, according to the nature of the place, your expectations and the support you want. The items listed above are possible deliverables, not a fixed package.",
    },
    audiences: {
      label: "For whom",
      title: "Places to live\n*and places to work.*",
      items: [
        { title: "Private clients", text: "A house, an apartment or a room to rethink around the way you use it." },
        { title: "Shops & professional spaces", text: "Shops, cafés, restaurants and professional spaces to fit out." },
        { title: "Collaborations", text: "Architects, companies or project owners looking for an interior architect." },
      ],
    },
    steps: {
      label: "How it works",
      title: "Step by step.",
      items: [
        { title: "Listen", text: "Understand your needs, your uses and your priorities." },
        { title: "Design", text: "Organise the space and develop a creative direction." },
        { title: "Visualise", text: "Explore volumes, materials and light." },
        { title: "Support", text: "Refine the technical choices and coordinate exchanges according to the defined assignment." },
      ],
    },
    cta: {
      title: "Let’s define\n*your assignment together.*",
      primary: "Discuss my project",
    },
  },

  projects: {
    layout: FR.projects.layout,
    seo: {
      title: "Projects · Rihab Baabou",
      description: "Interior architecture projects by Rihab Baabou: residential and commercial spaces in Gabès and Sousse.",
    },
    head: {
      label: "Projects",
      title: "Ideas that\n*take shape.*",
      lead: "Living spaces and professional places, explored through their uses, their atmospheres and their details.",
    },
    listing: {
      filterLabel: "Filter",
      filterAria: "Filter the projects",
      allLabel: "All",
      cardLink: "Discover the project",
      filterStatusOne: "{n} project shown",
      filterStatusMany: "{n} projects shown",
    },
    cta: {
      title: "Your space could\n*be the next one.*",
      primary: "Let’s talk about your project",
    },
  },

  projectDetail: {
    layout: FR.projectDetail.layout,
    labels: {
      breadcrumb: "Projects",
      place: "Location",
      category: "Category",
      context: "Context",
      intro: "The project",
      demoNote: "The images on this page are demonstration visuals, awaiting the renderings and photographs of the project.",
      next: "Next project",
    },
    cta: {
      title: "A space to imagine?\n*Let’s talk.*",
      primary: "Let’s talk about your project",
      secondary: "All projects",
    },
  },

  formations: {
    layout: FR.formations.layout,
    seo: {
      title: "Training · Rihab Baabou",
      description:
        "Rihab Baabou teaches technical drawing and design tools. Training courses in interior architecture, technical drawing and 3D visualisation are in preparation.",
    },
    head: {
      label: "Training",
      title: "Design is practised.\n*And shared.*",
      lead: "A teacher at ISAM Gabès and IMSET, I am preparing training courses for students and young designers.",
    },
    image: FR.formations.image,
    courses: FR.formations.courses,
    upcoming: {
      label: "Coming soon",
      title: "Three themes\n*in preparation.*",
      status: "Training courses in preparation",
      text: "Programmes, formats and dates have not been set yet. Leave your details to be informed when they open.",
      topics: [
        { label: "Theme 1", title: "Design & space planning" },
        { label: "Theme 2", title: "Technical drawing & AutoCAD" },
        { label: "Theme 3", title: "3D modelling & visualisation" },
      ],
      audience: "For students and early-career designers",
      button: "Be informed about upcoming courses",
      topicsAria: "Themes of the upcoming courses",
    },
  },

  contact: {
    seo: {
      title: "Contact · Rihab Baabou",
      description:
        "Contact Rihab Baabou, interior architect in Gabès: phone, e-mail, WhatsApp and project enquiry form.",
    },
    intro: {
      title: "What if we imagined\n*your space?*",
      text: "An interior to rethink, a shop to fit out or an idea to explore: let’s talk about your project.",
      studioLabel: "Studio",
      phoneLabel: "Phone",
      emailLabel: "E-mail",
      copy: "Copy",
      copied: "Copied",
      whatsapp: "Chat on WhatsApp",
      emailLink: "Send an e-mail",
    },
    form: {
      ariaLabel: "Project enquiry",
      name: "Full name",
      email: "E-mail address",
      phone: "Phone",
      optional: "(optional)",
      type: "Type of project",
      typePlaceholder: "Choose…",
      typeOptions: ["Residential", "Commercial", "Training", "Other"],
      location: "Project location",
      locationPlaceholder: "City or region",
      message: "Message",
      messagePlaceholder: "Describe your space, your expectations and the planned timeline.",
      formationOption: "Training",
      formationPreset: "I would like to be informed about upcoming training courses.",
      note: "This form prepares your message, then you send it from your e-mail app or WhatsApp. It does not transmit anything directly yet. You can also write to **{email}**.",
      submit: "Send my request",
      submitting: "Preparing your request…",
      handoffTitle: "Your message is ready, it just needs to be sent.",
      handoffText: "Choose how to send it. Nothing is sent until you confirm in your e-mail app or in WhatsApp.",
      handoffMail: "Open in my e-mail app",
      handoffWhatsapp: "Send via WhatsApp",
      copyBefore: "E-mail app not opening?",
      copyButton: "Copy the message",
      copyAfter: "then paste it into an e-mail to {email}.",
      copyDone: "Message copied",
      copyFallback: "Text selected, copy it",
      copyTextLabel: "Message text",
      mailSubjectProject: "Project enquiry · {type}",
      mailSubjectFormation: "Training",
      subjectLabel: "Subject",
    },
    errors: {
      summaryOne: "One field to complete.",
      summaryMany: "{n} fields to complete.",
      name: "Enter your full name.",
      emailMissing: "Enter your e-mail address.",
      emailInvalid: "Check the format of the e-mail address (example: name@domain.com).",
      phone: "Check the number, or leave this field empty.",
      type: "Choose a type of project.",
      location: "Enter the city or region of the project.",
      message: "Describe your project in a few words (10 characters minimum).",
    },
  },
};

export const DEFAULT_CONTENT_AR: SiteContent = {
  site: {
    identity: {
      ...FR.site.identity,
      name: "رحاب بعبو",
      homeLinkLabel: "رحاب بعبو، الصفحة الرئيسية",
      skipLink: "الانتقال إلى المحتوى",
      demoTag: "صورة توضيحية",
      demoAltPrefix: "صورة توضيحية سيتم استبدالها: ",
    },
    seo: FR.site.seo,
    design: FR.site.design,
    contact: { ...FR.site.contact, location: "قابس، تونس" },
    nav: {
      ...FR.site.nav,
      home: "الرئيسية",
      about: "من أنا",
      services: "الخدمات",
      projects: "المشاريع",
      formations: "التكوين",
      contact: "اتصل بنا",
      cta: "لنتحدث عن مشروعك",
      menu: "القائمة",
      close: "إغلاق",
      mainLabel: "القائمة الرئيسية",
      mobileLabel: "قائمة الهاتف",
      language: "لغة الموقع",
    },
    footer: {
      tagline: "الهندسة الداخلية والتكوين",
      text: "فضاءات مصمَّمة بحسّ مرهف ومنفَّذة بدقّة.",
      navTitle: "التصفح",
      socialTitle: "الشبكات الاجتماعية",
      contactTitle: "اتصل بنا",
      coords: "قابس · 33°53′ شمالًا، 10°06′ شرقًا",
      newTab: " (علامة تبويب جديدة)",
    },
    notFound: {
      label: "خطأ 404",
      title: "هذه الصفحة\n*غير موجودة.*",
      text: "ربما تغيّر العنوان. يمكنك الوصول إلى المشاريع والخدمات من الصفحة الرئيسية.",
      link: "العودة إلى الصفحة الرئيسية",
    },
    social: {
      links: [
        { label: "لينكدإن", url: "https://www.linkedin.com/in/rihab-baabou/" },
        { label: "بيهانس", url: "https://www.behance.net/ryhabaabouabde" },
        { label: "فيسبوك", url: "https://www.facebook.com/rihab.baabou.2025/" },
        { label: "تيك توك", url: "https://www.tiktok.com/@rihab_baabou" },
      ],
    },
  },

  home: {
    layout: FR.home.layout,
    seo: {
      title: "رحاب بعبو · الهندسة الداخلية في قابس",
      description:
        "رحاب بعبو، مهندسة داخلية وأستاذة في قابس، تونس. فضاءات سكنية وتجارية، تصميم، تصوّر ثلاثي الأبعاد وتكوين.",
    },
    hero: {
      ...FR.home.hero,
      label: "رحاب بعبو · الهندسة الداخلية",
      title: "الفضاء يتشكّل.\n*وقصّتك أيضًا.*",
      text: "فضاءات سكنية وتجارية مصمَّمة لتجمع بين الجمال والوظيفة والإحساس.",
      primaryCta: "اكتشف المشاريع",
      secondaryCta: "لنتحدث عن مشروعك",
      cue: "مرّر للاكتشاف",
      hint: "حرّك المؤشر لكشف الفضاء",
      place: "قابس، تونس",
    },
    about: {
      ...FR.home.about,
      label: "من أنا",
      title: "حسّ إبداعي.\n*وعناية بالتفاصيل.*",
      portrait: alt(FR.home.about.portrait, "صورة رحاب بعبو، مهندسة داخلية، جالسة إلى مكتبها"),
      lead: "مهندسة داخلية مقيمة في قابس، أصمّم أماكن تكتسب معناها من حياتك اليومية.",
      text: "يجمع أسلوبي بين الإصغاء والبحث عن الأجواء والدقّة التقنية. تتحاور الأحجام والمواد والضوء لتكوين كلٍّ متناسق يعبّر عن هويتك.",
      link: "اكتشف قصتنا",
      caption: "",
    },
    services: {
      ...FR.home.services,
      label: "مجالات الخبرة",
      title: "نصمّم الكلّ.\n*ونتقن كلّ تفصيل.*",
      text: "تُحدَّد كلّ مهمة وفق مشروعك، من الرسم الأوّلي إلى المتابعة التقنية.",
      button: "اكتشف خدماتنا",
    },
    projects: {
      ...FR.home.projects,
      label: "مختارات من المشاريع",
      title: "أفكار *تتجسّد.*",
      text: "فضاءات للعيش وأماكن مهنية، نستكشفها من خلال استخداماتها وأجوائها وتفاصيلها.",
      link: "اكتشف المشروع",
      button: "عرض جميع المشاريع",
      carouselLabel: "مشاريع مميّزة",
      roleDescription: "عرض شرائح",
    },
    formations: {
      label: "نقل المعرفة",
      title: "التصميم يُمارَس.\n*ويُتقاسَم.*",
      text: "إلى جانب عملي، أدرّس الرسم التقني وأدوات التصميم لمصمّمي المستقبل.\n\nوسيتواصل هذا الالتزام من خلال دورات تكوينية في الهندسة الداخلية والرسم التقني والتصوّر ثلاثي الأبعاد.",
      meta: "التدريس في المعهد العالي للفنون والحرف بقابس وفي IMSET",
      button: "اكتشف الدورات التكوينية",
    },
    contact: {
      primary: "لنتحدث عن مشروعك",
      secondary: "تواصل عبر واتساب",
    },
  },

  about: {
    layout: FR.about.layout,
    seo: {
      title: "من أنا · رحاب بعبو",
      description:
        "مسيرة رحاب بعبو، مهندسة داخلية في قابس، مؤسِّسة La Tienda Interior Design Studio وأستاذة في المعهد العالي للفنون والحرف بقابس وفي IMSET.",
    },
    head: {
      label: "من أنا",
      title: "أصمّم بإحساس،\n*وأرسم بدقّة.*",
      lead: "مهندسة داخلية وأستاذة، مقيمة في قابس.",
    },
    bio: {
      ...FR.about.bio,
      portrait: alt(FR.about.bio.portrait, "صورة رحاب بعبو، مهندسة داخلية، جالسة إلى مكتبها"),
      lead: "أنا رحاب بعبو، مهندسة داخلية في قابس. أصمّم فضاءات سكنية وتجارية تنطلق من طريقة عيشنا فيها.",
      text:
        "تكوّنتُ في المعهد العالي للفنون والحرف بقابس، حيث تحصّلت على الإجازة في الهندسة الداخلية، ثم على الماجستير المهني في التصميم الداخلي.\n\n" +
        "في أكتوبر 2023، أسّستُ **La Tienda Interior Design Studio**، مكتبي للهندسة الداخلية. أرافق فيه مشاريع التهيئة، من البحث عن الأجواء إلى الرسوم التقنية.\n\n" +
        "وبالتوازي، أدرّس موادّ مرتبطة بالتصميم في **المعهد العالي للفنون والحرف بقابس** وفي **IMSET**.",
      link: "لنتحدث عن مشروعك",
    },
    timeline: {
      label: "المسيرة",
      title: "التكوين والممارسة",
      items: [
        { when: "2018 – 2021", what: "إجازة في الهندسة الداخلية", where: "المعهد العالي للفنون والحرف بقابس" },
        { when: "2021 – 2023", what: "ماجستير مهني في التصميم الداخلي", where: "المعهد العالي للفنون والحرف بقابس" },
        { when: "منذ أكتوبر 2023", what: "مؤسِّسة La Tienda Interior Design Studio", where: "مكتب للهندسة الداخلية" },
        { when: "بالتوازي", what: "تدريس موادّ مرتبطة بالتصميم", where: "المعهد العالي للفنون والحرف بقابس · IMSET" },
      ],
    },
    approach: {
      label: "المنهج",
      title: "الإصغاء أوّلًا، ثم تدقيق كلّ اختيار.",
      text: "يبدأ كلّ مشروع بلقاء. عاداتك ورغباتك وقيود المكان تصبح نقطة انطلاق التصميم.\n\nثم تتيح المخطّطات والتصوّرات ثلاثية الأبعاد واختيار المواد والمرافقة التقنية تدقيقَ القرارات، خطوةً بخطوة.",
    },
    tools: {
      ...FR.about.tools,
      label: "الأدوات والمهارات",
      title: "أساس تقني متين.",
      skills: ["الرسوم التقنية", "المواد", "الإضاءة", "تنسيق المشاريع"],
      softwareAria: "البرمجيات",
      skillsAria: "المهارات",
    },
    cta: {
      title: "لديك مشروع في ذهنك؟\n*لنتحدث عنه.*",
      primary: "لنتحدث عن مشروعك",
      secondary: "عرض المشاريع",
    },
  },

  services: {
    layout: FR.services.layout,
    seo: {
      title: "الخدمات · رحاب بعبو",
      description:
        "التصميم والتهيئة، التصميم والتصوّر ثلاثي الأبعاد، التوثيق والتنسيق: خدمات الهندسة الداخلية لرحاب بعبو.",
    },
    head: {
      label: "الخدمات",
      title: "نصمّم الكلّ.\n*ونتقن كلّ تفصيل.*",
      lead: "ثلاثة مجالات تدخّل، تُجمع وفق احتياجات كلّ مشروع.",
    },
    list: {
      items: [
        {
          title: "التصميم والتهيئة",
          description: "تنظيم الفضاءات، مخطّطات التهيئة، البحث عن المفاهيم وتحديد الأجواء.",
          deliverables: [
            "الإصغاء إلى الاحتياجات وتحليل الاستخدامات",
            "تنظيم الفضاءات والممرّات",
            "مخطّطات التهيئة",
            "البحث عن المفهوم وتحديد الأجواء",
          ],
        },
        {
          title: "التصميم والتصوّر ثلاثي الأبعاد",
          description: "النمذجة، الصور الواقعية، اختيار المواد والأثاث والإضاءة وتنسيق اللمسات النهائية.",
          deliverables: [
            "النمذجة ثلاثية الأبعاد للفضاءات",
            "صور العرض الواقعية",
            "اختيار المواد والأثاث والإضاءة",
            "تنسيق اللمسات النهائية",
          ],
        },
        {
          title: "التوثيق والتنسيق",
          description: "الرسوم التقنية، التواصل مع المقاولات والمزوّدين، ومتابعة التنفيذ وفق المهمة المحدّدة.",
          deliverables: ["الرسوم التقنية", "التواصل مع المقاولات والمزوّدين", "متابعة التنفيذ وفق المهمة المحدّدة"],
        },
      ],
      deliverablesAria: "المخرجات الممكنة",
    },
    scope: {
      label: "نطاق المهمة",
      text: "يُحدَّد محتوى كلّ مهمة معك، مشروعًا بمشروع، وفق طبيعة المكان وتطلّعاتك والمرافقة التي ترغب فيها. العناصر المذكورة أعلاه مخرجات ممكنة، وليست باقة ثابتة.",
    },
    audiences: {
      label: "لمن",
      title: "أماكن للعيش\n*وأماكن للعمل.*",
      items: [
        { title: "الأفراد", text: "منزل أو شقة أو غرفة يُعاد التفكير فيها حول استخداماتك." },
        { title: "المحلات والفضاءات المهنية", text: "محلات ومقاهٍ ومطاعم وفضاءات مهنية تحتاج إلى تهيئة." },
        { title: "الشراكات", text: "مهندسون معماريون أو شركات أو أصحاب مشاريع يبحثون عن مهندسة داخلية." },
      ],
    },
    steps: {
      label: "مراحل العمل",
      title: "خطوة بخطوة.",
      items: [
        { title: "الإصغاء", text: "فهم احتياجاتك واستخداماتك وأولوياتك." },
        { title: "التصميم", text: "تنظيم الفضاء وتطوير توجّه إبداعي." },
        { title: "التصوّر", text: "استكشاف الأحجام والمواد والضوء." },
        { title: "المرافقة", text: "تدقيق الخيارات التقنية وتنسيق التواصل وفق المهمة المحدّدة." },
      ],
    },
    cta: {
      title: "لنحدّد معًا\n*مهمّتك.*",
      primary: "ناقش مشروعي",
    },
  },

  projects: {
    layout: FR.projects.layout,
    seo: {
      title: "المشاريع · رحاب بعبو",
      description: "مشاريع الهندسة الداخلية لرحاب بعبو: فضاءات سكنية وتجارية في قابس وسوسة.",
    },
    head: {
      label: "المشاريع",
      title: "أفكار\n*تتجسّد.*",
      lead: "فضاءات للعيش وأماكن مهنية، نستكشفها من خلال استخداماتها وأجوائها وتفاصيلها.",
    },
    listing: {
      filterLabel: "تصفية",
      filterAria: "تصفية المشاريع",
      allLabel: "الكلّ",
      cardLink: "اكتشف المشروع",
      filterStatusOne: "مشروع واحد معروض ({n})",
      filterStatusMany: "{n} مشاريع معروضة",
    },
    cta: {
      title: "قد يكون فضاؤك\n*التالي.*",
      primary: "لنتحدث عن مشروعك",
    },
  },

  projectDetail: {
    layout: FR.projectDetail.layout,
    labels: {
      breadcrumb: "المشاريع",
      place: "المكان",
      category: "الفئة",
      context: "السياق",
      intro: "المشروع",
      demoNote: "الصور في هذه الصفحة صور توضيحية، في انتظار الصور الواقعية والفوتوغرافية للمشروع.",
      next: "المشروع التالي",
    },
    cta: {
      title: "فضاء تودّ تخيّله؟\n*لنتحدث عنه.*",
      primary: "لنتحدث عن مشروعك",
      secondary: "جميع المشاريع",
    },
  },

  formations: {
    layout: FR.formations.layout,
    seo: {
      title: "التكوين · رحاب بعبو",
      description:
        "تدرّس رحاب بعبو الرسم التقني وأدوات التصميم. دورات تكوينية في الهندسة الداخلية والرسم التقني والتصوّر ثلاثي الأبعاد قيد الإعداد.",
    },
    head: {
      label: "التكوين",
      title: "التصميم يُمارَس.\n*ويُتقاسَم.*",
      lead: "بصفتي أستاذة في المعهد العالي للفنون والحرف بقابس وفي IMSET، أُعدّ دورات تكوينية للطلبة والمصمّمين الشباب.",
    },
    image: FR.formations.image,
    courses: {
      label: "أتقن أهمّ أدوات المهنة",
      title: "دورات احترافية في البرمجيات",
      items: [
        { logo: null, name: "SketchUp", text: "نمذج بثقة.\nأنشئ نماذج ثلاثية الأبعاد دقيقة وحوّل أفكارك إلى واقع.", button: "اعرف المزيد" },
        { logo: null, name: "Lumion", text: "تصوّر في الوقت الحقيقي.\nأنتج صورًا ورسومًا متحركة وجولات افتراضية مبهرة.", button: "اعرف المزيد" },
        { logo: null, name: "V-Ray", text: "صيّر بواقعية.\nأتقن الإضاءة والمواد والتصيير الفوتوغرافي الواقعي.", button: "اعرف المزيد" },
        { logo: null, name: "AutoCAD", text: "ارسم بدقّة.\nأنجز الرسوم التقنية ووثائق التنفيذ.", button: "اعرف المزيد" },
        { logo: null, name: "Unreal Engine", text: "ادخل عالم التصميم الغامر.\nأنشئ تجارب تفاعلية وفضاءات في الوقت الحقيقي.", button: "اعرف المزيد" },
      ],
    },
    upcoming: {
      label: "قريبًا",
      title: "ثلاثة محاور\n*قيد الإعداد.*",
      status: "دورات تكوينية قيد الإعداد",
      text: "لم تُحدَّد البرامج والصيغ والمواعيد بعد. اترك بياناتك ليتمّ إعلامك عند فتح التسجيل.",
      topics: [
        { label: "المحور 1", title: "التصميم والتهيئة" },
        { label: "المحور 2", title: "الرسم التقني وAutoCAD" },
        { label: "المحور 3", title: "النمذجة والتصوّر ثلاثي الأبعاد" },
      ],
      audience: "للطلبة والمصمّمين في بداية مسيرتهم",
      button: "أعلمني بالدورات القادمة",
      topicsAria: "محاور الدورات القادمة",
    },
  },

  contact: {
    seo: {
      title: "اتصل بنا · رحاب بعبو",
      description: "تواصل مع رحاب بعبو، مهندسة داخلية في قابس: الهاتف، البريد الإلكتروني، واتساب واستمارة طلب مشروع.",
    },
    intro: {
      title: "ماذا لو تخيّلنا\n*فضاءك معًا؟*",
      text: "داخل تريد إعادة التفكير فيه، أو محلّ تريد تهيئته، أو فكرة تودّ استكشافها: لنتحدث عن مشروعك.",
      studioLabel: "المكتب",
      phoneLabel: "الهاتف",
      emailLabel: "البريد الإلكتروني",
      copy: "نسخ",
      copied: "تم النسخ",
      whatsapp: "تواصل عبر واتساب",
      emailLink: "أرسل بريدًا إلكترونيًا",
    },
    form: {
      ariaLabel: "طلب مشروع",
      name: "الاسم واللقب",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      optional: "(اختياري)",
      type: "نوع المشروع",
      typePlaceholder: "اختر…",
      typeOptions: ["سكني", "تجاري", "تكوين", "آخر"],
      location: "موقع المشروع",
      locationPlaceholder: "المدينة أو الجهة",
      message: "الرسالة",
      messagePlaceholder: "عرّفنا بفضائك وتطلّعاتك والجدول الزمني المتوقّع.",
      formationOption: "تكوين",
      formationPreset: "أرغب في أن يتمّ إعلامي بالدورات التكوينية القادمة.",
      note: "تُعدّ هذه الاستمارة رسالتك، ثم ترسلها أنت من بريدك الإلكتروني أو من واتساب. لا تُرسل أيّ شيء مباشرةً بعد. يمكنك أيضًا الكتابة إلى **{email}**.",
      submit: "أرسل طلبي",
      submitting: "جارٍ إعداد طلبك…",
      handoffTitle: "رسالتك جاهزة، يبقى إرسالها.",
      handoffText: "اختر طريقة الإرسال. لن يُرسل أيّ شيء ما لم تؤكّد الإرسال من بريدك الإلكتروني أو من واتساب.",
      handoffMail: "افتح في بريدي الإلكتروني",
      handoffWhatsapp: "أرسل عبر واتساب",
      copyBefore: "لم يُفتح البريد الإلكتروني؟",
      copyButton: "انسخ الرسالة",
      copyAfter: "ثم الصقها في بريد إلكتروني إلى {email}.",
      copyDone: "تم نسخ الرسالة",
      copyFallback: "تم تحديد النص، انسخه",
      copyTextLabel: "نص الرسالة",
      mailSubjectProject: "طلب مشروع · {type}",
      mailSubjectFormation: "التكوين",
      subjectLabel: "الموضوع",
    },
    errors: {
      summaryOne: "حقل واحد يجب إكماله.",
      summaryMany: "عدد الحقول التي يجب إكمالها: {n}.",
      name: "أدخل اسمك ولقبك.",
      emailMissing: "أدخل بريدك الإلكتروني.",
      emailInvalid: "تحقّق من صيغة البريد الإلكتروني (مثال: name@domain.com).",
      phone: "تحقّق من الرقم، أو اترك هذا الحقل فارغًا.",
      type: "اختر نوع المشروع.",
      location: "أدخل مدينة المشروع أو جهته.",
      message: "صف مشروعك في بضع كلمات (10 أحرف على الأقل).",
    },
  },
};
