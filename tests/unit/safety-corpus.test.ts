import { describe, expect, it } from "vitest";
import { evaluateSafety } from "@/lib/safety/evaluate";
import type { SafetyCategory } from "@/lib/safety/types";

/*
 * The safety corpus. Real phrasing, typed the way people type on phones.
 * Every positive must trigger the right category; every negative must stay
 * quiet. Add a case here with every rule change.
 */

const POSITIVES: Record<SafetyCategory, string[]> = {
  cardiac: [
    "I have crushing chest pain and my left arm is numb",
    "I think I'm having a heart attack",
    "i think im having a heart attack",
    "I have really bad chest pain right now",
    "my chest hurts and my left arm is numb",
    "chest feels tight and I'm sweating and dizzy",
    "theres a lot of pressure in my chest and my jaw hurts",
    "I keep getting sharp chest pains",
    "my dad is having a heart attack what do i do",
    "my husband has chest pain and he's sweating",
    "she says she has bad chest pain",
    "is it normal that my chest is hurting this much",
  ],
  stroke: [
    "I think im having a stroak",
    "I think I'm having a stroke",
    "my face is drooping and my speech is slurred",
    "my mom's face is drooping and she can't lift her arm",
    "sudden numbness on one side of my face",
    "worst headache of my life came on suddenly",
    "he's slurring his words and can't move his right arm",
    "one side of my body feels numb",
    "grandpa suddenly can't see out of one eye and his arm is weak",
    "my wife is having a stroke",
  ],
  respiratory: [
    "I can't breathe",
    "I cant breath",
    "I can't breath",
    "im having a hard time breathing",
    "my dad collapsed and he isn't breathing",
    "my baby is turning blue",
    "she's gasping for air",
    "he is choking on food",
    "my son is having trouble breathing",
    "I don't have chest pain but I can't breathe",
    "can barely breathe after my inhaler",
  ],
  anaphylaxis: [
    "my throat is closing after I was stung",
    "I think this is anaphylaxis",
    "my throat is swelling after eating peanuts",
    "lips and tongue swelling can't swallow",
    "I had to use my epipen and my face is swollen",
    "my throat feels tight after the shrimp",
  ],
  bleeding: [
    "I'm bleeding and it won't stop",
    "he's bleeding a lot and it won't stop",
    "cut my hand and the bleeding wont stop",
    "blood is gushing from the cut",
    "I'm throwing up blood",
    "he is bleeding heavily from his head",
  ],
  consciousness: [
    "he won't wake up",
    "I just passed out",
    "she fainted and won't wake up",
    "my grandma collapsed in the kitchen",
    "my brother is unconscious",
    "he's having a seizure right now",
    "my dad is unresponsive",
  ],
  overdose: [
    "I took a whole bottle of pills",
    "I overdosed",
    "i overdosed on heroin",
    "I took 30 pills",
    "I took a bunch of my sleeping pills",
    "my friend took too many xanax",
    "i swallowed all of my antidepressants",
    "i think my roommate is overdosing",
  ],
  poisoning: [
    "my son swallowed bleach",
    "my toddler drank cleaning fluid",
    "my daughter ate a laundry pod",
    "the baby swallowed a button battery",
    "I accidentally drank some antifreeze",
    "my kid got into the rat poison",
    "i think i was poisoned",
  ],
  self_harm: [
    "I want to kill myself",
    "i want to kms",
    "I'm suicidal",
    "im suicidle",
    "I don't want to be alive anymore",
    "everyone would be better off if i was dead",
    "thinking about ending it all tonight",
    "I've been cutting myself and cant stop",
    "i wanna die",
    "i wish i was dead",
    "i have nothing to live for",
    "how do i kill myself",
    "what is the easiest way to end my life",
    "I took 30 pills because I want to die",
    "my brother keeps talking about suicide",
    "I've been having suicidal thoughts",
    "i want to hurt myself",
  ],
};

const NEGATIVES = [
  // Educational questions
  "What is chest pain?",
  "What are signs of stroke?",
  "What are the warning signs of a heart attack?",
  "what does anaphylaxis mean",
  "What is the suicide hotline?",
  "how do I know if I'm dehydrated",
  "what causes shortness of breath when running",
  "can you explain what an epipen does",
  "what should I do if someone is choking",
  "Can you explain saturated fat?",
  "is poison ivy dangerous",
  // Negation
  "I don't have chest pain.",
  "I do not want to hurt myself.",
  "no chest pain, just curious about cholesterol",
  "I never had a stroke",
  "I didn't take too many pills, I took my normal dose",
  // Past history and family history
  "My grandfather had a stroke years ago.",
  "my dad had a heart attack in 2015",
  "I passed out once when I was a kid",
  "my mom has a history of heart attacks",
  "I had an allergic reaction last year",
  // Media
  "I watched a movie where someone overdosed.",
  "in the tv show a guy has a heart attack",
  // Hyperbole and everyday talk
  "I ate a heart attack burger lol",
  "this workout is killing me",
  "i could die for some pizza",
  "dying to try that new salad place",
  "work is killing me this week",
  "I'm dead lol that was funny",
  "scared to death of needles",
  // Wellness logging
  "oatmeal with banana and peanut butter",
  "ribeye steak cooked with butter",
  "took my vitamins with breakfast",
  "I took my pills this morning",
  "walked 20 minutes, easy",
  "slept badly, stressed about work",
  "how much sodium is in bleach-free cleaner",
  "how do i lower my cholesterol",
  "my chest workout was hard today",
  "I can't stop eating chips",
  "I'm bleeding from a paper cut, it's fine",
];

describe("safety corpus: every emergency triggers", () => {
  for (const [category, phrases] of Object.entries(POSITIVES)) {
    it.each(phrases)(`${category}: %s`, (text) => {
      const decision = evaluateSafety(text);
      expect(decision.emergency, text).toBe(true);
      if (category === "self_harm" || text.includes("want to die")) {
        expect(decision.responseKind).toBe("crisis");
      } else {
        expect(decision.category).toBe(category);
        expect(decision.responseKind).toBe("medical");
      }
    });
  }
});

describe("safety corpus: ordinary text stays quiet", () => {
  it.each(NEGATIVES)("%s", (text) => {
    const decision = evaluateSafety(text);
    expect(decision.emergency, `${text} matched ${decision.matchedRuleId}`).toBe(false);
  });
});
