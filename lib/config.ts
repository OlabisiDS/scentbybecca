// ===== EDIT HERE: business contact numbers, links, story and media =====
export const WHATSAPP_NUMBER = "2348109245547"; // digits only, with country code
export const INSTAGRAM_URL = "https://www.instagram.com/scentbybecca.ng?xtok=MW1oaXRhOGVwMndveg==";
export const TIKTOK_URL = "https://www.tiktok.com/@_scentbybecca?_r=1&_t=ZS-9ArWOxZ2Pag";
export const LOGO = "/logo.webp"; // replace public/logo.webp to change the logo
export const HERO_VIDEO = "/hero.mp4"; // replace public/hero.mp4 to change the hero video
export const HERO_POSTER = "/hero-poster.jpg"; // still image shown before/instead of the video
export const STORY_TITLE = "A Scent That Lingers.";
export const STORY = [
  "Founded in Ilorin, Kwara State, Nigeria, in 2023, ScentbyBecca was born from my love for fragrances and the confidence that comes with smelling good.",
  "I'm Rebecca, the founder behind the brand. I've always believed there's something special about a beautiful fragrance, leaving memories and a lasting impression long after you've left the room. I wanted more people to experience that feeling.",
  "That love inspired me to create ScentbyBecca, with a simple mission: to help everyone discover fragrances they love without breaking the bank. Today, ScentbyBecca offers luxurious and affordable fragrances to suit different tastes, styles, and budgets, making it easier to find a scent that feels like you.",
  "With roots in Ilorin and an expanding presence in Ibadan, we bring quality fragrances closer to you, with nationwide delivery across Nigeria and beyond.",
  "Because smelling good is more than a fragrance; it's a confidence you carry and a presence people remember.",
];
export const STORY_CLOSING = "ScentbyBecca - Find your scent. Own your presence.";

export type Sub = { slug: string; name: string };
export type Category = { slug: string; name: string; subs?: Sub[] };
export const CATEGORIES: Category[] = [
  { slug: "designer-niche", name: "Designer & Niche Fragrances", subs: [
    { slug: "floral-sweet", name: "For her: Floral & Sweet" },
    { slug: "warm-oud", name: "For him: Warm & Oud" },
    { slug: "fresh-radiant", name: "Unisex: Fresh & Radiant" } ] },
  { slug: "affordable-miniature", name: "Affordable & Miniature Perfumes" },
  { slug: "perfume-combos", name: "Perfume Combos" },
  { slug: "gift-sets", name: "Gift Sets" },
  { slug: "perfume-oils", name: "Perfume Oils" },
  { slug: "deodorant-sprays", name: "Deodorant Sprays", subs: [
    { slug: "body-sprays-mists", name: "Body Sprays & Body Mists" },
    { slug: "antiperspirant-roll-ons", name: "Antiperspirant Sprays & Roll-ons" } ] },
  { slug: "diffusers-humidifiers", name: "Diffusers & Humidifiers" },
  { slug: "other-items", name: "Other Items" },
];
