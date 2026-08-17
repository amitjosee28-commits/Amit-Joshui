export type BlogType = "news" | "article" | "song" | "story" | "poem";

export interface BlogPost {
  id: string;
  slug: string;
  type?: BlogType;
  titleEn: string;
  titleNp: string;
  mainPhoto: string;
  additionalPhotos?: string[];
  contentEn: string;
  contentNp: string;
  authorEn: string;
  authorNp: string;
  dateEn: string;
  dateNp: string;
  timeEn?: string;
  timeNp?: string;
}

export interface CustomPermalink {
  id: string;
  type: "page" | "tool" | "form" | "blog";
  slug: string;
  targetId?: string;
  titleEn: string;
  titleNp: string;
  redirectDelaySec?: number;
}

export interface ToolItem {
  id: string;
  nameEn: string;
  nameNp: string;
  categoryEn: string;
  categoryNp: string;
  descriptionEn: string;
  descriptionNp: string;
  icon: string;
  url: string;
}

export interface ServiceAdminPermissions {
  serviceRequests: boolean;
  suggestions: boolean;
  newsletter: boolean;
  serviceConfiguration: boolean;
  billing: boolean;
}

export interface ServiceAdminUser {
  id: string;
  username: string;
  pin: string;
  name: string;
  role: "super_admin" | "services_admin" | "cms_admin" | string;
  createdAt: string;
  status?: "active" | "frozen" | "restricted";
  permissions?: ServiceAdminPermissions;
}

export type ServiceFieldType = 
  | "short_text" 
  | "long_text" 
  | "number" 
  | "email" 
  | "phone" 
  | "date" 
  | "time" 
  | "datetime" 
  | "dropdown" 
  | "radio" 
  | "checkbox" 
  | "multichoice" 
  | "file_upload" 
  | "image_upload";

export interface ServiceQuestion {
  id: string;
  labelEn: string;
  labelNp?: string;
  fieldType: ServiceFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  defaultValue?: string;
  maxImages?: number;
  allowedFileTypes?: string[];
  order: number;
}

export interface ServiceInvoice {
  invoiceId: string;
  submissionId: string;
  serviceId: string;
  serviceTitle: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress?: string;
  amount: number;
  amountFormatted: string;
  currency: string;
  submittedAt: string;
  paymentDueAt: string; // submittedAt + 12 hours
  paymentStatus: "Pending" | "Paid" | "Failed" | "Cancelled" | "Expired";
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  notes?: string;
  answers?: Record<string, any>;
  attachments?: Array<{ name: string; fileName: string; data: string }>;
}

export interface ServiceItem {
  id: string;
  titleEn: string;
  titleNp: string;
  descriptionEn: string;
  descriptionNp: string;
  priceEn: string;
  priceNp: string;
  whatsappMessageEn: string;
  whatsappMessageNp: string;
  officialLink: string;
  icon: string;
  photoReqsEn?: string;
  photoReqsNp?: string;
  docReqsEn?: string;
  docReqsNp?: string;
  specialNoticeEn?: string;
  specialNoticeNp?: string;
  customQuestionsEn?: string;
  customQuestionsNp?: string;
  questions?: ServiceQuestion[];
  pdfEnabled?: boolean;
  pdfRequired?: boolean;
  pdfLabelEn?: string;
  pdfLabelNp?: string;
  photo1Enabled?: boolean;
  photo1Required?: boolean;
  photo1LabelEn?: string;
  photo1LabelNp?: string;
  photo2Enabled?: boolean;
  photo2Required?: boolean;
  photo2LabelEn?: string;
  photo2LabelNp?: string;
  photo3Enabled?: boolean;
  photo3Required?: boolean;
  photo3LabelEn?: string;
  photo3LabelNp?: string;
  photo4Enabled?: boolean;
  photo4Required?: boolean;
  photo4LabelEn?: string;
  photo4LabelNp?: string;
  serverStatus?: "active" | "down" | "online" | "offline" | string;
}

export interface PortfolioData {
  header: {
    logoUrl: string;
    faviconUrl: string;
    brandTextEn: string;
    brandTextNp: string;
  };
  homepage: {
    slides: Array<{
      id: string;
      imageUrl: string;
      titleEn: string;
      titleNp: string;
      subtitleEn: string;
      subtitleNp: string;
    }>;
    biographySummaryEn: string;
    biographySummaryNp: string;
    biographyFullEn: string;
    biographyFullNp: string;
    portalPillEn?: string;
    portalPillNp?: string;
    executiveSummaryTitleEn?: string;
    executiveSummaryTitleNp?: string;
    bioBtnEn?: string;
    bioBtnNp?: string;
    connectBtnEn?: string;
    connectBtnNp?: string;
    biographyTitleEn?: string;
    biographyTitleNp?: string;
    biographyTaglineEn?: string;
    biographyTaglineNp?: string;
  };
  socials: Array<{
    id: string;
    platform: string;
    url: string;
    icon: string;
    clickCount: number;
    titleEn: string;
    titleNp: string;
  }>;
  initiatives: Array<{
    id: string;
    titleEn: string;
    titleNp: string;
    textEn: string;
    textNp: string;
    readMoreEn: string;
    readMoreNp: string;
    fbIframe: string;
  }>;
  blogs: {
    active: boolean;
    iframeUrl?: string;
    list: BlogPost[];
  };
  customLinks?: CustomPermalink[];
  serviceAdminUsers?: ServiceAdminUser[];
  lastEdited?: string;
  education: Array<{
    id: string;
    institutionEn: string;
    institutionNp: string;
    degreeEn: string;
    degreeNp: string;
    yearsEn: string;
    yearsNp: string;
    descriptionEn: string;
    descriptionNp: string;
    detailsEn: string;
    detailsNp: string;
    portalUrl: string;
  }>;
  tools: Array<{
    id: string;
    nameEn: string;
    nameNp: string;
    categoryEn: string;
    categoryNp: string;
    descriptionEn: string;
    descriptionNp: string;
    icon: string;
    url: string;
  }>;
  interests: Array<{
    id: string;
    titleEn: string;
    titleNp: string;
    descriptionEn: string;
    descriptionNp: string;
    icon: string;
  }>;
  services: ServiceItem[];
  popup: {
    active: boolean;
    imageUrl: string;
    textEn: string;
    textNp: string;
    buttonEn: string;
    buttonNp: string;
    buttonUrl: string;
  };
  maps: {
    permanentUrl: string;
    temporaryUrl: string;
    permanentAddressEn?: string;
    permanentAddressNp?: string;
    temporaryAddressEn?: string;
    temporaryAddressNp?: string;
  };
  privacyPolicyEn?: string;
  privacyPolicyNp?: string;
  termsConditionsEn?: string;
  termsConditionsNp?: string;
  downloads?: Array<{
    id: string;
    titleEn: string;
    titleNp: string;
    fileUrl: string;
    fileType: "pdf" | "jpg" | "png" | "gif";
  }>;
  usefulLinks?: Array<{
    id: string;
    titleEn: string;
    titleNp: string;
    url: string;
  }>;
}

export const defaultPortfolioData: PortfolioData = {
  header: {
    logoUrl: "/profile.jpg",
    faviconUrl: "/favicon.jpeg",
    brandTextEn: "Amit Joshi",
    brandTextNp: "अमित जोशी"
  },
  homepage: {
    slides: [
      {
        id: "slide-1",
        imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80",
        titleEn: "Architect of Modern Web Experiences",
        titleNp: "आधुनिक वेब अनुभवका निर्माता",
        subtitleEn: "Engineering robust, scalable applications with clean, interactive designs.",
        subtitleNp: "स्वच्छ, अन्तरक्रियात्मक डिजाइनहरूको साथ बलियो, मापनयोग्य अनुप्रयोगहरू निर्माण गर्दै।"
      },
      {
        id: "slide-2",
        imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
        titleEn: "Empowering Local Communities in Nepal",
        titleNp: "नेपालका स्थानीय समुदायहरूलाई सशक्त बनाउँदै",
        subtitleEn: "Developing open-source digital utilities and training next-gen engineers.",
        subtitleNp: "खुला स्रोत डिजिटल उपकरणहरू विकास गर्दै र अर्को पुस्ताका इन्जिनियरहरूलाई तालिम दिँदै।"
      },
      {
        id: "slide-3",
        imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
        titleEn: "Bridging Ideas with Technology",
        titleNp: "प्रविधिसँग विचारहरू जोड्दै",
        subtitleEn: "Consulting on enterprise software pipelines, database design, and global CMS deployments.",
        subtitleNp: "इन्टरप्राइज सफ्टवेयर पाइपलाइन, डेटाबेस डिजाइन, र विश्वव्यापी CMS डिप्लोइमेन्टमा परामर्श।"
      }
    ],
    biographySummaryEn: "Amit Joshi is a senior full-stack developer, software trainer, and visual craft specialist based in Kathmandu, Nepal. Operating at the intersections of high-performance backend pipelines and elegant, responsive frontends, Amit provides advanced custom CMS setups and community-focused digital toolkit initiatives.",
    biographySummaryNp: "अमित जोशी काठमाडौं, नेपालमा आधारित एक वरिष्ठ फुल-स्ट्याक डेभलपर, सफ्टवेयर प्रशिक्षक, र भिजुअल क्राफ्ट विशेषज्ञ हुनुहुन्छ। उच्च-प्रदर्शन ब्याकइन्ड पाइपलाइनहरू र सुरुचिपूर्ण, उत्तरदायी फ्रन्टइन्डहरूको संगममा काम गर्दै, अमितले उन्नत अनुकूलन CMS सेटअपहरू र समुदाय-केन्द्रित डिजिटल टुलकिट पहलहरू प्रदान गर्नुहुन्छ।",
    biographyFullEn: "With over 8 years of professional software engineering experience, Amit Joshi specializes in architectural design for enterprise portals, reactive web components, and real-time synchronization ecosystems. After graduating in Computer Engineering, Amit dedicated his efforts towards building utility tools that solve everyday digital workflow challenges for people in Nepal, while simultaneously scaling custom applications for international brands. His philosophy centers around lightweight code execution, modern responsive styles with custom neon glows, and localized dual-lingual translations.",
    biographyFullNp: "८ वर्षभन्दा बढी व्यावसायिक सफ्टवेयर इञ्जिनियरिङ अनुभवका साथ, अमित जोशी इन्टरप्राइज पोर्टलहरू, रिएक्टिभ वेब कम्पोनेन्टहरू, र रियल-टाइम सिङ्क्रोनाइजेसन इकोसिस्टमहरूको वास्तुकला डिजाइनमा विशेषज्ञ हुनुहुन्छ। कम्प्युटर इन्जिनियरिङमा स्नातक गरेपछि, अमितले नेपालका मानिसहरूका लागि दैनिक डिजिटल कार्यप्रवाहका चुनौतीहरू समाधान गर्ने उपयोगी उपकरणहरू निर्माण गर्न आफ्नो प्रयास समर्पित गर्नुभयो, र सँगसँगै अन्तर्राष्ट्रिय ब्रान्डहरूका लागि अनुकूलन अनुप्रयोगहरू विस्तार गर्नुभयो। उहाँको दर्शन हल्का कोड कार्यान्वयन, अनुकूलन नियोन चमकहरूको साथ आधुनिक उत्तरदायी शैलीहरू, र स्थानीयकृत द्वि-भाषी अनुवादहरूमा केन्द्रित छ।",
    portalPillEn: "Amit Joshi Official Portal",
    portalPillNp: "अमित जोशीको आधिकारिक पोर्टल",
    executiveSummaryTitleEn: "Core Executive Summary",
    executiveSummaryTitleNp: "मुख्य कार्यकारी संक्षेप",
    bioBtnEn: "Read Full Biography",
    bioBtnNp: "पूर्ण जीवनी पढ्नुहोस्",
    connectBtnEn: "Connect to Me Portal",
    connectBtnNp: "मेरो पोर्टलमा जोडिनुहोस्",
    biographyTitleEn: "Biography of Amit Joshi",
    biographyTitleNp: "अमित जोशीको जीवनी",
    biographyTaglineEn: "Senior Full-Stack Architect & Digital Localizer",
    biographyTaglineNp: "वरिष्ठ फुल-स्ट्याक आर्किटेक्ट र डिजिटल लोकलाइजर",
  },
  socials: [
    {
      id: "soc-1",
      platform: "Facebook",
      url: "https://facebook.com",
      icon: "Facebook",
      clickCount: 142,
      titleEn: "Amit Joshi on Facebook",
      titleNp: "फेसबुकमा अमित जोशी"
    },
    {
      id: "soc-2",
      platform: "Instagram",
      url: "https://instagram.com",
      icon: "Instagram",
      clickCount: 98,
      titleEn: "Visual updates and creative design logs",
      titleNp: "दृश्य अपडेट र रचनात्मक डिजाइन लगहरू"
    },
    {
      id: "soc-3",
      platform: "TikTok",
      url: "https://tiktok.com",
      icon: "Music",
      clickCount: 74,
      titleEn: "Coding tutorials and tech tips in Nepali",
      titleNp: "नेपालीमा कोडिङ ट्युटोरियल र प्राविधिक सुझावहरू"
    },
    {
      id: "soc-4",
      platform: "WhatsApp",
      url: "https://wa.me/9779800000000",
      icon: "MessageSquare",
      clickCount: 215,
      titleEn: "Instant direct chat & service queries",
      titleNp: "तुरुन्तै सीधा च्याट र सेवा सोधपुछ"
    },
    {
      id: "soc-5",
      platform: "Email",
      url: "mailto:amit@amitjoshi.info.np",
      icon: "Mail",
      clickCount: 63,
      titleEn: "Official inbox for business inquiries",
      titleNp: "व्यापार सोधपुछको लागि आधिकारिक इनबक्स"
    }
  ],
  initiatives: [
    {
      id: "init-1",
      titleEn: "Digital Nepal Localizer Initiative",
      titleNp: "डिजिटल नेपाल स्थानीयकरण पहल",
      textEn: "An open-source effort compiling translations, calendar conversions, and local data utilities for developers building apps targeted at rural Nepal.",
      textNp: "ग्रामीण नेपाललाई लक्षित गरी एपहरू बनाउने विकासकर्ताहरूका लागि अनुवाद, पात्रो रूपान्तरण, र स्थानीय डाटा उपयोगिताहरू संकलन गर्ने खुला स्रोत प्रयास।",
      readMoreEn: "This initiative provides plug-and-play APIs for converting dates from BS to Gregorian and back, generating Nepali rupee formatting, and standardized administrative division selections. Over 150 local engineers use this utility toolkit weekly to deliver fully localized experiences in far-west Nepal.",
      readMoreNp: "यस पहलले बि.सं. बाट ग्रेगोरियन र पछाडि मितिहरू रूपान्तरण गर्न, नेपाली रुपैयाँ ढाँचा सिर्जना गर्न, र मानकीकृत प्रशासनिक विभाजन चयनहरू प्रदान गर्न प्लग-एन्ड-प्ले API हरू प्रदान गर्दछ। सुदूरपश्चिम नेपालमा पूर्ण रूपमा स्थानीयकृत अनुभवहरू प्रदान गर्न १५० भन्दा बढी स्थानीय इन्जिनियरहरूले यस टुलकिटको प्रयोग गर्छन्।",
      fbIframe: `<iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Ffacebook&tabs=timeline&width=340&height=350&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false&appId" width="100%" height="350" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`
    },
    {
      id: "init-2",
      titleEn: "IT Career Accelerator Hub",
      titleNp: "आईटी करियर एक्सेलरेटर हब",
      textEn: "Providing free high-fidelity programming webinars, portfolio mentorship programs, and cloud engineering modules to young Nepali IT graduates.",
      textNp: "युवा नेपाली आईटी स्नातकहरूलाई निःशुल्क उच्च-गुणस्तर प्रोग्रामिङ वेबिनार, पोर्टफोलियो मेन्टरशिप कार्यक्रमहरू, र क्लाउड इन्जिनियरिङ मोड्युलहरू प्रदान गर्दै।",
      readMoreEn: "Our mission is to bridge the massive gap between academic curricula and actual engineering requirements in modern enterprise contexts. Amit hosts bi-weekly direct code-reviews and live deployments on Cloud platforms to show real production environments under load.",
      readMoreNp: "हाम्रो मिशन शैक्षिक पाठ्यक्रम र आधुनिक उद्यम सन्दर्भहरूमा वास्तविक इन्जिनियरिङ आवश्यकताहरू बीचको ठूलो अन्तरलाई कम गर्नु हो। अमितले लोड अन्तर्गत वास्तविक उत्पादन वातावरण देखाउन क्लाउड प्लेटफर्महरूमा दुई-साप्ताहिक प्रत्यक्ष कोड-समीक्षा र प्रत्यक्ष परिनियोजनहरू होस्ट गर्नुहुन्छ।",
      fbIframe: `<iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Ffacebook&tabs=timeline&width=340&height=350&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false&appId" width="100%" height="350" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`
    }
  ],
  blogs: {
    active: true,
    iframeUrl: "https://blog.amitjoshi.info.np",
    list: [
      {
        id: "blog-1",
        slug: "modern-full-stack-web-architecture-nepal-2026",
        type: "article",
        titleEn: "Modern Full-Stack Web Architecture in 2026",
        titleNp: "२०२६ मा आधुनिक फुल-स्ट्याक वेब आर्किटेक्चर",
        mainPhoto: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
        additionalPhotos: [
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"
        ],
        contentEn: "Building robust, scalable applications requires careful consideration of both frontend presentation and backend resilience. In this editorial, we explore real-time synchronization, edge distribution, and low-latency database architectures that power high-concurrency enterprise web systems.\n\nFrom localized fonts and Bikram Sambat date conversions to microsecond database queries, engineering systems for Nepal demands both global best practices and local cultural sensitivity.",
        contentNp: "बलियो र मापनयोग्य अनुप्रयोगहरू निर्माण गर्दा फ्रन्टइन्ड प्रस्तुतीकरण र ब्याकइन्ड लचिलोपन दुवैलाई ध्यान दिनु आवश्यक छ। यस सम्पादकीयमा, हामी वास्तविक-समय सिङ्क्रोनाइजेसन, एज वितरण, र कम-विलम्बता डाटाबेस आर्किटेक्चरहरूको अन्वेषण गर्छौं।\n\nस्थानीयकृत फन्टहरू र विक्रम संवत क्यालेन्डर रूपान्तरणदेखि माइक्रोसेकेन्ड डाटाबेस क्वेरीहरूसम्म, प्रणालीहरूको इञ्जिनियरिङले विश्वव्यापी उत्कृष्ट अभ्यासहरू र स्थानीय सांस्कृतिक संवेदनशीलता दुवैको माग गर्दछ।",
        authorEn: "Amit Joshi",
        authorNp: "अमित जोशी",
        dateEn: "2026-08-12",
        dateNp: "२०८३-०४-२८",
        timeEn: "10:30 AM",
        timeNp: "१०:३० बिहान"
      },
      {
        id: "blog-2",
        slug: "localized-digital-utilities-nepal-tech-ecosystem",
        type: "news",
        titleEn: "Empowering Nepal's Digital Ecosystem with Localized Utilities",
        titleNp: "स्थानीयकृत उपयोगिताहरूसँग नेपालको डिजिटल इकोसिस्टमलाई सशक्त बनाउँदै",
        mainPhoto: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80",
        additionalPhotos: [],
        contentEn: "Digital transformation is most effective when it speaks the local language. Discover how open-source Preeti-Unicode tools, Bikram Sambat date pickers, and localized invoice builders are transforming how government offices and businesses operate across Nepal.",
        contentNp: "स्थानीय भाषामा काम गर्दा डिजिटल रूपान्तरण सबैभन्दा प्रभावकारी हुन्छ। खुला स्रोत प्रिती-युनिकोड उपकरणहरू, बिक्रम संवत मिति चयनकर्ताहरू, र स्थानीयकृत इनभ्वाइस निर्माणकर्ताहरूले नेपालभर कसरी काम गरिरहेका छन् भन्ने बारे जान्नुहोस्।",
        authorEn: "Amit Joshi",
        authorNp: "अमित जोशी",
        dateEn: "2026-08-10",
        dateNp: "२०८३-०४-२६",
        timeEn: "02:15 PM",
        timeNp: "०२:१५ दिउँसो"
      },
      {
        id: "blog-3",
        slug: "high-performance-realtime-database-patterns",
        type: "article",
        titleEn: "Designing High-Performance Realtime Data Pipelines",
        titleNp: "उच्च-प्रदर्शन रियल-टाइम डाटा पाइपलाइन डिजाइन गर्दै",
        mainPhoto: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
        additionalPhotos: [],
        contentEn: "A deep dive into single-device sessions, granular role-based security rules, and real-time listeners for production dashboard management.",
        contentNp: "एकल-उपकरण सत्रहरू, भूमिका-आधारित सुरक्षा नियमहरू, र वास्तविक समयका श्रोताहरूमा गहिरो विश्लेषण।",
        authorEn: "Amit Joshi",
        authorNp: "अमित जोशी",
        dateEn: "2026-08-05",
        dateNp: "२०८३-०४-२१",
        timeEn: "09:00 AM",
        timeNp: "०९:०० बिहान"
      },
      {
        id: "blog-formatting-test",
        slug: "my-first-blog",
        type: "article",
        titleEn: "My First Blog — Structure & Formatting Verification",
        titleNp: "मेरो पहिलो ब्लग — संरचना र ढाँचा प्रमाणीकरण",
        mainPhoto: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80",
        additionalPhotos: [],
        contentEn: `MY FIRST BLOG

This is the first paragraph.

This is the second paragraph.


IMPORTANT NOTICE

Please read this carefully.

1. First point
2. Second point
3. Third point


Thank you,

Amit Joshi`,
        contentNp: `मेरो पहिलो ब्लग

यो पहिलो अनुच्छेद हो।

यो दोस्रो अनुच्छेद हो।


महत्त्वपूर्ण सूचना

कृपया यो ध्यानपूर्वक पढ्नुहोस्।

१. पहिलो बुँदा
२. दोस्रो बुँदा
३. तेस्रो बुँदा


धन्यवाद,

अमित जोशी`,
        authorEn: "Amit Joshi",
        authorNp: "अमित जोशी",
        dateEn: "2026-08-16",
        dateNp: "२०८३-०५-०१",
        timeEn: "04:30 PM",
        timeNp: "०४:३० दिउँसो"
      }
    ]
  },
  customLinks: [
    { id: "pl-1", type: "page", slug: "home", targetId: "home", titleEn: "Home Portal", titleNp: "होम पोर्टल" },
    { id: "pl-2", type: "page", slug: "social-media", targetId: "socials", titleEn: "Social Media Hub", titleNp: "सामाजिक सञ्जाल हब" },
    { id: "pl-3", type: "page", slug: "tools", targetId: "tools", titleEn: "Toolkit & Utilities", titleNp: "टुलकिट र उपयोगिताहरू" },
    { id: "pl-4", type: "page", slug: "services", targetId: "services", titleEn: "Professional Services", titleNp: "व्यावसायिक सेवाहरू" },
    { id: "pl-5", type: "page", slug: "blog", targetId: "blog", titleEn: "Blog Articles", titleNp: "ब्लग लेखहरू" },
    { id: "pl-6", type: "page", slug: "contact", targetId: "contact", titleEn: "Contact & Inquiries", titleNp: "सम्पर्क र सोधपुछ" },
    { id: "pl-7", type: "tool", slug: "preeti-to-unicode", targetId: "tool-2", titleEn: "Unicode to Preeti Converter", titleNp: "युनिकोडबाट प्रिती रूपान्तरण", redirectDelaySec: 30 },
    { id: "pl-8", type: "tool", slug: "calendar-converter", targetId: "tool-1", titleEn: "Nepali BS Calendar Converter", titleNp: "नेपाली बि.सं. क्यालेन्डर रूपान्तरण", redirectDelaySec: 30 },
    { id: "pl-9", type: "form", slug: "contact-form", targetId: "contact-form", titleEn: "Direct Contact Form", titleNp: "प्रत्यक्ष सम्पर्क फारम" },
    { id: "pl-10", type: "form", slug: "service-application", targetId: "serv-1", titleEn: "Enterprise Service Application", titleNp: "इन्टरप्राइज सेवा आवेदन" },
    { id: "pl-11", type: "blog", slug: "modern-full-stack-web-architecture-nepal-2026", targetId: "blog-1", titleEn: "Modern Enterprise Web Architecture", titleNp: "आधुनिक इन्टरप्राइज वेब आर्किटेक्चर" }
  ],
  serviceAdminUsers: [
    { 
      id: "sau-1", 
      username: "loginadmin", 
      pin: "1860", 
      name: "Primary Services Admin", 
      role: "super_admin", 
      status: "active", 
      permissions: {
        serviceRequests: true,
        suggestions: true,
        newsletter: true,
        serviceConfiguration: true,
        billing: true
      },
      createdAt: "2026-08-12T00:00:00.000Z" 
    }
  ],
  lastEdited: "August 12, 2026, 11:35 AM",
  education: [
    {
      id: "edu-1",
      institutionEn: "Tribhuvan University, IOE",
      institutionNp: "त्रिभुवन विश्वविद्यालय, आईओई",
      degreeEn: "Bachelor in Computer Engineering",
      degreeNp: "कम्प्युटर इन्जिनियरिङमा स्नातक",
      yearsEn: "2014 - 2018",
      yearsNp: "२०७१ - २०७५",
      descriptionEn: "Focused on database architecture, distributed systems, and real-time operating parameters.",
      descriptionNp: "डेटाबेस आर्किटेक्चर, डिस्ट्रिब्युटेड प्रणालीहरू, र रियल-टाइम सञ्चालन प्यारामिटरहरूमा केन्द्रित।",
      detailsEn: "Graduated with honors. Completed key research on multi-tenant localized CMS systems for regional government portals in Nepal, optimizing low-bandwidth page deliveries.",
      detailsNp: "सम्मानका साथ स्नातक। कम ब्यान्डविथमा वेबपेज लोडलाई अनुकूलन गर्दै, नेपालका क्षेत्रीय सरकारी पोर्टलहरूको लागि बहु-टेनेन्ट स्थानीयकृत CMS प्रणालीहरूमा मुख्य अनुसन्धान पूरा गर्नुभयो।",
      portalUrl: "https://ioe.edu.np"
    },
    {
      id: "edu-2",
      institutionEn: "Advanced Cloud & Architectural Studies",
      institutionNp: "उन्नत क्लाउड र आर्किटेक्चरल अध्ययन",
      degreeEn: "Senior Full-Stack Architect Certification",
      degreeNp: "वरिष्ठ फुल-स्ट्याक आर्किटेक्ट प्रमाणीकरण",
      yearsEn: "2019 - 2020",
      yearsNp: "२०७६ - २०७७",
      descriptionEn: "Specialization in Microservices, Kubernetes pipelines, and serverless logic structures.",
      descriptionNp: "माइक्रोसर्भिसेज, कुबरनेटिस पाइपलाइनहरू, र सर्भरलेस लजिक संरचनाहरूमा विशेषज्ञता।",
      detailsEn: "Rigorous certification covering advanced security frameworks, automated load balancing, and Realtime Database event pipelines under massive concurrency constraints.",
      detailsNp: "धेरै प्रयोगकर्ताहरूको सक्रिय उपस्थितिको अवस्थामा उन्नत सुरक्षा ढाँचाहरू, स्वचालित लोड सन्तुलन, र रियलटाइम डेटाबेस घटना पाइपलाइनहरू समेट्ने कडा प्रमाणीकरण।",
      portalUrl: "https://github.com"
    }
  ],
  tools: [
    {
      id: "tool-1",
      nameEn: "Nepali BS Calendar Converter",
      nameNp: "नेपाली बि.सं. क्यालेन्डर रूपान्तरण",
      categoryEn: "Date Utilities",
      categoryNp: "मिति उपयोगिताहरू",
      descriptionEn: "Instant precise conversion between Bikram Sambat dates and Gregorian dates with tithi data mappings.",
      descriptionNp: "तिथि डेटा म्यापिङको साथ विक्रम संवत र ग्रेगोरियन मितिहरू बीच तुरुन्त र सटीक रूपान्तरण।",
      icon: "Calendar",
      url: "https://amitjoshi.info.np/tools/calendar"
    },
    {
      id: "tool-2",
      nameEn: "Unicode to Preeti Converter",
      nameNp: "युनिकोडबाट प्रिती रूपान्तरण",
      categoryEn: "Font & Text",
      categoryNp: "फन्ट र पाठ",
      descriptionEn: "Encode standard Unicode text into popular legacy Preeti keyboard layouts instantly.",
      descriptionNp: "मानक युनिकोड पाठलाई लोकप्रिय विरासत प्रिती किबोर्ड लेआउटहरूमा तुरुन्तै इन्कोड गर्नुहोस्।",
      icon: "Type",
      url: "https://amitjoshi.info.np/tools/preeti"
    },
    {
      id: "tool-3",
      nameEn: "Nepali Rupee Formatter",
      nameNp: "नेपाली रुपैयाँ ढाँचा",
      categoryEn: "Finance",
      categoryNp: "वित्त",
      descriptionEn: "Format integers into Nepali currency standards with lakhs and crores separators automatically.",
      descriptionNp: "पूर्णांकहरूलाई स्वचालित रूपमा लाख र करोड विभाजकहरूसहित नेपाली मुद्रा मानकहरूमा ढाँचा गर्नुहोस्।",
      icon: "Coins",
      url: "https://amitjoshi.info.np/tools/rupee"
    },
    {
      id: "tool-4",
      nameEn: "Nepal Postcode Finder",
      nameNp: "नेपाल हुलाक कोड खोजकर्ता",
      categoryEn: "Location",
      categoryNp: "स्थान",
      descriptionEn: "Interactive search engine to pinpoint official zip codes for all provinces and municipalities.",
      descriptionNp: "सबै प्रदेश र नगरपालिकाहरूको लागि आधिकारिक जिप कोडहरू पिनपोइन्ट गर्न अन्तरक्रियात्मक खोज इन्जिन।",
      icon: "MapPin",
      url: "https://amitjoshi.info.np/tools/zip"
    },
    {
      id: "tool-5",
      nameEn: "Nepali Unicode Keyboard Layout",
      nameNp: "नेपाली युनिकोड किबोर्ड लेआउट",
      categoryEn: "Keyboard Input",
      categoryNp: "किबोर्ड इनपुट",
      descriptionEn: "On-screen phonetic keyboard overlay for seamless typing in Devanagari script without installing fonts.",
      descriptionNp: "फन्टहरू स्थापना नगरी देवनागरी लिपिमा निर्बाध टाइपिङको लागि अन-स्क्रिन फोनेटिक किबोर्ड ओभरले।",
      icon: "Keyboard",
      url: "https://amitjoshi.info.np/tools/keyboard"
    },
    {
      id: "tool-6",
      nameEn: "Tax & VAT Calculator Nepal",
      nameNp: "कर र भ्याट क्यालकुलेटर नेपाल",
      categoryEn: "Finance",
      categoryNp: "वित्त",
      descriptionEn: "Perform quick calculations for corporate income tax, VAT, and custom duty structures based on current budget parameters.",
      descriptionNp: "वर्तमान बजेट मापदण्डहरूको आधारमा कर्पोरेट आयकर, भ्याट, र भन्सार शुल्क संरचनाहरूको लागि द्रुत गणना गर्नुहोस्।",
      icon: "Calculator",
      url: "https://amitjoshi.info.np/tools/tax"
    },
    {
      id: "tool-7",
      nameEn: "Nepali Speech to Text Voice Kit",
      nameNp: "नेपाली स्पिच टु टेक्स्ट भ्वाइस किट",
      categoryEn: "Artificial Intelligence",
      categoryNp: "कृत्रिम बुद्धिमत्ता",
      descriptionEn: "Real-time voice dictation with high precision using lightweight local browser audio triggers.",
      descriptionNp: "हल्का स्थानीय ब्राउजर अडियो ट्रिगरहरू प्रयोग गरेर उच्च परिशुद्धताका साथ वास्तविक समय आवाज निर्देशित टाइपिङ।",
      icon: "Mic",
      url: "https://amitjoshi.info.np/tools/voice"
    },
    {
      id: "tool-8",
      nameEn: "Nepali Text to Speech Synthesizer",
      nameNp: "नेपाली टेक्स्ट टु स्पिच सिन्थेसाइजर",
      categoryEn: "Artificial Intelligence",
      categoryNp: "कृत्रिम बुद्धिमत्ता",
      descriptionEn: "Enter Devanagari text to read it aloud instantly with natural cadence audio engines.",
      descriptionNp: "प्राकृतिक प्रवाह अडियो इन्जिनहरूको साथ देवनागरी पाठ प्रविष्ट गरी तुरुन्तै सुन्नुहोस्।",
      icon: "Volume2",
      url: "https://amitjoshi.info.np/tools/tts"
    },
    {
      id: "tool-9",
      nameEn: "Image Size Optimizer Pro",
      nameNp: "छवि साइज अप्टिमाइजर प्रो",
      categoryEn: "Design Utilities",
      categoryNp: "डिजाइन उपयोगिताहरू",
      descriptionEn: "Compress and scale heavy dashboard images into modern WebP formats directly on the client canvas.",
      descriptionNp: "क्लाइन्ट क्यानभासमा सीधै भारी ड्यासबोर्ड छविहरूलाई आधुनिक WebP ढाँचाहरूमा कम्प्रेस र स्केल गर्नुहोस्।",
      icon: "Image",
      url: "https://amitjoshi.info.np/tools/image"
    },
    {
      id: "tool-10",
      nameEn: "Secure Password Generator",
      nameNp: "सुरक्षित पासवर्ड जनरेटर",
      categoryEn: "Security",
      categoryNp: "सुरक्षा",
      descriptionEn: "Generate strong cryptographic hashes and randomized key configurations with custom seed factors.",
      descriptionNp: "अनुकूलन सिड कारकहरूको साथ बलियो क्रिप्टोग्राफिक ह्यास र अनियमित कुञ्जी ढांचाहरू सिर्जना गर्नुहोस्।",
      icon: "Lock",
      url: "https://amitjoshi.info.np/tools/pass"
    },
    {
      id: "tool-11",
      nameEn: "QR Code Matrix Generator",
      nameNp: "क्युआर कोड म्याट्रिक्स जनरेटर",
      categoryEn: "Marketing",
      categoryNp: "मार्केटिङ",
      descriptionEn: "Encode URLs, text payloads, and localized contact details directly into custom-styled QR frames.",
      descriptionNp: "अनुकूलन शैली क्युआर फ्रेमहरूमा सिधै URL, पाठ पेलोड, र स्थानीयकृत सम्पर्क विवरणहरू इन्कोड गर्नुहोस्।",
      icon: "QrCode",
      url: "https://amitjoshi.info.np/tools/qr"
    },
    {
      id: "tool-12",
      nameEn: "JSON schema Beautifier",
      nameNp: "जेसन स्कीमा ब्युटिफायर",
      categoryEn: "Development Tools",
      categoryNp: "विकास उपकरणहरू",
      descriptionEn: "Validate, clean, and map deep nested JSON nodes instantly for lightweight frontend states.",
      descriptionNp: "हल्का फ्रन्टइन्ड राज्यहरूको लागि गहिरो नेस्टेड जेसन नोडहरू तुरुन्तै प्रमाणित, सफा र म्याप गर्नुहोस्।",
      icon: "Code",
      url: "https://amitjoshi.info.np/tools/json"
    },
    {
      id: "tool-13",
      nameEn: "Markdown Editor Canvas",
      nameNp: "मार्कडाउन सम्पादक क्यानभास",
      categoryEn: "Development Tools",
      categoryNp: "विकास उपकरणहरू",
      descriptionEn: "Real-time side-by-side split screen Markdown writing board with copyable HTML compile.",
      descriptionNp: "प्रतिलिपि गर्न मिल्ने HTML संकलनको साथ वास्तविक समयको मार्कडाउन लेखन बोर्ड।",
      icon: "FileText",
      url: "https://amitjoshi.info.np/tools/markdown"
    },
    {
      id: "tool-14",
      nameEn: "RegEx Patterns Tester",
      nameNp: "रेजेक्स प्याटर्न परीक्षक",
      categoryEn: "Development Tools",
      categoryNp: "विकास उपकरणहरू",
      descriptionEn: "Instantly test regular expression filters with dynamic visual matching overlays.",
      descriptionNp: "गतिशील भिजुअल म्याचिङ ओभरलेहरूको साथ तुरुन्तै नियमित अभिव्यक्ति फिल्टरहरू परीक्षण गर्नुहोस्।",
      icon: "Cpu",
      url: "https://amitjoshi.info.np/tools/regex"
    },
    {
      id: "tool-15",
      nameEn: "Base64 Stream Transcoder",
      nameNp: "बेस६४ स्ट्रिम ट्रान्सकोडर",
      categoryEn: "Security",
      categoryNp: "सुरक्षा",
      descriptionEn: "Convert raw image binaries directly into clean base64 data strings for direct serverless embedding.",
      descriptionNp: "सर्भरलेस एम्बेडिङका लागि कच्चा छवि बाइनरीहरूलाई सीधा बेस६४ डाटा स्ट्रिङहरूमा रूपान्तरण गर्नुहोस्।",
      icon: "Radio",
      url: "https://amitjoshi.info.np/tools/base64"
    },
    {
      id: "tool-16",
      nameEn: "Nepali Calendar Countdown",
      nameNp: "नेपाली क्यालेन्डर काउन्टडाउन",
      categoryEn: "Date Utilities",
      categoryNp: "मिति उपयोगिताहरू",
      descriptionEn: "Count down the days to upcoming major Nepalese festivals like Dashain, Tihar, and Lhosar.",
      descriptionNp: "दशैं, तिहार, र ल्होसार जस्ता प्रमुख नेपाली चाडपर्वहरूको काउन्टडाउन गर्नुहोस्।",
      icon: "Timer",
      url: "https://amitjoshi.info.np/tools/countdown"
    }
  ],
  interests: [
    {
      id: "int-1",
      titleEn: "DevOps & Cloud Architecture",
      titleNp: "डेभअप्स र क्लाउड आर्किटेक्चर",
      descriptionEn: "Configuring ultra-responsive multi-region database sync pipelines and Dockerizing CMS servers.",
      descriptionNp: "अति-उत्तरदायी बहु-क्षेत्र डेटाबेस सिङ्क पाइपलाइनहरू कन्फिगर गर्ने र CMS सर्भरहरू डकराइज गर्ने।",
      icon: "Server"
    },
    {
      id: "int-2",
      titleEn: "UX Aesthetics & Typography",
      titleNp: "युएक्स सौन्दर्यशास्त्र र टाइपोग्राफी",
      descriptionEn: "Obsessing over proper negative spacing, typography pairings, and glowing glassmorphism gradients.",
      descriptionNp: "उपयुक्त नेगेटिभ स्पेसिङ, टाइपोग्राफी जोडीहरू, र नियोन चमक ग्रेडियन्टहरूमा ध्यान केन्द्रित गर्ने।",
      icon: "PenTool"
    },
    {
      id: "int-3",
      titleEn: "Mentorship & Tech Literacy",
      titleNp: "मेन्टरशिप र प्राविधिक साक्षरता",
      descriptionEn: "Running free bootcamps and building localization toolkits to reduce entry barriers for young engineers.",
      descriptionNp: "युवा इन्जिनियरहरूको प्रवेश बाधा कम गर्न निःशुल्क बुटक्याम्पहरू र स्थानीयकरण टुलकिटहरू निर्माण गर्ने।",
      icon: "BookOpen"
    }
  ],
  services: [
    {
      id: "serv-1",
      titleEn: "Custom Enterprise Portal Design",
      titleNp: "अनुकूलन इन्टरप्राइज पोर्टल डिजाइन",
      descriptionEn: "Production-ready web systems featuring modular layout components, light-dark reactive nodes, and advanced server scaling.",
      descriptionNp: "मोड्युलर लेआउट कम्पोनेन्टहरू, लाइट-डार्क रियाक्टिभ नोडहरू, र उन्नत सर्भर स्केलिङ सहितका उत्पादनका लागि तयार वेब प्रणालीहरू।",
      priceEn: "NPR 150,000",
      priceNp: "रु १,५०,०००",
      whatsappMessageEn: "Hello Amit, I am interested in your Custom Enterprise Portal Design service. Please let me know your availability for a technical consultation.",
      whatsappMessageNp: "नमस्कार अमित, म तपाईंको 'कस्टम इन्टरप्राइज पोर्टल डिजाइन' सेवामा इच्छुक छु। कृपया प्राविधिक परामर्शको लागि उपलब्ध समय जानकारी गराउनुहोला।",
      officialLink: "https://amitjoshi.info.np/services/enterprise",
      icon: "Layout",
      questions: [
        {
          id: "q-1",
          order: 1,
          labelEn: "Organization / Company Name",
          labelNp: "संस्था वा कम्पनीको नाम",
          fieldType: "short_text",
          required: true,
          placeholder: "e.g. Acme Innovations Nepal",
          helpText: "Official legal entity name"
        },
        {
          id: "q-2",
          order: 2,
          labelEn: "Expected Delivery Timeline",
          labelNp: "अपेक्षित कार्य समापन समय",
          fieldType: "dropdown",
          required: true,
          options: ["Urgent (Within 2 Weeks)", "Standard (1 Month)", "Comprehensive (2 - 3 Months)", "Flexible"],
          defaultValue: "Standard (1 Month)"
        },
        {
          id: "q-3",
          order: 3,
          labelEn: "Project Scope & Technical Requirements",
          labelNp: "परियोजना दायरा र प्राविधिक आवश्यकताहरू",
          fieldType: "long_text",
          required: true,
          placeholder: "Describe the features, expected traffic, and specific integrations needed..."
        },
        {
          id: "q-4",
          order: 4,
          labelEn: "Upload Brand Assets & Logos (Images)",
          labelNp: "ब्रान्ड सम्पत्ति र लोगोहरू अपलोड गर्नुहोस्",
          fieldType: "image_upload",
          required: false,
          maxImages: 4,
          allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
          helpText: "Upload high-res PNG, JPG or WebP images (max 4 images)"
        }
      ]
    },
    {
      id: "serv-2",
      titleEn: "Secure Firebase/CMS Architecture",
      titleNp: "सुरक्षित फायरबेस/CMS आर्किटेक्चर",
      descriptionEn: "Zero-latency database design with strict Firebase rule enforcement, Single Session client verification, and custom Rich-Text state tools.",
      descriptionNp: "कडा फायरबेस नियमहरू, सिंगल सेसन क्लाइन्ट प्रमाणिकरण, र अनुकूलन रिच-टेक्स्ट अवस्था उपकरणहरूको साथ शून्य-विलम्बता डाटाबेस डिजाइन।",
      priceEn: "NPR 95,000",
      priceNp: "रु ९५,०००",
      whatsappMessageEn: "Hello Amit, I want to inquire about setting up a Secure Firebase/CMS Architecture for my business application. Let's discuss details.",
      whatsappMessageNp: "नमस्कार अमित, म मेरो व्यावसायिक अनुप्रयोगको लागि 'सुरक्षित फायरबेस/CMS आर्किटेक्चर' सेटअपको बारेमा सोधपुछ गर्न चाहन्छु। थप छलफल गरौं।",
      officialLink: "https://amitjoshi.info.np/services/cms",
      icon: "ShieldAlert",
      questions: [
        {
          id: "q-201",
          order: 1,
          labelEn: "Current Database Platform",
          labelNp: "हालको डाटाबेस प्लेटफर्म",
          fieldType: "dropdown",
          required: true,
          options: ["Firebase Realtime Database", "Firestore", "PostgreSQL / MySQL", "None (New Project)"],
          defaultValue: "Firebase Realtime Database"
        },
        {
          id: "q-202",
          order: 2,
          labelEn: "Target Security Level & Concurrency",
          labelNp: "लक्षित सुरक्षा स्तर र प्रयोगकर्ता संख्या",
          fieldType: "short_text",
          required: true,
          placeholder: "e.g. 500 simultaneous admins, strict RBAC"
        },
        {
          id: "q-203",
          order: 3,
          labelEn: "Upload Architecture Diagram / Wireframe (Optional)",
          labelNp: "आर्किटेक्चर रेखाचित्र अपलोड गर्नुहोस्",
          fieldType: "file_upload",
          required: false,
          allowedFileTypes: ["pdf", "png", "jpg"]
        }
      ]
    },
    {
      id: "serv-3",
      titleEn: "Interactive UI/UX & Web Performance Audits",
      titleNp: "अन्तरक्रियात्मक UI/UX र वेब प्रदर्शन अडिट",
      descriptionEn: "Deep diagnostic audits targeting core web vitals, canvas animations, and localized SEO schemas.",
      descriptionNp: "कोर वेब भिटल्स, क्यानभास एनिमेसनहरू, र स्थानीयकृत SEO स्कीमाहरूलाई लक्षित गर्दै गहिरो निदान अडिटहरू।",
      priceEn: "NPR 45,000",
      priceNp: "रु ४५,०००",
      whatsappMessageEn: "Hello Amit, I need a performance and UX audit for our existing website portal. Please guide us on the next steps.",
      whatsappMessageNp: "नमस्कार अमित, मलाई हाम्रो अवस्थित वेबसाइट पोर्टलको लागि कार्यसम्पादन र UX अडिट आवश्यक छ। कृपया अर्को चरणहरूको लागि मार्गदर्शन गर्नुहोस्।",
      officialLink: "https://amitjoshi.info.np/services/audit",
      icon: "Gauge",
      questions: [
        {
          id: "q-301",
          order: 1,
          labelEn: "Website URL to Audit",
          labelNp: "अडिट गर्नुपर्ने वेबसाइट URL",
          fieldType: "short_text",
          required: true,
          placeholder: "https://yourwebsite.com"
        },
        {
          id: "q-302",
          order: 2,
          labelEn: "Key Performance Bottlenecks Encountered",
          labelNp: "अनुभव गरिएका मुख्य कार्यसम्पादन समस्याहरू",
          fieldType: "long_text",
          required: false,
          placeholder: "Slow initial page loads, high LCP scores, mobile rendering glitches..."
        }
      ]
    }
  ],
  popup: {
    active: true,
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    textEn: "Welcome to Amit Joshi's official portal! The 2026 High-Performance Cloud System is now live with dual-lingual capabilities, instant WhatsApp automated queries, and localized BS-Gregorian calendar utilities.",
    textNp: "अमित जोशीको आधिकारिक पोर्टलमा स्वागत छ! २०२६ को उच्च-प्रदर्शन क्लाउड प्रणाली अब द्वि-भाषी क्षमता, तत्काल व्हाट्सएप स्वचालित सोधपुछ, र स्थानीयकृत बि.सं.-ग्रेगोरियन क्यालेन्डर उपयोगिताहरूसँग लाइभ भएको छ।",
    buttonEn: "Schedule Consultation Now",
    buttonNp: "अहिले नै परामर्श तालिका बनाउनुहोस्",
    buttonUrl: "https://wa.me/9779800000000?text=Hello%20Amit%2C%20I%20saw%20your%20announcement%20popup%20and%20want%20to%20schedule%20a%20consultation%21"
  },
  maps: {
    permanentUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d509.7736340911179!2d80.57885568435034!3d29.884878628769556!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39a6b300325ec949%3A0x2d96d9e1f8d3f6a2!2sBarbaj%20Rural%20Road!5e1!3m2!1sen!2snp!4v1784441306570!5m2!1sen!2snp",
    temporaryUrl: "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d271.68799683989323!2d85.34146221988118!3d27.692376061527767!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2snp!4v1784441110308!5m2!1sen!2snp",
    permanentAddressEn: "Permanent Address: Duhu 3, Darchula",
    permanentAddressNp: "स्थायी ठेगाना: दुहु ३, दार्चुला",
    temporaryAddressEn: "Current Address: New Baneshwor, Kathmandu",
    temporaryAddressNp: "हालको ठेगाना: नयाँ बानेश्वर, काठमाडौं"
  },
  privacyPolicyEn: "This Privacy Policy describes how we collect, use, and handle your information. Your trust is important to us, and we are committed to protecting your personal data.",
  privacyPolicyNp: "यो गोपनीयता नीतिले हामी कसरी तपाईंको जानकारी सङ्कलन, प्रयोग र व्यवस्थापन गर्छौं भन्ने कुरा वर्णन गर्दछ। तपाईंको विश्वास हाम्रो लागि महत्त्वपूर्ण छ, र हामी तपाईंको व्यक्तिगत डेटा सुरक्षित गर्न प्रतिबद्ध छौं।",
  termsConditionsEn: "By accessing this website, you agree to be bound by these Terms and Conditions of Use, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.",
  termsConditionsNp: "यस वेबसाइटमा पहुँच गरेर, तपाईं यी नियम र सर्तहरू, सबै लागू हुने कानून र नियमहरूद्वारा बाँधिन सहमत हुनुहुन्छ, र स्थानीय कानूनहरूको पालनाको लागि तपाईं जिम्मेवार हुनुहुन्छ भनी सहमत हुनुहुन्छ।",
  downloads: [
    {
      id: "dl-1",
      titleEn: "Official Professional CV (PDF)",
      titleNp: "आधिकारिक व्यावसायिक सीभी (PDF)",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileType: "pdf"
    },
    {
      id: "dl-2",
      titleEn: "Service Brochure (JPG)",
      titleNp: "सेवा ब्रोसर (JPG)",
      fileUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80",
      fileType: "jpg"
    }
  ],
  usefulLinks: [
    {
      id: "ul-1",
      titleEn: "Government of Nepal Official Portal",
      titleNp: "नेपाल सरकारको आधिकारिक पोर्टल",
      url: "https://nepal.gov.np"
    },
    {
      id: "ul-2",
      titleEn: "Tribhuvan University IOE",
      titleNp: "त्रिभुवन विश्वविद्यालय आईओई",
      url: "https://ioe.edu.np"
    }
  ]
};
