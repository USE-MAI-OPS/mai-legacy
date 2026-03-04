/**
 * Seed data for MAI Legacy.
 *
 * 25 realistic family entries across all 6 types designed to exercise the RAG
 * pipeline with substantive, retrievable content.  Each entry is written as
 * though an actual family member authored it -- complete with specific names,
 * places, dates, and emotions.
 *
 * The `authorKey` field maps to one of the test family members created in
 * seed.ts so entries are distributed across multiple contributors.
 */

import type { EntryType } from "@/types/database";

export interface SeedEntry {
  title: string;
  content: string;
  type: EntryType;
  tags: string[];
  /** Maps to a key in the family-member lookup created at seed time. */
  authorKey: "james" | "mae" | "tanya" | "ray";
}

// ---------------------------------------------------------------------------
// STORIES (5)
// ---------------------------------------------------------------------------

const stories: SeedEntry[] = [
  {
    title: "The Summer Road Trip to Mississippi",
    content: `The summer of 1995 was the last time the whole family piled into Daddy's maroon Chevy Suburban and drove the twelve hours from Chicago down to Greenville, Mississippi. I was nine years old, and my brother Marcus was seven. Mama packed a cooler full of ham sandwiches, boiled eggs, and those little Hugs juice barrels that turned your lips blue.

We left before dawn so we could beat the St. Louis traffic. Daddy had the whole route mapped out on a paper atlas he kept tucked between the driver seat and the console. No GPS back then -- just Daddy's memory and that atlas. He'd done the drive so many times growing up that he knew every exit, every rest stop, every speed trap in southern Missouri.

The best part was always crossing the Mississippi River bridge into Memphis. Marcus and I would press our faces to the window and try to count the barges. Mama would hum along to the Isley Brothers tape she kept in the glove box, and Daddy would point out Beale Street even though you could barely see it from the highway.

When we finally pulled up to Grandma Odessa's house on Nelson Street, the whole block seemed to know we were coming. Mr. Perkins from next door was already on his porch waving, and you could smell Grandma's peach cobbler from the driveway. She'd come out the screen door wiping her hands on her apron, and before you could even get your seatbelt off she was pulling you into a hug that smelled like cocoa butter and cinnamon.

Those two weeks in Greenville were everything. Catching fireflies in Mason jars. Eating watermelon on the back porch while the sprinkler ran. Walking to the corner store for Now and Laters with our cousin Keisha. Going to Mt. Calvary Baptist with Grandma on Sunday and sitting through a three-hour service because the choir was that good.

Grandma Odessa passed in 2003, and we sold the house on Nelson Street the following year. But every time I smell peach cobbler or hear the Isley Brothers, I'm nine years old again, face pressed to the window, counting barges on the Mississippi.`,
    type: "story",
    tags: ["family trips", "mississippi", "grandma odessa", "childhood"],
    authorKey: "james",
  },
  {
    title: "How Grandma and Grandpa Met at the Church Social",
    content: `Grandma Mae always said Grandpa Robert didn't have a lick of sense the first time she laid eyes on him, and she meant it as a compliment.

It was September 1961 at the First Baptist Church fall social in Clarksdale, Mississippi. Mae was nineteen and had just started working at the telephone company. Robert was twenty-one and had come up from Jackson to visit his aunt. He didn't even go to First Baptist -- he was AME -- but his aunt dragged him along because she said there'd be good food and "nice girls."

The way Grandma told it, Robert walked straight past the dessert table, past the lemonade, past his own aunt, and planted himself right in front of her. He said, "Excuse me, miss, but I believe you dropped something." She looked around and said, "I didn't drop anything." And he said, "Yes you did. You dropped my jaw."

Grandma said she rolled her eyes so hard she almost saw her own brain. But he made her laugh, and that was the thing about Robert -- he could always make her laugh. He asked her to dance even though there wasn't any music playing yet, and she said yes even though she told herself she wouldn't.

They wrote letters back and forth for six months -- Robert in Jackson, Mae in Clarksdale. He'd send her pressed wildflowers between the pages and she'd send him back poems she wrote during her lunch break at the phone company. He proposed on Easter Sunday 1962, kneeling right there in the church parking lot with a ring he'd saved four months of warehouse wages to buy. It had the tiniest diamond you ever saw, but Grandma wore it every single day for fifty-one years.

They got married that June in a small ceremony. Grandma's mother made her dress from fabric they ordered from the Sears catalog. Twenty-three people attended, and Grandma's little brother spilled punch on the groom. Robert just laughed and said it matched his tie.

When people asked Grandma what the secret to a long marriage was, she'd say: "Find someone who makes you laugh when you want to cry, and never go to bed without saying goodnight." They were married from 1962 until Grandpa Robert passed in 2013. Fifty-one years of laughter, letters, and pressed wildflowers.`,
    type: "story",
    tags: ["grandma mae", "grandpa robert", "love story", "family history"],
    authorKey: "mae",
  },
  {
    title: "The Great Flood of '93 and How the Family Survived",
    content: `The summer of 1993 the Mississippi River decided it had had enough of staying between its banks. We were living in St. Louis at the time, out in the Lemay area, and the water just kept coming. It rained for weeks straight, and every night the news showed another levee breaking somewhere upriver.

Daddy worked for the water department back then, so he knew before most people how bad it was going to get. One Friday night in July he came home and said, "Start packing. We're going to your mother's." No discussion, no argument. When James Powell Sr. said pack, you packed.

Mama filled garbage bags with photo albums, birth certificates, the family Bible, and Grandma Odessa's quilt. That's what she saved first -- not the TV, not the furniture -- the things that couldn't be replaced. Daddy disconnected the hot water heater and moved everything he could to the second floor. Marcus and I thought it was an adventure. We had no idea.

We stayed with Mama's sister Denise in Florissant for three weeks. Seven people in a two-bedroom apartment, and Aunt Denise never once complained. She made it feel like a sleepover. We ate a lot of spaghetti and watched a lot of Jeopardy.

When the water finally went down and we came back, the first floor had about two feet of river mud in it. The smell is something I'll never forget -- this thick, earthy, rotten smell that got into everything. The couch was ruined. The carpet was ruined. Most of the kitchen was ruined. But the photo albums were safe. The family Bible was dry. Grandma's quilt didn't have a drop on it.

It took us the rest of the summer to clean out and rebuild. The whole neighborhood pitched in. Mr. Henderson from across the street brought his shop vac. The ladies from Mama's church brought food every day for two weeks. Daddy's union brothers came on weekends to help with the drywall.

That flood taught me something I've never forgotten: things are just things. The stuff that matters -- family, photos, stories -- you protect those first. Everything else can be replaced. And when your community shows up for you the way ours did, you show up for them when it's their turn. That's just how it works.`,
    type: "story",
    tags: ["st. louis", "flood", "family resilience", "1993"],
    authorKey: "james",
  },
  {
    title: "Moving to the City from the Country",
    content: `My parents, Robert and Mae Powell, moved from Clarksdale, Mississippi to Chicago, Illinois in the spring of 1965. They were part of what historians now call the Second Great Migration, though at the time they just called it "going up north."

Robert had a cousin named Wallace who'd moved to Chicago in 1960 and gotten a job at the Pullman railcar plant on the South Side. Wallace wrote letters back home talking about the money he was making, the apartment he had with indoor plumbing and central heat, the jazz clubs on 47th Street. Robert was making two dollars a day at the warehouse in Jackson, and Mae's telephone operator salary wasn't much better. They had a baby on the way -- that was my James -- and they wanted more.

They took the Illinois Central train from Clarksdale to Chicago's Central Station on April 14, 1965. Mae was five months pregnant, carrying one suitcase and a box of dishes her mother had given her as a wedding gift. Robert had forty-seven dollars in his pocket, a change of clothes, and Wallace's address written on the back of a church bulletin.

Wallace met them at the station and drove them to a basement apartment on South Wabash Avenue in Bronzeville. It was small, it was cold, and the pipes rattled all night. But it was theirs. Robert started at Pullman two days later. Mae found work as a seamstress at a shop on State Street once James was born and old enough to stay with a neighbor.

The adjustment was hard. Mae missed the open sky and the sound of crickets at night. She missed her mother's cooking and the slow pace of Sunday mornings. Chicago was loud and fast and cold in ways Mississippi never was. But she found her people -- other women from the Delta who'd made the same journey, who gathered at each other's kitchens on Saturday evenings to cook greens and cornbread and talk about home.

Robert worked at Pullman for twelve years before the plant closed. Then he drove a CTA bus for another twenty. He never got rich, but he bought a house on the South Side in 1972, put two kids through school, and never missed a Sunday at Greater Bethlehem Baptist. When people asked him if he ever regretted leaving Mississippi, he'd say: "I don't regret it. But I never stopped missing it either."

That tension -- between where you come from and where you've planted yourself -- is something every member of this family understands. We are Chicago people with Mississippi soil still on our shoes.`,
    type: "story",
    tags: ["great migration", "chicago", "mississippi", "grandpa robert", "grandma mae"],
    authorKey: "mae",
  },
  {
    title: "The Family Reunion Tradition That Started in 1978",
    content: `The first Powell Family Reunion was held on July 4th weekend, 1978, at Washington Park on the South Side of Chicago. Grandma Mae organized the whole thing with nothing but a rotary phone, a box of stamps, and pure determination.

The idea started because Grandma realized that her children were growing up not knowing their cousins. Robert's side of the family was spread across Mississippi, Memphis, Detroit, and Gary, Indiana. Mae's people were in Clarksdale, Jackson, and a few had gone out to Los Angeles. The kids were becoming strangers to each other, and that bothered her deeply.

She wrote forty-three letters. Forty-three. Each one handwritten on her good stationery, explaining that the Powell family was going to start gathering every year on Fourth of July weekend, and everyone was expected to come. She included directions to Washington Park, a list of what to bring (each family was assigned a dish), and a stern reminder that "this is not optional."

That first year, twenty-eight people showed up. By 1985, it was over sixty. By the early nineties, we were pushing a hundred, and Grandma had to rent a shelter pavilion because we couldn't all fit under the trees anymore.

Every reunion followed the same pattern. Friday night was the welcome dinner at whoever's house was big enough (or brave enough) to host. Saturday was the main event at the park -- food, games, music, a talent show for the kids, and dominoes for the old-timers. Sunday was church followed by a family meeting where Grandma would update everyone on births, deaths, graduations, and who needed prayer.

The food was always legendary. Grandma's cornbread. Aunt Lorraine's potato salad (she guarded that recipe like state secrets). Uncle Benny's ribs that he'd start smoking at four in the morning. Cousin Patricia's seven-layer dip. And enough sweet tea to fill a swimming pool.

The tradition has continued every year except 2020, when the pandemic forced us to do a Zoom reunion that Uncle Ray still complains about. We've rotated the location over the years -- Chicago, Memphis, Atlanta, and last year we went back to Clarksdale for the first time.

The reunion is more than a party. It's how we remember who we are. It's how the young ones learn the old stories. It's how we keep the thread going between the Mississippi Delta and everywhere else life has scattered us. Grandma Mae passed in 2019, but she left us this tradition, and we intend to keep it going for another forty-five years at least.`,
    type: "story",
    tags: ["family reunion", "traditions", "grandma mae", "fourth of july"],
    authorKey: "tanya",
  },
];

// ---------------------------------------------------------------------------
// SKILLS (4)
// ---------------------------------------------------------------------------

const skills: SeedEntry[] = [
  {
    title: "How to Change a Tire (from Uncle Ray)",
    content: `Every member of this family needs to know how to change a tire. I don't care if you have AAA, I don't care if you have roadside assistance on your phone -- you need to know how to do this yourself. Because one day you're going to be on some back road with no cell service and a flat tire, and this knowledge is going to save you.

First, before anything happens, make sure you know where your spare tire, jack, and lug wrench are in your car. Check right now. Go out to your car and find them. Most spare tires are under the mat in the trunk or bolted underneath the vehicle. If you can't find them, check your owner's manual.

Here's the step-by-step:

1. Pull over to a safe, flat surface. Turn on your hazard lights. If you have road flares or reflective triangles, set them up behind your car.

2. Put the car in park (or in gear if you drive manual) and engage the parking brake. This is critical -- you don't want the car rolling while it's jacked up.

3. Before you jack the car up, loosen the lug nuts on the flat tire. Turn them counterclockwise. They're going to be tight, so you might need to stand on the wrench to break them free. Don't remove them all the way -- just break them loose about half a turn.

4. Place the jack under the vehicle's frame near the flat tire. Your owner's manual will show you the exact jack points. Using the wrong spot can damage your car or cause the jack to slip.

5. Raise the vehicle until the flat tire is about six inches off the ground. Now remove the lug nuts completely and pull the tire off.

6. Put the spare tire on. Hand-tighten the lug nuts in a star pattern -- don't go in a circle. This ensures the tire seats evenly.

7. Lower the vehicle until the spare tire is just touching the ground but not bearing full weight. Now tighten the lug nuts firmly in the same star pattern.

8. Lower the vehicle completely and remove the jack. Give each lug nut one more good tightening.

9. Check your spare tire's air pressure. Most spares (especially the smaller "donut" spares) need 60 PSI. Don't drive over 50 mph on a donut spare, and get to a tire shop within 50 miles.

One more thing: check your spare tire's air pressure every time you check your regular tires. A flat spare is just as useless as no spare at all. I check mine every oil change.

Your Uncle Ray has changed more tires on the side of the road than he can count, including twice on Christmas Eve. Learn this skill and you'll never be stranded.`,
    type: "skill",
    tags: ["car maintenance", "uncle ray", "emergency skills", "practical"],
    authorKey: "ray",
  },
  {
    title: "Basic Home Electrical Repair",
    content: `I've been doing my own basic electrical work around the house for thirty years, and it's saved this family thousands of dollars. Now, I want to be clear: I'm talking about simple repairs -- replacing outlets, switches, and light fixtures. If you're dealing with your breaker panel, rewiring a room, or anything that involves the main service line, call a licensed electrician. Don't be a hero.

The most important rule: always, always turn off the power at the breaker box before you touch anything. Then test the outlet or switch with a voltage tester (you can get one at the hardware store for about fifteen dollars) to make sure it's truly dead. I don't care if you just flipped the breaker -- test it. Breakers can be mislabeled.

Replacing a standard electrical outlet:

1. Turn off the breaker. Test the outlet with your voltage tester. Confirm it's dead.
2. Remove the outlet cover plate (one screw) and unscrew the outlet from the electrical box (two screws, top and bottom).
3. Gently pull the outlet out. You'll see wires connected to it -- typically a black (hot) wire, a white (neutral) wire, and a bare or green (ground) wire.
4. Note where each wire is connected. Take a photo with your phone. The black wire goes to the brass screw, the white wire goes to the silver screw, and the ground wire goes to the green screw.
5. Loosen the screws and disconnect the old outlet. Connect the wires to the new outlet in the same positions. Wrap the wire clockwise around each screw so that tightening the screw pulls the wire tighter.
6. Gently push the outlet back into the box, screw it in, replace the cover plate, and turn the breaker back on.

Replacing a light switch is almost identical, except switches only have the hot (black) wires and ground -- the neutral (white) wires are usually joined together in the back of the box with a wire nut and don't connect to the switch.

A few safety tips I've learned the hard way:

- Never work on electrical when you're tired or in a rush. That's when mistakes happen.
- Use a flashlight or headlamp since the power will be off.
- If you see aluminum wiring (silver colored instead of copper), stop and call an electrician. Aluminum wiring requires special connectors.
- If an outlet feels warm to the touch or you smell something burning, that's an emergency. Turn off the breaker and call an electrician immediately.
- Always buy outlets and switches rated for the amperage of your circuit (usually 15 or 20 amps for household circuits).

These are simple skills that every homeowner should have. Your grandfather Robert replaced every outlet in the house on South Wabash himself, and he taught me. Now I'm teaching you.`,
    type: "skill",
    tags: ["home repair", "electrical", "safety", "DIY"],
    authorKey: "ray",
  },
  {
    title: "How to Iron a Dress Shirt Properly",
    content: `I learned to iron from my mother, Mae Powell, who learned from her mother before her. In our family, you don't leave the house looking wrinkled. It's a matter of self-respect, and it's a skill that takes ten minutes to learn and a lifetime to appreciate.

You'll need a good iron (steam capable), a sturdy ironing board, a spray bottle of water, and a clean, wrinkle-free shirt to start with. If the shirt is fresh out of the dryer, iron it while it's still slightly damp. If it's been hanging in the closet, give it a few sprays of water and let it sit for a minute.

Set your iron to the right temperature for the fabric. Cotton and linen take high heat. Polyester blends take medium. If you're not sure, start low and work up -- you can always add heat, but you can't un-scorch a shirt.

Here's the order I iron in, and the order matters:

1. Collar: Lay it flat, wrong side up. Iron from the points toward the center. Flip it over and iron the right side. A crisp collar frames your face, so don't skip this.

2. Yoke (the panel across the upper back and shoulders): Drape one shoulder over the narrow end of the ironing board. Iron from the shoulder toward the center. Rotate and do the other side.

3. Cuffs: Unbutton them and lay them flat, inside up. Iron the inside first, then flip and do the outside. If you like a crisp crease on your cuffs, fold them and press along the fold.

4. Sleeves: Lay the sleeve flat along the board with the seam at the edge. Iron from the shoulder down to the cuff. This is where most people get creases they don't want -- the trick is to make sure the fabric is perfectly smooth before you press.

5. Front panels: Drape one front panel over the board. Iron around the buttons carefully -- go between them, not over them, or you'll crack them. Do both front panels.

6. Back: Drape the back over the board and iron in long, smooth strokes. If your shirt has a back pleat, iron it flat or press the pleat -- whichever you prefer.

A few tips from Mama Mae:

- Always iron on the wrong side of dark fabrics to prevent that shiny "iron mark."
- Hang the shirt immediately after ironing. Don't fold it or it'll wrinkle again.
- Clean your iron's soleplate regularly with a paste of baking soda and water. A dirty iron leaves marks.
- If you're in a hurry, you can iron just the collar, cuffs, and front placket -- the parts people see when you're wearing a jacket.

Looking sharp isn't vanity. It's telling the world you take yourself seriously. That's what Mama always said, and she was right.`,
    type: "skill",
    tags: ["grooming", "life skills", "grandma mae", "presentation"],
    authorKey: "mae",
  },
  {
    title: "Garden Pest Control Without Chemicals",
    content: `When I started my garden on the back patio of our place in Hyde Park, I made a decision early on: no chemical pesticides. We eat what comes out of this garden, and I don't want my grandchildren eating anything that's been doused in synthetic chemicals. Turns out, nature has plenty of solutions if you know where to look.

Here's what I've learned over fifteen years of organic gardening in Chicago:

Companion planting is your first line of defense. Marigolds planted around the border of your vegetable garden repel aphids, whiteflies, and even rabbits. Basil planted near tomatoes repels tomato hornworms and actually improves the flavor of the tomatoes (I'm convinced of this even if the science isn't settled). Nasturtiums attract aphids away from your other plants -- they're a sacrifice crop.

For aphids specifically, a simple spray of water mixed with a few drops of dish soap (Dr. Bronner's castile soap works best) will knock them right off. Spray in the evening so the sun doesn't burn the leaves. Do this every few days until they're gone.

Slugs are a big problem in Chicago's damp springs. Set out shallow dishes of beer near your plants. The slugs are attracted to the yeast, crawl in, and can't get out. Sounds crude but it works perfectly. Alternatively, sprinkle crushed eggshells around the base of your plants -- slugs don't like crawling over sharp edges.

For tomato hornworms -- those fat green caterpillars that can strip a tomato plant overnight -- the best defense is just checking your plants every morning. They're big enough to pick off by hand. Drop them in a bucket of soapy water. If you see a hornworm covered in tiny white cocoons, leave it alone. Those cocoons are braconid wasp larvae that parasitize the hornworm, and the wasps are your allies.

Japanese beetles are the bane of my rose bushes. I go out in the early morning when they're sluggish from the cool air and knock them into a jar of soapy water. You can also plant garlic chives nearby -- they don't like the smell.

Neem oil is my all-purpose organic solution for more stubborn problems. Mix a tablespoon of neem oil with a teaspoon of dish soap in a quart spray bottle of warm water. Shake well and spray on affected plants. It disrupts the feeding and breeding cycle of most garden pests without harming bees or beneficial insects when applied in the evening.

One last thing: a healthy garden resists pests better than a stressed one. Good soil, proper watering (at the base, not on the leaves), and adequate spacing for air circulation will prevent more problems than any spray ever will.

Gardening teaches patience, and it teaches you to work with nature instead of against it. Both are good lessons for life.`,
    type: "skill",
    tags: ["gardening", "organic", "pest control", "chicago"],
    authorKey: "tanya",
  },
];

// ---------------------------------------------------------------------------
// RECIPES (5)
// ---------------------------------------------------------------------------

const recipes: SeedEntry[] = [
  {
    title: "Grandma Mae's Cornbread (Cast Iron Skillet Method)",
    content: `This is the cornbread recipe that has been at every Powell family gathering since before I was born. Grandma Mae got it from her mother, Odessa, who got it from her mother before that. It goes back at least four generations that we know of.

The secret is the cast iron skillet. You cannot make this cornbread in a regular baking pan and expect the same result. The cast iron gives you that crispy, golden-brown crust on the bottom and edges that makes people fight over the corner pieces. If you don't have a 10-inch cast iron skillet, go get one. Season it properly and it'll last longer than you will.

Ingredients:
- 2 cups yellow cornmeal (stone-ground if you can find it -- Bob's Red Mill is what I use)
- 1/2 cup all-purpose flour
- 1 tablespoon sugar (and not a grain more -- this is cornbread, not cake)
- 1 tablespoon baking powder
- 1/2 teaspoon baking soda
- 1 teaspoon salt
- 2 eggs, beaten
- 1 1/2 cups buttermilk (full fat, not that low-fat nonsense)
- 1/4 cup melted butter, plus 2 tablespoons for the skillet
- Optional: 1/4 cup bacon drippings instead of the butter for the skillet (this is the real secret)

Instructions:

1. Preheat your oven to 425 degrees. Put your cast iron skillet in the oven while it preheats with the 2 tablespoons of butter (or bacon drippings) in it. You want that skillet screaming hot.

2. In a large bowl, whisk together the cornmeal, flour, sugar, baking powder, baking soda, and salt.

3. In a separate bowl, mix the eggs, buttermilk, and melted butter.

4. Pour the wet ingredients into the dry ingredients and stir until just combined. Do not overmix. A few lumps are fine and actually preferred. Overmixed cornbread is tough cornbread.

5. Very carefully remove the hot skillet from the oven. The butter should be sizzling and just starting to brown. Swirl it around to coat the bottom and sides.

6. Pour the batter into the hot skillet. It should sizzle when it hits -- that sizzle is the sound of the crust forming.

7. Bake for 20-25 minutes until the top is golden brown and a toothpick inserted in the center comes out clean.

8. Let it cool in the skillet for 5 minutes, then turn it out onto a cutting board or serve it right from the skillet.

Grandma's rules:
- The sugar debate: Grandma used one tablespoon and said anyone who uses more is making dessert, not cornbread. I follow her lead.
- Always use buttermilk. Regular milk makes flat, bland cornbread. The acid in buttermilk reacts with the baking soda and gives you that rise and tang.
- If you don't have bacon drippings saved, start saving them. Keep a jar in the fridge. Strain the drippings through a coffee filter after you cook bacon. It'll keep for months.

This cornbread goes with everything: collard greens, chili, soup, or just by itself with a cold glass of buttermilk, which is how Grandpa Robert ate it every evening after supper.`,
    type: "recipe",
    tags: ["cornbread", "grandma mae", "cast iron", "soul food"],
    authorKey: "mae",
  },
  {
    title: "Uncle Ray's BBQ Dry Rub",
    content: `I've been perfecting this dry rub since 1998, and this is the version I've settled on. I use it on ribs, pulled pork, chicken -- pretty much anything that's going on the smoker or the grill. The family calls it "Ray's Magic Dust" which I pretend to be embarrassed about but secretly love.

The key to a good dry rub is balance. You want sweet, heat, savory, and a little smoke. And you want the spices to complement the meat, not cover it up. Some people go crazy with thirty ingredients -- I keep it to nine because every ingredient should be pulling its weight.

The Recipe:

- 1/4 cup smoked paprika (Hungarian if you can find it -- regular paprika is too mild)
- 2 tablespoons dark brown sugar (packed)
- 1 tablespoon freshly ground black pepper (pre-ground is acceptable but fresh is better)
- 1 tablespoon garlic powder (not garlic salt -- that's a rookie mistake)
- 1 tablespoon onion powder
- 2 teaspoons kosher salt
- 1 teaspoon cayenne pepper (adjust to taste -- start with half a teaspoon if you're feeding kids)
- 1 teaspoon ground cumin
- 1/2 teaspoon dry mustard powder

Mix everything together in a bowl and store in an airtight jar. It keeps for about three months in a cool, dark pantry. I make a fresh batch every time I do ribs for the reunion because you want those spices fresh and potent.

How to apply it:

For ribs: Remove the membrane from the back of the rack (grab it with a paper towel for grip and pull). Pat the ribs dry. Apply a thin coat of yellow mustard all over -- this is just a binder; you won't taste it. Then apply the rub generously. I use about 3 tablespoons per rack. Let the ribs sit uncovered in the fridge for at least 4 hours, preferably overnight. The salt in the rub will draw out moisture, which then gets reabsorbed along with the flavors.

For pulled pork: Same process but I use about 1/4 cup for a 7-8 pound shoulder. Rub it in well, getting into all the crevices.

For chicken: Go lighter -- about 2 tablespoons for a whole bird. Chicken is more delicate and you don't want the rub to overpower it. Make sure to get some rub under the skin for the best flavor.

The brown sugar is going to caramelize during cooking and create this beautiful, mahogany-colored bark on the outside of your meat. That bark is where all the flavor lives. If your bark looks black, your heat was too high. If it's still pale, give it more time.

This rub has won me three trophies at the church cookout competition and it's the reason I'm in charge of the meat at every reunion. Use it wisely.`,
    type: "recipe",
    tags: ["BBQ", "uncle ray", "dry rub", "grilling"],
    authorKey: "ray",
  },
  {
    title: "Sweet Potato Pie",
    content: `This sweet potato pie is the one I make every Thanksgiving, Christmas, and honestly whenever somebody in the family has a birthday and requests it. It's based on Grandma Odessa's recipe from Mississippi, with a few changes I've made over the years.

The difference between a good sweet potato pie and a great one is roasting the sweet potatoes instead of boiling them. Boiling makes them watery and dilutes the flavor. Roasting concentrates the sugars and gives you a deeper, more caramel-like sweetness.

Ingredients for the filling:
- 2 pounds sweet potatoes (about 3 medium), roasted
- 3/4 cup sugar
- 1/2 cup butter, melted and slightly cooled
- 2 large eggs
- 1/2 cup evaporated milk (not sweetened condensed -- that's a different thing entirely)
- 1 teaspoon vanilla extract
- 1 teaspoon ground cinnamon
- 1/2 teaspoon ground nutmeg (freshly grated makes a world of difference)
- 1/4 teaspoon ground ginger
- Pinch of salt
- 1 unbaked 9-inch pie crust (homemade or store-bought -- I won't judge)

Instructions:

1. Roast the sweet potatoes: Preheat oven to 400 degrees. Wash the sweet potatoes, poke them with a fork several times, wrap each one in aluminum foil, and roast for 45-60 minutes until they're completely soft when squeezed. Let them cool until you can handle them, then peel off the skin. It should slip right off.

2. Reduce oven to 350 degrees.

3. In a large bowl, mash the roasted sweet potatoes until smooth. I use a potato masher first, then switch to a hand mixer to get it really creamy. You don't want lumps.

4. Add the sugar and melted butter to the sweet potatoes and mix well.

5. Beat in the eggs one at a time, mixing after each.

6. Add the evaporated milk, vanilla, cinnamon, nutmeg, ginger, and salt. Mix until the filling is smooth and uniform. It should be pourable but thick.

7. Pour the filling into the unbaked pie crust. Smooth the top with a spatula.

8. Bake at 350 degrees for 55-60 minutes. The pie is done when the center is set but still has a slight jiggle -- like Jello, not like liquid. A toothpick won't work for this one; you have to learn to read the jiggle.

9. Let the pie cool completely at room temperature. This takes 2-3 hours, and patience is required. The filling sets as it cools. If you cut it hot, it'll be runny.

Grandma Odessa's secret addition: a tablespoon of bourbon stirred into the filling before baking. It cooks off during baking so the kids can eat it, but it adds a warmth and complexity that's hard to describe. I always add it at Thanksgiving but leave it out when I'm making it for church.

Serve at room temperature or slightly chilled, with a dollop of fresh whipped cream (not Cool Whip). This pie is a love letter to Mississippi, and it deserves to be treated with respect.`,
    type: "recipe",
    tags: ["sweet potato pie", "thanksgiving", "grandma odessa", "dessert"],
    authorKey: "tanya",
  },
  {
    title: "Sunday Morning Pancakes",
    content: `Every Sunday morning in the Powell house, the kids wake up to the sound of a whisk hitting the side of a mixing bowl and the smell of butter melting on a hot griddle. Sunday pancakes have been a tradition since our kids were little, and now that they're grown and have kids of their own, they still show up at our house on Sunday mornings when they can.

These are not fancy pancakes. They're not sourdough or protein-enriched or gluten-free. They're just good, fluffy, honest pancakes that make you feel like the world is a kind place.

Ingredients:
- 2 cups all-purpose flour
- 2 tablespoons sugar
- 2 teaspoons baking powder
- 1 teaspoon baking soda
- 1/2 teaspoon salt
- 2 cups buttermilk
- 2 large eggs
- 3 tablespoons melted butter, plus extra for the griddle
- 1 teaspoon vanilla extract

Instructions:

1. Whisk the dry ingredients together in a large bowl: flour, sugar, baking powder, baking soda, and salt.

2. In a separate bowl, whisk the buttermilk, eggs, melted butter, and vanilla.

3. Pour the wet ingredients into the dry and stir with a spatula until just combined. Stop stirring when you still see lumps. This is the hardest part for people who like things neat -- you have to leave the lumps alone. Overmixed batter makes tough, flat pancakes. Lumpy batter makes fluffy ones.

4. Let the batter rest for 5 minutes. You'll see bubbles forming on the surface. That's the baking soda and buttermilk doing their thing.

5. Heat a griddle or large nonstick skillet over medium heat. Melt a small pat of butter and swirl it around.

6. Pour about 1/4 cup of batter per pancake. Cook until you see bubbles forming on the surface and the edges look set -- about 2-3 minutes. Flip once and cook another 1-2 minutes until golden brown.

7. Keep finished pancakes warm on a plate in a 200-degree oven while you cook the rest.

Our family's favorite additions:
- Blueberries: Drop them onto the wet batter right after you pour it on the griddle. Don't mix them in or they'll turn the batter purple.
- Chocolate chips: Same technique. Marcus's kids go crazy for these.
- Banana slices: Tanya's preference. She puts sliced bananas and a sprinkle of cinnamon on top.
- Pecans: My personal favorite. Toast them first in a dry skillet for extra flavor.

We serve them with real maple syrup (not the corn syrup kind -- spend the extra few dollars; it's worth it), more butter, and whatever fruit is in season. In the summer, fresh strawberries. In the fall, sauteed apples with cinnamon.

The best part of Sunday pancakes isn't the food. It's the hour we spend together at the table, no phones, no TV, just conversation and laughter and the clinking of forks. That's what I want my grandchildren to remember.`,
    type: "recipe",
    tags: ["breakfast", "pancakes", "sunday tradition", "family"],
    authorKey: "james",
  },
  {
    title: "Collard Greens with Smoked Turkey",
    content: `Collard greens are the cornerstone of Powell family cooking. Grandma Mae made them with a ham hock, but I switched to smoked turkey legs years ago for health reasons and honestly I think the flavor is even better. The smokiness from the turkey gets into the greens in a way that's just beautiful.

This recipe feeds a crowd -- about 8-10 people as a side dish. I make a full batch because greens are even better the next day, reheated in a pot with a splash of vinegar.

Ingredients:
- 3 large bunches of collard greens (about 3 pounds)
- 2 smoked turkey legs (you can find these at most grocery stores)
- 1 large onion, diced
- 4 cloves garlic, minced
- 2 tablespoons apple cider vinegar
- 1 tablespoon sugar
- 1 teaspoon red pepper flakes (more if you like heat)
- Salt and black pepper to taste
- 2 tablespoons olive oil
- 6 cups chicken broth (or water, but broth adds depth)
- Hot sauce for serving (Crystal or Texas Pete -- we don't discriminate)

Instructions:

1. Prep the greens: This is the most time-consuming part. Strip the leaves off the thick center stems. Some people skip this step but those stems are tough and bitter, so don't be lazy. Stack the leaves, roll them up like a cigar, and slice them into 1-inch ribbons. Put the cut greens in a clean sink full of cold water and swish them around. Lift them out, drain the water, and repeat at least three times. Collards grow close to the ground and hold grit like you wouldn't believe. Nobody wants sandy greens.

2. In a large pot (at least 8 quarts), heat the olive oil over medium heat. Add the diced onion and cook until softened and slightly golden, about 5 minutes. Add the garlic and cook another minute.

3. Add the smoked turkey legs and chicken broth. Bring to a boil, then reduce to a simmer. Let the turkey legs cook in the broth for about 30 minutes to build flavor.

4. Start adding the greens in batches. They look like way too much but they'll cook down dramatically. Add a few handfuls, let them wilt, stir, add more. Repeat until all the greens are in the pot.

5. Add the apple cider vinegar, sugar, red pepper flakes, salt, and pepper. The vinegar brightens the flavor and cuts the richness. The sugar isn't enough to make them sweet -- it just balances the natural bitterness of the greens.

6. Cover and simmer on low heat for 1.5 to 2 hours, stirring occasionally. The greens are done when they're tender but still have a slight bite. If they're mushy, you've gone too long.

7. About 30 minutes before they're done, pull out the turkey legs. Let them cool enough to handle, then pull the meat off the bones, shred it, and add it back to the pot. Discard the bones and skin.

8. Taste and adjust seasoning. Greens almost always need more salt than you think.

Serve with cornbread (see Grandma Mae's cornbread recipe in this family vault) and hot sauce on the side. The liquid left in the pot -- called "pot liquor" -- is liquid gold. Soak your cornbread in it or drink it straight from a cup like Grandpa Robert used to.

As Grandma said: you can tell a lot about a family by their greens. Ours tell a story of patience, love, and just the right amount of heat.`,
    type: "recipe",
    tags: ["collard greens", "soul food", "smoked turkey", "grandma mae"],
    authorKey: "mae",
  },
];

// ---------------------------------------------------------------------------
// LESSONS (4)
// ---------------------------------------------------------------------------

const lessons: SeedEntry[] = [
  {
    title: "Always Negotiate Your First Salary Offer",
    content: `When I got my first real job out of college -- an analyst position at a logistics company in 2001 -- they offered me $38,000. I was so excited to have a real salary that I almost said yes on the spot. But Daddy had drilled this into me since high school: the first offer is never the best offer. Always negotiate.

Here's why this matters so much, and why I'm writing it down for the younger members of this family:

That first salary sets the baseline for every raise, every bonus, and every future job offer for years to come. Most raises are percentage-based. If you start at $38,000 and get a 3% raise, that's $1,140. But if you had negotiated up to $42,000 -- which is what I ended up getting -- that same 3% raise is $1,260. The gap compounds every single year. Over a 30-year career, failing to negotiate your first salary can cost you hundreds of thousands of dollars. I've seen the math and it's real.

Here's how to do it:

1. Research the market rate for your position. Use Glassdoor, LinkedIn Salary, the Bureau of Labor Statistics, and talk to people in your field. You need to know the range so you can name a number with confidence.

2. When they make the offer, don't respond immediately. Say: "Thank you so much for this offer. I'm very excited about this opportunity. Can I have a day or two to review the full package?" This is completely normal and expected. Any employer who pressures you to accept on the spot is waving a red flag.

3. Come back with a specific number, not a range. "Based on my research and the value I'll bring to this role, I was hoping for $X." The number should be at the top of the reasonable range -- not outrageous, but ambitious. They can always come down, but they rarely go up from your first counter.

4. Be prepared to justify your number. Talk about your skills, your education, specific things you'll bring to the role. Don't talk about your bills or your personal financial needs -- that's not their concern. Focus on value.

5. If they can't meet you on salary, negotiate other things: signing bonus, extra vacation days, flexible schedule, professional development budget, earlier performance review (which means an earlier raise). There's almost always something they can give you.

6. Be gracious regardless of the outcome. "I appreciate you working with me on this" goes a long way. You want to start the relationship on good terms.

The hardest part for most people is the discomfort. It feels awkward, especially the first time. But here's what I tell my kids: ten minutes of discomfort can be worth $100,000 over your career. That's the best hourly rate you'll ever earn.

Your Auntie Tanya negotiated a 12% increase on her first offer, and she negotiates every offer since. It's a muscle. The more you use it, the easier it gets. Start with your first job and never stop.`,
    type: "lesson",
    tags: ["career", "salary", "negotiation", "money"],
    authorKey: "tanya",
  },
  {
    title: "The Importance of Compound Interest",
    content: `I wish someone had sat me down at eighteen and explained compound interest to me the way I'm about to explain it to you. It would have changed the trajectory of my entire financial life. So listen up, because this might be the most important money lesson you ever learn.

Compound interest is what happens when your money earns interest, and then that interest earns interest, and then that interest earns interest on itself. It's money making money making money, and the longer you let it run, the more powerful it gets.

Here's a real example. Let's say you're 25 years old and you start putting $200 a month into an index fund that averages 8% annual return (which is roughly what the S&P 500 has averaged historically). Just $200 a month. By the time you're 65, you'd have about $700,000. But here's the wild part: you only put in $96,000 of your own money over those 40 years. The other $604,000? That's compound interest doing the work.

Now let's say you wait until you're 35 to start -- just ten years later. Same $200 a month, same 8% return. By 65, you'd have about $300,000. You lost $400,000 by waiting ten years. That first decade of compounding is worth more than the last two decades combined.

This is why I tell every young person in this family: start investing now. Not tomorrow. Not when you "make more money." Not when you "have less bills." Now. Even if it's $50 a month. Even if it feels like nothing.

Here's what your father and I wish we'd done differently:

1. Started earlier. We didn't begin seriously investing until our mid-thirties. We wasted a decade of compounding.

2. Automated it. Once we set up automatic transfers from our checking account to our investment account every payday, we stopped thinking about it. Money we never see is money we don't spend.

3. Kept it simple. We use low-cost index funds (look for expense ratios under 0.20%). You don't need to pick stocks or time the market. Just buy a broad market index fund and leave it alone.

4. Ignored the noise. The market drops sometimes. It dropped in 2008, it dropped in 2020, it'll drop again. But if you zoom out over any 20-year period in the history of the stock market, it has always gone up. Always. The people who lose money are the ones who panic and sell when it drops.

Grandpa Robert used to say, "The best time to plant a tree was twenty years ago. The second-best time is today." That applies to trees and to money. Open an investment account this week. Set up a small automatic contribution. Then forget about it and let compound interest do its thing.

Your future self -- and your future family -- will thank you.`,
    type: "lesson",
    tags: ["finance", "investing", "compound interest", "wealth building"],
    authorKey: "james",
  },
  {
    title: "How to Handle a Job Interview",
    content: `I've been on both sides of the interview table more times than I can count -- as the nervous candidate and as the hiring manager. Here's everything I know about how to walk into a job interview and walk out with an offer.

Before the interview:

Research the company like your life depends on it. Read their website, their recent news, their annual report if they're public. Know what they do, who their competitors are, and what challenges they're facing. When you can reference specific things about the company in your answers, it shows you're serious.

Prepare stories, not answers. Most interview questions are some version of "tell me about a time when..." Use the STAR method: Situation, Task, Action, Result. Have 5-6 stories ready that you can adapt to different questions. Practice them out loud until they feel natural, not rehearsed.

Plan your outfit the night before. Dress one level above what people typically wear in that workplace. If they wear jeans and t-shirts, you wear business casual. If they wear business casual, you wear a suit. Better to be slightly overdressed than underdressed.

Bring five copies of your resume on good paper, a notepad, and a pen. Yes, even though everything is digital now. It shows preparation.

During the interview:

Arrive 10-15 minutes early. Not 30 minutes early (that's awkward) and definitely not late. Greet the receptionist warmly -- I always ask the receptionist's name and use it. You'd be surprised how often hiring managers ask the front desk how candidates treated them.

When you shake hands, make it firm but not crushing. Look them in the eye. Smile. These first thirty seconds set the tone for everything.

Answer questions concisely. The biggest mistake I see candidates make is rambling. Give your answer in 2-3 minutes max, then stop and ask if they'd like you to elaborate. Silence after you finish an answer is okay -- don't fill it with nervous chatter.

Ask thoughtful questions when it's your turn. "What does success look like in this role in the first 90 days?" or "What's the biggest challenge the team is facing right now?" Never ask about salary, vacation, or benefits in the first interview -- save that for after they make an offer.

After the interview:

Send a thank-you email within 24 hours to everyone you met with. Reference something specific from your conversation. Keep it brief -- three sentences is enough. This is not optional; it's expected, and not sending one is noticed.

If you don't hear back by their stated timeline, follow up once. If you still don't hear back, move on. Don't chase.

The most important thing I want the family to remember: an interview is a conversation, not an interrogation. They need someone for this role. You might be that someone. Approach it with confidence, preparation, and the Powell family composure, and you'll do fine.`,
    type: "lesson",
    tags: ["career", "job interview", "professional development", "preparation"],
    authorKey: "tanya",
  },
  {
    title: "Why You Should Always Have 6 Months Savings",
    content: `In 2009, I got laid off from my job at the distribution center. The economy had crashed, companies were cutting everywhere, and on a Tuesday morning in March, my manager called me into a conference room and handed me a packet. After eleven years.

I remember sitting in my car in the parking lot, staring at that packet, and the first thing I felt wasn't anger. It was fear. Because at that moment, we had about $800 in our savings account. $800 between our family and disaster. The mortgage was $1,200 a month. We had two kids in school. The car payment. Insurance. Food.

Your mother and I survived that period through a combination of unemployment benefits, her picking up extra shifts at the hospital, and the grace of God. But it took me four months to find a new job, and those four months nearly broke us. We went into credit card debt that took three years to climb out of.

I swore after that: never again.

Since 2012, your mother and I have maintained an emergency fund of six months' worth of expenses. Not six months of salary -- six months of expenses. That means we sat down, added up everything we spend in a month (mortgage, utilities, insurance, food, gas, minimum debt payments), multiplied by six, and that's our target number.

Here's how we built it, and how you should too:

1. Calculate your monthly essential expenses. Not your wants -- your needs. Rent, food, utilities, insurance, transportation, minimum debt payments. Be honest but conservative.

2. Multiply by six. That's your target. For most people in this family, that's going to be somewhere between $12,000 and $25,000. I know that sounds like a lot. It is a lot. But you don't build it overnight.

3. Open a separate high-yield savings account. Do not keep this money in your checking account where you can see it and spend it. Put it somewhere slightly inconvenient to access -- an online bank like Ally or Marcus (good rates, FDIC insured) works well.

4. Set up an automatic transfer. Even if it's $50 per paycheck. Even if it's $25. The amount matters less than the consistency. Once you've automated it, you'll adjust to living without that money faster than you think.

5. Don't touch it except for real emergencies. A real emergency is: you lost your job, you have a medical crisis, your car broke down and you need it to get to work, your furnace died in January. A real emergency is NOT: a vacation, a sale, a new phone, or "I'll pay it back next month."

6. Once you hit your target, stop contributing to it (redirect that money to investments instead). If you ever have to use some of it, make rebuilding it your top financial priority.

Having that cushion changes how you walk through the world. You make better decisions at work because you're not terrified of losing your job. You handle unexpected expenses without panic. You sleep better. Your mother says I became a different person once we had that safety net, and she's right.

The flood of '93 taught our family that you protect what matters first. This is the financial version of that lesson. Build your emergency fund. Protect your family from the unexpected. Because the unexpected always comes eventually.`,
    type: "lesson",
    tags: ["finance", "emergency fund", "savings", "security"],
    authorKey: "james",
  },
];

// ---------------------------------------------------------------------------
// CONNECTIONS (3)
// ---------------------------------------------------------------------------

const connections: SeedEntry[] = [
  {
    title: "The Williams Family Next Door (40 Years of Friendship)",
    content: `Harold and Betty Williams moved into the house next door to us on South Euclid Avenue in 1983, the same year Marcus was born. Harold was a postal carrier and Betty worked at the Board of Education. They had three kids: DeShawn (same age as James Jr.), Keisha, and little Malcolm who was born the same week as Marcus. Those two boys shared a birthday week and a backyard fence for eighteen years.

The Williams family isn't technically our family, but try telling that to anyone who's been to a Powell Thanksgiving. Betty has had a seat at our table since 1984, and her mac and cheese is the only mac and cheese allowed at Powell gatherings. I tried bringing my own recipe once in 1997 and Betty gave me a look that could have curdled milk. I never tried again.

Harold and James Sr. (my father-in-law, rest his soul) were inseparable. Every Saturday morning they'd sit on Harold's front porch with coffee, arguing about the Bears, the Bulls, local politics, and whose lawn looked better. When James Sr. got sick in 2011, Harold drove him to every single chemotherapy appointment for six months. Every single one. He said that's what neighbors do, but that's not what neighbors do -- that's what family does.

DeShawn Williams was the best man at James Jr.'s wedding. Keisha was Tanya's college roommate (they both went to Illinois State). Malcolm and Marcus started a lawn care business together when they were fifteen and ran it for three summers.

Betty helped me through the worst period of my life -- when Robert passed in 2013. She came over every morning for two months with coffee and sat with me while I cried. She didn't try to fix anything or say the right thing. She just sat there. Sometimes that's exactly what you need.

Harold retired in 2018 after 35 years with the Postal Service. They still live next door. Betty still brings her mac and cheese to Thanksgiving. Harold still argues about the Bears, though now it's with James Jr. since his father is gone.

Contact info: Harold cell: 773-555-0142. Betty cell: 773-555-0143. Their son DeShawn is a firefighter in Naperville -- if anyone in the family ever needs anything in the west suburbs, call DeShawn.

The Williamses are proof that the family you choose is just as important as the family you're born into. Forty years and counting.`,
    type: "connection",
    tags: ["neighbors", "williams family", "friendship", "chicago"],
    authorKey: "mae",
  },
  {
    title: "Pastor Johnson at First Baptist",
    content: `Pastor Theodore Johnson has been the shepherd of First Baptist Church of Hyde Park since 1992. He married James Jr. and Tanya. He baptized their children. He officiated Robert's funeral. He has been a steady, guiding presence in this family for over thirty years, and every member of this family should know who he is and what he means to us.

Pastor Johnson grew up on the West Side, the son of a steelworker and a schoolteacher. He went to Morehouse College and then McCormick Theological Seminary. He came to First Baptist as an associate pastor in 1988 and became senior pastor four years later when Reverend Thompson retired. He was thirty-four years old, and some of the older members weren't sure about having such a young pastor. He won them over in about two weeks.

What makes Pastor Johnson special isn't just his preaching, though his sermons are something else -- the man can make you laugh, cry, and rethink your entire life in forty-five minutes. It's his presence. When Robert was in the hospital, Pastor Johnson came every other day. Not to preach or pray (though he did that too), but to sit and watch the Cubs game with Robert and tell stories about growing up on the West Side. He met Robert where he was. He does that with everyone.

He started the church's community garden in 2005, which is now one of the largest urban gardens on the South Side. He partnered with the high school to offer SAT prep tutoring at the church every Saturday. He organized the annual coat drive that has provided winter coats to over 2,000 families. He shows up at every funeral, every graduation, every hospital room.

When James Jr. went through his rough patch in 2016 (you know what I'm talking about), Pastor Johnson met with him weekly for six months. Not as a therapist, not as a judge, but as a pastor. James says those conversations saved his marriage and possibly his life, and I believe him.

Church service is every Sunday at 10:30 AM. Bible study is Wednesday at 7 PM. Pastor Johnson's office hours are Tuesday and Thursday, 10 AM to 2 PM, and he always says his door is open to any Powell family member, any time.

Contact: Church office: 773-555-0200. Pastor Johnson direct: 773-555-0201. Email: pastor.johnson@firstbaptisthp.org.

If you're going through something hard and you don't know who to talk to, call Pastor Johnson. He's been there for this family through everything, and he'll be there for you too.`,
    type: "connection",
    tags: ["church", "pastor johnson", "first baptist", "faith"],
    authorKey: "mae",
  },
  {
    title: "Dr. Chen, the Family Doctor for 20 Years",
    content: `Dr. Linda Chen has been the Powell family's primary care physician since 2005, and she is one of the most important people in our lives. She operates out of the Southshore Medical Group on East 71st Street, and she is the only doctor I have ever met who actually listens.

I found Dr. Chen after a string of doctors who spent about four minutes with me per visit and couldn't remember my name between appointments. Dr. Chen's first appointment with me was forty-five minutes long. She asked about my family medical history, my diet, my stress levels, my sleep, my parents' health, and my grandparents' health. She took notes in a little leather notebook in addition to the computer chart. She still has that notebook.

Here's what every family member should know about our medical history, which Dr. Chen has documented thoroughly:

The Powell side has a history of high blood pressure and Type 2 diabetes. Grandpa Robert was diagnosed with hypertension at 52 and managed it with medication for the rest of his life. Grandma Odessa had Type 2 diabetes. Uncle Vernon had a heart attack at 58 (he's fine now, but it was a wake-up call for the whole family).

Dr. Chen put together a prevention plan for the family based on this history: regular blood pressure checks starting at age 30, A1C screenings for diabetes starting at 35, and an emphasis on diet, exercise, and stress management. She's the reason I started walking three miles a day and cut back on sodium.

She's also incredibly connected in the Chicago medical community. When Tanya needed a specialist for her knee, Dr. Chen made three calls and had her in with the best orthopedic surgeon at University of Chicago within a week. When Marcus's daughter had that allergic reaction, Dr. Chen talked us through what to do over the phone at 9 PM on a Saturday. She gave us her cell phone number years ago and told us to use it for emergencies, and she means it.

Important details:

Dr. Linda Chen, MD
Southshore Medical Group
2345 E. 71st Street, Suite 200, Chicago, IL 60649
Office: 773-555-0310
Dr. Chen's direct line: 773-555-0311
Office hours: Monday-Friday, 8 AM - 5 PM. Saturday mornings by appointment.
She accepts Blue Cross, Aetna, United, and Medicaid.

If you're a new family member (spouses, the kids when they turn 18), call the office and tell them you're with the Powell family and Dr. Chen will make sure you get in quickly. She treats our whole family and knows our history, which is invaluable.

Health is everything. Without it, none of the other things in this family vault matter. Take care of yourselves, get your checkups, and trust Dr. Chen. She has earned it.`,
    type: "connection",
    tags: ["doctor", "healthcare", "dr. chen", "family health"],
    authorKey: "tanya",
  },
];

// ---------------------------------------------------------------------------
// GENERAL (4)
// ---------------------------------------------------------------------------

const general: SeedEntry[] = [
  {
    title: "Family Emergency Contacts and Important Numbers",
    content: `Every family member should have this list saved in their phone and printed on a piece of paper kept in a safe place at home. When an emergency happens, you don't want to be searching through contacts. You want to know exactly who to call.

FAMILY CONTACTS:
- James Powell Jr. (family coordinator): 773-555-0101
- Mae Powell (matriarch): 773-555-0102
- Tanya Powell-Davis: 773-555-0103
- Ray Powell: 773-555-0104
- Marcus Powell: 312-555-0105

MEDICAL:
- Dr. Linda Chen (family physician): 773-555-0311
- Southshore Medical Group: 773-555-0310
- University of Chicago Emergency Room: 773-555-0400
- Poison Control: 1-800-222-1222
- Nearest urgent care (CityMD 71st): 773-555-0320

INSURANCE:
- Health insurance: Blue Cross Blue Shield, Group #BC-7742901
- Homeowner's insurance: State Farm, Policy #SF-20394-IL, Agent Tom Bradley: 773-555-0500
- Auto insurance: Allstate, Policy #AL-88472, Agent Nicole Reed: 773-555-0501

LEGAL:
- Family attorney: David Washington, Esq. -- 773-555-0600
- He handles wills, power of attorney, and property matters for our family
- Has copies of all important documents in his office safe

SPIRITUAL:
- Pastor Theodore Johnson: 773-555-0201
- First Baptist Church office: 773-555-0200

HOME SERVICES:
- Plumber (Reliable Plumbing, ask for Mike): 773-555-0700
- Electrician (Southside Electric, ask for Andre): 773-555-0701
- HVAC (ComfortAir, 24-hour emergency): 773-555-0702
- Locksmith (KeyMaster): 773-555-0703

NEIGHBORS:
- Harold & Betty Williams (next door): 773-555-0142 / 773-555-0143
- The Hendersons (across the street): 773-555-0144

UTILITIES:
- ComEd (electric): 1-800-334-7661
- Peoples Gas: 1-866-556-6001
- Chicago Water Department: 311

Important note: If there's a major emergency -- fire, medical crisis, break-in -- call 911 first, then James Jr. He'll coordinate notifying the rest of the family. We have a group text chain ("Powell Emergency") for urgent family-wide communication. If you're not in that group text, talk to James and he'll add you.

Update this list whenever contact information changes. Last updated: January 2024.`,
    type: "general",
    tags: ["emergency contacts", "important numbers", "safety", "reference"],
    authorKey: "james",
  },
  {
    title: "The Family Motto and What It Means",
    content: `"Roots deep, branches wide."

That's the Powell family motto, and it's been our guiding principle for as long as I can remember. Grandma Mae came up with it sometime in the early 1980s, and she had it embroidered on a sampler that hung in her kitchen until the day she passed. That sampler is now in James and Tanya's living room.

The meaning is layered, the way all good mottos should be.

"Roots deep" means several things. It means knowing where you come from -- the Mississippi Delta, the Great Migration, Chicago's South Side. It means understanding your history, your people, the struggles and triumphs that brought you to this moment. You can't know where you're going if you don't know where you've been.

It also means being grounded. Having values that don't shift with the wind. Faith, family, education, hard work, community -- these are the roots. When life gets hard (and it will), your roots are what keep you standing. A tree with shallow roots falls in the first storm. A tree with deep roots bends but doesn't break.

"Branches wide" means growth and generosity. It means reaching out -- to new people, new places, new experiences. It means that the strength you draw from your roots should be used to extend yourself into the world, not to close yourself off from it.

It means welcoming new members into the family -- spouses, partners, adopted family, chosen family. The Williams family next door, Pastor Johnson, Dr. Chen -- they're all branches of the Powell tree.

It means spreading knowledge. What you learn, you teach. What you earn, you share (within reason). When someone in the community needs help, you extend a branch. When someone in the family starts something new, you support them.

Grandma Mae used to say this motto when she was making decisions. Should we host the family reunion even though it's expensive? "Roots deep, branches wide." Should the kids be allowed to go away to college? "Roots deep, branches wide." Should we let Uncle Vernon move in when he was going through his divorce? "Roots deep, branches wide."

It's on the banner at every family reunion. We say it at Thanksgiving before the prayer. The kids know it by heart before they know their multiplication tables.

Some families have crests or coats of arms. We have four words, an embroidered sampler, and the understanding that no matter how far any of us goes, we stay rooted in who we are and where we come from.

Roots deep, branches wide. Pass it on.`,
    type: "general",
    tags: ["family motto", "values", "grandma mae", "identity"],
    authorKey: "mae",
  },
  {
    title: "Annual Traditions Calendar",
    content: `This is the Powell family calendar of annual traditions. Some of these go back decades, some are newer. All of them matter, and all of them are on the calendar until further notice. If you're a new member of this family, welcome -- and clear your schedule.

JANUARY
- New Year's Day brunch at James & Tanya's house. Everyone brings a dish. Tanya makes her black-eyed peas for good luck, Mae makes cornbread, and Ray fries the fish. The TV stays on the Rose Parade in the morning and football in the afternoon.

FEBRUARY
- Family Valentine's dinner. Not just for couples -- for everyone. We go to a restaurant (Grandma Mae picks), dress up, and celebrate love in all its forms. Kids are included. This tradition started in 2015 after Grandpa Robert passed, because Grandma said she needed a reason to put on a nice dress in February.

MARCH/APRIL
- Easter Sunday at First Baptist, followed by dinner at Mae's house. The kids (and some adults who shall remain nameless) do an Easter egg hunt in the backyard. Mae hides real money in some of the eggs. Last year Marcus's daughter found the $20 egg and you would have thought she won the lottery.

MAY
- Mother's Day cookout. The women of the family do absolutely nothing. The men cook, clean, and serve. This started as James Jr.'s idea in 2003 and it's the one tradition nobody argues about. Ray handles the grill. James does the setup. Marcus and the kids handle cleanup.

JUNE
- Juneteenth celebration. We started formally observing Juneteenth as a family in 2018, before it became a federal holiday. We do a cookout, someone reads from a relevant text (Frederick Douglass, Langston Hughes, Maya Angelou), and we talk about what freedom means to us as a family. The kids participate in the reading starting at age 10.

JULY
- Powell Family Reunion, July 4th weekend. See the separate entry about the reunion. This is the big one. Non-negotiable. Plan your vacations around it, not the other way around.

SEPTEMBER
- Back-to-school dinner for all the kids (and adults who are in school). Everyone going back to school gets a card with encouragement and a gift card. Mae insists on this, and she's right -- it sets the tone for the year.

NOVEMBER
- Thanksgiving at the family home. Cooking starts Wednesday. Eating starts Thursday at 2 PM sharp. If you're late, you're eating cold food. Menu is fixed: turkey (James), ham (Ray), cornbread (Mae), collard greens (Tanya), mac and cheese (Betty Williams), sweet potato pie (Tanya), and whatever else people want to bring. The men watch football. The women play cards. The kids destroy the basement. Everyone eats too much.

DECEMBER
- Christmas Eve service at First Baptist, 7 PM. Then back to Mae's house for hot chocolate and opening one gift each (tradition since 1975). Christmas Day is for immediate families. December 26th is the family gift exchange using the name-drawing system (draw names at Thanksgiving).
- New Year's Eve game night at James & Tanya's. Board games, cards, dominoes, and the countdown. No going out. We ring in the new year together.

If you need to miss a major event, let James Jr. or Mae know in advance. No-shows without communication will receive a phone call from Grandma Mae, and trust me, you don't want that phone call.`,
    type: "general",
    tags: ["traditions", "calendar", "holidays", "annual events"],
    authorKey: "tanya",
  },
  {
    title: "House Maintenance Schedule",
    content: `After the flood of '93 and a few expensive lessons since then, I've learned that maintaining a house is like maintaining a car -- ignore it and it'll cost you ten times more later. This is the maintenance schedule I follow for our house, and I'm putting it here so the next generation knows what to do when they own a home.

MONTHLY:
- Test all smoke detectors and carbon monoxide detectors. Press the test button. If it doesn't beep loudly, replace the batteries immediately. This is non-negotiable. I test ours on the first of every month.
- Check HVAC air filters. Replace them if they look dirty. A clean filter saves you money on your energy bill and extends the life of your system. I use the MERV-11 rated filters from the hardware store.
- Run water in any bathroom or sink you don't use regularly. This keeps the P-trap (the curved pipe under the sink) full of water, which blocks sewer gas from coming into the house.
- Check under all sinks for leaks. A small drip now is a big water damage bill later.

QUARTERLY (every 3 months):
- Test the garage door auto-reverse safety feature. Place a 2x4 on the ground under the door. If the door doesn't reverse when it hits the board, it needs adjustment. This is a safety issue, especially with kids around.
- Flush the hot water heater to remove sediment. Attach a hose to the drain valve at the bottom, run it outside or into a bucket, and let it flow until the water runs clear. Sediment buildup reduces efficiency and can cause premature failure.
- Clean the dryer vent. Not just the lint trap (you should clean that every load), but the actual vent hose that goes to the outside. Lint buildup is a fire hazard -- this is the number one cause of dryer fires.
- Inspect caulking around bathtubs, showers, and sinks. If it's cracked or peeling, remove it and re-caulk. Water getting behind tile is how you get mold, and mold is expensive and unhealthy.

TWICE A YEAR (spring and fall):
- Spring: service the air conditioning before summer. Change the filter, clean the condenser coils outside (garden hose works fine), and make sure the drainage line is clear.
- Fall: service the furnace before winter. Change the filter, check the pilot light or igniter, and have a professional do a tune-up every other year.
- Clean gutters in spring and fall. Clogged gutters cause water to pool around your foundation, which can lead to basement flooding and foundation damage. If you don't want to climb a ladder, hire someone -- it's worth every penny.
- Check the roof for missing or damaged shingles. You can do this from the ground with binoculars. Fix any issues before they become leaks.
- Inspect the foundation for cracks. Small hairline cracks are normal. Cracks wider than a quarter inch, or cracks that are growing, need professional evaluation.

ANNUALLY:
- Have the chimney inspected and cleaned (if you have a fireplace). Creosote buildup is a fire hazard.
- Test all GFCI outlets (the ones with the test/reset buttons, usually in kitchens, bathrooms, garages, and outdoor areas). Press the test button -- the power should cut off. Press reset to restore it.
- Check the water pressure. Attach a pressure gauge (available for about ten dollars at the hardware store) to an outside faucet. Normal pressure is 40-60 PSI. Too high and you're stressing your pipes; too low and you might have a supply issue.
- Drain and winterize outdoor faucets before the first freeze. Disconnect hoses, shut off the interior valve for outdoor faucets, and open the outdoor faucet to let residual water drain. Frozen pipes burst, and burst pipes are expensive and devastating.

Keep a home maintenance binder (or a folder on your phone) with records of when you did each task, receipts from any professional work, and warranty information for your major systems. When you sell the house someday, this documentation adds value and builds buyer confidence.

A house is the biggest investment most families will ever make. Treat it accordingly.`,
    type: "general",
    tags: ["home maintenance", "house care", "DIY", "seasonal"],
    authorKey: "ray",
  },
];

// ---------------------------------------------------------------------------
// Combined export
// ---------------------------------------------------------------------------

export const seedEntries: SeedEntry[] = [
  ...stories,
  ...skills,
  ...recipes,
  ...lessons,
  ...connections,
  ...general,
];
