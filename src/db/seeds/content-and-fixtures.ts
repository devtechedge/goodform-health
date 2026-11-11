import type { LearnReferenceLink } from "@/db/schema/content";
import type { UserRole } from "@/db/schema/users";

export interface SeedLearnArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  readingMinutes: number;
  summary: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  references: LearnReferenceLink[];
  sortOrder: number;
}

export const SEED_LEARN_ARTICLES: readonly SeedLearnArticle[] = [
  {
    id: "learn_01_elemental_labels",
    slug: "reading-indian-supplement-labels-elemental-vs-compound",
    title: "How to Read an Indian Supplement Label: Elemental vs Compound Weight",
    category: "Label Literacy",
    readingMinutes: 5,
    summary:
      "Why 1,715 mg of magnesium bisglycinate yields 240 mg of actual elemental magnesium, and how to spot oxide buffering on retail jars.",
    sections: [
      {
        heading: "Molecular stoichiometry sets a physical ceiling",
        paragraphs: [
          "Minerals in supplements are bound to carrier molecules such as glycine, citric acid, or picolinic acid for stability and gut tolerance. Pure, unbuffered magnesium bisglycinate contains roughly 14.1% magnesium by weight; the remaining ~85.9% is glycine.",
          "Whenever a single 500 mg capsule claims to supply 250 mg or 400 mg of elemental magnesium from 'magnesium glycinate', stoichiometry proves the powder has been blended or buffered with dense inorganic magnesium oxide (~60% magnesium by weight). In Indian buyer communities, label chemistry is one of the sharpest trust dividers.",
        ],
      },
      {
        heading: "How GOODFORM prints mineral panels",
        paragraphs: [
          "Every GOODFORM mineral SKU separates the total chelate salt weight from the true elemental nutrient yield on the front and back panels, alongside the adult ICMR-NIN Recommended Dietary Allowance percentage.",
          "The Routine Builder sums elemental milligrams across your selected products so overlapping multis, electrolytes, and single minerals never hide behind compound names.",
        ],
      },
    ],
    references: [
      {
        title: "Supplements on Amazon India: Shelf Report & Buyer Chemistry Threads",
        publisher: "impuls8 (November 2026)",
        url: "https://www.impuls8.com/blog/indian-supplements-amazon-shelf-for-investors",
      },
      {
        title: "Magnesium Fact Sheet for Health Professionals",
        publisher: "NIH Office of Dietary Supplements",
        url: "https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/",
      },
    ],
    sortOrder: 1,
  },
  {
    id: "learn_02_indoor_workdays_d3_b12",
    slug: "urban-indian-workdays-vitamin-d-and-b12-context",
    title: "Indoor Workdays in Urban India: Vitamin D3 & Vitamin B12 Context",
    category: "Micronutrients",
    readingMinutes: 6,
    summary:
      "What India's 2026 Workforce Health Index survey and NIH nutrition monographs show about indoor schedules, vegetarian diets, and daily physiological dosing.",
    sections: [
      {
        heading: "Why Vitamin D and B12 lead Indian workplace surveys",
        paragraphs: [
          "In the Loop Health India Workforce Health Index 2026 (7,592 valid supplement responses), 34.1% of surveyed urban professionals reported taking at least one supplement, led by Vitamin D (20.4%) and Vitamin B12 (15.0%).",
          "In a separate, unlinked laboratory dataset reported by Loop, 60.1% of 6,943 Vitamin D reports sat below 20 ng/mL and 69.6% of 6,192 Vitamin B12 reports sat below 300 pg/mL. Because survey answers and lab panels come from separate samples, taking a daily supplement is never a substitute for clinical blood testing.",
        ],
      },
      {
        heading: "Daily physiological intake vs therapeutic bolus dosing",
        paragraphs: [
          "Vitamin D is fat-soluble and best absorbed alongside a meal containing dietary fat. Under Indian FSSAI Health Supplement rules, everyday non-prescription supplements are bounded by ICMR-NIN daily reference allowances (600 IU / 15 mcg for adults), whereas high-dose 60,000 IU sachets belong strictly to physician-supervised medical correction.",
          "Vitamin B12 occurs naturally in animal-origin foods; in supplements, free-form methylcobalamin (2.2 mcg adult RDA) does not require gastric acid cleavage from food protein.",
        ],
      },
    ],
    references: [
      {
        title: "India Workforce Health Index 2026: Supplementation",
        publisher: "Loop Health",
        url: "https://whi.loophealth.com/lifestyle/supplementation/",
      },
      {
        title: "Vitamin D & Vitamin B12 Fact Sheets for Health Professionals",
        publisher: "NIH Office of Dietary Supplements",
        url: "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/",
      },
    ],
    sortOrder: 2,
  },
  {
    id: "learn_03_epa_dha_marine_vs_algal",
    slug: "omega-3-epa-dha-triglyceride-and-algal-forms",
    title: "EPA, DHA & Algal Oil: Reading Beyond '1000 mg Fish Oil'",
    category: "Essential Lipids",
    readingMinutes: 4,
    summary:
      "Why combined EPA + DHA milligrams matter more than total oil weight, and how fermented Schizochytrium microalgae serves vegetarian diets.",
    sections: [
      {
        heading: "Crude oil weight vs active EPA and DHA",
        paragraphs: [
          "Standard 1,000 mg marine oil softgels typically contain 180 mg EPA and 120 mg DHA (30% omega-3 concentration), leaving 700 mg of other marine lipids. Re-esterified triglyceride concentrates raise active EPA + DHA density so fewer softgels deliver meaningful intake.",
        ],
      },
      {
        heading: "Direct algal DHA/EPA vs plant ALA",
        paragraphs: [
          "Flaxseed and chia supply alpha-linolenic acid (ALA), whose endogenous conversion to DHA in humans is very limited. Fermented Schizochytrium sp. microalgae supplies preformed DHA and EPA directly in a 100% plant-origin matrix.",
        ],
      },
    ],
    references: [
      {
        title: "2026 Supplement Popularity Survey Press Release",
        publisher: "ConsumerLab (26 Feb 2026)",
        url: "https://www.consumerlab.com/news/2026-supplement-popularity-press-release/02-26-2026/",
      },
    ],
    sortOrder: 3,
  },
  {
    id: "learn_04_creatine_daily_maintenance",
    slug: "creatine-monohydrate-daily-maintenance-guide",
    title: "Creatine Monohydrate: Plain 3 g Maintenance Without Loading Hype",
    category: "Active Living",
    readingMinutes: 4,
    summary:
      "Why plain micronised creatine monohydrate led 2026 supplement growth (+17.1 percentage points in ConsumerLab) and needs no sugary buffered variants.",
    sections: [
      {
        heading: "Steady daily saturation vs multi-scoop loading",
        paragraphs: [
          "The International Society of Sports Nutrition (ISSN) identifies creatine monohydrate as the best-evidenced nutritional ergogenic aid for high-intensity exercise capacity and training adaptations. A steady 3 g daily scoop saturates muscle stores over three to four weeks without the GI discomfort of 20 g loading phases.",
          "Adults with pre-existing kidney disease, pregnant or nursing women, and adolescents under 18 should avoid unsupervised creatine supplementation.",
        ],
      },
    ],
    references: [
      {
        title: "ISSN Position Stand: Safety and Efficacy of Creatine Supplementation",
        publisher: "Journal of the International Society of Sports Nutrition (Kreider et al., 2017)",
        url: "https://doi.org/10.1186/s12970-017-0173-z",
      },
      {
        title: "ConsumerLab Survey Shows Growth in Creatine and Magnesium",
        publisher: "ConsumerLab (26 Feb 2026)",
        url: "https://www.consumerlab.com/news/2026-supplement-popularity-press-release/02-26-2026/",
      },
    ],
    sortOrder: 4,
  },
  {
    id: "learn_05_fssai_publishing_gate",
    slug: "how-goodform-applies-fssai-nutraceutical-and-claims-rules",
    title: "Inside GOODFORM's India FSSAI Publishing Gate",
    category: "Governance & Quality",
    readingMinutes: 6,
    summary:
      "How India's 8 functional food categories and Advertising & Claims Regulations govern our catalogue - and why 8 seeded SKUs stay unpublished.",
    sections: [
      {
        heading: "Eight regulated categories under FSSAI Regulations, 2016",
        paragraphs: [
          "India regulates non-drug nutritional supplements under the Food Safety and Standards (Health Supplements, Nutraceuticals, Food for Special Dietary Use, Food for Special Medical Purpose, Functional Food, and Novel Food) Regulations, 2016 and subsequent amendments, alongside the Food Safety and Standards (Advertising and Claims) Regulations, 2018.",
          "Every formulation must map to a valid category, respect ICMR-NIN vitamin/mineral ceilings, carry mandatory 'NOT FOR MEDICINAL USE' and non-disease disclaimers, and avoid prohibited disease-treatment, detox, hormone, or anti-ageing claims.",
        ],
      },
      {
        heading: "Why Shilajit, NAC, botanicals, and non-specified salts stay held",
        paragraphs: [
          "GOODFORM seeds 40 formulations in its product database, but our server-side publishing gate blocks 8 SKUs from storefront purchase: Shilajit (AYUSH Drugs & Cosmetics Act vs Food Act legal review), NAC (CDSCO drug vs nutraceutical regulatory review), botanical extracts (Ashwagandha, Milk Thistle, Curcumin + Piperine, Greens & Superfoods pending Schedule IV & contaminant sign-off), and non-specified salts/amino isolates (Magnesium L-Threonate, L-Theanine).",
          "In addition, all seed records carry explicit 'Concept Pack - Demo Only' disclosures and unverified FBO/COA flags until an operating food business owner uploads verified FoSCoS licences and NABL-accredited batch certificates.",
        ],
      },
    ],
    references: [
      {
        title: "Standards for Health Supplements and Nutraceuticals",
        publisher: "Food Safety and Standards Authority of India (FSSAI)",
        url: "https://www.fssai.gov.in/standards/health-supplements",
      },
      {
        title: "Nutraceuticals Regulations Amendments",
        publisher: "FSSAI",
        url: "https://www.fssai.gov.in/food-law/regulations/amendments/nutraceuticals",
      },
      {
        title: "Advertising & Claims Regulations, 2018 and Amendments",
        publisher: "FSSAI",
        url: "https://www.fssai.gov.in/food-law/regulations/amendments/advertising-claims",
      },
    ],
    sortOrder: 5,
  },
] as const;

export const SEED_FAQS = [
  {
    id: "faq_01",
    category: "Store & Demo Status",
    question: "Is GOODFORM charging real cards or dispatching physical jars right now?",
    answer:
      "When Razorpay or Stripe live credentials are not configured, checkout runs in an explicit Non-Charging Demo Mode: orders are saved to PostgreSQL as DEMO_ORDER with payment status DEMO_NON_CHARGING (never marked Paid), and packshots are labelled Concept Pack - Demo Only.",
    sortOrder: 1,
  },
  {
    id: "faq_02",
    category: "Formulation & Labelling",
    question: "Why do your mineral jars show two different milligram numbers?",
    answer:
      "We print both the total mineral salt weight (for example 1,715 mg unbuffered magnesium bisglycinate) and the true elemental mineral weight (240 mg elemental magnesium) so you never confuse compound weight with absorbed nutrient intake.",
    sortOrder: 2,
  },
  {
    id: "faq_03",
    category: "FSSAI & Compliance",
    question: "Why are Shilajit, NAC, Ashwagandha, and Magnesium L-Threonate not available to buy?",
    answer:
      "All 40 formulations exist in our catalogue database, but our server-side FSSAI Publishing Gate blocks 8 SKUs pending India-specific legal, CDSCO/AYUSH boundary, Schedule IV botanical, or Non-Specified Food regulatory clearance.",
    sortOrder: 3,
  },
  {
    id: "faq_04",
    category: "FSSAI & Compliance",
    question: "Does referencing FSSAI regulations mean FSSAI endorses GOODFORM?",
    answer:
      "Never. FSSAI regulations are statutory Indian food-safety laws that food business operators must obey; FSSAI never endorses commercial brands or products. Demo seed records also keep FBO licence and COA fields marked unverified until owner-confirmed.",
    sortOrder: 4,
  },
  {
    id: "faq_05",
    category: "Routine Builder",
    question: "Does the Routine Builder diagnose deficiencies or replace blood tests?",
    answer:
      "No. The Routine Builder is strictly non-diagnostic: it filters everyday formats by dietary preference and sums overlapping nutrients (such as Vitamin D3, Zinc, Magnesium, and Biotin) across selected jars so you can spot cumulative overlap and discuss blood work with your doctor.",
    sortOrder: 5,
  },
  {
    id: "faq_06",
    category: "Shipping & Taxes",
    question: "How are INR prices, GST, and pan-India shipping calculated?",
    answer:
      "All prices are stored and computed in integer INR paise. Orders of INR 999 or above receive free standard shipping across serviceable Indian 6-digit PIN codes; orders below INR 999 add INR 79 shipping. Checkout breaks out intra-state CGST + SGST (Maharashtra) vs inter-state IGST.",
    sortOrder: 6,
  },
  {
    id: "faq_07",
    category: "Dietary Suitability",
    question: "How do I filter strictly vegan or vegetarian formulations?",
    answer:
      "Use the Diet filter in /shop or the Routine Builder. Every product carries the statutory Indian vegetarian (green circle) or non-vegetarian (brown triangle) mark plus explicit allergen flags for marine fish or dairy whey.",
    sortOrder: 7,
  },
  {
    id: "faq_08",
    category: "Orders & Returns",
    question: "Can I request a return or reorder a previous stack from my account?",
    answer:
      "Yes. Signed-in customers can view every order under /account, submit a self-serve return request for damaged or incorrect deliveries, and trigger one-click Reorder (which re-checks current stock and FSSAI publish eligibility).",
    sortOrder: 8,
  },
] as const;

export const SEED_COUPONS = [
  {
    id: "cpn_welcome10",
    code: "WELCOME10",
    description: "10% off orders from INR 999 (up to INR 500 max discount)",
    discountType: "PERCENT" as const,
    discountValue: 10,
    minSubtotalPaise: 99900,
    maxDiscountPaise: 50000,
    usageLimit: 1000,
  },
  {
    id: "cpn_routine250",
    code: "ROUTINE250",
    description: "Flat INR 250 off multi-jar routines from INR 2,499",
    discountType: "FIXED_PAISE" as const,
    discountValue: 25000,
    minSubtotalPaise: 249900,
    maxDiscountPaise: 25000,
    usageLimit: 500,
  },
] as const;

export interface DemoAccountSpec {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string;
}

export const DEMO_PASSWORD_PLAINTEXT = "Goodform-Demo-2026!";

export const DEMO_ACCOUNTS: readonly DemoAccountSpec[] = [
  {
    id: "usr_demo_customer",
    email: "aarav@goodform.demo",
    fullName: "Aarav Kulkarni (Demo Customer)",
    role: "CUSTOMER",
    phone: "+91 98201 44110",
  },
  {
    id: "usr_demo_merchandiser",
    email: "merchandiser@goodform.demo",
    fullName: "Meera Nair (Demo Merchandiser)",
    role: "MERCHANDISER",
    phone: "+91 98201 44111",
  },
  {
    id: "usr_demo_compliance",
    email: "compliance@goodform.demo",
    fullName: "Dr. Rohan Deshmukh (Demo Compliance)",
    role: "COMPLIANCE_OFFICER",
    phone: "+91 98201 44112",
  },
  {
    id: "usr_demo_admin",
    email: "admin@goodform.demo",
    fullName: "Kavya Joshi (Demo Store Admin)",
    role: "ADMIN",
    phone: "+91 98201 44113",
  },
] as const;
