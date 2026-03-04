import { createClient } from "@/lib/supabase/server";
import {
  TutorialDetailClient,
  type TutorialData,
  type TutorialStep,
} from "./tutorial-detail-client";

// Mock tutorials for fallback
const MOCK_TUTORIALS: Record<string, TutorialData> = {
  "tutorial-1": {
    id: "tutorial-1",
    title: "Grandma's Cornbread Recipe",
    difficulty: "beginner",
    estimated_time: "45 min",
    entry_title: "Grandma Mae's Cornbread",
    steps: [
      {
        title: "Gather Your Ingredients",
        description:
          "You'll need 2 cups yellow cornmeal, 1 cup buttermilk, 2 eggs, 1/3 cup melted butter, 1 tsp baking soda, 1 tsp salt, and a pinch of sugar (optional, but Grandma always added it).",
        tips: "Use stone-ground cornmeal if you can find it. Grandma always said it made the texture better.",
      },
      {
        title: "Preheat the Oven and Skillet",
        description:
          "Set your oven to 425 degrees F. Place your cast iron skillet in the oven with a tablespoon of butter to melt and coat the pan. This is the secret to that crispy bottom crust.",
        tips: "If you don't have a cast iron skillet, a 9-inch baking pan works, but the crust won't be quite the same.",
      },
      {
        title: "Mix the Dry Ingredients",
        description:
          "In a large bowl, whisk together the cornmeal, baking soda, salt, and sugar. Make a well in the center for the wet ingredients.",
      },
      {
        title: "Combine Wet and Dry",
        description:
          "Beat the eggs, then mix them with the buttermilk and melted butter. Pour into the well of dry ingredients and stir until just combined. Don't overmix; a few lumps are fine.",
        tips: "Grandma always said 'stir it like you're in no hurry.' Overmixing makes it tough.",
      },
      {
        title: "Pour and Bake",
        description:
          "Carefully remove the hot skillet from the oven. The butter should be sizzling. Pour the batter into the hot skillet. It should sizzle when it hits the pan. Return to the oven and bake for 20-25 minutes.",
      },
      {
        title: "Check and Serve",
        description:
          "The cornbread is done when it's golden brown on top and a toothpick inserted in the center comes out clean. Let it cool for 5 minutes, then slice and serve with butter and honey.",
        tips: "Grandma served hers with collard greens and pot liquor on the side. Best enjoyed warm.",
      },
    ],
  },
  "tutorial-2": {
    id: "tutorial-2",
    title: "How to Fix a Leaky Faucet",
    difficulty: "intermediate",
    estimated_time: "1 hr",
    entry_title: "Home Repair Skills",
    steps: [
      {
        title: "Identify the Leak Source",
        description:
          "Before you start taking things apart, figure out where the water is coming from. Is it dripping from the spout, leaking around the base, or dripping under the sink? Each has a different fix.",
        tips: "Place a dry paper towel under the sink and check after an hour. This helps pinpoint slow leaks.",
      },
      {
        title: "Turn Off the Water Supply",
        description:
          "Look for the shut-off valves under the sink. Turn them clockwise to close. Then turn on the faucet to release any remaining water pressure. This is the most important step.",
        tips: "Uncle Robert says: 'Never skip this step. I learned the hard way in 1978.'",
      },
      {
        title: "Take a Photo",
        description:
          "Before removing anything, take a photo of the faucet assembly with your phone. This will be your reference when putting everything back together.",
      },
      {
        title: "Remove the Faucet Handle",
        description:
          "Pop off the decorative cap on top of the handle. Remove the screw underneath with a Phillips head screwdriver. Lift the handle straight up and off.",
      },
      {
        title: "Replace the Washer or Cartridge",
        description:
          "For compression faucets, you'll see a rubber washer at the bottom of the stem. Replace it with an exact match from the hardware store. For cartridge faucets, pull out the cartridge and bring it to the store to match.",
        tips: "Take the old part to the hardware store. Guessing at sizes never works.",
      },
      {
        title: "Reassemble the Faucet",
        description:
          "Using your reference photo, put everything back together in reverse order. Hand-tighten first, then snug with the screwdriver. Don't overtighten.",
      },
      {
        title: "Test Your Work",
        description:
          "Turn the water supply back on slowly. Let the faucet run for a minute and check for leaks around the handle and under the sink.",
      },
      {
        title: "Clean Up",
        description:
          "Wipe down the area, put your tools away, and take pride in a job well done. You just saved yourself a plumber's bill.",
        tips: "Uncle Robert's rule: always clean up better than you found it.",
      },
    ],
  },
  "tutorial-3": {
    id: "tutorial-3",
    title: "Family Quilt Pattern",
    difficulty: "advanced",
    estimated_time: "3 hrs",
    entry_title: "Aunt Diane's Quilting",
    steps: [
      { title: "Choose Your Fabrics", description: "Select 4-6 coordinating cotton fabrics. Aunt Diane's traditional pattern uses a mix of solids and small prints. Pre-wash and iron all fabrics before cutting.", tips: "Aunt Diane always included one fabric from something meaningful, like a baby outfit or old dress shirt." },
      { title: "Cut Your Squares", description: "Cut all fabrics into 5-inch squares. You'll need about 48 squares for a lap quilt. Use a rotary cutter and cutting mat for precision." },
      { title: "Arrange the Layout", description: "Lay out all your squares on a flat surface in an 8x6 grid. Alternate colors and patterns so no two identical fabrics are adjacent. Step back and look at the overall balance.", tips: "Take a black-and-white photo to check the value contrast. It shows you the pattern better than color." },
      { title: "Sew the Rows", description: "Using a 1/4-inch seam allowance, sew each row of squares together left to right. Press seams in alternating directions for each row so they nest together neatly." },
      { title: "Join the Rows", description: "Pin rows together, matching seam intersections carefully. Sew rows together one at a time, pressing seams as you go." },
      { title: "Prepare the Backing", description: "Cut your backing fabric and batting 3 inches larger than your quilt top on all sides. Layer backing (face down), batting, then quilt top (face up)." },
      { title: "Pin or Baste the Layers", description: "Starting from the center, pin safety pins every 4-5 inches through all three layers. Work outward to the edges, smoothing as you go." },
      { title: "Quilt the Layers Together", description: "Using a walking foot on your sewing machine, stitch in the ditch along all seam lines. Or hand-quilt with small running stitches for a more traditional look.", tips: "Aunt Diane always hand-quilts. She says it's meditative and you can feel the love in every stitch." },
      { title: "Trim the Edges", description: "Using your rotary cutter and ruler, trim all layers even with the quilt top. Make sure corners are square." },
      { title: "Make the Binding", description: "Cut 2.5-inch strips of binding fabric. Join them into one continuous strip. Press in half lengthwise, wrong sides together." },
      { title: "Attach the Binding", description: "Sew the binding to the front of the quilt with a 1/4-inch seam. Miter the corners by folding the binding at a 45-degree angle. When you get back to the start, overlap the binding ends." },
      { title: "Finish and Label", description: "Hand-stitch the binding to the back of the quilt. Add a label with the date, maker's name, and who it's for. Every family quilt tells a story.", tips: "Aunt Diane signs every quilt with the words 'Made with love by the [family name] family.'" },
    ],
  },
  "tutorial-4": {
    id: "tutorial-4",
    title: "Grandpa's Garden Layout",
    difficulty: "beginner",
    estimated_time: "30 min",
    entry_title: "Grandpa's Garden Notes",
    steps: [
      { title: "Choose Your Plot", description: "Find a spot that gets at least 6 hours of direct sunlight. Grandpa's garden was only 10x12 feet, but it fed the family all summer.", tips: "Watch the sun pattern in your yard for a full day before choosing. Morning sun is best." },
      { title: "Plan Your Rows", description: "Sketch your garden on paper first. Tall plants (tomatoes, corn) go on the north side so they don't shade shorter plants. Leave 18 inches between rows." },
      { title: "Prepare the Soil", description: "Mix in compost or aged manure a few weeks before planting. Grandpa composted kitchen scraps all winter for this purpose." },
      { title: "Plant in Succession", description: "Don't plant everything at once. Stagger lettuce and beans every two weeks for a continuous harvest through the season.", tips: "Grandpa's rule: 'Plant when the dogwoods bloom, and you'll never get caught by a late frost.'" },
      { title: "Water and Maintain", description: "Water deeply in the morning, not in the evening. Mulch around plants to retain moisture. Pull weeds when they're small; it's easier that way." },
    ],
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TutorialDetailPage({ params }: PageProps) {
  const { id } = await params;
  let tutorial: TutorialData | null = MOCK_TUTORIALS[id] || null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Try to fetch from Supabase
      const { data: tutorialData } = await supabase
        .from("skill_tutorials")
        .select("id, steps, difficulty_level, estimated_time, entry_id, entries(title)")
        .eq("id", id)
        .single();

      if (tutorialData) {
        const rawSteps = tutorialData.steps as { order?: number; title: string; description: string; tips?: string }[];
        const steps: TutorialStep[] = rawSteps
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((s) => ({
            title: s.title,
            description: s.description,
            tips: s.tips,
          }));

        const entryRecord = tutorialData.entries as unknown as { title: string } | null;
        const entryTitle = entryRecord?.title || "Unknown Entry";

        tutorial = {
          id: tutorialData.id,
          title: `${entryTitle} Tutorial`,
          difficulty: (tutorialData.difficulty_level || "beginner") as TutorialData["difficulty"],
          estimated_time: tutorialData.estimated_time || "N/A",
          entry_title: entryTitle,
          steps,
        };
      }
      // If not found in Supabase and not in mock, tutorial stays null
    }
  } catch (e) {
    console.error("Failed to fetch tutorial, falling back to mock:", e);
    // Keep whatever mock data we have (or null)
  }

  return <TutorialDetailClient tutorial={tutorial} />;
}
