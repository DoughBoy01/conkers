export type ChapterId = "harvest" | "thread" | "swing" | "swap" | "victor";

export type FoleyCueType =
  | "breeze"
  | "thud"
  | "bore"
  | "thread"
  | "whoosh"
  | "clack"
  | "crack"
  | "shatter"
  | "chime";

export type SubtitleMode = "both" | "en" | "dz" | "off";

export interface CaptionCue {
  start: number;
  end: number;
  en: string;
  dz: string;
}

export interface FoleyCue {
  id: string;
  time: number;
  type: FoleyCueType;
  intensity?: number;
}

export interface StoryChapter {
  id: ChapterId;
  index: string;
  shortLabel: string;
  title: string;
  start: number;
  end: number;
  summary: string;
  narrationText: string;
  backdropSrc: string;
  captions: CaptionCue[];
}

export const TOTAL_FILM_DURATION = 54;

export const ILLUSTRATION_ASSETS = {
  poster: "/src/assets/images/poster_conkers_title_1795057091181.jpg",
  woodland: "/src/assets/images/backdrop_autumn_woodland_1795057092016.jpg",
  workbench: "/src/assets/images/backdrop_cottage_workbench_1795057091157.jpg",
  villageGreen: "/src/assets/images/backdrop_village_green_1795057090378.jpg",
} as const;

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: "harvest",
    index: "01",
    shortLabel: "Gather",
    title: "The Autumn Harvest",
    start: 0,
    end: 11,
    summary:
      "Every autumn, British children collect the shiny brown seeds that fall from horse chestnut trees.",
    narrationText:
      "Every autumn, British children collect the shiny brown seeds that fall from horse chestnut trees.",
    backdropSrc: ILLUSTRATION_ASSETS.woodland,
    captions: [
      {
        start: 0.3,
        end: 5.4,
        en: "Every autumn, British children collect the shiny brown seeds...",
        dz: "སེར་ཁའི་དུས་ལུ་ ཨིང་ལེནཌ་གི་ཨ་ལུ་ཚུ་གིས་ འོད་འཚེར་བའི་སོན་སྨུག་པོ་ཚུ་བསྡུཝ་ཨིན།",
      },
      {
        start: 5.4,
        end: 10.6,
        en: "...that fall from horse chestnut trees in spiky green husks.",
        dz: "ཧོརསི་ཅེསཊ་ནཊ་ཤིང་ལས་ ཚེར་མ་ཅན་གྱི་ཤུབས་ལྗང་ཁུའི་ནང་བུད་འོངམ་ཨིན།",
      },
    ],
  },
  {
    id: "thread",
    index: "02",
    shortLabel: "String",
    title: "Hole & Knot",
    start: 11,
    end: 21,
    summary:
      "Make a hole through a conker and thread it on a string with a knot at the end.",
    narrationText:
      "Make a hole through a conker, and thread it on a string with a knot at the end.",
    backdropSrc: ILLUSTRATION_ASSETS.workbench,
    captions: [
      {
        start: 11.3,
        end: 15.8,
        en: "Make a hole straight through the centre of a firm conker...",
        dz: "ཀོང་ཀར་སྲ་ཀྲག་ཅིག་གི་སྦུག་ལས་ཕར་ དོང་ཅིག་ཐད་ཀར་དུ་བཏོལ་ཏེ་...",
      },
      {
        start: 15.8,
        end: 20.6,
        en: "...and thread it on a string with a knot tied tight at the end.",
        dz: "སྐུདཔ་ཅིག་གུ་བསྣར་ཞིནམ་ལས་ མཇུག་ལུ་མདུད་ཕུ་དམ་ཏོག་ཏོ་ཅིག་བསྡམ་དགོ།",
      },
    ],
  },
  {
    id: "swing",
    index: "03",
    shortLabel: "Swing",
    title: "Hold Still & Swing",
    start: 21,
    end: 32,
    summary:
      "Your opponent holds their conker still, hanging at arm's length. Swing yours and try to hit theirs.",
    narrationText:
      "Your opponent holds their conker still, hanging at arm's length. Swing yours and try to hit theirs!",
    backdropSrc: ILLUSTRATION_ASSETS.villageGreen,
    captions: [
      {
        start: 21.3,
        end: 26.5,
        en: "Your opponent holds their conker still, hanging at arm's length.",
        dz: "ཁྱོད་ཀྱི་འགྲན་ཟླ་གིས་ ཁོང་རའི་ཀོང་ཀར་འདི་ ལགཔ་བརྐྱངས་པའི་ཐག་ཚད་ཁར་ མ་སྒུལ་བར་འཕྱང་སྟེ་བཟུངམ་ཨིན།",
      },
      {
        start: 26.5,
        end: 31.6,
        en: "Swing yours along a clean arc and try to hit theirs!",
        dz: "ཁྱོད་རའི་ཀོང་ཀར་འདི་ གཡུག་སྟེ་ ཁོང་གི་ཀོང་ཀར་གུ་ཕོག་ཐབས་འབད་དགོ།",
      },
    ],
  },
  {
    id: "swap",
    index: "04",
    shortLabel: "Swap",
    title: "Swap & Strike",
    start: 32,
    end: 42,
    summary:
      "Then swap. Each player takes turns holding steady and swinging at their opponent's conker.",
    narrationText:
      "Then swap! Each player takes turns holding steady and swinging in a clean arc.",
    backdropSrc: ILLUSTRATION_ASSETS.villageGreen,
    captions: [
      {
        start: 32.3,
        end: 36.8,
        en: "Then swap! Now it is your turn to hold steady without flinching.",
        dz: "དེ་ལས་སྐོར་རྒྱབ་བརྗེ་སོར་འབད་དགོ། ད་ཁྱོད་ཀྱིས་མ་སྐྲག་པར་ བརྟན་ཏོག་ཏོ་འབད་བཟུང་ནིའི་སྐོར་ཨིན།",
      },
      {
        start: 36.8,
        end: 41.6,
        en: "Each player takes turns holding steady and swinging in a clean arc.",
        dz: "རྩེདམོ་རྩེ་མི་རེ་རེ་བཞིན་དུ་གིས་ བརྟན་པོར་བཟུང་ནི་དང་ གཡུག་སྟེ་བརྡུང་ནིའི་སྐོར་རེ་ལེནམ་ཨིན།",
      },
    ],
  },
  {
    id: "victor",
    index: "05",
    shortLabel: "Score",
    title: "One-er, Two-er",
    start: 42,
    end: 54,
    summary:
      "The first conker to break loses. The winner becomes a 'one-er', then a 'two-er' after its next win, and so on.",
    narrationText:
      "The first conker to break loses. The winner becomes a one-er, then a two-er after its next win, and so on!",
    backdropSrc: ILLUSTRATION_ASSETS.villageGreen,
    captions: [
      {
        start: 42.3,
        end: 46.5,
        en: "The first conker to break loses the match.",
        dz: "དང་པ་ར་ཆག་མི་ཀོང་ཀར་འདི་ འགྲན་བསྡུར་ནང་ཕམ་ཨིན།",
      },
      {
        start: 46.5,
        end: 53.2,
        en: "The winner becomes a 'one-er', then a 'two-er' after its next win, and so on.",
        dz: "རྒྱལ་ཁ་ཐོབ་མི་འདི་ 'ཝན་ཨར་' ལུ་འགྱུར་ནི་དང་། དེ་གི་ཤུལ་ལས་རྒྱལ་བ་ཅིན་ 'ཊུ་ཨར་' སོགས་འགྱུར་འགྱོཝ་ཨིན།",
      },
    ],
  },
];

export const FOLEY_CUES: FoleyCue[] = [
  { id: "c1-breeze", time: 0.6, type: "breeze", intensity: 0.6 },
  { id: "c1-thud1", time: 3.1, type: "thud", intensity: 0.7 },
  { id: "c1-thud2", time: 4.5, type: "thud", intensity: 0.85 },
  { id: "c2-bore", time: 12.4, type: "bore", intensity: 0.75 },
  { id: "c2-thread", time: 16.2, type: "thread", intensity: 0.8 },
  { id: "c3-whoosh", time: 26.4, type: "whoosh", intensity: 0.85 },
  { id: "c3-clack", time: 27.35, type: "clack", intensity: 0.95 },
  { id: "c4-whoosh", time: 36.9, type: "whoosh", intensity: 0.8 },
  { id: "c4-clack", time: 37.75, type: "clack", intensity: 0.75 },
  { id: "c5-whoosh", time: 43.5, type: "whoosh", intensity: 1.0 },
  { id: "c5-clack", time: 44.35, type: "clack", intensity: 1.0 },
  { id: "c5-crack", time: 44.7, type: "crack", intensity: 1.0 },
  { id: "c5-shatter", time: 45.6, type: "shatter", intensity: 0.95 },
  { id: "c5-chime1", time: 47.2, type: "chime", intensity: 0.8 },
  { id: "c5-chime2", time: 48.6, type: "chime", intensity: 0.95 },
];

export function getChapterAtTime(time: number): StoryChapter {
  const clamped = Math.max(0, Math.min(TOTAL_FILM_DURATION - 0.01, time));
  return (
    STORY_CHAPTERS.find((c) => clamped >= c.start && clamped < c.end) ??
    STORY_CHAPTERS[0]
  );
}

export function getActiveCaption(time: number): CaptionCue | null {
  for (const chapter of STORY_CHAPTERS) {
    for (const cue of chapter.captions) {
      if (time >= cue.start && time < cue.end) {
        return cue;
      }
    }
  }
  return null;
}

export function formatConkerRank(wins: number): string {
  if (wins <= 0) return "Fresh Conker";
  const words = [
    "",
    "One-er",
    "Two-er",
    "Three-er",
    "Four-er",
    "Five-er",
    "Six-er",
    "Seven-er",
    "Eight-er",
    "Nine-er",
    "Ten-er",
  ];
  return words[wins] ?? `${wins}-er`;
}
