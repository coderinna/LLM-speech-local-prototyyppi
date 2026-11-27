
import { DRUG_PATTERNS } from "./drugs/drug-patterns.mjs";
import { WEAPON_PATTERNS } from "./weapons/weapon-patterns.mjs";
import { SELF_HARM_PATTERNS } from "./self-harm/self-harm-patterns.mjs";
import { VIOLENCE_PATTERNS } from "./violence/violence-patterns.mjs";
import { SUBSTANCE_PATTERNS } from "./substances/substance-patterns.mjs";
import { HATE_PATTERNS } from "./hate/hate-patterns.mjs";
import { BULLYING_PATTERNS } from "./bullying/bullying-patterns.mjs";

export const SAFETY_RULES = [
  {
    reason: "DRUG_TOPIC",
    patterns: DRUG_PATTERNS,
    response: "En juttele huumeista. Voitaisiinko puhua vaikka eläimistä?"
  },
  {
    reason: "WEAPON_TOPIC",
    patterns: WEAPON_PATTERNS,
    response: "En neuvo aseiden tai räjähteiden käytössä. Puhutaanko jostain muusta?"
  },
  {
    reason: "SELF_HARM",
    patterns: SELF_HARM_PATTERNS,
    response: "Kuulostaa tärkeältä asialta. Kerrothan tästä turvalliselle aikuiselle. Hän voi auttaa sinua."
  },
  {
    reason: "VIOLENCE",
    patterns: VIOLENCE_PATTERNS,
    response: "En auta satuttamaan ketään. Voimme miettiä turvallista ratkaisua yhdessä."
  },
  {
    reason: "SUBSTANCE_TOPIC",
    patterns: SUBSTANCE_PATTERNS,
    response: "En voi keskustella kanssasi päiteistä. Valitse muu keskustelun aihe."
  },
  {
    reason: "HATE_CONTENT",
    patterns: HATE_PATTERNS,
    response: "Puhutaan toisillemme ystävällisesti ja kunnioittavasti."
  },
  {
    reason: "BULLYING",
    patterns: BULLYING_PATTERNS,
    response: "Kiusaaminen ei ole oikein. Jos sinua kiusataan, kerro turvalliselle aikuiselle."
  }
];
