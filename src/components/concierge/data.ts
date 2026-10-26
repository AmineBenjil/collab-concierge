/*
  The demo dashboard's creators: everyone who used the business's Concierge link,
  with Benable's review of each. Copy is Tony's, word for word, from his prototype.
  Photos are Benable's own creator shots (see public/img/dash).
*/

export type Fit = "strong" | "maybe" | "no";
export type Status = "new" | "forward" | "declined";
export type Tone = "good" | "ok" | "bad" | "unknown";
export type Social = "instagram" | "tiktok";

export type Check = { label: string; note: string; grade: string; tone: Tone };

export type Creator = {
  id: string;
  name: string;
  first: string;
  handle: string;
  followers: string;
  avatar: string;
  socials: Social[];
  fit: Fit;
  status: Status;
  requested: string; // yyyy-mm-dd
  summary: string; // the one line in the list
  verdict: string; // the Concierge's take, top of the request
  bio: string;
  engagement: string;
  audience: string;
  age: string;
  gender: string;
  verticals: string[];
  posts: string[];
  proposal: { create: string; want: string; payment: string; based: string; extra?: string };
  review: Check[];
  email: string;
  phone?: string;
};

/* fit reads like a health meter: three segments, filled by how good the fit is */
/* tag: the dashboard row's fit label (strong is from the Figma row; maybe and no follow the same tint, stroke, deep-text recipe) */
export const FIT: Record<Fit, { label: string; chip: string; tag: string; text: string; dot: string; bar: string; filled: number }> = {
  strong: { label: "Strong fit", chip: "bg-mint/12 text-[#178a60]", tag: "border-[#c7e1c6] bg-[#e3f9e2] text-[#175412]", text: "text-[#178a60]", dot: "bg-mint", bar: "bg-mint", filled: 3 },
  maybe: { label: "Maybe", chip: "bg-[#fdf3e1] text-[#a8630a]", tag: "border-[#ecd6a9] bg-[#fdf3e1] text-[#7a4806]", text: "text-[#a8630a]", dot: "bg-[#f0a531]", bar: "bg-[#f0a531]", filled: 2 },
  no: { label: "Not a fit", chip: "bg-rose/10 text-[#c23a56]", tag: "border-[#f2c6cf] bg-[#fdeaee] text-[#8e1f37]", text: "text-[#c23a56]", dot: "bg-rose", bar: "bg-rose", filled: 1 },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* parsed by hand: new Date("2026-10-19") is UTC midnight, which reads as Oct 18 in Los Angeles */
function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, month: MONTHS[m - 1], d };
}
export const shortDate = (iso: string) => {
  const { month, d } = parts(iso);
  return `${month.slice(0, 3)} ${d}`;
};
export const longDate = (iso: string) => {
  const { y, month, d } = parts(iso);
  return `${month} ${d}, ${y}`;
};

const clean = (note: string): Check => ({ label: "Red flags", note, grade: "None", tone: "good" });
const NO_FLAGS = clean("No red flags in the 24 posts we reviewed.");

export const CREATORS: Creator[] = [
  {
    id: "mia",
    name: "Mia Chen",
    first: "Mia",
    handle: "mia.eats.la",
    followers: "41.2K",
    avatar: "/img/dash/mia.jpg",
    socials: ["instagram", "tiktok"],
    fit: "strong",
    status: "new",
    requested: "2026-10-19",
    summary: "Gifted visit for a Reel and two Stories. 68% LA audience, strong content.",
    verdict: "Mia looks like a strong fit, with a real local audience and clean, consistent content.",
    bio: "LA food and lifestyle creator. Coffee first, then everything else. I share the small local spots that make this city feel like home.",
    engagement: "4.8%",
    audience: "68% Los Angeles",
    age: "25 to 34",
    gender: "82% women",
    verticals: ["Los Angeles", "food", "day in my life", "local spots"],
    posts: ["/img/ig/cafe.jpg", "/img/creators/lp-07.png", "/img/ig/nata.jpg", "/img/ig/roasters.jpg", "/img/creators/lp-04.png"],
    proposal: {
      create: "Come in for a visit, film a Reel and a couple of Stories about the space. I love the light in there.",
      want: "A complimentary visit",
      payment: "None expected",
      based: "Highland Park, 10 min away",
      extra: "Weekday mornings work best. Happy to tag you in Stories too.",
    },
    review: [
      { label: "Fake followers", note: "Steady growth, no spikes, comments from real accounts.", grade: "None", tone: "good" },
      { label: "Past content quality", note: "Close-ups, clear captions, posts every few days.", grade: "A-", tone: "good" },
      { label: "Audience", note: "**4.8% true engagement** with real comments. Mostly women 25 to 34.", grade: "A", tone: "good" },
      { label: "Location", note: "**68% Los Angeles**, from her Insights screenshot, Sept 2026.", grade: "A", tone: "good" },
      { label: "Fit", note: "Local food and lifestyle content. Her audience is your customer.", grade: "Strong", tone: "good" },
      NO_FLAGS,
      { label: "Successful collabs", note: "3 local brands tagged in 6 months, all posted as promised.", grade: "3", tone: "good" },
    ],
    email: "mia.chen@gmail.com",
    phone: "(323) 555-0142",
  },
  {
    id: "lena",
    name: "Lena Ortiz",
    first: "Lena",
    handle: "lena.lux",
    followers: "9.8K",
    avatar: "/img/dash/lena.jpg",
    socials: ["instagram"],
    fit: "strong",
    status: "new",
    requested: "2026-10-18",
    summary: "Complimentary visit for a Reel. Small but 81% local, and every post gets real comments.",
    verdict: "Lena is a strong fit: small, very local and unusually engaged.",
    bio: "Nails, skin and slow mornings in Studio City. Small account, big group chat.",
    engagement: "7.1%",
    audience: "81% Los Angeles",
    age: "25 to 34",
    gender: "91% women",
    verticals: ["Studio City", "beauty", "nails", "self care"],
    posts: ["/img/creators/lp-11.png", "/img/creators/lp-17.png", "/img/creators/lp-05.png", "/img/creators/mirror.png", "/img/creators/lp-06.png"],
    proposal: {
      create: "Would love to do a Reel on your signature set and share it with my Studio City people.",
      want: "A complimentary visit",
      payment: "None expected",
      based: "Studio City, 5 min away",
      extra: "Any afternoon. I usually post within a week.",
    },
    review: [
      { label: "Fake followers", note: "Organic growth, no purchased spikes.", grade: "None", tone: "good" },
      { label: "Past content quality", note: "Warm, well lit, consistent look.", grade: "B+", tone: "ok" },
      { label: "Audience", note: "**7.1% engagement**, high for her size. 91% women.", grade: "A", tone: "good" },
      { label: "Location", note: "**81% Los Angeles**, Insights screenshot, Oct 2026.", grade: "A", tone: "good" },
      { label: "Fit", note: "Beauty and self care, right in your neighborhood.", grade: "Strong", tone: "good" },
      NO_FLAGS,
      { label: "Successful collabs", note: "2 local collabs, both delivered.", grade: "2", tone: "good" },
    ],
    email: "lena@lenalux.co",
  },
  {
    id: "ava",
    name: "Ava Reyes",
    first: "Ava",
    handle: "ava.after.dark",
    followers: "27.5K",
    avatar: "/img/dash/ava.jpg",
    socials: ["instagram", "tiktok"],
    fit: "strong",
    status: "new",
    requested: "2026-10-17",
    summary: "Reel plus Stories for an experience. Nightlife content that fits, 54% LA.",
    verdict: "Ava is a strong fit if you want an evening crowd that books experiences.",
    bio: "Going out in LA so you know where to go. Bars, late dinners and the occasional rooftop.",
    engagement: "3.9%",
    audience: "54% Los Angeles",
    age: "21 to 29",
    gender: "76% women",
    verticals: ["nightlife", "going out", "LA bars", "girls night"],
    posts: ["/img/creators/event-sign.png", "/img/creators/lp-12.png", "/img/creators/mirror.png", "/img/creators/lp-01.png", "/img/creators/lp-10.png"],
    proposal: {
      create: "A girls night Reel plus a few Stories. I'd bring two friends and we'd book the full experience.",
      want: "An experience",
      payment: "None expected",
      based: "Silver Lake, 15 min away",
      extra: "Thursday or Friday evenings. I'd bring two friends.",
    },
    review: [
      { label: "Fake followers", note: "Normal growth, comments match followers.", grade: "None", tone: "good" },
      { label: "Past content quality", note: "Polished, high energy, good captions.", grade: "A-", tone: "good" },
      { label: "Audience", note: "**3.9% engagement**, real comments. Women 21 to 29.", grade: "B+", tone: "ok" },
      { label: "Location", note: "**54% Los Angeles**, 12% Orange County.", grade: "B+", tone: "ok" },
      { label: "Fit", note: "Evening crowd that books experiences.", grade: "Strong", tone: "good" },
      NO_FLAGS,
      { label: "Successful collabs", note: "4 venues tagged, all with posted content.", grade: "4", tone: "good" },
    ],
    email: "ava@avareyes.com",
    phone: "(213) 555-0177",
  },
  {
    id: "jade",
    name: "Jade Okafor",
    first: "Jade",
    handle: "jade.okafor",
    followers: "18.4K",
    avatar: "/img/dash/jade.jpg",
    socials: ["instagram", "tiktok"],
    fit: "maybe",
    status: "new",
    requested: "2026-10-18",
    summary: "Wants $250 plus a visit. Great content, but her audience is mostly Atlanta.",
    verdict: "Jade's content is lovely, but her audience is in Atlanta and she's asking for a fee.",
    bio: "Beauty and skincare from Atlanta, with a suitcase always half packed.",
    engagement: "5.2%",
    audience: "62% Atlanta",
    age: "25 to 34",
    gender: "88% women",
    verticals: ["Atlanta", "beauty", "skincare", "travel"],
    posts: ["/img/creators/lp-05.png", "/img/creators/lp-11.png", "/img/creators/event-sign.png", "/img/creators/lp-17.png", "/img/creators/lp-15.png"],
    proposal: {
      create: "I'm in LA for two weeks in November and would love to feature you. Reel plus Stories, $250 plus the service.",
      want: "A complimentary service",
      payment: "Yes, $250 to $500",
      based: "Atlanta, visiting LA in Nov",
      extra: "In LA Nov 3 to 17. Flexible on dates while I'm there.",
    },
    review: [
      { label: "Fake followers", note: "Clean growth.", grade: "None", tone: "good" },
      { label: "Past content quality", note: "Beauty content with strong close-ups.", grade: "A", tone: "good" },
      { label: "Audience", note: "**5.2% engagement**, real comments. 88% women.", grade: "A-", tone: "good" },
      { label: "Location", note: "**62% Atlanta**, 9% Los Angeles.", grade: "C", tone: "bad" },
      { label: "Fit", note: "Right content, wrong city, and a $250 fee you don't pay.", grade: "Mixed", tone: "ok" },
      NO_FLAGS,
      { label: "Successful collabs", note: "5 brand collabs, all delivered.", grade: "5", tone: "good" },
    ],
    email: "hello@jadeokafor.com",
  },
  {
    id: "remy",
    name: "Remy Blake",
    first: "Remy",
    handle: "remy.films",
    followers: "12.1K",
    avatar: "/img/dash/remy.jpg",
    socials: ["instagram"],
    fit: "maybe",
    status: "new",
    requested: "2026-10-16",
    summary: "Reel for a visit. Good content, but no Insights shared, so audience location is unknown.",
    verdict: "Remy's content fits, but we can't see where his audience lives yet.",
    bio: "Cinematic Reels about coffee, film and Echo Park. Moody on purpose.",
    engagement: "3.4%",
    audience: "Unknown",
    age: "Unknown",
    gender: "Unknown",
    verticals: ["Echo Park", "film", "cinematic", "coffee"],
    posts: ["/img/ig/roasters.jpg", "/img/ig/foundcoffee.jpg", "/img/creators/mirror.png", "/img/ig/cafe.jpg", "/img/creators/lp-16.png"],
    proposal: {
      create: "One Reel, moody and cinematic, in exchange for a visit.",
      want: "A complimentary visit",
      payment: "None expected",
      based: "Echo Park, 12 min away",
      extra: "Flexible. I shoot on a mirrorless, not a phone.",
    },
    review: [
      { label: "Fake followers", note: "Nothing unusual.", grade: "None", tone: "good" },
      { label: "Past content quality", note: "Cinematic, well edited.", grade: "B+", tone: "ok" },
      { label: "Audience", note: "**3.4% engagement**. No Insights shared, so no age or gender.", grade: "?", tone: "unknown" },
      { label: "Location", note: "No Insights screenshot shared yet.", grade: "?", tone: "unknown" },
      { label: "Fit", note: "Right look, but we can't see the audience.", grade: "Likely", tone: "ok" },
      NO_FLAGS,
      { label: "Successful collabs", note: "No prior collabs visible.", grade: "?", tone: "unknown" },
    ],
    email: "remy@remyblake.film",
    phone: "(310) 555-0198",
  },
  {
    id: "nia",
    name: "Nia Carter",
    first: "Nia",
    handle: "niacarter",
    followers: "33.9K",
    avatar: "/img/dash/nia.jpg",
    socials: ["instagram", "tiktok"],
    fit: "no",
    status: "new",
    requested: "2026-10-17",
    summary: "Signs of bought followers: 1.1% engagement and two follower spikes this year.",
    verdict: "Nia's numbers don't hold up. The follower count looks inflated.",
    bio: "Fashion hauls, giveaways and whatever's trending this week.",
    engagement: "1.1%",
    audience: "31% United States",
    age: "18 to 24",
    gender: "70% women",
    verticals: ["fashion", "hauls", "giveaways"],
    posts: ["/img/creators/lp-12.png", "/img/creators/lp-01.png", "/img/creators/lp-07.png", "/img/creators/lp-05.png", "/img/creators/lp-18.png"],
    proposal: {
      create: "Reel and Stories for a free visit for me and a friend.",
      want: "A complimentary visit",
      payment: "None expected",
      based: "Los Angeles",
      extra: "Weekends only.",
    },
    review: [
      { label: "Fake followers", note: "Two spikes of 8K in a week, comments mostly generic.", grade: "Likely", tone: "bad" },
      { label: "Past content quality", note: "Fine, but giveaway heavy.", grade: "B-", tone: "ok" },
      { label: "Audience", note: "**1.1% engagement**, very low for 33.9K.", grade: "D", tone: "bad" },
      { label: "Location", note: "Only 31% in the US.", grade: "D", tone: "bad" },
      { label: "Fit", note: "Audience isn't local and the numbers look inflated.", grade: "Weak", tone: "bad" },
      NO_FLAGS,
      { label: "Successful collabs", note: "None visible.", grade: "?", tone: "unknown" },
    ],
    email: "niacarter@gmail.com",
  },
  {
    id: "theo",
    name: "Theo Park",
    first: "Theo",
    handle: "theo.eats",
    followers: "8.2K",
    avatar: "/img/dash/theo.jpg",
    socials: ["instagram", "tiktok"],
    fit: "no",
    status: "new",
    requested: "2026-10-15",
    summary: "Audience is 85% outside LA and he's asking for $400 cash.",
    verdict: "Theo's audience is mostly outside LA and he's asking for cash.",
    bio: "Honest food reviews from San Diego. Tacos, mostly.",
    engagement: "4.0%",
    audience: "85% outside LA",
    age: "25 to 34",
    gender: "55% men",
    verticals: ["San Diego", "food reviews", "tacos"],
    posts: ["/img/ig/nata.jpg", "/img/ig/cafe.jpg", "/img/creators/lp-17.png", "/img/ig/roasters.jpg", "/img/creators/fc-10.png"],
    proposal: {
      create: "Review video for $400 and a comped meal.",
      want: "A comped meal",
      payment: "Yes, $250 to $500",
      based: "San Diego",
      extra: "Next month. I review on camera, honest takes.",
    },
    review: [
      { label: "Fake followers", note: "Clean.", grade: "None", tone: "good" },
      { label: "Past content quality", note: "Solid food reviews.", grade: "B", tone: "ok" },
      { label: "Audience", note: "**4.0% engagement**, real comments.", grade: "B", tone: "ok" },
      { label: "Location", note: "85% outside Los Angeles.", grade: "D", tone: "bad" },
      { label: "Fit", note: "San Diego audience, $400 fee.", grade: "Weak", tone: "bad" },
      NO_FLAGS,
      { label: "Successful collabs", note: "2 restaurants.", grade: "2", tone: "good" },
    ],
    email: "theo@theoeats.co",
  },
  {
    id: "sasha",
    name: "Sasha Lin",
    first: "Sasha",
    handle: "sashalin.la",
    followers: "15.6K",
    avatar: "/img/dash/sasha.jpg",
    socials: ["instagram"],
    fit: "no",
    status: "new",
    requested: "2026-10-14",
    summary: "No posts in the last five months.",
    verdict: "Sasha's account has gone quiet, so there isn't much to assess.",
    bio: "Lifestyle, loosely.",
    engagement: "Unknown",
    audience: "Unknown",
    age: "Unknown",
    gender: "Unknown",
    verticals: ["lifestyle"],
    posts: ["/img/creators/lp-01.png", "/img/creators/mirror.png", "/img/creators/lp-12.png", "/img/creators/lp-07.png", "/img/creators/fc-11.png"],
    proposal: {
      create: "Hi! Would love to collab, let me know.",
      want: "Not stated",
      payment: "None expected",
      based: "Not stated",
    },
    review: [
      { label: "Fake followers", note: "Too little recent activity to tell.", grade: "?", tone: "unknown" },
      { label: "Past content quality", note: "Last post was five months ago.", grade: "Inactive", tone: "bad" },
      { label: "Audience", note: "No recent posts to measure engagement.", grade: "?", tone: "unknown" },
      { label: "Location", note: "No Insights shared.", grade: "?", tone: "unknown" },
      { label: "Fit", note: "Nothing recent to judge, no proposal to speak of.", grade: "Weak", tone: "bad" },
      clean("No red flags in the posts we could review."),
      { label: "Successful collabs", note: "None visible.", grade: "?", tone: "unknown" },
    ],
    email: "sasha.lin@gmail.com",
  },
  {
    id: "priya",
    name: "Priya Nair",
    first: "Priya",
    handle: "priya.eats",
    followers: "22.0K",
    avatar: "/img/dash/priya.jpg",
    socials: ["instagram", "tiktok"],
    fit: "strong",
    status: "forward",
    requested: "2026-10-16",
    summary: "Reel and Stories for a complimentary visit. 72% LA, strong engagement.",
    verdict: "Priya is a strong fit, with a local brunch audience and a clean track record.",
    bio: "Brunch, bakeries and new menus around Los Feliz. I eat here so you can too.",
    engagement: "5.6%",
    audience: "72% Los Angeles",
    age: "25 to 34",
    gender: "79% women",
    verticals: ["Los Feliz", "food", "brunch"],
    posts: ["/img/ig/nata.jpg", "/img/ig/cafe.jpg", "/img/ig/foundcoffee.jpg", "/img/creators/lp-07.png", "/img/creators/fc-12.png"],
    proposal: {
      create: "A Reel about your new menu plus Stories from the visit.",
      want: "A complimentary visit",
      payment: "None expected",
      based: "Los Feliz, 8 min away",
      extra: "Weekday lunch. Can turn the Reel around in 3 days.",
    },
    review: [
      { label: "Fake followers", note: "Clean.", grade: "None", tone: "good" },
      { label: "Past content quality", note: "Bright, appetizing, consistent.", grade: "A", tone: "good" },
      { label: "Audience", note: "**5.6% engagement**, real comments. 79% women.", grade: "A", tone: "good" },
      { label: "Location", note: "**72% Los Angeles**.", grade: "A", tone: "good" },
      { label: "Fit", note: "Brunch and cafe content, local audience.", grade: "Strong", tone: "good" },
      NO_FLAGS,
      { label: "Successful collabs", note: "6 local restaurants, all posted.", grade: "6", tone: "good" },
    ],
    email: "priya@priyaeats.com",
    phone: "(818) 555-0133",
  },
  {
    id: "marco",
    name: "Marco Diaz",
    first: "Marco",
    handle: "marcod",
    followers: "5.1K",
    avatar: "/img/dash/marco.jpg",
    socials: ["instagram"],
    fit: "no",
    status: "declined",
    requested: "2026-10-15",
    summary: "Wanted $150 and a visit for one Story. Mostly reposts.",
    verdict: "Marco wanted $150 for one Story and mostly reposts other people's content.",
    bio: "Pasadena. Reposting the best of the city.",
    engagement: "2.9%",
    audience: "60% Los Angeles",
    age: "30 to 39",
    gender: "52% men",
    verticals: ["Pasadena", "reposts"],
    posts: ["/img/creators/event-sign.png", "/img/ig/roasters.jpg", "/img/creators/lp-12.png", "/img/creators/mirror.png", "/img/creators/fc-13.png"],
    proposal: {
      create: "One Story for $150 plus a comped visit.",
      want: "A comped visit",
      payment: "Yes, $100 to $250",
      based: "Pasadena",
      extra: "Anytime.",
    },
    review: [
      { label: "Fake followers", note: "Clean.", grade: "None", tone: "good" },
      { label: "Past content quality", note: "Mostly reposts.", grade: "C", tone: "bad" },
      { label: "Audience", note: "**2.9% engagement**, few comments.", grade: "C", tone: "bad" },
      { label: "Location", note: "**60% Los Angeles**.", grade: "B", tone: "ok" },
      { label: "Fit", note: "$150 for one Story, little original content.", grade: "Weak", tone: "bad" },
      NO_FLAGS,
      { label: "Successful collabs", note: "None visible.", grade: "?", tone: "unknown" },
    ],
    email: "marco.diaz@gmail.com",
  },
];

export const FIT_ORDER: Fit[] = ["strong", "maybe", "no"];

export const byNewest = (a: Creator, b: Creator) => b.requested.localeCompare(a.requested);

/* the messages the Concierge sends for the business */
export const declineMessage = (business: string) =>
  `Thank you so much for reaching out! Unfortunately, ${business} isn't able to take on this collab right now, but they really appreciate you thinking of them! 💖✨`;
export const forwardMessage = (first: string, business: string) =>
  `Great news, ${first}! ${business} is interested in learning more about this collab and will be in touch soon. 🎉`;

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
