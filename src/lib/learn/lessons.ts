export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  body: string;
  takeaway: string;
  sourceIds: string[];
  /** Topics this lesson can sit beside. Empty means it is general. */
  contextIds: string[];
  /** Shown on My Health Factors when coaching stays education-only. */
  general: boolean;
  quiz: { prompt: string; choices: string[]; answer: number };
};

export const LESSONS: readonly Lesson[] = [
  {
    id: "cholesterol",
    title: "Understanding cholesterol",
    minutes: 4,
    body: "Cholesterol is a waxy substance the body uses. LDL and HDL describe different lipoprotein patterns that clinicians look at together, not as a single good-or-bad label. Eating patterns, movement, and family history are among the factors people discuss with a healthcare professional. One meal or one lesson cannot tell you your lab result.",
    takeaway: "Cholesterol is something to understand with your own results, not a score this app calculates.",
    sourceIds: ["nhlbi-blood-cholesterol", "medlineplus-cholesterol"],
    contextIds: ["elevated_cholesterol", "cardiovascular_wellness"],
    general: true,
    quiz: {
      prompt: "What can HealthQuest tell you about your cholesterol?",
      choices: [
        "Your exact LDL number",
        "General education, not a diagnosis or a lab result",
        "That a single meal will change your labs",
      ],
      answer: 1,
    },
  },
  {
    id: "saturated-fat",
    title: "Saturated and unsaturated fat",
    minutes: 4,
    body: "Foods contain different mixes of fats. Eating patterns that are lower in saturated fat are associated with healthier blood cholesterol levels in population guidance. Unsaturated fats are common in foods such as olive oil, nuts, and fish. The Nutrition Facts label lists saturated fat for one serving, which is a way to compare products.",
    takeaway: "Use the label to compare saturated fat. That comparison is not a verdict on the food.",
    sourceIds: ["nhlbi-blood-cholesterol", "fda-nutrition-facts"],
    contextIds: ["elevated_cholesterol"],
    general: false,
    quiz: {
      prompt: "Where can you compare saturated fat for a packaged food?",
      choices: ["A HealthQuest health score", "The Nutrition Facts label", "A guess from the food name"],
      answer: 1,
    },
  },
  {
    id: "food-labels",
    title: "Understanding food labels",
    minutes: 5,
    body: "The Nutrition Facts label starts with a serving size. The numbers under it, including calories, saturated fat, sodium, and fiber, refer to that serving, not always the whole package. Comparing two products works better when the servings are similar.",
    takeaway: "Read the serving size before comparing nutrients.",
    sourceIds: ["fda-nutrition-facts"],
    contextIds: ["healthy_eating", "elevated_cholesterol"],
    general: true,
    quiz: {
      prompt: "The nutrient numbers on a label apply to what?",
      choices: ["The whole package, always", "The serving size listed", "A restaurant meal"],
      answer: 1,
    },
  },
  {
    id: "affordable-meals",
    title: "Affordable meal building",
    minutes: 4,
    body: "A practical plate can include vegetables, fruit, grains, and a protein food. Canned beans, oats, lentils, frozen vegetables, and bulk grains are often inexpensive and widely available. A higher price does not by itself mean a food is more supportive of health. If you write down an approximate cost, that number is yours, not a store price from HealthQuest.",
    takeaway: "Budget-oriented staples can be part of a varied eating pattern.",
    sourceIds: ["myplate", "who-healthy-diet"],
    contextIds: ["healthy_eating"],
    general: true,
    quiz: {
      prompt: "What does HealthQuest know about grocery prices?",
      choices: [
        "It looks up today's store price",
        "It only knows an approximate cost if you enter one",
        "Expensive foods are always more nutritious",
      ],
      answer: 1,
    },
  },
  {
    id: "sleep",
    title: "Sleep consistency",
    minutes: 4,
    body: "Sleep is part of general wellness. A steadier bedtime is a common focus in sleep education. Tracking a few nights can help you notice your own pattern. HealthQuest does not diagnose a sleep disorder from a log.",
    takeaway: "A sleep log is a record of your pattern, not a diagnosis.",
    sourceIds: ["nhlbi-sleep"],
    contextIds: ["sleep"],
    general: true,
    quiz: {
      prompt: "A few nights of sleep tracking can help you do what?",
      choices: ["Diagnose insomnia", "Notice your own pattern", "Replace a sleep study"],
      answer: 1,
    },
  },
  {
    id: "activity",
    title: "Physical activity basics",
    minutes: 4,
    body: "Federal guidance encourages adults to move regularly, in amounts that fit their situation. A walk, chores, or a short workout can all count as movement you chose. HealthQuest records the activity and duration you enter. It does not calculate calories burned, and it does not decide whether the session was enough.",
    takeaway: "You choose the movement. The log records it. It does not grade your body.",
    sourceIds: ["odphp-physical-activity"],
    contextIds: ["fitness", "cardiovascular_wellness"],
    general: true,
    quiz: {
      prompt: "What does an activity log in HealthQuest measure?",
      choices: ["Precise calories burned", "The activity and duration you entered", "Whether you are healthy"],
      answer: 1,
    },
  },
  {
    id: "family-history",
    title: "What family history means",
    minutes: 4,
    body: "MedlinePlus describes family history as health information about you and your close relatives. Families share genes, surroundings, and habits. A condition in a relative can mean a higher chance of some problems, including heart disease and stroke, and it does not mean you will develop that condition. HealthQuest can store a category you check. It does not store relatives’ names, and it does not turn the note into a percentage.",
    takeaway: "Family history is context for a clinician, not a prediction from this app.",
    sourceIds: ["medlineplus-family-history"],
    contextIds: [],
    general: true,
    quiz: {
      prompt: "How does HealthQuest treat family history?",
      choices: ["As a risk percentage", "As education, not a calculated risk", "As something you failed to change"],
      answer: 1,
    },
  },
  {
    id: "blood-pressure",
    title: "Understanding blood pressure",
    minutes: 5,
    body: "Blood pressure is the force of blood on artery walls. It is written as two numbers. The first, systolic, is the force when the heart pumps. The second, diastolic, is the force when the heart fills. NHLBI describes a systolic pressure under 120 and a diastolic pressure under 80 as a healthy range, and consistent readings of 130 systolic or higher, or 80 diastolic or higher, as high blood pressure. HealthQuest does not measure or stage your blood pressure. A clinician does. NHLBI says a clinician may discuss eating pattern, movement, smoking, stress, sleep, and sometimes medicine. A systolic reading higher than 180 or a diastolic reading higher than 120 is urgent: contact a healthcare provider.",
    takeaway: "The two numbers are for a clinician to interpret. This app does not take your blood pressure.",
    sourceIds: ["nhlbi-high-blood-pressure"],
    contextIds: ["high_blood_pressure", "cardiovascular_wellness"],
    general: false,
    quiz: {
      prompt: "What does HealthQuest do with blood pressure?",
      choices: [
        "It stages your reading",
        "It explains the two numbers and leaves measurement to a clinician",
        "It estimates your risk percentage",
      ],
      answer: 1,
    },
  },
  {
    id: "sodium",
    title: "Sodium basics",
    minutes: 4,
    body: "Your body needs some sodium for nerves, muscles, and fluid balance. MedlinePlus explains that extra sodium can build up when the kidneys do not clear it, and that this is associated with high blood pressure. The same page says most adults in the United States get more sodium than they need, and that Dietary Guidelines recommend less than 2.3 grams a day for most adults, about one teaspoon of salt. The Nutrition Facts label lists sodium for one serving. People with high blood pressure, diabetes, or kidney disease should ask a clinician what amount fits them. HealthQuest will not set a sodium target for you.",
    takeaway: "Use the label to see sodium per serving. Your own limit is a clinician conversation.",
    sourceIds: ["medlineplus-sodium", "fda-nutrition-facts"],
    contextIds: ["high_blood_pressure", "healthy_eating"],
    general: false,
    quiz: {
      prompt: "Who sets a sodium limit for you?",
      choices: ["HealthQuest", "A clinician, if you need an individual limit", "The food name alone"],
      answer: 1,
    },
  },
  {
    id: "fiber",
    title: "Fiber basics",
    minutes: 4,
    body: "Dietary fiber is a carbohydrate from plants. MedlinePlus lists whole grains, nuts, seeds, fruit, and vegetables as sources, and says a label may show soluble or insoluble fiber. It describes fiber as helping digestion and adding bulk so a meal can feel filling. Adding a lot at once can cause gas, bloating, and cramps, so the page says to increase it slowly. HealthQuest does not set a fiber gram goal.",
    takeaway: "Fiber comes from plant foods. Add it gradually, and do not treat a lesson as a gram target.",
    sourceIds: ["medlineplus-fiber"],
    contextIds: ["healthy_eating", "prediabetes"],
    general: false,
    quiz: {
      prompt: "What does MedlinePlus suggest when you add fiber?",
      choices: ["Add as much as possible in one day", "Add it slowly", "Skip fruit and vegetables"],
      answer: 1,
    },
  },
  {
    id: "stress",
    title: "Stress and wellness",
    minutes: 4,
    body: "NIMH describes stress as a physical or mental response to an outside cause, and anxiety as a reaction that can continue when there is no current threat. Everyone feels stress. Ideas on that page include keeping a journal, moving, eating regular meals, keeping a sleep routine, and talking with people who help. If stress or anxiety gets in the way of daily life, NIMH says it may be time to talk with a professional. A 1-to-5 note in HealthQuest is only your record. If you are in immediate distress, call or text 988.",
    takeaway: "A stress note is your record. It is not a diagnosis.",
    sourceIds: ["nimh-stress", "988-lifeline"],
    contextIds: ["sleep"],
    general: true,
    quiz: {
      prompt: "What is a stress rating in HealthQuest?",
      choices: ["A diagnosis", "A note you chose to record", "A reason to earn points"],
      answer: 1,
    },
  },
  {
    id: "visit-prep",
    title: "Preparing for a visit",
    minutes: 4,
    body: "A useful visit often starts with your questions. You might ask what a cholesterol or blood pressure result means for you, which habits are most relevant, and what is realistic on your grocery budget. Bring the questions. The clinician interprets your results.",
    takeaway: "Prepare questions. Leave interpretation to a qualified professional.",
    sourceIds: ["medlineplus-cholesterol"],
    contextIds: [],
    general: true,
    quiz: {
      prompt: "Who should interpret your lab results?",
      choices: ["The HealthQuest assistant", "A qualified healthcare professional", "Your XP level"],
      answer: 1,
    },
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}
