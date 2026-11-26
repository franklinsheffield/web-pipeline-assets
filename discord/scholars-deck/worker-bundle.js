// Instant /tarot for "Science is Magic" — Cloudflare Worker (free plan), Discord interactions endpoint.
// Same 78-card deck as the nightly Seeker's Draw (deck.json from `tarot.py export-deck`).
// Secrets: DISCORD_PUBLIC_KEY (from the Discord app's General Information page).
const MAJ = [["The Fool", "beginnings, a leap of faith, beginner's mind", "recklessness, hesitation, a leap taken blind"], ["The Magician", "skill, will, turning knowledge into action", "scattered talent, tricks, will without skill"], ["The High Priestess", "intuition, hidden knowledge, listening", "ignored intuition, secrets kept from yourself"], ["The Empress", "abundance, nurture, creation", "neglect, creative block, smothering care"], ["The Emperor", "structure, discipline, authority", "rigidity, control for its own sake"], ["The Hierophant", "tradition, teachers, received wisdom", "dogma questioned, breaking from received wisdom"], ["The Lovers", "choice, values, union", "misaligned values, a choice avoided"], ["The Chariot", "willpower, direction, momentum", "lost direction, force without aim"], ["Strength", "patience, quiet courage, gentle mastery", "self-doubt, patience worn thin"], ["The Hermit", "solitude, study, the inner lamp", "isolation, withdrawal that stops teaching"], ["Wheel of Fortune", "cycles, chance, turning points", "resisting change, a run of bad timing"], ["Justice", "truth, fairness, cause and effect", "bias, avoided accountability"], ["The Hanged Man", "a new angle, surrender, pause", "stalling, a pause that becomes a rut"], ["Death", "endings that make room, transformation", "clinging to what has already ended"], ["Temperance", "balance, blending, the middle path", "excess, imbalance, mixing what should stay apart"], ["The Devil", "attachments, habits, what binds us", "breaking free, naming the chain"], ["The Tower", "sudden insight, collapse of false structures", "a collapse delayed, fear of necessary change"], ["The Star", "hope, renewal, guidance", "discouragement, hope gone quiet"], ["The Moon", "illusion, dreams, the unknown", "confusion clearing, a hidden truth surfacing"], ["The Sun", "clarity, joy, vitality", "joy dimmed, clarity just out of reach"], ["Judgement", "awakening, reckoning, a calling", "self-doubt, ignoring the call"], ["The World", "completion, integration, wholeness", "loose ends, a cycle not yet closed"]];
const SUITS = {"Wands": ["energy and drive", "energy blocked, delayed or burning out"], "Cups": ["feeling and relationships", "feelings held back, turned inward or unspoken"], "Swords": ["thought and truth", "muddled thinking, harsh words, a thought that cuts the thinker"], "Pentacles": ["body, craft and resources", "resources stuck, neglected or mismanaged"]};
const RANKS = [["Ace", "a fresh spark of"], ["Two", "a choice in"], ["Three", "early growth in"], ["Four", "stability in"], ["Five", "struggle in"], ["Six", "recovery and sharing in"], ["Seven", "testing and perseverance in"], ["Eight", "focused practice in"], ["Nine", "near-fulfilment of"], ["Ten", "the full weight of"], ["Page", "curiosity and first lessons in"], ["Knight", "bold pursuit of"], ["Queen", "mature care for"], ["King", "command and mastery of"]];
const LAB = {"Major": "Which belief would this card ask you to test, and what result would change your mind?", "Wands": "What small experiment could you run this week to act on that spark?", "Cups": "Who in your life does this card point to, and what would you say to them?", "Swords": "What idea are you holding that this card asks you to question?", "Pentacles": "What practical step, tool or habit does this card ask you to build?"};
const EMOJI = new Proxy({"The Fool": "<a:tarot_fool:1575422974679326874>", "The Magician": "<a:tarot_magician:1575423983506169897>", "The High Priestess": "<a:tarot_high_priestess:1575424989174177792>", "The Empress": "<a:tarot_empress:1575425993412448338>", "The Emperor": "<a:tarot_emperor:1575427001882255470>", "The Hierophant": "<a:tarot_hierophant:1575427376958021727>", "The Lovers": "<a:tarot_lovers:1575427397661098095>", "The Chariot": "<a:tarot_chariot:1575427419123351592>", "Strength": "<a:tarot_strength:1575427438408892497>", "The Hermit": "<a:tarot_hermit:1575427457769803776>", "Wheel of Fortune": "<a:tarot_wheel:1575427485695221821>", "Justice": "<a:tarot_justice:1575427514778656869>", "The Hanged Man": "<a:tarot_hanged_man:1575427544486907974>", "Death": "<a:tarot_death:1575427573435994132>", "Temperance": "<a:tarot_temperance:1575427607078502541>", "The Devil": "<a:tarot_devil:1575427636736299008>", "The Tower": "<a:tarot_tower:1575427670043402330>", "The Star": "<a:tarot_star:1575427703706886164>", "The Moon": "<a:tarot_moon:1575428259196182670>", "The Sun": "<a:tarot_sun:1575429266039115797>", "Judgement": "<a:tarot_judgement:1575430274202992720>", "The World": "<a:tarot_world:1575431281574019132>"}, { get: (t, k) => t[k] || "<a:tarot_card:1575411377625899079>" });
// Occult lore for the Scholar's deck: 3-5 sentences per card, in the Science is Magic voice.
const LORE_MAJ = {
  "The Fool": ["Arcanum 0, the number before all numbers, steps off the cliff with a satchel of unwritten notes and a dog that knows better.", "Every alchemist began here, standing at the lip of the Great Work with nothing but curiosity and a pair of sturdy boots.", "This is the beginner's mind the old mystics prized: no map, all wonder.", "Reversed, the leap curdles into either paralysis at the edge or a jump made blindfolded."],
  "The Magician": ["Arcanum I raises one hand to the heavens and points the other to the earth: as above, so below, written in a single gesture.", "On the altar lie all four elemental tools, the wand, the cup, the sword and the pentacle, ready for the experiment.", "This is the card of turning knowledge into action, the moment the scholar becomes the practitioner.", "Reversed, the tools sit unused or get used for sleight of hand, talent without a true aim."],
  "The High Priestess": ["Arcanum II sits between the black pillar and the white, guarding the veil that hides the inner temple.", "In her lap rests a scroll only partly unrolled, the akashic record of what you already know but have not yet admitted.", "She teaches that some data only arrives in silence, through dreams, hunches and the pause before you speak.", "Reversed, the veil is drawn tight: you are keeping a secret from yourself."],
  "The Empress": ["Arcanum III is the garden goddess, crowned with twelve stars and seated in wheat that grows wherever she looks.", "She is creation in its most generous form, the fertile soil where ideas, projects and people take root.", "Her element is abundance, and her rule is simple: what you tend, grows.", "Reversed, the garden is neglected or overwatered, care that starves or care that smothers."],
  "The Emperor": ["Arcanum IV sits on a stone throne carved with rams, the architect of order who turns chaos into a floor plan.", "He is the laboratory protocol, the calendar, the discipline that lets a wild idea survive contact with reality.", "Structure is not his prison but his gift: walls are what make a room.", "Reversed, the throne becomes a cage, control kept for its own sake."],
  "The Hierophant": ["Arcanum V is the keeper of the mysteries, the teacher who holds the crossed keys to the old libraries.", "He stands for lineage: traditions, mentors and the hard-won wisdom passed hand to hand across centuries.", "Every scholar needs a teacher before they can become one.", "Reversed, he asks you to test the dogma, because received wisdom is a hypothesis until you check it."],
  "The Lovers": ["Arcanum VI shows two figures beneath an angel with the sun blazing behind, and the choice between them is the real subject.", "This is the card of union, but also of values: what you choose reveals what you worship.", "In the alchemical tradition it is the sacred marriage of opposites that births something new.", "Reversed, values and actions drift apart, or a choice is quietly being avoided."],
  "The Chariot": ["Arcanum VII charges forward behind two sphinxes, one black and one white, pulling in opposite directions.", "The charioteer holds no reins, steering by will alone, the oldest trick in the grimoire.", "This is momentum earned by focus: victory comes from aligning forces that would rather tear you apart.", "Reversed, the sphinxes win and the chariot circles, force without direction."],
  "Strength": ["Arcanum VIII shows a woman gently closing the jaws of a lion, with the infinity sigil floating above her head.", "Her power is not muscle but patience, the quiet courage that tames the beast by befriending it.", "In the old lodges this was the mastery of the lower self through love rather than force.", "Reversed, the lion roars back as self-doubt, or patience simply runs out."],
  "The Hermit": ["Arcanum IX climbs the snowy peak alone, holding a lantern that contains a six-pointed star.", "He is the scholar at midnight, the monk in the library, the seeker who withdraws to finally hear the signal under the noise.", "His light is meant to be shared: he climbs so he can show others the path.", "Reversed, solitude hardens into isolation, a lamp hidden under a bushel."],
  "Wheel of Fortune": ["Arcanum X spins with the sphinx on top and the serpent descending, the four winged creatures reading in each corner of the sky.", "It is the cosmic cycle: seasons, tides, the turning of luck that no one fully controls.", "The occult lesson is not to fear the wheel but to ride it, knowing every low is a rising.", "Reversed, the wheel sticks, or you are fighting a turn that has already happened."],
  "Justice": ["Arcanum XI holds the double-edged sword in one hand and the scales in the other, and her gaze does not blink.", "She is cause and effect, the universe as a lab notebook where every input leaves a result.", "Truth is her element: what is measured honestly can finally be corrected.", "Reversed, the scales tilt toward bias, or accountability is being dodged."],
  "The Hanged Man": ["Arcanum XII dangles upside down from a living tree, serene, a halo glowing round his head.", "He chose this, because some truths are only visible from a strange angle.", "This is the sacred pause of the initiate: surrender the old view and the new one arrives.", "Reversed, the pause becomes a rut, waiting that no longer teaches anything."],
  "Death": ["Arcanum XIII rides a pale horse beneath a black banner bearing a white rose, and kings and children alike fall before it.", "Do not flinch: this card almost never means a literal death, but the ending that clears the ground.", "In the alchemist's furnace this is putrefaction, the necessary rot before gold.", "Reversed, you are clinging to something that has already finished its work."],
  "Temperance": ["Arcanum XIV pours liquid between two cups, one foot on land and one in water, an angel running an experiment in balance.", "This is the alchemist's patient art: blending opposites in exact measure until a new substance appears.", "Her path is the middle one, the steady titration of a life.", "Reversed, the mixture fails, too much of one thing, or things combined that should stay apart."],
  "The Devil": ["Arcanum XV sits on a black altar with two figures chained loosely at his feet, loose enough to slip off at any time.", "He is the card of attachments, the habits, cravings and stories that bind us because we let them.", "Naming the chain is the first spell of release.", "Reversed, the chains are coming off: you can see the trap, and you are walking out."],
  "The Tower": ["Arcanum XVI is struck by lightning and the crown blows off the top as two figures fall into the night.", "It is the flash of sudden insight that destroys a false structure in a single instant.", "Painful, yes, but every lab knows a failed experiment teaches faster than a successful one.", "Reversed, the collapse is delayed, held off by fear of a change that is already necessary."],
  "The Star": ["Arcanum XVII kneels naked beneath eight stars, pouring water onto the land and back into the pool.", "After the Tower comes the calm: hope, renewal and the quiet guidance of a sky that is still there.", "She is the navigator's star, the reminder that you can always find north again.", "Reversed, hope goes quiet for a while, though the stars have not gone anywhere."],
  "The Moon": ["Arcanum XVIII glows over a road between two towers while a dog and a wolf howl and a crayfish crawls from the deep.", "This is the realm of dreams, illusions and the unconscious, where nothing is quite what it seems.", "The occultist walks this road slowly, testing every shadow before trusting it.", "Reversed, the fog begins to lift and a hidden truth surfaces."],
  "The Sun": ["Arcanum XIX blazes over a child riding a white horse past a wall of sunflowers, arms flung wide.", "It is clarity, vitality and joy, the experiment that finally works and the answer you can see in daylight.", "Every alchemist dreams of this card: the gold, the rubedo, the Great Work complete for a moment.", "Reversed, the light is dimmed by clouds, but it is still the sun."],
  "Judgement": ["Arcanum XX sounds the angel's trumpet and the sleepers rise from their graves, arms open to the sky.", "This is the awakening, the reckoning, the moment a true calling finally gets your full attention.", "It asks you to judge yourself honestly and then rise anyway.", "Reversed, the trumpet sounds but self-doubt keeps you lying down."],
  "The World": ["Arcanum XXI dances inside a laurel wreath, the four living creatures watching from every corner of the cosmos.", "It is completion and integration, the moment the whole pattern becomes visible at once.", "The Fool's journey ends here, and in the same breath begins again on a higher turn of the spiral.", "Reversed, the cycle is almost closed, with a few loose ends still to tie."],
};
const SUIT_LORE = {
  Wands: { el: "Fire", glyph: "🔥", lore: "Wands burn with elemental Fire, the salamander's realm of will, ambition and creative spark.", rev: "Reversed, the fire smoulders: drive is blocked, scattered, or burning out faster than it can be fed." },
  Cups: { el: "Water", glyph: "🌊", lore: "Cups hold elemental Water, the undine's realm of feeling, intuition and the bonds between people.", rev: "Reversed, the water stagnates: feelings are held back, turned inward, or left unspoken." },
  Swords: { el: "Air", glyph: "🌪️", lore: "Swords cut through elemental Air, the sylph's realm of thought, truth and the words we wield.", rev: "Reversed, the blade turns on its owner: muddled thinking, harsh words, or a belief that cuts the believer." },
  Pentacles: { el: "Earth", glyph: "🪙", lore: "Pentacles are minted from elemental Earth, the gnome's realm of body, craft, money and the slow work of building.", rev: "Reversed, the earth goes fallow: resources stuck, neglected, or poured into the wrong ground." },
};
const RANK_LORE = {
  Ace: "The Ace is the seed of the whole suit, a single hand from the clouds offering raw potential before it has taken any shape.",
  Two: "The Two is the first polarity, a fork in the road where the energy must choose a direction.",
  Three: "The Three is the first growth, the moment an idea leaves the head and becomes something others can see.",
  Four: "The Four is the square, the foundation stone, a rest point where the energy settles into a stable form.",
  Five: "The Five is the disruption, the friction that every working must pass through before it matures.",
  Six: "The Six is the harmony after struggle, recovery and generosity flowing once more.",
  Seven: "The Seven is the test, the initiate's trial where perseverance is weighed.",
  Eight: "The Eight is focused practice, the hours in the workshop where skill quietly compounds.",
  Nine: "The Nine stands at the threshold of fulfilment, nearly complete and carrying the weight of the journey.",
  Ten: "The Ten is the suit taken to its limit, the full harvest and the full burden at once.",
  Page: "The Page is the apprentice of the suit, a student messenger with fresh eyes and a lot to learn.",
  Knight: "The Knight is the suit in motion, a bold quester charging toward the goal, sometimes too fast.",
  Queen: "The Queen is the suit mastered from within, mature care and deep understanding held with grace.",
  King: "The King is the suit mastered outwardly, command and authority used to build and protect.",
};
const POS_LORE = {
  Past: "Sitting in the Past seat, it names a force that has already shaped the question.",
  Present: "In the Present seat, it describes the ground you are standing on right now.",
  Future: "In the Future seat, it shows where this road leads if nothing in the experiment changes.",
};

const DECK = [...MAJ.map(([name, meaning, reversed]) => ({ name, meaning, reversed, suit: "Major", lab: LAB.Major })),
  ...Object.entries(SUITS).flatMap(([s, [sm, rev]]) => RANKS.map(([r, m]) => ({ name: `${r} of ${s}`, rank: r, meaning: `${m} ${sm}`, reversed: rev, suit: s, lab: LAB[s] })))];

const hex = (h) => new Uint8Array(h.match(/../g).map((b) => parseInt(b, 16)));
const json = (o) => new Response(JSON.stringify(o), { headers: { "content-type": "application/json" } });

async function verified(req, body, pub) {
  const sig = req.headers.get("x-signature-ed25519"), ts = req.headers.get("x-signature-timestamp");
  if (!sig || !ts) return false;
  const key = await crypto.subtle.importKey("raw", hex(pub), { name: "Ed25519" }, false, ["verify"]);
  return crypto.subtle.verify({ name: "Ed25519" }, key, hex(sig), new TextEncoder().encode(ts + body));
}

function draw(n) {
  const idx = [...DECK.keys()];
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = crypto.getRandomValues(new Uint32Array(2));
    const c = DECK[idx.splice(r[0] % idx.length, 1)[0]];
    out.push({ ...c, rev: r[1] / 2 ** 32 < 0.3 });
  }
  return out;
}

// Night Arcade palette
const COLOR = { Major: 0xF2B63C, Wands: 0xFF3DB8, Cups: 0x22E5FF, Swords: 0xF4F1FF, Pentacles: 0x7BD88F, Reading: 0x2A1A4A };
const POS = { Past: "What shaped this", Present: "Where you stand", Future: "Where it leads if nothing changes" };
const SUIT_KW = { Wands: "drive", Cups: "feeling", Swords: "thought", Pentacles: "craft and resources" };
const short = (s) => s.split(",")[0].trim();
const kw = (c) => (c.rev ? short(c.reversed) : c.suit === "Major" ? short(c.meaning) : `${RANKS.find(([r]) => r === c.rank)[1]} ${SUIT_KW[c.suit]}`);

function lore(c, pos) {
  let s;
  if (c.suit === "Major") {
    const L = LORE_MAJ[c.name];
    s = [...L.slice(0, 3)];
    if (pos) s.push(POS_LORE[pos]);
    if (c.rev) s.push(L[3]);
  } else {
    const S = SUIT_LORE[c.suit];
    s = [S.lore, RANK_LORE[c.rank]];
    if (pos) s.push(POS_LORE[pos]);
    s.push(c.rev ? S.rev : `Upright, it speaks of ${c.meaning}.`);
  }
  return s.join(" ");
}

function cardEmbed(c, pos) {
  const tag = c.suit === "Major" ? "Major Arcana" : `${SUIT_LORE[c.suit].glyph} ${c.suit} · ${SUIT_LORE[c.suit].el}`;
  const state = c.rev ? "⤵️ reversed (upside down)" : "upright";
  const head = `${EMOJI[c.name]} ${pos ? `**${pos}** · ` : ""}**${c.name}**, *${state}*\n-# ${tag}${pos ? ` · ${POS[pos]}` : ""}`;
  return {
    color: COLOR[c.suit],
    description: `${head}\n\n${lore(c, pos)}\n\n-# Upright: ${c.meaning} · Reversed: ${c.reversed}`.slice(0, 1500),
  };
}

const THEMES = [
  { key: "Cups", words: /\b(love|lover|partner|relationship|dating|crush|friend|family|marriage|heart|feel|feelings|ex|romance|soulmate)\b/i, name: "matters of the heart" },
  { key: "Pentacles", words: /\b(money|job|work|career|business|income|finance|house|home|health|body|client|sell|pay|rent|salary|invest)\w*/i, name: "money, work and the material world" },
  { key: "Swords", words: /\b(decide|decision|choose|choice|truth|idea|plan|study|learn|exam|school|conflict|argument|think|mind|clarity|torn|either)\w*/i, name: "a decision and the truth of it" },
  { key: "Wands", words: /\b(project|start|launch|create|creative|art|passion|motivat|energy|build|ambition|goal|grow|channel|brand|content)\w*/i, name: "a creative project and the drive behind it" },
  { key: "Major", words: /\b(purpose|path|calling|spirit|soul|destiny|meaning|life|universe|journey|future|shadow|self)\w*/i, name: "your path and purpose" },
];

function interpret(cards, question) {
  const q = (question || "").trim();
  const score = (t) => (q.match(new RegExp(t.words.source, "gi")) || []).length;
  const theme = q && THEMES.map((t) => [t, score(t)]).filter(([, n]) => n).sort((a, b) => b[1] - a[1])[0]?.[0];
  const out = [];
  out.push(q ? `🔮 You asked: *${q.slice(0, 140)}*` : "🔮 You asked nothing aloud, so the deck answered the question you carry in.");

  const counts = {}; cards.forEach((c) => (counts[c.suit] = (counts[c.suit] || 0) + 1));
  const majors = counts.Major || 0;
  const dom = Object.entries(counts).filter(([s, n]) => s !== "Major" && n >= 2).map(([s]) => s)[0];

  if (theme) {
    const hit = counts[theme.key] || 0;
    const label = theme.key === "Major" ? "the Major Arcana" : `${theme.key} (${SUIT_LORE[theme.key].el})`;
    out.push(hit
      ? `⚗️ The deck heard you: this is about ${theme.name}, and ${hit > 1 ? `${hit} cards answer` : "a card answers"} in ${label}, the very element of your question.`
      : `⚗️ You asked about ${theme.name}, yet the deck answered without ${label}. That is a clue: the answer lives in a different element than the one you are looking in.`);
  }

  if (cards.length === 1) {
    const c = cards[0];
    out.push(`🌀 One card, one lens. ${c.name} answers with ${kw(c)}, ${c.rev ? "an inner knot to untie before the way opens" : "a current already flowing in your favour"}.`);
    out.push(`🔬 Take it into the lab: ${c.lab}`);
    return out.join("\n\n");
  }

  const [p, n, f] = cards;
  out.push(`🌀 The arc runs from **${kw(p)}** (${p.name}), through **${kw(n)}** (${n.name}), toward **${kw(f)}** (${f.name}).`);

  if (majors >= 2) out.push(`👁️ ${majors} Major Arcana in one spread. Bigger currents than everyday choices are moving here; this question touches the Great Work of your life, so treat it with weight.`);
  else if (majors === 1) out.push(`👁️ One Major Arcanum, ${cards.find((c) => c.suit === "Major").name}, marks the hinge of the reading. Whatever it says is the lesson; the other cards are the circumstances.`);
  else out.push("👁️ No Major Arcana appeared. This is everyday magic: the matter is in your own hands, decided by small, repeatable acts.");

  if (dom) out.push(`${SUIT_LORE[dom].glyph} ${counts[dom]} cards in ${dom} make ${SUIT_LORE[dom].el} the ruling element: ${({ Wands: "act, and act with fire, because momentum is your medicine", Cups: "feel it through and say it aloud, because the answer is emotional before it is logical", Swords: "think it through and speak the truth plainly, because clarity is the spell here", Pentacles: "build it slowly with your hands, because steady practical work will carry this" })[dom]}.`);

  const revs = cards.map((c, i) => (c.rev ? ["Past", "Present", "Future"][i] : null)).filter(Boolean);
  if (revs.length === 0) out.push("🌕 Every card stands upright. The currents flow freely; nothing is fighting you except hesitation.");
  else if (revs.length === 1) out.push(`🌗 One card turned upside down, in the ${revs[0]} seat. ${({ Past: "An old pattern still pulls backwards; name it so it loses its grip.", Present: "The block is happening now; this is where your attention belongs this week.", Future: "The road ahead bends inward unless something shifts; the future is a hypothesis, not a verdict." })[revs[0]]}`);
  else out.push(`🌑 ${revs.length} cards reversed (${revs.join(", ")}). Much of this is held inward: the work is internal first, and the outside world follows.`);

  const future = `the Future seat points toward ${kw(f)}`;
  out.push(`✨ **The counsel:** ${future}, but only if nothing changes. ${n.name} is the lever you can pull today. ${n.lab}`);
  return out.join("\n\n");
}

function reading(user, spread, question) {
  const n = spread === "one" ? 1 : 3, cards = draw(n);
  const pos = n === 1 ? [null] : ["Past", "Present", "Future"];
  const embeds = cards.map((c, i) => cardEmbed(c, pos[i]));
  embeds.push({ color: COLOR.Reading, title: "📜 The Interpretation", description: interpret(cards, question).slice(0, 2500),
    footer: { text: "Instant draws earn no points. Reflect in 🃏 The Seeker's Draw for Scholar's Path points. A mirror for reflection, not a forecast." } });
  const q = question ? `\n> *${question.slice(0, 140)}*` : "";
  return { content: `🃏 **The cards turn for <@${user}>**${q}`, embeds, allowed_mentions: { parse: [] } };
}

export default {
  async fetch(req, env) {
    if (req.method === "GET" && new URL(req.url).pathname === "/register") {
      // one-time: registers /tarot in Science is Magic using the BOT_TOKEN and APP_ID secrets
      const cmd = [{ name: "tarot", description: "Draw from the Scholar's deck", options: [
        { type: 3, name: "question", description: "What you ask the cards (optional, makes the reading personal)", max_length: 140 },
        { type: 3, name: "spread", description: "Three cards (default) or one", choices: [{ name: "past · present · future", value: "three" }, { name: "one card", value: "one" }] }] }];
      const r = await fetch(`https://discord.com/api/v10/applications/${env.APP_ID}/guilds/1530029383404884069/commands`,
        { method: "PUT", headers: { Authorization: `Bot ${env.BOT_TOKEN || env.Bot_token}`, "content-type": "application/json" }, body: JSON.stringify(cmd) });
      return new Response(r.ok ? "/tarot registered" : `failed: ${r.status}`, { status: r.ok ? 200 : 500 });
    }
    if (req.method !== "POST") return new Response("🃏", { status: 200 });
    const body = await req.text();
    if (!(await verified(req, body, env.DISCORD_PUBLIC_KEY))) return new Response("bad signature", { status: 401 });
    const i = JSON.parse(body);
    if (i.type === 1) return json({ type: 1 }); // PING
    if (i.type === 2 && i.data?.name === "tarot") {
      const opt = Object.fromEntries((i.data.options || []).map((o) => [o.name, o.value]));
      const user = i.member?.user?.id || i.user?.id;
      return json({ type: 4, data: reading(user, opt.spread, opt.question) });
    }
    return json({ type: 4, data: { content: "The deck does not know that rite.", flags: 64 } });
  },
};
