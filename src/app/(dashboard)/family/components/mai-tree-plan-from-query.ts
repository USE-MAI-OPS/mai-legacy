// MAI Tree — local natural-language → FilterPlan parser.
// Ported verbatim from handoff/MAITree.jsx :864-890.
//
// Acts as:
//   1. The primary Griot parser when the LLM endpoint is unavailable/broken.
//   2. The fallback the client uses if `/api/griot/tree-view` returns an error
//      or an unparseable response.

import type { FilterPlan } from "./mai-tree-types";

export function planFromQuery(queryIn: string): FilterPlan {
  const q = queryIn.toLowerCase().trim();

  // ─── Split phrases (contain "vs" / " versus " / " and ") ───
  if (q.includes(" vs ") || q.includes(" versus ") || q.includes(" and ")) {
    if ((q.includes("mom") || q.includes("mother")) && (q.includes("dad") || q.includes("father"))) {
      return {
        type: "split",
        split: {
          left: { groups: ["family"], side: "mom", label: "Mom's side" },
          right: { groups: ["family"], side: "dad", label: "Dad's side" },
          label: "Mom's vs Dad's side",
        },
        summary: "Here's your mom's side on the left, dad's side on the right.",
      };
    }
    if (q.includes("family") && (q.includes("friend") || q.includes("friends"))) {
      return {
        type: "split",
        split: {
          left: { groups: ["family"], label: "Family" },
          right: { groups: ["friend"], label: "Friends" },
          label: "Family vs Friends",
        },
        summary: "Family clustered on the left, friends on the right.",
      };
    }
  }

  // ─── Side (mom / dad) ───
  if (q.includes("mom") || q.includes("mother")) {
    return {
      type: "filter",
      filters: [{ groups: ["family"], side: "mom", __label: "Mom's side" }],
      summary: "Showing your mom's side of the family.",
    };
  }
  if (q.includes("dad") || q.includes("father")) {
    return {
      type: "filter",
      filters: [{ groups: ["family"], side: "dad", __label: "Dad's side" }],
      summary: "Showing your dad's side of the family.",
    };
  }

  // ─── Group keywords ───
  if (q.includes("family")) {
    return {
      type: "filter",
      filters: [{ groups: ["family"], __label: "Family" }],
      summary: "Here's your family.",
    };
  }
  if (q.includes("friend")) {
    return {
      type: "filter",
      filters: [{ groups: ["friend"], __label: "Friends" }],
      summary: "Here are your friends.",
    };
  }
  if (q.includes("work") || q.includes("coworker") || q.includes("colleague")) {
    return {
      type: "filter",
      filters: [{ groups: ["work"], __label: "Work" }],
      summary: "Here's your professional network.",
    };
  }
  if (q.includes("school") || q.includes("class")) {
    return {
      type: "filter",
      filters: [{ groups: ["school"], __label: "School" }],
      summary: "Here are your school connections.",
    };
  }
  if (q.includes("mentor")) {
    return {
      type: "filter",
      filters: [{ groups: ["mentor"], __label: "Mentors" }],
      summary: "Your mentors.",
    };
  }

  // ─── Tag keywords ───
  if (q.includes("tech")) {
    return {
      type: "filter",
      filters: [{ tags: ["tech"], __label: "Tech" }],
      summary: "Everyone you know in tech.",
    };
  }
  if (q.includes("morehouse")) {
    return {
      type: "filter",
      filters: [{ tags: ["Morehouse"], __label: "Morehouse" }],
      summary: "Morehouse alumni in your network.",
    };
  }
  if (q.includes("howard")) {
    return {
      type: "filter",
      filters: [{ tags: ["Howard"], __label: "Howard" }],
      summary: "Howard alumni in your network.",
    };
  }
  if (q.includes("spelman")) {
    return {
      type: "filter",
      filters: [{ tags: ["Spelman"], __label: "Spelman" }],
      summary: "Spelman alumnae in your network.",
    };
  }

  // ─── Age ───
  if (q.includes("elder") || q.includes("old")) {
    return {
      type: "filter",
      filters: [{ minAge: 60, __label: "60+" }],
      summary: "Elders in your network — everyone over 60.",
    };
  }

  // ─── Fallback: freeform text search across name/occupation/location/tags ───
  return {
    type: "filter",
    filters: [{ q: queryIn.trim(), __label: `"${queryIn.trim()}"` }],
    summary: `Searching for "${queryIn.trim()}" across your network.`,
  };
}
