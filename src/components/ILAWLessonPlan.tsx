import React, { useEffect, useMemo, useRef, useState } from "react";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { BookOpen, Plus, Trash2, Printer, Save, ClipboardCheck, ChevronDown, ChevronUp, Send, CheckCircle2, Upload, Download, RotateCcw, X, ArrowLeft, ArrowRight, Pencil } from "lucide-react";

type Subject = { id?: string; name?: string; subjectName?: string; gradeLevel?: string | number; sectionId?: string; section_id?: string; sectionName?: string; section?: any; teacherId?: string; teacherUid?: string; teacherEmail?: string; assignedTeacherId?: string; assignedTeacherUid?: string; assignedTeacherEmail?: string; [key: string]: any };
type Section = { id?: string; name?: string; sectionName?: string; gradeLevel?: string | number; subjectName?: string; subject?: any; subjects?: any[]; assignedSubjects?: any[]; [key: string]: any };

type Props = {
  currentUser?: any;
  assignedSubjects?: Subject[];
  globalSubjects?: Subject[];
  sections?: Section[];
  isSchoolHead?: boolean;
  isSystemAdmin?: boolean;
};

type Session = { id: string; dateOfInstruction?: string; instructionStatus?: "not-marked" | "executed" | "not-executed"; carryOverFrom?: string; competencyStandards: string; objectives: string; learnerContext: string; preLesson: string; title: string; lessonSubtitleTitle: string; hideLessonSubtitleTitle?: boolean; flow: string; flowSequence?: string; examination: string; summative: string; assessment: string; extendedLearning: string; reflection: string; waysForward: string; coachingNotes: string; lessonMaterialIds?: string[]; assessmentAttachments?: { id: string; name: string; type: string; size?: number; included?: boolean }[] };
type Plan = {
  lessonTitle: string;
  dateOfInstruction: string;
  term: string;
  week: string;
  learningAreas: string;
  teacherNames: string;
  schoolHeadName: string;
  additionalSignatory1Included?: boolean;
  additionalSignatory1TeacherId?: string;
  additionalSignatory1Name?: string;
  additionalSignatory1Role?: string;
  additionalSignatory2Included?: boolean;
  additionalSignatory2TeacherId?: string;
  additionalSignatory2Name?: string;
  additionalSignatory2Role?: string;
  gradeSection: string;
  noOfSessions: string;
  references: string;
  aiDeclaration: string;
  aiNotUsed?: boolean;
  competencyStandards: string;
  objectives: string;
  learnerContext: string;
  preLesson: string;
  sessions: Session[];
  /** Session IDs explicitly saved by the teacher; only these appear in the Approval tab. */
  savedSessionIds?: string[];
  learningResources: string;
  integration: string;
  formativeAssessment: string;
  extendedLearning: string;
  reflections: string;
  coachingNotes: string;
  objectivesApplyTargetsBySession?: Record<string, string[]>;
  intentionApplyTargetsBySession?: Record<string, string[]>;
  learnerContextApplyTargetsBySession?: Record<string, string[]>;
  lessonSubtitleApplyTargetsBySession?: Record<string, string[]>;
  selfCheckItems?: Record<string, { status: "yes" | "not-yet"; note: string }>;
};

// Display titles come from LESSON PROPER (per-session Lesson Title fields).
// Fall back to the legacy plan-level title only for older saved plans.
const getLessonProperTitle = (plan?: Partial<Plan> | null): string => {
  const titles = Array.from(new Set((plan?.sessions || [])
    .map(session => String(session?.lessonSubtitleTitle || "").trim())
    .filter(Boolean)));
  return titles.join(" / ") || String(plan?.lessonTitle || "").trim();
};

const FLOW_SEQUENCE_TEMPLATES: Record<string, { label: string; preLesson: string; flow: string; assessment: string }> = {
  "5e": {
    label: "5E's",
    preLesson: "1. Engage: Present a motivating question, short situation, image, or real-life problem.\n2. Activate prior knowledge and connect it to the lesson objectives.\n3. State the learning targets and success criteria.",
    flow: "1. ENGAGE (5–10 min) — Introduce a hook or problem; invite learners to share initial ideas.\n2. EXPLORE (10–15 min) — Learners investigate, observe, solve, or work with examples in pairs/groups. Teacher facilitates and asks probing questions.\n3. EXPLAIN (10–15 min) — Learners explain findings; teacher clarifies concepts, models processes, and addresses misconceptions.\n4. ELABORATE (10–15 min) — Learners apply the concept to a new task, context, or real-life situation.",
    assessment: "5. EVALUATE (5–10 min) — Check understanding through an exit ticket, short task, oral response, or other evidence of learning.\nDifferentiation / support: Provide scaffolds, examples, language support, or extension tasks as needed."
  },
  "matatag": {
    label: "MATATAG Framework",
    preLesson: "1. Connect the lesson to learners' prior knowledge, experiences, and context.\n2. Share the lesson purpose, learning targets, and expected output in learner-friendly language.\n3. Prepare materials and identify possible misconceptions or needed scaffolds.",
    flow: "1. CONNECT — Elicit prior knowledge and introduce a meaningful context or essential question.\n2. EXPLICIT TEACHING / MODELING — Explain key concepts and demonstrate the skill or process using clear examples.\n3. GUIDED PRACTICE — Work through examples with prompts, feedback, and checks for understanding.\n4. COLLABORATIVE APPLICATION — Learners discuss, investigate, or complete a task with peers.\n5. INDEPENDENT APPLICATION — Learners demonstrate the target skill or understanding independently or in an authentic task.",
    assessment: "6. SYNTHESIS AND CHECK FOR UNDERSTANDING — Summarize key learning, address misconceptions, and collect evidence of progress.\nAdaptation: Adjust scaffolds, pacing, materials, and enrichment to learners' needs and the lesson competency."
  },
  "review-motivation-discussion": {
    label: "Review–Motivation–Discussion Sequence",
    preLesson: "1. Review the previous lesson or prerequisite skill using 2–3 quick questions.\n2. Check learners' readiness and address one important misconception.\n3. Motivate learning with a short story, picture, demonstration, current issue, or real-life question.\n4. Present the lesson objective and connect it to the motivation activity.",
    flow: "1. REVIEW (5–8 min) — Recall key ideas from the previous lesson; use quick oral questions or a brief retrieval task.\n2. MOTIVATION (5 min) — Present a hook or real-life situation and ask learners to predict, notice, or wonder.\n3. DISCUSSION / DEVELOPMENT (15–20 min) — Explain the new concept through examples, questioning, demonstration, and learner responses.\n4. GUIDED OR GROUP TASK (10–15 min) — Learners apply the key idea with teacher guidance or peer collaboration.\n5. GENERALIZATION (3–5 min) — Learners state the main takeaway or answer the essential question.",
    assessment: "6. QUICK CHECK (3–5 min) — Use an exit ticket, short response, or practice item to identify next steps."
  },
  "4as": {
    label: "4A's Framework",
    preLesson: "1. Prepare a short activity or stimulus related to learners' experience.\n2. Recall prerequisite knowledge and introduce the lesson purpose.\n3. Prepare guiding questions that move learners from experience to concept and application.",
    flow: "1. ACTIVITY (8–12 min) — Learners complete a task, examine a stimulus, solve a problem, or work with an example.\n2. ANALYSIS (8–12 min) — Learners describe observations, compare answers, and discuss guiding questions.\n3. ABSTRACTION (10–15 min) — Learners formulate the key idea; teacher clarifies and summarizes the concept or rule.\n4. APPLICATION (10–15 min) — Learners use the concept or skill in a new problem, practical task, or real-life situation.",
    assessment: "5. CLOSURE / CHECK (3–5 min) — Learners share a takeaway and complete a brief check for understanding."
  },
  "examination": {
    label: "Examination Sequence",
    preLesson: "1. Explain the examination purpose, coverage, time limit, and scoring rules.\n2. Prepare the required test papers/materials and ensure learners understand the instructions.\n3. Remind learners about independent work, academic honesty, and how to submit answers.",
    flow: "1. DIRECTIONS AND READINESS — Distribute the examination and clarify procedural questions without giving away answers.\n2. EXAMINATION PROPER — Learners answer the test independently within the allotted time.\n3. TEACHER MONITORING — Monitor the room, maintain testing conditions, and provide only permitted clarifications.\n4. COLLECTION AND CHECKING — Collect all answer sheets and verify that each learner has submitted the required work.",
    assessment: "5. CLOSURE — Examination evidence: Use the completed test to measure achievement of the stated learning objectives. Record scores, analyze common errors, and plan feedback or remediation."
  },
  "summative-assessment": {
    label: "Summative Assessment Sequence",
    preLesson: "1. Explain the summative task, expected output, criteria, and deadline.\n2. Review the rubric/checklist and clarify what successful performance looks like.\n3. Prepare the materials and ensure all learners understand the task and submission procedure.",
    flow: "1. TASK OR OUTPUT LAUNCH — Present the summative task and connect it to the learning objectives.\n2. INDEPENDENT / GROUP PERFORMANCE — Learners complete the required output, performance, project, or written response according to the task directions.\n3. TEACHER FACILITATION — Monitor progress and provide only the level of support allowed by the assessment rules.\n4. SUBMISSION / PRESENTATION — Learners submit, demonstrate, or present their completed work.",
    assessment: "5. REVIEW AND CLOSURE — Summative evidence: Evaluate the final output or performance using the stated rubric, answer key, or scoring guide. Record results and use them to determine achievement of the learning objectives."
  },
  "assigned-topic-reporting": {
    label: "Assigned Topic Reporting (Individual / Group)",
    preLesson: "1. CLASSROOM READINESS — Greet the learners, check attendance, and prepare the classroom and reporting materials.\n2. REVIEW AND CONNECTION — Ask brief questions about the previous lesson or prior knowledge related to the assigned topics.\n3. REPORTING ORIENTATION — State the learning objectives, introduce the reporting order and time limits, and explain the criteria for evaluating content, organization, clarity, participation, and responses to questions.\n4. REPORTER PREPARATION — Give the assigned individual learner or group a short time to organize notes, visual aids, and presentation roles before reporting begins.",
    flow: "1. OPENING AND TOPIC INTRODUCTION (2–3 min) — The assigned learner or group states the topic, its purpose, and the key points to be discussed.\n2. REPORTING / PRESENTATION (10–15 min per learner or group) — The reporter or group explains the assigned content in a logical order, defines important terms, shares examples or demonstrations, and uses approved learning resources. Group members take part according to their assigned roles.\n3. CLASS QUESTIONS AND RESPONSES (3–5 min) — Classmates ask relevant questions or share observations. The reporter responds, and the teacher facilitates respectful discussion.\n4. TEACHER CLARIFICATION AND SYNTHESIS (3–5 min) — The teacher confirms accurate information, corrects misconceptions, highlights essential ideas, and connects the report to the learning objectives.\n5. TRANSITION — Introduce the next assigned reporter or group, or move to the assessment activity when all reports are complete.",
    assessment: "FORMATIVE CHECK — After each report or after all reports, check understanding through oral questions, a short written response, an exit ticket, or a brief quiz. Assess content accuracy, organization, clarity, use of resources, participation or individual contribution, and ability to answer questions. Provide specific feedback and identify concepts that need further explanation."
  },
  "teacher-made": {
    label: "Teacher's made",
    preLesson: "1. Review or activate prior knowledge: [write activity].\n2. Motivate and connect to learners' experiences: [write prompt/activity].\n3. Share lesson objectives and success criteria: [write targets].",
    flow: "1. [Opening / review / motivation] — Describe the teacher and learner actions.\n2. [Teaching / exploration / discussion] — Describe the key learning experience.\n3. [Guided practice / collaboration] — Describe learner task and teacher support.\n4. [Independent application] — Describe the output or performance expected.\nTRANSITION — Proceed to Assessment and complete the Formative Assessment text field.",
    assessment: "[5. [Synthesis / formative check] — Describe how understanding will be checked.\n6. Differentiation / materials / time allotment: [customize as needed].]"
  }
};

const getFlowSequenceTemplate = (key: string, isFilipino: boolean) => {
  const english = FLOW_SEQUENCE_TEMPLATES[key];
  if (!english || !isFilipino) return english;
  const filipino: Record<string, { label: string; preLesson: string; flow: string; assessment: string }> = {
    "5e": {
      label: "5E's (Filipino)",
      preLesson: "1. ENGAGE / PAGGANYAK: Maglahad ng tanong, maikling sitwasyon, larawan, o suliraning maiuugnay sa tunay na buhay.\n2. Buhayin ang dating kaalaman at iugnay ito sa mga layunin ng aralin.\n3. Ilahad ang mga target sa pagkatuto at pamantayan ng tagumpay.",
      flow: "1. PAGGANYAK (5–10 minuto) — Magpakita ng panimula o suliranin at hikayatin ang mga mag-aaral na ibahagi ang kanilang paunang ideya.\n2. PAGGALUGAD (10–15 minuto) — Magsiyasat, magmasid, lumutas, o magsuri ng mga halimbawa ang mga mag-aaral nang pares o pangkat. Magpadaloy ang guro at magtanong ng mga gabay na tanong.\n3. PAGPAPALIWANAG (10–15 minuto) — Ipaliwanag ng mga mag-aaral ang kanilang natuklasan; linawin ng guro ang mga konsepto at iwasto ang maling pagkaunawa.\n4. PAGPAPALAWAK (10–15 minuto) — Ilapat ang konsepto sa bagong gawain, sitwasyon, o konteksto sa tunay na buhay.\n5. PAGLALAGOM AT PAGLIPAT — Ibuod ang mahahalagang natutuhan at iugnay sa susunod na gawain.\nTRANSISYON — Pumunta sa 04. PAGTATAYA at kumpletuhin ang kahong Pagtatayang Formative.",
      assessment: "PAGTATAYA (5–10 minuto) — Suriin ang pag-unawa sa pamamagitan ng exit ticket, maikling gawain, pasalitang sagot, o iba pang ebidensiya ng pagkatuto.\nPag-aangkop / suporta: Magbigay ng gabay, halimbawa, suporta sa wika, o gawaing pampalawak ayon sa pangangailangan."
    },
    "matatag": {
      label: "Balangkas MATATAG",
      preLesson: "1. Iugnay ang aralin sa dating kaalaman, karanasan, at konteksto ng mga mag-aaral.\n2. Ibahagi sa payak na pananalita ang layunin, target sa pagkatuto, at inaasahang output.\n3. Ihanda ang mga kagamitan at tukuyin ang posibleng maling pagkaunawa o suportang kailangan.",
      flow: "1. PAG-UUGNAY — Tuklasin ang dating kaalaman at ipakilala ang makabuluhang konteksto o mahalagang tanong.\n2. TUWIRANG PAGTUTURO / PAGMOMODELO — Ipaliwanag ang mahahalagang konsepto at ipakita ang kasanayan gamit ang malinaw na halimbawa.\n3. GABAY NA PAGSASANAY — Sama-samang lutasin ang mga halimbawa sa tulong ng mga pahiwatig, puna, at pagsusuri sa pag-unawa.\n4. PAKIKIPAGTULUNGANG PAGLALAPAT — Talakayin, magsiyasat, o magsagawa ng gawain kasama ang mga kamag-aral.\n5. INDIBIDWAL NA PAGLALAPAT — Ipakita nang mag-isa ang target na kasanayan o pag-unawa sa isang makabuluhang gawain.\n6. PAGLALAGOM AT PAGSUSURI NG PAG-UNAWA — Ibuod ang natutuhan, tugunan ang maling pagkaunawa, at tipunin ang ebidensiya ng pag-unlad.\nTRANSISYON — Pumunta sa 04. PAGTATAYA at kumpletuhin ang kahong Pagtatayang Formative.",
      assessment: "Iangkop ang gabay, bilis ng pagtuturo, kagamitan, at gawaing pampalawak sa pangangailangan ng mga mag-aaral."
    },
    "review-motivation-discussion": {
      label: "Balik-aral–Pagganyak–Talakayan",
      preLesson: "1. Balikan ang nakaraang aralin o kinakailangang kasanayan gamit ang 2–3 maikling tanong.\n2. Suriin ang kahandaan ng mga mag-aaral at linawin ang isang mahalagang maling pagkaunawa.\n3. Pukawin ang interes sa pamamagitan ng maikling kuwento, larawan, demonstrasyon, napapanahong isyu, o tanong tungkol sa tunay na buhay.\n4. Ilahad ang layunin ng aralin at iugnay ito sa gawaing pampagganyak.",
      flow: "1. BALIK-ARAL (5–8 minuto) — Alalahanin ang mahahalagang ideya mula sa nakaraang aralin sa pamamagitan ng pasalitang tanong o maikling gawain.\n2. PAGGANYAK (5 minuto) — Maglahad ng panimula o sitwasyon sa tunay na buhay at itanong kung ano ang napapansin o inaasahan nila.\n3. TALAKAYAN / PAGLINANG (15–20 minuto) — Ipaliwanag ang bagong konsepto gamit ang mga halimbawa, pagtatanong, demonstrasyon, at tugon ng mga mag-aaral.\n4. GABAY O PANGKATANG GAWAIN (10–15 minuto) — Ilapat ang pangunahing ideya sa tulong ng guro o pakikipagtulungan sa kapwa.\n5. PAGLALAHAT (3–5 minuto) — Ibahagi ang pangunahing natutuhan o sagutin ang mahalagang tanong.\nTRANSISYON — Pumunta sa 04. PAGTATAYA at kumpletuhin ang kahong Pagtatayang Formative.",
      assessment: "MAIKLING PAGSUSURI (3–5 minuto) — Gumamit ng exit ticket, maikling sagot, o pagsasanay upang matukoy ang susunod na hakbang."
    },
    "4as": {
      label: "Balangkas 4A's",
      preLesson: "1. Maghanda ng maikling gawain o stimulus na maiuugnay sa karanasan ng mga mag-aaral.\n2. Balikan ang kinakailangang dating kaalaman at ipakilala ang layunin ng aralin.\n3. Maghanda ng mga gabay na tanong mula sa karanasan patungo sa konsepto at paglalapat.",
      flow: "1. GAWAIN (8–12 minuto) — Magsagawa ng gawain, suriin ang stimulus, lumutas ng suliranin, o gumawa gamit ang halimbawa.\n2. PAGSUSURI (8–12 minuto) — Ilarawan ang obserbasyon, paghambingin ang mga sagot, at talakayin ang mga gabay na tanong.\n3. PAGLALAHAT NG KONSEPTO (10–15 minuto) — Bumuo ng pangunahing ideya ang mga mag-aaral; linawin at ibuod ng guro ang konsepto o tuntunin.\n4. PAGLALAPAT (10–15 minuto) — Gamitin ang konsepto o kasanayan sa bagong suliranin, praktikal na gawain, o sitwasyon sa tunay na buhay.\nTRANSISYON — Pumunta sa 04. PAGTATAYA at kumpletuhin ang kahong Pagtatayang Formative.",
      assessment: "PAGWAWAKAS / PAGSUSURI (3–5 minuto) — Ibahagi ng mga mag-aaral ang natutuhan at sagutan ang maikling pagsusuri sa pag-unawa."
    },
    "examination": {
      label: "Pagkakasunod-sunod ng Pagsusulit",
      preLesson: "1. Ipaliwanag ang layunin, saklaw, oras, at pamantayan sa pagmamarka ng pagsusulit.\n2. Ihanda ang mga test paper/kagamitan at tiyaking nauunawaan ng mga mag-aaral ang panuto.\n3. Ipaalala ang pagsagot nang mag-isa, katapatan sa pagsusulit, at paraan ng pagpasa.",
      flow: "1. PANUTO AT PAGHAHANDA — Ipamahagi ang pagsusulit at linawin ang mga tanong tungkol sa proseso nang hindi ibinibigay ang sagot.\n2. PAGSUSULIT — Sagutan ng mga mag-aaral ang pagsusulit nang mag-isa sa itinakdang oras.\n3. PAGMAMATYAG NG GURO — Panatilihin ang maayos na kondisyon ng pagsusulit at magbigay lamang ng pinahihintulutang paglilinaw.\n4. PAGKOLEKTA AT PAGSUSURI — Kolektahin ang mga sagutang papel at tiyaking naipasa ng lahat ang kinakailangang gawain.\n5. PAGWAWAKAS — Ipaliwanag ang susunod na hakbang sa pagwawasto, pagbibigay ng puna, at remediation.",
      assessment: "Ebidensiya ng pagsusulit: Gamitin ang natapos na pagsusulit upang masukat ang pag-abot sa mga layunin. Itala ang mga marka, suriin ang karaniwang pagkakamali, at magplano ng puna o remediation."
    },
    "summative-assessment": {
      label: "Pagkakasunod-sunod ng Pagtatayang Summative",
      preLesson: "1. Ipaliwanag ang summative na gawain, inaasahang output, pamantayan, at takdang oras.\n2. Suriin ang rubric/checklist at linawin ang inaasahang mahusay na pagganap.\n3. Ihanda ang mga kagamitan at tiyaking nauunawaan ng lahat ang gawain at paraan ng pagpasa.",
      flow: "1. PAGPAPAKILALA NG GAWAIN — Ilahad ang summative task at iugnay ito sa mga layunin ng pagkatuto.\n2. PAGGANAP / PAGBUO NG OUTPUT — Kumpletuhin ng mga mag-aaral ang output, performance, proyekto, o nakasulat na sagot ayon sa panuto.\n3. GABAY NG GURO — Subaybayan ang pag-usad at magbigay lamang ng suportang pinahihintulutan sa pagtataya.\n4. PAGPASA / PAGLALAHAD — Ipasa, ipakita, o ilahad ng mga mag-aaral ang kanilang natapos na gawain.\n5. PAGREPASO AT PAGWAWAKAS — Suriin kung kumpleto ang mga ipinasa at ipaliwanag kung kailan ibibigay ang puna o resulta.",
      assessment: "Ebidensiya ng summative: Suriin ang huling output o pagganap gamit ang itinakdang rubric, answer key, o scoring guide. Itala ang resulta at gamitin ito upang matukoy ang pag-abot sa mga layunin ng pagkatuto."
    },
    "assigned-topic-reporting": {
      label: "Pag-uulat ng Itinalagang Paksa (Indibidwal / Pangkat)",
      preLesson: "1. PAGHAHANDA NG KLASE — Batiin ang mga mag-aaral, tingnan ang pagdalo, at ihanda ang silid-aralan at mga kagamitan sa pag-uulat.\n2. BALIK-ARAL AT PAG-UUGNAY — Magtanong nang maikli tungkol sa nakaraang aralin o dating kaalamang may kaugnayan sa mga itinalagang paksa.\n3. PAGPAPALIWANAG NG GAWAIN — Ilahad ang mga layunin sa pagkatuto, pagkakasunod-sunod ng mga mag-uulat at takdang oras, at pamantayan sa pagtataya ng kawastuhan ng nilalaman, organisasyon, linaw ng pagpapaliwanag, pakikilahok, at pagsagot sa mga tanong.\n4. PAGHAHANDA NG TAGAPAG-UULAT — Bigyan ng maikling oras ang itinalagang mag-aaral o pangkat upang ayusin ang tala, biswal na kagamitan, at mga gampanin bago magsimula.",
      flow: "1. PANIMULA AT PAGPAPAKILALA NG PAKSA (2–3 minuto) — Babanggitin ng itinalagang mag-aaral o pangkat ang paksa, layunin nito, at mahahalagang puntong tatalakayin.\n2. PAG-UULAT / PRESENTASYON (10–15 minuto bawat mag-aaral o pangkat) — Ipapaliwanag ng tagapag-ulat ang paksa sa maayos na pagkakasunod-sunod, bibigyang-kahulugan ang mahahalagang termino, magbibigay ng halimbawa o demonstrasyon, at gagamit ng angkop na kagamitang pampagkatuto. Gaganap ang bawat kasapi ayon sa itinalagang tungkulin.\n3. MGA TANONG AT SAGOT NG KLASE (3–5 minuto) — Magtatanong ang mga kaklase o magbabahagi ng obserbasyon. Sasagot ang tagapag-ulat at gagabayan ng guro ang magalang na talakayan.\n4. PAGLILINAW AT PAGLALAGOM NG GURO (3–5 minuto) — Patutunayan ng guro ang wastong impormasyon, itatama ang maling pagkaunawa, bibigyang-diin ang mahahalagang ideya, at iuugnay ang ulat sa mga layunin ng pagkatuto.\n5. PAGLIPAT SA SUSUNOD NA GAWAIN — Ipakilala ang susunod na mag-uulat o pangkat, o magpatuloy sa pagtataya kapag natapos na ang lahat ng ulat.",
      assessment: "PORMATIBONG PAGSUSURI — Pagkatapos ng bawat ulat o ng lahat ng ulat, suriin ang pag-unawa sa pamamagitan ng pasalitang tanong, maikling nakasulat na sagot, exit ticket, o maikling pagsusulit. Tayahin ang kawastuhan ng nilalaman, organisasyon, linaw ng pagpapaliwanag, paggamit ng kagamitan, pakikilahok o indibidwal na ambag, at kakayahang sumagot sa mga tanong. Magbigay ng tiyak na puna at tukuyin ang mga konseptong nangangailangan pa ng paglilinaw."
    },
    "teacher-made": {
      label: "Gawang-guro",
      preLesson: "1. Balikan o buhayin ang dating kaalaman: [isulat ang gawain].\n2. Pukawin ang interes at iugnay sa karanasan ng mga mag-aaral: [isulat ang tanong/gawain].\n3. Ibahagi ang mga layunin at pamantayan ng tagumpay: [isulat ang mga target].",
      flow: "1. [Panimula / balik-aral / pagganyak] — Ilarawan ang gagawin ng guro at mga mag-aaral.\n2. [Pagtuturo / paggalugad / talakayan] — Ilarawan ang pangunahing karanasan sa pagkatuto.\n3. [Gabay na pagsasanay / pagtutulungan] — Ilarawan ang gawain ng mag-aaral at suportang ibibigay ng guro.\n4. [Indibidwal na paglalapat] — Ilarawan ang inaasahang output o pagganap.\nTRANSISYON — Pumunta sa 04. PAGTATAYA at kumpletuhin ang kahong Pagtatayang Formative.",
      assessment: "5. [Paglalagom / formative na pagsusuri] — Ilarawan kung paano susuriin ang pag-unawa.\n6. Pagkakaiba-iba ng suporta / kagamitan / oras: [iangkop ayon sa pangangailangan]."
    }
  };
  return filipino[key] || english;
};

const makeSession = (id = `session-${Date.now()}`): Session => ({
  id, dateOfInstruction: "", instructionStatus: "not-marked", carryOverFrom: "", competencyStandards: "", objectives: "", learnerContext: "", preLesson: "", title: "", lessonSubtitleTitle: "", flow: "", flowSequence: "", examination: "", summative: "", assessment: "", extendedLearning: "", reflection: "", waysForward: "", coachingNotes: "", lessonMaterialIds: []
});

const blankPlan = (): Plan => ({
  lessonTitle: "", dateOfInstruction: "", term: "1", week: "1", learningAreas: "", teacherNames: "", schoolHeadName: "",
  additionalSignatory1Included: false, additionalSignatory1TeacherId: "", additionalSignatory1Name: "", additionalSignatory1Role: "Master Teacher",
  additionalSignatory2Included: false, additionalSignatory2TeacherId: "", additionalSignatory2Name: "", additionalSignatory2Role: "", gradeSection: "",
  noOfSessions: "", references: "",
  aiDeclaration: "AI was used to support drafting and organizing the lesson plan. The teacher reviewed and adapted the content for accuracy, learner context, and curriculum alignment. Complete/correct this declaration in accordance with DO 3, s. 2026, Annex A.", aiNotUsed: false,
  competencyStandards: "", objectives: "", learnerContext: "", preLesson: "",
  sessions: [makeSession("session-1"), makeSession("session-2"), makeSession("session-3"), makeSession("session-4")], learningResources: "", integration: "",
  formativeAssessment: "", extendedLearning: "", reflections: "", coachingNotes: "",
  objectivesApplyTargetsBySession: {}, intentionApplyTargetsBySession: {}, learnerContextApplyTargetsBySession: {}, lessonSubtitleApplyTargetsBySession: {}, selfCheckItems: {}
});

const formatSessionInstructionDates = (plan: Plan): string => (plan.sessions || []).map((session, index) => {
  const date = session.dateOfInstruction || plan.dateOfInstruction || "";
  return `Session ${index + 1}: ${date ? new Date(`${date}T00:00:00`).toLocaleDateString() : "—"}`;
}).join("; ");

const STORAGE_KEY = "ilaw-lesson-plans-v1";
const SUBMISSIONS_KEY = "ilaw-lesson-plan-submissions-v1";
const CHANGE_REQUESTS_KEY = "ilaw-lesson-plan-change-requests-v1";
const CHANGE_REQUESTS_CLOUD_COLLECTION = "ilawLessonPlanChangeRequests";
const LOCAL_META_KEY = "ilaw-lesson-plans-meta-v1";
const PLAN_LIST_KEY = "ilaw-lesson-plan-week-term-list-v1";
const CLOUD_COLLECTION = "ilawLessonPlans";
const PLAN_RECORDS_COLLECTION = "ilawLessonPlanRecords";
const SUBMISSIONS_CLOUD_COLLECTION = "ilawLessonPlanSubmissions";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const normalizeStoredPlan = (value: any): Plan => {
  const base = { ...blankPlan(), ...(value && typeof value === "object" ? value : {}) } as Plan;
  const storedSessions = Array.isArray(value?.sessions) ? value.sessions : [];
  const rawSessionsCount = value?.noOfSessions !== undefined && value?.noOfSessions !== null && String(value.noOfSessions).trim() !== ""
    ? Number(value.noOfSessions)
    : (base.noOfSessions ? Number(base.noOfSessions) : NaN);
  const requestedCount = Number.isFinite(rawSessionsCount) && rawSessionsCount >= 1 && rawSessionsCount <= 10
    ? Math.round(rawSessionsCount)
    : (storedSessions.length > 0 ? storedSessions.length : 4);
  const sessions: Session[] = Array.from({ length: requestedCount }, (_, index) => {
    const stored = storedSessions[index] && typeof storedSessions[index] === "object" ? storedSessions[index] : {};
    return {
      ...makeSession(`session-${index + 1}`),
      ...stored,
      id: `session-${index + 1}`,
      dateOfInstruction: String(stored.dateOfInstruction ?? base.dateOfInstruction ?? ""),
      competencyStandards: String(stored.competencyStandards ?? (index === 0 ? value?.competencyStandards : "") ?? ""),
      objectives: String(stored.objectives ?? value?.objectives ?? ""),
      learnerContext: String(stored.learnerContext ?? (index === 0 ? value?.learnerContext : "") ?? ""),
      preLesson: String(stored.preLesson ?? (index === 0 ? value?.preLesson : "") ?? ""),
      title: String(stored.title ?? stored.sessionTitle ?? ""),
      lessonSubtitleTitle: String(stored.lessonSubtitleTitle ?? stored.lessonSubtitle ?? stored.subtitleTitle ?? ""),
      flow: (() => {
        const raw = String(stored.flow ?? stored.learningExperience ?? "");
        return /<[a-z][\s\S]*>/i.test(raw) ? flowHtmlToText(raw) : raw;
      })(),
      examination: String(stored.examination ?? ""),
      summative: String(stored.summative ?? ""),
      assessment: String(stored.assessment ?? ""),
      extendedLearning: String(stored.extendedLearning ?? ""),
      reflection: String(stored.reflection ?? ""),
      waysForward: String(stored.waysForward ?? ""),
      coachingNotes: String(stored.coachingNotes ?? ""),
      lessonMaterialIds: Array.isArray(stored.lessonMaterialIds) ? stored.lessonMaterialIds.map(String) : []
    };
  });
  const textKeys: (keyof Omit<Plan, "sessions">)[] = [
    "lessonTitle", "term", "week", "learningAreas", "teacherNames", "schoolHeadName",
    "gradeSection", "noOfSessions", "references", "aiDeclaration", "competencyStandards",
    "objectives", "learnerContext", "preLesson", "learningResources", "integration",
    "formativeAssessment", "extendedLearning", "reflections", "coachingNotes"
  ];
  textKeys.forEach(key => {
    const current = (base as any)[key];
    if (current === undefined || current === null) (base as any)[key] = "";
    else if (typeof current !== "string") (base as any)[key] = String(current);
  });
  // Intention is shared across the whole lesson plan. Migrate older plans that stored
  // these fields only on Session 1 into the plan-level fields without overwriting data.
  if (!String(base.competencyStandards || "").trim()) base.competencyStandards = String(sessions[0]?.competencyStandards || "");
  if (!String(base.objectives || "").trim()) base.objectives = String(sessions[0]?.objectives || "");
  if (!String(base.learnerContext || "").trim()) base.learnerContext = String(sessions[0]?.learnerContext || "");
  const normalizeTargets = (targets: any): Record<string, string[]> => {
    if (!targets || typeof targets !== "object" || Array.isArray(targets)) return {};
    const validIds = new Set(sessions.map(session => session.id));
    return Object.fromEntries(
      Object.entries(targets)
        .filter(([sourceId]) => validIds.has(String(sourceId)))
        .map(([sourceId, ids]) => [
          sourceId,
          Array.isArray(ids) ? [...new Set(ids.map(String).filter(id => validIds.has(id) && id !== sourceId))] : []
        ])
    );
  };
  base.objectivesApplyTargetsBySession = normalizeTargets(base.objectivesApplyTargetsBySession || value?.objectivesApplyTargetsBySession);
  base.intentionApplyTargetsBySession = normalizeTargets(base.intentionApplyTargetsBySession || value?.intentionApplyTargetsBySession);
  base.learnerContextApplyTargetsBySession = normalizeTargets(base.learnerContextApplyTargetsBySession || value?.learnerContextApplyTargetsBySession);
  base.lessonSubtitleApplyTargetsBySession = normalizeTargets(base.lessonSubtitleApplyTargetsBySession || value?.lessonSubtitleApplyTargetsBySession);
  return { ...base, noOfSessions: String(requestedCount), sessions };
};

const hasStoredPlanContent = (value: any): boolean => {
  if (!value || typeof value !== "object") return false;
  const fields = [
    "lessonTitle", "learningAreas", "teacherNames", "gradeSection", "references",
    "competencyStandards", "objectives", "learnerContext", "preLesson", "learningResources",
    "integration", "formativeAssessment", "extendedLearning", "reflections", "coachingNotes"
  ];
  return fields.some(key => String(value[key] ?? "").trim()) ||
    (Array.isArray(value.sessions) && value.sessions.some((session: any) =>
      ["competencyStandards", "objectives", "learnerContext", "preLesson", "title", "lessonSubtitleTitle", "flow", "examination", "summative", "assessment", "extendedLearning", "reflection", "waysForward", "coachingNotes"]
        .some(key => String(session?.[key] ?? "").trim())
    ));
};

const readInitialLocalPlan = (): Plan => {
  try {
    const active = localStorage.getItem(STORAGE_KEY);
    if (active) {
      const parsed = JSON.parse(active);
      if (hasStoredPlanContent(parsed)) return normalizeStoredPlan(parsed);
    }
    const savedList = JSON.parse(localStorage.getItem(PLAN_LIST_KEY) || "[]");
    if (Array.isArray(savedList)) {
      const candidate = [...savedList].reverse().find(hasStoredPlanContent);
      if (candidate) return normalizeStoredPlan(candidate);
    }
    const savedSubmissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || "[]");
    if (Array.isArray(savedSubmissions)) {
      const candidate = [...savedSubmissions]
        .sort((a, b) => new Date(b?.reviewedAt || b?.submittedAt || 0).getTime() - new Date(a?.reviewedAt || a?.submittedAt || 0).getTime())
        .find(item => hasStoredPlanContent(item?.plan));
      if (candidate?.plan) return normalizeStoredPlan(candidate.plan);
    }
  } catch (error) {
    console.warn("Could not restore all ILAW lesson-plan entries from local storage:", error);
  }
  return blankPlan();
};

type ApprovedPlanChangeRequest = {
  id: string;
  submissionId: string;
  type: "edit" | "delete";
  status: "pending" | "approved" | "rejected";
  planTitle: string;
  teacherName: string;
  teacherEmail: string;
  requestedAt: string;
  requestNote?: string;
  scope?: "session" | "week";
  sessionId?: string;
  reviewedAt?: string;
  reviewerName?: string;
  reviewerNote?: string;
};

type Submission = {
  id: string;
  plan: Plan;
  teacherName: string;
  teacherEmail: string;
  submittedAt: string;
  status: "pending" | "approved" | "returned";
  reviewerName?: string;
  reviewedAt?: string;
  reviewerSignature?: string;
  reviewerNote?: string;
  approvedSessionIds?: string[];
  sessionReviewNotes?: Record<string, string>;
  sessionStatuses?: Record<string, "pending" | "approved" | "returned">;
  submittedSessionIds?: string[];
  editApproved?: boolean;
};

const escapeFlowHtml = (value: string) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\'/g, "&#39;");
const assessmentHtml = (value: string) => {
  const raw = String(value || "");
  // Preserve rich-text markup while allowing only basic formatting and table elements.
  if (!/[<](?:p|div|br|strong|b|em|i|u|s|ul|ol|li|table|thead|tbody|tr|th|td|h[1-6])\b/i.test(raw)) {
    return escapeFlowHtml(raw).replace(/\r?\n/g, "<br />");
  }
  if (typeof document === "undefined") return raw;
  const template = document.createElement("template");
  template.innerHTML = raw;
  const allowed = new Set(["P", "DIV", "BR", "STRONG", "B", "EM", "I", "U", "S", "UL", "OL", "LI", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD", "H1", "H2", "H3", "H4", "H5", "H6"]);
  const clean = (node: Node) => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (!allowed.has(el.tagName)) {
          const text = document.createTextNode(el.textContent || "");
          el.replaceWith(text);
        } else {
          Array.from(el.attributes).forEach(attr => el.removeAttribute(attr.name));
          clean(el);
        }
      } else if (child.nodeType !== Node.TEXT_NODE) child.remove();
    });
  };
  clean(template.content);
  return template.innerHTML;
};

const flowHtmlToText = (value: string) => {
  const raw = String(value || "");
  // Keep previously saved rich-text Flow readable when opening it in a textarea.
  return raw
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/(?:p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<\s*li\b[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const flowMarkdownToHtml = (value: string) => {
  // Convert the Flow field's lightweight Markdown to safe HTML for the on-screen
  // PDF preview and browser printing. Escape user text before adding formatting tags.
  const inline = (line: string) => escapeFlowHtml(line)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<u>$1</u>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;
  const closeList = () => { if (listType) { html.push(`</${listType}>`); listType = null; } };
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^###\s+(.+)$/);
    const bullet = line.match(/^\s*(?:[-*•])\s+(.+)$/);
    const numbered = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (heading) {
      closeList();
      html.push(`<strong class="ilaw-flow-heading">${inline(heading[1])}</strong>`);
    } else if (bullet) {
      if (listType !== "ul") { closeList(); html.push("<ul class=\"ilaw-flow-list\">"); listType = "ul"; }
      html.push(`<li>${inline(bullet[1])}</li>`);
    } else if (numbered) {
      if (listType !== "ol") { closeList(); html.push(`<ol class="ilaw-flow-list" start="${Number(numbered[1]) || 1}">`); listType = "ol"; }
      html.push(`<li>${inline(numbered[2])}</li>`);
    } else {
      closeList();
      html.push(line ? inline(line) : "<br />");
    }
  }
  closeList();
  return html.join("<br />");
};

<style>{`.ilaw-assessment-editor:empty:before{content:attr(data-placeholder);color:#94a3b8;pointer-events:none}.ilaw-assessment-editor table,.ilaw-assessment-content table{width:100%;border-collapse:collapse;margin:8px 0;table-layout:fixed}.ilaw-assessment-editor th,.ilaw-assessment-editor td,.ilaw-assessment-content th,.ilaw-assessment-content td{border:1px solid #94a3b8;padding:6px;vertical-align:top;overflow-wrap:anywhere}.ilaw-assessment-editor th,.ilaw-assessment-content th{background:#f1f5f9;font-weight:700}.ilaw-assessment-editor h1,.ilaw-assessment-content h1{font-size:2em;font-weight:700;margin:.67em 0}.ilaw-assessment-editor h2,.ilaw-assessment-content h2{font-size:1.5em;font-weight:700;margin:.75em 0}.ilaw-assessment-editor h3,.ilaw-assessment-content h3{font-size:1.17em;font-weight:700;margin:1em 0}.ilaw-assessment-editor h4,.ilaw-assessment-content h4{font-size:1em;font-weight:700;margin:1.33em 0}.ilaw-assessment-editor h5,.ilaw-assessment-content h5{font-size:.83em;font-weight:700;margin:1.67em 0}.ilaw-assessment-editor h6,.ilaw-assessment-content h6{font-size:.67em;font-weight:700;margin:2.33em 0}.ilaw-assessment-editor:focus{outline:2px solid #bfdbfe;outline-offset:-2px}.ilaw-assessment-editor ul,.ilaw-assessment-content ul{list-style:disc;padding-left:22px}.ilaw-assessment-editor ol,.ilaw-assessment-content ol{list-style:decimal;padding-left:22px}.ilaw-assessment-content p{margin:4px 0}`}</style>
type StoredLessonMaterial = { id: string; owner: string; name: string; type: string; size: number; uploadedAt: string; file?: Blob; driveUrl?: string; lessonPlanKey?: string; sessionId?: string; learningArea?: string; term?: string; week?: string };
// Paste the deployed Google Apps Script Web App URL here (ends in /exec).
const ILAW_DRIVE_API_URL = "https://script.google.com/macros/s/AKfycbwAwJbgMpIKE6BDVSQOnyZ4BK3StyXEnL6j7FSMuwG38K56RgZVwYme2ol1Si81A0eZ/exec";
const isDriveApiConfigured = () => /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:$|\?)/.test(ILAW_DRIVE_API_URL);
const driveApiRequest = async (action: string, data: Record<string, unknown> = {}) => {
  if (!isDriveApiConfigured()) throw new Error("Google Drive is not connected: replace ILAW_DRIVE_API_URL with the deployed Google Apps Script Web App URL ending in /exec.");
  let response: Response;
  try {
    response = await fetch(ILAW_DRIVE_API_URL, {
      method: "POST",
      // text/plain avoids a browser CORS preflight for the Apps Script endpoint.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...data }),
      redirect: "follow"
    });
  } catch (error) {
    throw new Error("Could not reach Google Apps Script. Check the deployed /exec URL, Web App access permissions, and browser network/CORS errors.");
  }
  const raw = await response.text();
  let result: any;
  try { result = JSON.parse(raw); }
  catch { throw new Error(`Google Apps Script returned a non-JSON response (HTTP ${response.status}). Confirm the URL is the deployed /exec endpoint and the Web App is accessible.`); }
  if (!response.ok) throw new Error(result?.error || `Google Drive request failed (HTTP ${response.status}).`);
  if (!result?.ok) throw new Error(result?.error || "Google Drive request failed.");
  return result;
};
const getStoredLessonMaterials = async (_owner: string): Promise<StoredLessonMaterial[]> => {
  const result = await driveApiRequest("list", { owner: _owner });
  return (result.files || []) as StoredLessonMaterial[];
};

// Resolve the signed-in user's canonical email from Firestore `users`.
// The signed-in profile is used only to locate the Firestore record; the email
// used by the Lesson Materials workflow is read from that record.
const resolveSignedInEmailFromFirestore = async (currentUser: any): Promise<string> => {
  const uid = String(currentUser?.uid || currentUser?.userId || currentUser?.user_id || currentUser?.id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
  const profileEmail = String(currentUser?.email || currentUser?.profile?.email || "").trim().toLowerCase();
  const emailFromRecord = (data: any) => String(data?.email || data?.emailAddress || data?.userEmail || data?.googleEmail || data?.mail || "").trim().toLowerCase();

  if (uid) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const email = emailFromRecord(userDoc.data());
        if (email) return email;
      }
    } catch (error) {
      console.warn("Could not read Firestore users document by UID.", error);
    }
    for (const field of ["uid", "userId", "user_id", "authUid"]) {
      try {
        const matches = await getDocs(query(collection(db, "users"), where(field, "==", uid)));
        for (const match of matches.docs) {
          const email = emailFromRecord(match.data());
          if (email) return email;
        }
      } catch (error) {
        // Continue through supported identity fields; a missing optional field
        // or query error should not prevent checking the other common fields.
      }
    }
  }

  // If the auth profile has an email, use it only to find the matching Firestore
  // user record; do not treat the auth-profile value itself as the stored email.
  if (profileEmail) {
    for (const field of ["email", "emailAddress", "userEmail", "googleEmail"]) {
      try {
        const matches = await getDocs(query(collection(db, "users"), where(field, "==", profileEmail)));
        for (const match of matches.docs) {
          const email = emailFromRecord(match.data());
          if (email) return email;
        }
      } catch (error) {
        // Continue checking other known email fields.
      }
    }
  }
  throw new Error("Could not find the signed-in user's email in the Firestore `users` collection. Check the user document ID/UID and email field, and confirm Firestore read permissions.");
};
const saveStoredLessonMaterial = async (material: StoredLessonMaterial): Promise<string | undefined> => {
  if (!material.file) throw new Error("The selected file is missing.");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const value = String(reader.result || ""); const comma = value.indexOf(","); resolve(comma >= 0 ? value.slice(comma + 1) : value); };
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(material.file as Blob);
  });
  const result = await driveApiRequest("upload", { id: material.id, name: material.name, mimeType: material.type, base64, owner: material.owner, lessonPlanKey: material.lessonPlanKey || "", sessionId: material.sessionId || "", learningArea: material.learningArea || "", term: material.term || "", week: material.week || "" });
  return String(result?.file?.id || result?.id || material.id || "");
};
const deleteStoredLessonMaterial = async (id: string, owner: string): Promise<void> => { await driveApiRequest("delete", { id, owner }); };

export default function ILAWLessonPlan({ currentUser, assignedSubjects = [], globalSubjects = [], sections = [], isSchoolHead = false, isSystemAdmin: isSystemAdminProp = false }: Props) {
  type MessageDialogOptions = { title: string; message: string; mode: "info" | "confirm" | "input" | "choice"; inputLabel?: string; initialValue?: string; options?: string[]; confirmLabel?: string; danger?: boolean; requireNonEmptyInput?: boolean };
  const [messageDialog, setMessageDialog] = useState<MessageDialogOptions | null>(null);
  const [messageDialogInput, setMessageDialogInput] = useState("");
  const [assessmentPreview, setAssessmentPreview] = useState<{ url: string; name: string; type: string } | null>(null);
  const messageDialogResolver = useRef<((value: string | boolean | null) => void) | null>(null);
  const showMessageWindow = (options: MessageDialogOptions): Promise<string | boolean | null> => {
    setMessageDialog(options);
    setMessageDialogInput(options.initialValue || "");
    return new Promise(resolve => { messageDialogResolver.current = resolve; });
  };
  const closeMessageWindow = (value: string | boolean | null) => {
    setMessageDialog(null);
    const resolve = messageDialogResolver.current;
    messageDialogResolver.current = null;
    resolve?.(value);
  };
  const messageWindow = messageDialog ? <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && messageDialog.mode === "info") closeMessageWindow(true); }}><section role="dialog" aria-modal="true" aria-labelledby="ilaw-message-window-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><h2 id="ilaw-message-window-title" className="text-lg font-extrabold text-slate-900">{messageDialog.title}</h2><button type="button" aria-label="Close message" onClick={() => closeMessageWindow(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={18}/></button></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{messageDialog.message}</p>{messageDialog.mode === "input" && <label className="mt-4 block text-sm font-bold text-slate-700">{messageDialog.inputLabel || "Details"}<textarea autoFocus required={Boolean(messageDialog.requireNonEmptyInput)} aria-required={Boolean(messageDialog.requireNonEmptyInput)} value={messageDialogInput} onChange={event => setMessageDialogInput(event.target.value)} rows={4} placeholder={messageDialog.requireNonEmptyInput ? "Explain why you are requesting this change..." : ""} className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />{messageDialog.requireNonEmptyInput && !messageDialogInput.trim() && <p className="mt-1 text-xs font-semibold text-rose-600">A reason is required before you can send this request.</p>}</label>}{messageDialog.mode === "choice" && <label className="mt-4 block text-sm font-bold text-slate-700">{messageDialog.inputLabel || "Choose an option"}<select autoFocus value={messageDialogInput} onChange={event => setMessageDialogInput(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">{(messageDialog.options || []).map(option => <option key={option} value={option}>{option}</option>)}</select></label>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => closeMessageWindow(messageDialog.mode === "info" ? true : null)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{messageDialog.mode === "info" ? "Close" : "Cancel"}</button>{messageDialog.mode !== "info" && <button type="button" disabled={Boolean(messageDialog.requireNonEmptyInput && !messageDialogInput.trim())} onClick={() => closeMessageWindow(messageDialog.mode === "input" || messageDialog.mode === "choice" ? messageDialogInput : true)} className={`rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40 ${messageDialog.danger ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>{messageDialog.confirmLabel || (messageDialog.mode === "input" ? "Submit" : messageDialog.mode === "choice" ? "Continue" : "Confirm")}</button>}</div></section></div> : null;
  const openPdfPreview = (existingPreviewWindow?: Window | null) => {
    const printContent = document.querySelector<HTMLElement>(".ilaw-deped-print");
    if (!printContent) {
      void showMessageWindow({ title: "Preview not ready", message: "The lesson plan preview is not ready yet. Please try again.", mode: "info" });
      return;
    }
    // An existing blank window may be supplied when the approved plan needs to render first.
    // Otherwise open synchronously from the button click to avoid popup blocking.
    const previewWindow = existingPreviewWindow || window.open("", "_blank");
    if (!previewWindow) {
      void showMessageWindow({ title: "Pop-up blocked", message: "Please allow pop-ups for this site to view the PDF preview.", mode: "info" });
      return;
    }
    const styles = Array.from(document.querySelectorAll("style"))
      .map(style => style.textContent || "")
      .join("\n");
    const html = `<!doctype html>
      <html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>ILAW Lesson Plan PDF Preview</title>
      <style>${styles}
        html, body { margin: 0; padding: 0; background: #e5e7eb; }
        .ilaw-preview-toolbar { position: sticky; top: 0; z-index: 9999; display: flex; justify-content: flex-end; gap: 10px; padding: 12px 18px; background: #fff; border-bottom: 1px solid #d1d5db; box-shadow: 0 2px 6px #0001; }
        .ilaw-preview-toolbar button { border: 0; border-radius: 8px; padding: 9px 16px; font: 600 14px Arial,sans-serif; cursor: pointer; }
        .ilaw-preview-print { background: #4f46e5; color: white; }
        .ilaw-preview-close { background: #e5e7eb; color: #111827; }
        .ilaw-pdf-preview { width: min(13.25in, calc(100% - 32px)); margin: 22px auto; padding: 0; }
        .ilaw-pdf-preview .ilaw-deped-print { display: block !important; background: #fff !important; color: #172033 !important; padding: .28in .32in .32in !important; box-shadow: 0 8px 30px #11182724; font: 9pt/1.35 Arial, Helvetica, sans-serif !important; }
        .ilaw-pdf-preview .deped-print-header { text-align: center !important; line-height: 1.18 !important; margin: 0 0 12px !important; padding: 0 0 10px !important; border-bottom: 2px solid #17365d !important; }
        .ilaw-pdf-preview .deped-school { color: #334155 !important; font-size: 8.5pt !important; font-weight: 700 !important; letter-spacing: .55px !important; }
        .ilaw-pdf-preview .deped-print-header h1 { color: #17365d !important; font-size: 15pt !important; line-height: 1.2 !important; font-weight: 800 !important; margin: 5px 0 !important; }
        .ilaw-pdf-preview .deped-print-header h2 { color: #17365d !important; font-size: 12pt !important; font-weight: 800 !important; margin: 4px 0 !important; }
        .ilaw-pdf-preview .deped-print-header h3 { color: #475569 !important; font-size: 9pt !important; font-weight: 700 !important; margin: 3px 0 0 !important; }
        .ilaw-pdf-preview .ilaw-deped-print table { border-collapse: collapse !important; width: 100% !important; table-layout: fixed !important; margin: 0 0 10px !important; font-size: 8.5pt !important; }
        .ilaw-pdf-preview .ilaw-deped-print th, .ilaw-pdf-preview .ilaw-deped-print td { border: 1px solid #aab7c7 !important; padding: 5px 6px !important; vertical-align: top !important; text-align: left !important; white-space: pre-wrap !important; overflow-wrap: anywhere !important; word-break: normal !important; color: #172033 !important; }
        .ilaw-pdf-preview .ilaw-deped-print th { background: #eaf0f7 !important; font-weight: 700 !important; }
        .ilaw-pdf-preview .deped-meta th { width: 17% !important; color: #17365d !important; background: #eef3f8 !important; }
        .ilaw-pdf-preview .deped-meta td { width: 33% !important; background: #fff !important; }
        .ilaw-pdf-preview .deped-section-heading th { background: #d9e6f2 !important; color: #17365d !important; font-size: 9pt !important; font-weight: 800 !important; letter-spacing: .45px !important; padding: 7px 8px !important; border-top: 2px solid #7892ad !important; }
        .ilaw-pdf-preview .deped-session-table { font-size: 8pt !important; }
        .ilaw-pdf-preview .ilaw-flow-heading { display: inline-block; margin: 2px 0; font-weight: 800 !important; }
        .ilaw-pdf-preview .ilaw-flow-list { display: inline-block; margin: 2px 0 2px 18px !important; padding-left: 12px !important; list-style-position: outside !important; }
        .ilaw-pdf-preview .ilaw-flow-list li { display: list-item !important; margin: 1px 0 !important; padding-left: 2px !important; }
        .ilaw-pdf-preview .ilaw-deped-print td strong { font-weight: 800 !important; }
        .ilaw-pdf-preview .ilaw-deped-print td em { font-style: italic !important; }
        .ilaw-pdf-preview .ilaw-deped-print td u { text-decoration: underline !important; }
        .ilaw-pdf-preview .ilaw-deped-print td s { text-decoration: line-through !important; }
        .ilaw-pdf-preview .deped-session-table thead th { background: #17365d !important; color: #fff !important; font-size: 8pt !important; }
        .ilaw-pdf-preview .deped-session-table tbody tr:nth-child(even):not(.deped-section-heading) td { background: #f8fafc !important; }
        .ilaw-pdf-preview .deped-session-table tbody th { background: #eef3f8 !important; color: #17365d !important; }
        .ilaw-pdf-preview .deped-signatures { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; align-items: flex-start !important; justify-content: space-between !important; gap: 12px !important; width: 100% !important; margin: 22px auto 24px !important; break-inside: avoid !important; }
        .ilaw-pdf-preview .deped-signatures > div { display: block !important; flex: 1 1 0 !important; width: auto !important; min-width: 0 !important; max-width: none !important; margin: 0 !important; text-align: center !important; line-height: 1.35 !important; overflow-wrap: anywhere !important; }
        .ilaw-pdf-preview .deped-check-title { color: #17365d !important; text-align: center !important; font-size: 10pt !important; font-weight: 800 !important; margin: 18px 0 8px !important; padding: 8px !important; background: #eaf0f7 !important; border: 1px solid #aab7c7 !important; }
        .ilaw-pdf-preview table.deped-check thead th { background: #17365d !important; color: #fff !important; }
        .ilaw-pdf-preview .coaching-notes-print h3 { color: #17365d !important; text-align: center !important; font-size: 10pt !important; font-weight: 800 !important; margin: 16px 0 8px !important; padding: 7px !important; background: #eaf0f7 !important; border: 1px solid #aab7c7 !important; }
        .ilaw-pdf-preview .deped-logo-footer { border-top: 1px solid #aab7c7 !important; padding-top: 8px !important; margin-top: 14px !important; }
        .ilaw-pdf-preview .deped-footer-logos { display: flex !important; justify-content: flex-start !important; align-items: center !important; gap: 8px !important; }
        .ilaw-pdf-preview .deped-footer-logos img { width: 30px !important; height: 30px !important; object-fit: contain !important; }
        @media print {
          @page { size: legal landscape; margin: .28in .32in .32in; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .ilaw-preview-toolbar { display: none !important; }
          .ilaw-pdf-preview { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
          .ilaw-pdf-preview .ilaw-deped-print { display: block !important; width: 100% !important; padding: 0 !important; box-shadow: none !important; font-size: 8.5pt !important; }
          .ilaw-pdf-preview .deped-print-header { margin-bottom: 8px !important; padding-bottom: 5px !important; }
          .ilaw-pdf-preview .deped-print-header h1 { font-size: 12pt !important; }
          .ilaw-pdf-preview .deped-print-header h2 { font-size: 10.5pt !important; }
          .ilaw-pdf-preview .ilaw-deped-print th, .ilaw-pdf-preview .ilaw-deped-print td { padding: 3px 4px !important; }
          .ilaw-pdf-preview .ilaw-deped-print table { margin-bottom: 6px !important; }
          .ilaw-pdf-preview .deped-check-title { break-before: page !important; page-break-before: always !important; }
        }
      </style></head><body>
      <div class="ilaw-preview-toolbar"><button class="ilaw-preview-close" onclick="window.close()">Close Preview</button><button class="ilaw-preview-print" onclick="window.print()">Print</button></div>
      <main class="ilaw-pdf-preview ilaw-print-document">${printContent.outerHTML}</main>
      </body></html>`;
    previewWindow.document.open();
    previewWindow.document.write(html);
    previewWindow.document.close();
    previewWindow.focus();
  };

  // Restore every saved field. Prefer the active working draft, then the saved-plan list,
  // then the most recent local submission if the active draft is empty or unavailable.
  const [plan, setPlan] = useState<Plan>(() => blankPlan());
  const [savedPlans, setSavedPlans] = useState<Plan[]>([]);
  const [hasStartedPlan, setHasStartedPlan] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState("");
  const [showTermWeekModal, setShowTermWeekModal] = useState(false);
  const [listTermFilter, setListTermFilter] = useState("all");
  const [listWeekFilter, setListWeekFilter] = useState("all");
  const [showPlanList, setShowPlanList] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [language, setLanguage] = useState<"fil" | "en">("en");
  const isFilipino = language === "fil";
  const [activeSessionTab, setActiveSessionTab] = useState("session-1");
  const [activeLessonProperTab, setActiveLessonProperTab] = useState("Intentions");
  const currentSessionIndex = useMemo(() => {
    const list = Array.isArray(plan.sessions) && plan.sessions.length ? plan.sessions : [];
    const idx = list.findIndex(s => s.id === activeSessionTab);
    return idx >= 0 ? idx : 0;
  }, [plan.sessions, activeSessionTab]);
  const [objectivesApplyTargetsBySession, setObjectivesApplyTargetsBySession] = useState<Record<string, string[]>>(() => plan.objectivesApplyTargetsBySession || {});
  const [intentionApplyTargetsBySession, setIntentionApplyTargetsBySession] = useState<Record<string, string[]>>(() => plan.intentionApplyTargetsBySession || {});
  const [learnerContextApplyTargetsBySession, setLearnerContextApplyTargetsBySession] = useState<Record<string, string[]>>(() => plan.learnerContextApplyTargetsBySession || {});
  // Checkbox selections are stored inside the plan so they survive Save and reopening.
  useEffect(() => {
    setObjectivesApplyTargetsBySession(plan.objectivesApplyTargetsBySession || {});
    setIntentionApplyTargetsBySession(plan.intentionApplyTargetsBySession || {});
    setLearnerContextApplyTargetsBySession(plan.learnerContextApplyTargetsBySession || {});
  }, [plan.objectivesApplyTargetsBySession, plan.intentionApplyTargetsBySession, plan.learnerContextApplyTargetsBySession]);

  const openOrLoadPlan = (planToLoad: Plan, statusMsg?: string) => {
    const normalized = normalizeStoredPlan(planToLoad);
    (normalized.sessions || []).forEach(session => {
      flowDraftsRef.current[session.id] = String(session.flow || "");
      assessmentDraftsRef.current[session.id] = String(session.assessment || "");
    });
    setPlan(normalized);
    setSavedPlanSignature(JSON.stringify(normalized));
    setObjectivesApplyTargetsBySession(normalized.objectivesApplyTargetsBySession || {});
    setIntentionApplyTargetsBySession(normalized.intentionApplyTargetsBySession || {});
    setLearnerContextApplyTargetsBySession(normalized.learnerContextApplyTargetsBySession || {});
    setSelectedTerm(String(normalized.term || "1"));
    setSelectedWeek(String(normalized.week || "1"));
    setSelectedSubject(String(normalized.learningAreas || ""));
    setActiveSessionTab(normalized.sessions[0]?.id || "session-1");
    // Every newly created or opened lesson starts on Lesson Information.
    setActiveNavigationSection("01");
    setHasStartedPlan(true);
    setShowTermWeekModal(false);
    if (statusMsg) setWorkflowMessage(statusMsg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

 const [activeWaysForwardSessionIndex, setActiveWaysForwardSessionIndex] = useState(0);
  const [approvedEditSubmissionId, setApprovedEditSubmissionId] = useState<string | null>(null);
  const [previewApprovedPlanOnRender, setPreviewApprovedPlanOnRender] = useState(false);
  const pendingApprovedPdfWindowRef = useRef<Window | null>(null);
  const assessmentEditorRef = useRef<HTMLDivElement | null>(null);
  // Keep a synchronous copy of contentEditable values so saving never depends on
  // React finishing a state update before the Save click handler runs.
  const flowDraftsRef = useRef<Record<string, string>>({});
  const assessmentDraftsRef = useRef<Record<string, string>>({});
  const assessmentSelectionRef = useRef<Range | null>(null);
  const rememberEditorSelection = (editor: HTMLDivElement | null, savedRange: React.MutableRefObject<Range | null>) => {
    if (!editor || typeof window === "undefined") return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount && editor.contains(selection.anchorNode)) savedRange.current = selection.getRangeAt(0).cloneRange();
  };
  const runRichTextCommand = (editor: HTMLDivElement | null, savedRange: React.MutableRefObject<Range | null>, field: "flow" | "assessment", command: string, value?: string) => {
    if (!editor || currentSessionIndex < 0) return;
    editor.focus();
    const selection = window.getSelection();
    if (savedRange.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    } else if (selection && !editor.contains(selection.anchorNode)) {
      const range = document.createRange(); range.selectNodeContents(editor); range.collapse(false);
      selection.removeAllRanges(); selection.addRange(range);
    }
    if (command === "insertTable") {
      const html = field === "flow"
        ? '<table><thead><tr><th>Activity / Step</th><th>Teacher Actions</th><th>Learner Actions</th><th>Time</th></tr></thead><tbody><tr><td>Step 1</td><td> </td><td> </td><td> </td></tr><tr><td>Step 2</td><td> </td><td> </td><td> </td></tr></tbody></table><p><br></p>'
        : '<table><thead><tr><th>Criteria</th><th>Evidence / Response</th><th>Remarks</th></tr></thead><tbody><tr><td>Criterion 1</td><td>Enter response</td><td> </td></tr><tr><td>Criterion 2</td><td>Enter response</td><td> </td></tr></tbody></table><p><br></p>';
      document.execCommand("insertHTML", false, html);
    } else if (command === "heading") document.execCommand("formatBlock", false, value || "p");
    else document.execCommand(command, false, value);
    rememberEditorSelection(editor, savedRange);
    const sessionId = plan.sessions[currentSessionIndex].id;
    if (field === "flow") flowDraftsRef.current[sessionId] = editor.innerHTML;
    else assessmentDraftsRef.current[sessionId] = editor.innerHTML;
    updateSession(sessionId, field, editor.innerHTML);
  };
  useEffect(() => {
    if (!previewApprovedPlanOnRender) return;
    const previewWindow = pendingApprovedPdfWindowRef.current;
    pendingApprovedPdfWindowRef.current = null;
    setPreviewApprovedPlanOnRender(false);
    if (previewWindow && !previewWindow.closed) openPdfPreview(previewWindow);
  }, [previewApprovedPlanOnRender, plan]);

  useEffect(() => {
    // Refresh the synchronous draft cache whenever a plan/session is loaded.
    (plan.sessions || []).forEach(session => {
      flowDraftsRef.current[session.id] = String(session.flow || "");
      assessmentDraftsRef.current[session.id] = String(session.assessment || "");
    });
    if (assessmentEditorRef.current) assessmentEditorRef.current.innerHTML = assessmentHtml(plan.sessions[currentSessionIndex]?.assessment || "");
  }, [plan.sessions, activeSessionTab, approvedEditSubmissionId, currentSessionIndex]);

  useEffect(() => {
    if (plan.sessions && plan.sessions.length > 0) {
      if (!plan.sessions.some(s => s.id === activeSessionTab)) {
        setActiveSessionTab(plan.sessions[0].id);
      }
      if (activeWaysForwardSessionIndex >= plan.sessions.length) {
        setActiveWaysForwardSessionIndex(Math.max(0, plan.sessions.length - 1));
      }
    }
  }, [plan.sessions, activeSessionTab, activeWaysForwardSessionIndex]);
  const [sectionGradeFilter, setSectionGradeFilter] = useState("");
  const [sectionSubjectFilter, setSectionSubjectFilter] = useState("");
  const [showSelfCheck, setShowSelfCheck] = useState(true);
  const [activeNavigationSection, setActiveNavigationSection] = useState("01");
  const [savedPlanSignature, setSavedPlanSignature] = useState("");
  const approvedEditMode = Boolean(approvedEditSubmissionId);
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try { return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || "[]"); } catch { return []; }
  });
  const [changeRequests, setChangeRequests] = useState<ApprovedPlanChangeRequest[]>(() => {
    try { return JSON.parse(localStorage.getItem(CHANGE_REQUESTS_KEY) || "[]"); } catch { return []; }
  });
  // Approval is tracked per session. A previously approved session must not lock
  // the other sessions in the same weekly lesson plan.
  const currentTeacherSubmission = submissions.find(item =>
    item.teacherEmail === String(currentUser?.email || "").trim().toLowerCase() &&
    String(item.plan.term || "1") === String(plan.term || "1") &&
    String(item.plan.week || "1") === String(plan.week || "1") &&
    String(item.plan.lessonTitle || "").trim() === String(plan.lessonTitle || "").trim()
  );
  const activeSessionId = plan.sessions[currentSessionIndex]?.id;
  const activeSessionReviewStatus = activeSessionId
    ? (currentTeacherSubmission?.sessionStatuses?.[activeSessionId] ||
      ((currentTeacherSubmission?.approvedSessionIds || []).includes(activeSessionId) ? "approved" : "pending"))
    : "pending";
  const isCurrentSessionApproved = !approvedEditMode && !!activeSessionId && activeSessionReviewStatus === "approved";
  const isCurrentPlanApproved = isCurrentSessionApproved;
  // Pending or returned sessions stay fully editable even if an older/stale
  // approvedSessionIds array contains their IDs. Only this session's current
  // approval status can lock its controls.
  // Teachers must be able to complete or revise any session, including an approved session,
  // so its Reflection can be entered. Approval remains tracked independently per session.
  const controlsLocked = false;
  const [reviewNote, setReviewNote] = useState("");
  const [reviewCoachingNote, setReviewCoachingNote] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [workflowMessage, setWorkflowMessage] = useState("");
  const [viewingSubmissionId, setViewingSubmissionId] = useState<string | null>(null);
  const [reviewSessionIndex, setReviewSessionIndex] = useState(0);
  const [cloudMessage, setCloudMessage] = useState("");
  const [lessonMaterials, setLessonMaterials] = useState<StoredLessonMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsMessage, setMaterialsMessage] = useState("");
  const [activeMaterialsSessionIndex, setActiveMaterialsSessionIndex] = useState(0);
  const [firestoreUserEmail, setFirestoreUserEmail] = useState("");
  const materialsInputRef = useRef<HTMLInputElement | null>(null);
  const assessmentAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const signedInUserKey = String(currentUser?.uid || currentUser?.userId || currentUser?.user_id || currentUser?.id || currentUser?.profile?.uid || currentUser?.profile?.id || currentUser?.email || currentUser?.profile?.email || "").trim();
  const materialsOwner = firestoreUserEmail;
  useEffect(() => {
    let cancelled = false;
    setFirestoreUserEmail("");
    setLessonMaterials([]);
    if (!signedInUserKey) {
      setMaterialsMessage("Please sign in before accessing lesson materials.");
      return () => { cancelled = true; };
    }
    setMaterialsLoading(true);
    setMaterialsMessage("Looking up your email in Firestore users…");
    void resolveSignedInEmailFromFirestore(currentUser)
      .then(email => { if (!cancelled) { setFirestoreUserEmail(email); setMaterialsMessage(""); } })
      .catch(error => { if (!cancelled) setMaterialsMessage(error instanceof Error ? error.message : "Could not retrieve the signed-in user's email from Firestore."); })
      .finally(() => { if (!cancelled) setMaterialsLoading(false); });
    return () => { cancelled = true; };
  }, [signedInUserKey]);
  const refreshLessonMaterials = async () => {
    if (!materialsOwner) {
      setMaterialsMessage("Your email has not been retrieved from Firestore users yet. Please check the user record and try again.");
      return;
    }
    setMaterialsLoading(true);
    try { setLessonMaterials(await getStoredLessonMaterials(materialsOwner)); setMaterialsMessage(""); }
    catch (error) { setMaterialsMessage(error instanceof Error ? error.message : "Could not load lesson materials."); }
    finally { setMaterialsLoading(false); }
  };
  useEffect(() => { if (materialsOwner) void refreshLessonMaterials(); }, [materialsOwner]);
  const uploadLessonMaterials = async (files: FileList | null) => {
    if (!files?.length) return;
    const targetSession = plan.sessions[activeMaterialsSessionIndex] || plan.sessions[0];
    const lessonPlanKey = `${String(plan.term || "1")}-${String(plan.week || "1")}-${String(plan.learningAreas || "").trim().toLowerCase()}-${String(plan.lessonTitle || "").trim().toLowerCase()}`;
    if (!materialsOwner) { setMaterialsMessage("Cannot upload yet: the signed-in user's email was not found in Firestore users."); if (materialsInputRef.current) materialsInputRef.current.value = ""; return; }
    setMaterialsLoading(true); setMaterialsMessage("");
    try {
      const uploadedIds: string[] = [];
      const uploadedNames: string[] = [];
      const uploadedRecords: StoredLessonMaterial[] = [];
      const uploadStartedAt = Date.now();
      for (const file of Array.from(files)) {
        const id = `${materialsOwner}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const storedId = await saveStoredLessonMaterial({ id, owner: materialsOwner, name: file.name, type: file.type || "application/octet-stream", size: file.size, uploadedAt: new Date().toISOString(), file, lessonPlanKey, sessionId: targetSession?.id || "session-1", learningArea: String(plan.learningAreas || ""), term: String(plan.term || "1"), week: String(plan.week || "1") });
        if (storedId) {
          uploadedIds.push(storedId);
          uploadedRecords.push({ id: storedId, owner: materialsOwner, name: file.name, type: file.type || "application/octet-stream", size: file.size, uploadedAt: new Date().toISOString(), lessonPlanKey, sessionId: targetSession?.id || "session-1", learningArea: String(plan.learningAreas || ""), term: String(plan.term || "1"), week: String(plan.week || "1") });
        }
        uploadedNames.push(file.name);
      }
      const refreshedMaterials = await getStoredLessonMaterials(materialsOwner);
      // Keep the just-uploaded session metadata in the UI even when the Apps
      // Script list endpoint returns file records without custom metadata.
      const refreshedIds = new Set(refreshedMaterials.map(material => String(material.id)));
      const mergedMaterials = [...refreshedMaterials, ...uploadedRecords.filter(material => !refreshedIds.has(String(material.id)))];
      setLessonMaterials(mergedMaterials);
      const matchingIds = refreshedMaterials.filter(material =>
        material.sessionId === (targetSession?.id || "session-1") &&
        material.lessonPlanKey === lessonPlanKey &&
        String(material.learningArea || "").trim().toLowerCase() === String(plan.learningAreas || "").trim().toLowerCase() &&
        (uploadedIds.includes(material.id) || (uploadedNames.includes(material.name) && Date.parse(material.uploadedAt || "") >= uploadStartedAt - 5000))
      ).map(material => material.id);
      const finalIds = matchingIds.length ? matchingIds : uploadedIds;
      if (targetSession && finalIds.length) {
        setPlan(prev => ({ ...prev, sessions: prev.sessions.map(session => session.id === targetSession.id ? ({ ...session, lessonMaterialIds: Array.from(new Set([...(session.lessonMaterialIds || []), ...finalIds])) }) : session) }));
      }
      setMaterialsMessage(`${files.length} file(s) uploaded to Session ${activeMaterialsSessionIndex + 1} — ${String(plan.learningAreas || "Learning Area not selected")}.`);
    } catch (error) { setMaterialsMessage(error instanceof Error ? error.message : "Upload failed. Please try again."); }
    finally { setMaterialsLoading(false); if (materialsInputRef.current) materialsInputRef.current.value = ""; }
  };
  const uploadAssessmentAttachments = async (files: FileList | null) => {
    if (!files?.length || currentSessionIndex < 0) return;
    const targetSession = plan.sessions[currentSessionIndex];
    if (!targetSession) return;
    const allowedExtensions = /\.(pdf|doc|docx)$/i;
    const selectedFiles = Array.from(files);
    const invalid = selectedFiles.filter(file => !allowedExtensions.test(file.name));
    if (invalid.length) {
      setMaterialsMessage("Assessment attachments must be PDF or Word files (.pdf, .doc, .docx).");
      if (assessmentAttachmentInputRef.current) assessmentAttachmentInputRef.current.value = "";
      return;
    }
    if (!materialsOwner) {
      setMaterialsMessage("Cannot upload yet: the signed-in user's email was not found in Firestore users.");
      if (assessmentAttachmentInputRef.current) assessmentAttachmentInputRef.current.value = "";
      return;
    }
    const lessonPlanKey = `${String(plan.term || "1")}-${String(plan.week || "1")}-${String(plan.learningAreas || "").trim().toLowerCase()}-${String(plan.lessonTitle || "").trim().toLowerCase()}`;
    setMaterialsLoading(true);
    setMaterialsMessage("");
    try {
      const uploaded: { id: string; name: string; type: string; size: number; included?: boolean; required?: boolean }[] = [];
      const uploadedRecords: StoredLessonMaterial[] = [];
      for (const file of selectedFiles) {
        const id = `${materialsOwner}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const storedId = await saveStoredLessonMaterial({
          id, owner: materialsOwner, name: file.name,
          type: file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/msword"),
          size: file.size, uploadedAt: new Date().toISOString(), file,
          lessonPlanKey, sessionId: targetSession.id,
          learningArea: String(plan.learningAreas || ""), term: String(plan.term || "1"), week: String(plan.week || "1")
        });
        if (storedId) {
          uploaded.push({ id: storedId, name: file.name, type: file.type || "application/octet-stream", size: file.size, included: true, required: false });
          uploadedRecords.push({ id: storedId, owner: materialsOwner, name: file.name, type: file.type || "application/octet-stream", size: file.size, uploadedAt: new Date().toISOString(), lessonPlanKey, sessionId: targetSession.id, learningArea: String(plan.learningAreas || ""), term: String(plan.term || "1"), week: String(plan.week || "1") });
        }
      }
      setLessonMaterials(prev => [...prev.filter(item => !uploadedRecords.some(record => record.id === item.id)), ...uploadedRecords, ...prev.filter(item => uploadedRecords.some(record => record.id === item.id))]);
      if (uploaded.length) {
        setPlan(prev => ({ ...prev, sessions: prev.sessions.map(session => session.id === targetSession.id
          ? { ...session, assessmentAttachments: [...(session.assessmentAttachments || []).filter(item => !uploaded.some(file => file.id === item.id)), ...uploaded] }
          : session) }));
      }
      setMaterialsMessage(`${uploaded.length} assessment file(s) uploaded to Session ${currentSessionIndex + 1}.`);
    } catch (error) {
      setMaterialsMessage(error instanceof Error ? error.message : "Assessment upload failed. Please try again.");
    } finally {
      setMaterialsLoading(false);
      if (assessmentAttachmentInputRef.current) assessmentAttachmentInputRef.current.value = "";
    }
  };
  const deleteAssessmentAttachment = async (attachment: { id: string; name: string; type: string; size?: number }, sessionId: string) => {
    const confirmed = await showMessageWindow({
      title: isFilipino ? "Permanenteng burahin ang file?" : "Permanently delete file?",
      message: isFilipino
        ? `Permanenteng buburahin ang “${attachment.name}” mula sa Google Drive, hindi lamang aalisin sa session. Hindi na ito maibabalik. Itutuloy?`
        : `Permanently delete “${attachment.name}” from Google Drive, not just remove it from this session? This cannot be undone. Continue?`,
      mode: "confirm", confirmLabel: isFilipino ? "Burahin sa Drive" : "Delete from Drive", danger: true
    });
    if (confirmed !== true) return;
    if (!materialsOwner) {
      setMaterialsMessage("Cannot delete: the signed-in user's email was not found in Firestore users.");
      return;
    }
    setMaterialsLoading(true);
    setMaterialsMessage("");
    try {
      await deleteStoredLessonMaterial(attachment.id, materialsOwner);
      setLessonMaterials(prev => prev.filter(item => item.id !== attachment.id));
      setPlan(prev => ({ ...prev, sessions: prev.sessions.map(session => ({
        ...session,
        assessmentAttachments: session.id === sessionId
          ? (session.assessmentAttachments || []).filter(item => item.id !== attachment.id)
          : (session.assessmentAttachments || []).filter(item => item.id !== attachment.id)
      })) }));
      setMaterialsMessage(isFilipino ? "Permanenteng nabura ang file mula sa Google Drive." : "File permanently deleted from Google Drive.");
    } catch (error) {
      setMaterialsMessage(error instanceof Error ? error.message : "Could not delete the file from Google Drive.");
    } finally {
      setMaterialsLoading(false);
    }
  };

  const downloadLessonMaterial = async (material: StoredLessonMaterial) => {
    try {
      setMaterialsMessage("");
      const result = await driveApiRequest("download", { id: material.id, owner: materialsOwner });
      const binary = atob(String(result.base64 || ""));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: material.type || "application/octet-stream" });
      const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = material.name; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setMaterialsMessage(error instanceof Error ? error.message : "Could not download this material from Google Drive."); }
  };
  const previewAssessmentAttachment = async (attachment: { id: string; name: string; type: string; size?: number }, ownerOverride?: string) => {
    try {
      setMaterialsMessage("");
      const result = await driveApiRequest("download", { id: attachment.id, owner: ownerOverride || materialsOwner });
      const binary = atob(String(result.base64 || ""));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const type = attachment.type || (attachment.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream");
      const url = URL.createObjectURL(new Blob([bytes], { type }));
      setAssessmentPreview({ url, name: attachment.name, type });
    } catch (error) {
      setMaterialsMessage(error instanceof Error ? error.message : "Could not preview this assessment attachment.");
    }
  };
  const closeAssessmentPreview = () => {
    if (assessmentPreview?.url) URL.revokeObjectURL(assessmentPreview.url);
    setAssessmentPreview(null);
  };

  const removeLessonMaterial = async (material: StoredLessonMaterial) => {
    const confirmed = await showMessageWindow({ title: "Delete lesson material", message: `Delete “${material.name}” from the shared Google Drive lesson materials folder?`, mode: "confirm", confirmLabel: "Delete", danger: true });
    if (confirmed !== true) return;
    try { await deleteStoredLessonMaterial(material.id, materialsOwner); await refreshLessonMaterials(); setMaterialsMessage("Material deleted."); }
    catch (error) { setMaterialsMessage(error instanceof Error ? error.message : "Could not delete this material."); }
  };

  // Keep all transient status notifications visible for 3 seconds, then dismiss them automatically.
  useEffect(() => {
    if (!workflowMessage) return;
    const message = workflowMessage;
    const timer = window.setTimeout(() => {
      setWorkflowMessage(current => current === message ? "" : current);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [workflowMessage]);

  useEffect(() => {
    if (!savedMessage) return;
    const message = savedMessage;
    const timer = window.setTimeout(() => {
      setSavedMessage(current => current === message ? "" : current);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [savedMessage]);

  useEffect(() => {
    if (!cloudMessage) return;
    const message = cloudMessage;
    const timer = window.setTimeout(() => {
      setCloudMessage(current => current === message ? "" : current);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [cloudMessage]);
  const [schoolLogo, setSchoolLogo] = useState<string>("");
  const [depEdLogo, setDepEdLogo] = useState<string>("");
  const [schoolDisplayName, setSchoolDisplayName] = useState<string>("");
  const [resolvedSchoolHeadName, setResolvedSchoolHeadName] = useState<string>("");
  const [schoolTeacherOptions, setSchoolTeacherOptions] = useState<Array<{ id: string; name: string; role: string }>>([]);

  // Derive the teacher name from the signed-in profile and resolve the school head
  // from the School List (Firestore `schools`) using the teacher's assigned school ID.
  const userDisplayName = useMemo(() => {
    const profiles = [currentUser, currentUser?.profile, currentUser?.teacherProfile, currentUser?.teacher, currentUser?.user];
    for (const profile of profiles) {
      if (!profile) continue;
      const direct = profile.displayName || profile.fullName || profile.full_name || profile.name || profile.username || profile.preferredName ||
        profile.teacherName || profile.teacher_name || profile.employeeName || profile.employee_name || profile.teacherFullName || profile.teacher_full_name || profile.nameOfTeacher;
      if (direct && String(direct).trim()) return String(direct).trim();
      const parts = [profile.firstName || profile.first_name, profile.middleName || profile.middle_name, profile.lastName || profile.last_name]
        .map(value => String(value || "").trim()).filter(Boolean);
      if (parts.length) return parts.join(" ");
    }
    return "";
  }, [currentUser]);
  // Start every new/cleared lesson with the signed-in teacher's identity. The
  // profile effect alone is not enough because it does not rerun when a blank
  // plan is created after sign-in has already completed.
  const blankPlanForCurrentUser = () => ({
    ...blankPlan(),
    teacherNames: userDisplayName,
    schoolHeadName: String(plan.schoolHeadName || "").trim()
  });

  const schoolId = String(
    currentUser?.schoolId || currentUser?.school_id || currentUser?.schoolID || currentUser?.schoolIDNumber ||
    currentUser?.assignedSchoolId || currentUser?.assignedSchoolID || currentUser?.schoolNumber ||
    currentUser?.school?.schoolId || currentUser?.school?.school_id || currentUser?.school?.schoolID || currentUser?.school?.schoolIDNumber || currentUser?.school?.id ||
    currentUser?.assignedSchool?.schoolId || currentUser?.assignedSchool?.school_id || currentUser?.assignedSchool?.schoolID || currentUser?.assignedSchool?.id ||
    currentUser?.profile?.schoolId || currentUser?.profile?.school_id || currentUser?.profile?.schoolID || currentUser?.profile?.schoolIDNumber ||
    currentUser?.teacherProfile?.schoolId || currentUser?.teacherProfile?.school_id || currentUser?.teacherProfile?.schoolID || currentUser?.teacherProfile?.schoolIDNumber ||
    currentUser?.teacher?.schoolId || currentUser?.teacher?.school_id || currentUser?.teacher?.schoolID || currentUser?.teacher?.schoolIDNumber ||
    currentUser?.user?.schoolId || currentUser?.user?.school_id || currentUser?.user?.schoolID || currentUser?.user?.schoolIDNumber ||
    currentUser?.schoolAssignment?.schoolId || currentUser?.schoolAssignment?.school_id || currentUser?.schoolAssignment?.schoolID || currentUser?.schoolAssignment?.id || ""
  ).trim();

  useEffect(() => {
    let cancelled = false;
    const loadTeachersForSchool = async () => {
      const normalize = (value: any) => String(value ?? "").trim().replace(/\s+/g, "");
      const schoolIdOf = (record: any) => record?.schoolId ?? record?.school_id ?? record?.schoolID ??
        record?.schoolIDNumber ?? record?.school_id_number ?? record?.assignedSchoolId ?? record?.assignedSchoolID ??
        record?.schoolNumber ?? record?.schoolCode ?? record?.school_code ?? record?.schoolAssignment?.schoolId ??
        record?.school?.schoolId ?? record?.school?.school_id ?? record?.school?.schoolID ?? record?.school?.id ??
        record?.assignedSchool?.schoolId ?? record?.assignedSchool?.school_id ?? record?.assignedSchool?.schoolID ?? record?.assignedSchool?.id;
      let lookupSchoolId = String(schoolId || "").trim();
      const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
      const email = String(currentUser?.email || currentUser?.profile?.email || currentUser?.teacherProfile?.email || "").trim().toLowerCase();

      // The authenticated profile can omit School ID. Resolve it from the signed-in
      // account's teacher/user record before loading the signatory list.
      if (!lookupSchoolId) {
        for (const collectionName of ["teachers", "users"]) {
          try {
            let accountRecord: any = null;
            if (uid) {
              const byId = await getDoc(doc(db, collectionName, uid));
              if (byId.exists()) accountRecord = { id: byId.id, ...byId.data() };
            }
            if (!accountRecord && email) {
              const byEmail = await getDocs(query(collection(db, collectionName), where("email", "==", email)));
              if (!byEmail.empty) accountRecord = { id: byEmail.docs[0].id, ...byEmail.docs[0].data() };
            }
            const recordSchoolId = schoolIdOf(accountRecord);
            if (recordSchoolId !== undefined && recordSchoolId !== null && String(recordSchoolId).trim()) {
              lookupSchoolId = String(recordSchoolId).trim();
              break;
            }
          } catch (error) {
            console.debug(`Could not resolve School ID from ${collectionName}.`, error);
          }
        }
      }

      if (!lookupSchoolId) {
        if (!cancelled) setSchoolTeacherOptions([]);
        console.warn("Cannot load Assign Teacher options because the signed-in user's School ID could not be resolved.");
        return;
      }

      const schoolFields = ["schoolId", "school_id", "schoolID", "schoolIDNumber", "school_id_number", "assignedSchoolId", "assignedSchoolID", "schoolNumber", "schoolCode", "school_code"];
      const candidates: any[] = [lookupSchoolId];
      if (/^\d+$/.test(lookupSchoolId)) candidates.push(Number(lookupSchoolId));
      const records = new Map<string, any>();

      // Query both account collections because some deployments store teacher profiles
      // in `teachers`, while others keep the school assignment on `users` documents.
      for (const collectionName of ["teachers", "users"]) {
        for (const fieldName of schoolFields) {
          for (const candidate of candidates) {
            try {
              const snap = await getDocs(query(collection(db, collectionName), where(fieldName, "==", candidate)));
              snap.docs.forEach(item => records.set(`${collectionName}:${item.id}`, { id: item.id, ...item.data(), _sourceCollection: collectionName }));
            } catch (error) {
              // School ID field aliases vary by deployment; continue through the aliases.
            }
          }
        }
      }

      // If no alias query matched, try one collection read as a compatibility fallback
      // for records that store School ID in nested profile fields or an uncommon alias.
      if (records.size === 0) {
        for (const collectionName of ["teachers", "users"]) {
          try {
            const snap = await getDocs(collection(db, collectionName));
            snap.docs.forEach(item => records.set(`${collectionName}:${item.id}`, { id: item.id, ...item.data(), _sourceCollection: collectionName }));
          } catch (error) {
            console.debug(`Could not read ${collectionName} as a fallback for Assign Teacher.`, error);
          }
        }
      }

      const getName = (record: any) => {
        const direct = record.displayName || record.fullName || record.full_name || record.name || record.teacherName || record.teacher_name || record.employeeName || record.employee_name;
        if (direct && String(direct).trim()) return String(direct).trim();
        return [record.firstName || record.first_name, record.middleName || record.middle_name, record.lastName || record.last_name]
          .map((v: any) => String(v || "").trim()).filter(Boolean).join(" ");
      };
      const optionsByIdentity = new Map<string, { id: string; name: string; role: string }>();
      Array.from(records.values()).forEach((record: any) => {
        const recordSchoolId = schoolIdOf(record);
        const name = getName(record);
        if (normalize(recordSchoolId) !== normalize(lookupSchoolId) || !name) return;

        // Never offer student accounts in the signatory dropdown. Some deployments
        // store both teachers and students in `users`, so inspect all common role fields.
        const roleValues = [record.position, record.designation, record.role, record.userRole,
          record.user_role, record.accountType, record.account_type, record.userType,
          record.user_type, record.accountRole, record.account_role, record.type,
          record.profile?.role, record.profile?.userRole, record.profile?.accountType]
          .filter((value: any) => value !== undefined && value !== null && String(value).trim())
          .map((value: any) => String(value).trim().toLowerCase());
        const roleText = roleValues.join(" ");
        const explicitlyStudent = /\b(student|learner|pupil|learner account|student account)\b/.test(roleText);
        if (explicitlyStudent) return;

        // `teachers` is the canonical teacher profile collection. For records found
        // only in `users`, require an explicit teacher/staff/school-lead role rather
        // than treating every same-school account as a teacher.
        const isTeacherProfile = record._sourceCollection === "teachers" ||
          roleValues.some((value: string) => /\b(teacher|master teacher|head teacher|school head|principal|assistant principal|vice principal|faculty|educator)\b/.test(value));
        if (!isTeacherProfile) return;

        // Prefer a teacher document ID for assignment, but keep the user document ID
        // when a matching teacher record is not available.
        const id = String(record.uid || record.userId || record.user_id || record.id);
        const identity = String(record.email || record.uid || record.userId || record.user_id || name).trim().toLowerCase();
        const option = { id, name, role: String(record.position || record.designation || record.role || record.userRole || record.accountType || "Teacher") };
        const existing = optionsByIdentity.get(identity);
        if (!existing || (record._sourceCollection === "teachers" && existing.id !== id)) optionsByIdentity.set(identity, option);
      });
      const options = Array.from(optionsByIdentity.values()).sort((a, b) => a.name.localeCompare(b.name));
      if (!cancelled) setSchoolTeacherOptions(options);
      if (!options.length) console.warn(`No teacher records found for School ID ${lookupSchoolId}. Check the school ID fields and Firestore read permissions in teachers/users.`);
    };
    void loadTeachersForSchool();
    return () => { cancelled = true; };
  }, [schoolId, currentUser]);

  useEffect(() => {
    if (userDisplayName) {
      setPlan(prev => prev.teacherNames === userDisplayName ? prev : { ...prev, teacherNames: userDisplayName });
    }
  }, [userDisplayName]);

  // Resolve the signed-in teacher's canonical name from the Firestore users record as well
  // as the auth/profile object. Match by UID first, then email, constrained by school ID.
  useEffect(() => {
    let cancelled = false;
    const resolveTeacherName = async () => {
      const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
      const email = String(currentUser?.email || currentUser?.profile?.email || currentUser?.teacherProfile?.email || "").trim().toLowerCase();
      const normalize = (v: any) => String(v ?? "").trim();
      const displayName = (record: any) => {
        const direct = record?.displayName || record?.fullName || record?.full_name || record?.name || record?.username || record?.preferredName || record?.teacherName || record?.teacher_name || record?.employeeName || record?.employee_name || record?.teacherFullName || record?.teacher_full_name;
        if (direct && String(direct).trim()) return String(direct).trim();
        return [record?.firstName || record?.first_name, record?.middleName || record?.middle_name, record?.lastName || record?.last_name]
          .map(normalize).filter(Boolean).join(" ");
      };
      try {
        let record: any = null;
        if (uid) {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) record = snap.data();
        }
        if (!record && email) {
          const snap = await getDocs(query(collection(db, "users"), where("email", "==", email)));
          const docs = snap.docs.map(d => d.data());
          record = docs.find((item: any) => !schoolId || !item.schoolId || normalize(item.schoolId) === normalize(schoolId)) || null;
        }
        if (!record) return;
        const recordSchoolId = record.schoolId || record.school_id || record.schoolID || record.schoolIDNumber;
        if (schoolId && recordSchoolId && normalize(recordSchoolId) !== normalize(schoolId)) return;
        const name = displayName(record);
        if (name && !cancelled) setPlan(prev => prev.teacherNames === name ? prev : { ...prev, teacherNames: name });
      } catch (error) {
        console.warn("Could not resolve teacher name from the users collection; using signed-in profile.", error);
      }
    };
    void resolveTeacherName();
    return () => { cancelled = true; };
  }, [currentUser, schoolId]);

  useEffect(() => {
    let cancelled = false;
    const normalizeSchoolId = (value: any) => String(value ?? "").trim().replace(/\s+/g, "");
    const nameOf = (record: any): string => {
      if (!record) return "";
      const direct = record.headOfSchoolName ?? record.head_of_school_name ?? record.headOfSchool ?? record.head_of_school ??
        record.schoolHeadName ?? record.school_head_name ?? record.schoolHeadFullName ?? record.school_head_full_name ??
        record.principalName ?? record.principal_name ?? record.principalFullName ?? record.principal_full_name ??
        record.schoolHeadFullName ?? record.school_head_full_name ?? record.schoolHead ?? record.school_head ?? record.principal ??
        record.schoolLeaderName ?? record.school_leader_name ?? record.headName ?? record.head_name;
      if (typeof direct === "string" && direct.trim() && direct.trim().toLowerCase() !== "n/a") return direct.trim();
      if (direct && typeof direct === "object") {
        const nested = direct.displayName || direct.fullName || direct.name || direct.label;
        if (nested && String(nested).trim()) return String(nested).trim();
        const parts = [direct.firstName || direct.first_name, direct.middleName || direct.middle_name, direct.lastName || direct.last_name]
          .map(value => String(value || "").trim()).filter(Boolean);
        if (parts.length) return parts.join(" ");
      }
      const parts = [record.schoolHeadFirstName || record.school_head_first_name || record.principalFirstName || record.principal_first_name || record.headOfSchoolFirstName || record.firstName,
        record.schoolHeadMiddleName || record.school_head_middle_name || record.principalMiddleName || record.principal_middle_name || record.headOfSchoolMiddleName || record.middleName,
        record.schoolHeadLastName || record.school_head_last_name || record.principalLastName || record.principal_last_name || record.headOfSchoolLastName || record.lastName]
        .map(value => String(value || "").trim()).filter(Boolean);
      return parts.join(" ");
    };

    const readSchoolHeadFromSchoolList = async () => {
      // Resolve the signed-in teacher's database record first. The `teachers` collection
      // is authoritative for the teacher's schoolID; use that ID to retrieve the school head.
      let lookupSchoolId = schoolId;
      let teacherRecord: any = null;
      const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
      const email = String(currentUser?.email || currentUser?.profile?.email || currentUser?.teacherProfile?.email || "").trim().toLowerCase();
      try {
        if (uid) {
          const byId = await getDoc(doc(db, "teachers", uid));
          if (byId.exists()) teacherRecord = { id: byId.id, ...byId.data() };
        }
        if (!teacherRecord && email) {
          const byEmail = await getDocs(query(collection(db, "teachers"), where("email", "==", email)));
          if (!byEmail.empty) teacherRecord = { id: byEmail.docs[0].id, ...byEmail.docs[0].data() };
        }
        if (teacherRecord) {
          const teacherSchoolId = teacherRecord.schoolId ?? teacherRecord.school_id ?? teacherRecord.schoolID ?? teacherRecord.schoolIDNumber ?? teacherRecord.assignedSchoolId ?? teacherRecord.assignedSchoolID;
          if (teacherSchoolId !== undefined && teacherSchoolId !== null && String(teacherSchoolId).trim()) {
            lookupSchoolId = String(teacherSchoolId).trim();
          }
          const teacherHeadName = nameOf(teacherRecord);
          if (teacherHeadName && !cancelled && /school.?head|principal|school.?administrator/i.test(String(teacherRecord.role || teacherRecord.userRole || teacherRecord.position || teacherRecord.designation || ""))) {
            setResolvedSchoolHeadName(teacherHeadName);
            setPlan(prev => prev.schoolHeadName === teacherHeadName ? prev : { ...prev, schoolHeadName: teacherHeadName });
          }
        }
      } catch (error) {
        console.warn("Could not resolve teacher record from Firestore `teachers`; using the signed-in user's schoolID.", error);
      }

      // Use a school-head name already included in the signed-in user's school profile
      // as a fallback while the canonical School List record is being loaded.
      const profileSchoolRecords = [
        currentUser?.school,
        currentUser?.assignedSchool,
        currentUser?.schoolProfile,
        currentUser?.profile?.school,
        currentUser?.teacherProfile?.school,
        currentUser?.assignedSchoolProfile
      ];
      const profileHeadName = profileSchoolRecords.map(nameOf).find(Boolean) || "";
      if (profileHeadName && !cancelled) {
        setResolvedSchoolHeadName(profileHeadName);
        setPlan(prev => prev.schoolHeadName === profileHeadName ? prev : { ...prev, schoolHeadName: profileHeadName });
      }

      if (!lookupSchoolId) {
        console.warn("Cannot resolve principal: no schoolID found in the signed-in user or teachers database record.", currentUser);
        return;
      }
      try {
        // The app's School List is stored in Firestore `schools`, keyed by the schoolId field.
        const candidates: any[] = [lookupSchoolId];
        if (/^\d+$/.test(lookupSchoolId)) candidates.push(Number(lookupSchoolId));
        let schoolRecord: any = null;

        // Read the School List and match against the teacher's exact assigned school ID.
        // This also supports records whose school ID is stored under a different alias,
        // as a number instead of a string, or only as the Firestore document ID.
        const schoolsSnap = await getDocs(collection(db, "schools"));
        const normalizedLookupSchoolId = normalizeSchoolId(lookupSchoolId);
        const schoolIdFromRecord = (record: any, documentId = "") =>
          record?.schoolId ?? record?.school_id ?? record?.schoolID ?? record?.schoolIDNumber ??
          record?.school_id_number ?? record?.assignedSchoolId ?? record?.assignedSchoolID ??
          record?.schoolCode ?? record?.school_code ?? documentId;
        const schoolMatch = schoolsSnap.docs.find(item => {
          const data = item.data();
          return normalizeSchoolId(schoolIdFromRecord(data, item.id)) === normalizedLookupSchoolId;
        });
        if (schoolMatch) schoolRecord = { id: schoolMatch.id, ...schoolMatch.data() };

        let resolvedName = nameOf(schoolRecord);

        // If the School List document does not contain the name, search teacher records
        // belonging to this exact schoolID and prefer a designated School Head/Principal.
        if (!resolvedName) {
          const teacherFields = ["schoolId", "school_id", "schoolID", "schoolIDNumber", "assignedSchoolId", "assignedSchoolID"];
          const normalize = (value: any) => String(value ?? "").trim().replace(/\s+/g, "");
          const candidates: any[] = [lookupSchoolId];
          if (/^\d+$/.test(lookupSchoolId)) candidates.push(Number(lookupSchoolId));
          const teacherRecords = new Map<string, any>();
          for (const fieldName of teacherFields) {
            for (const candidate of candidates) {
              try {
                const teacherSnap = await getDocs(query(collection(db, "teachers"), where(fieldName, "==", candidate)));
                teacherSnap.docs.forEach(item => teacherRecords.set(item.id, { id: item.id, ...item.data() }));
              } catch (queryError) {
                console.debug(`Principal lookup skipped teachers.${fieldName}`, queryError);
              }
            }
          }
          const matches = Array.from(teacherRecords.values()).filter((record: any) => {
            const recordSchoolId = record.schoolId ?? record.school_id ?? record.schoolID ?? record.schoolIDNumber ?? record.assignedSchoolId ?? record.assignedSchoolID;
            return normalize(recordSchoolId) === normalize(lookupSchoolId);
          });
          const roleOf = (record: any) => String(record.role || record.userRole || record.accountType || record.userType || record.position || record.designation || "").toLowerCase();
          const headRecord = matches.find((record: any) => /school.?head|principal|school.?administrator/.test(roleOf(record)) || record.isSchoolHead === true || record.isPrincipal === true || record.is_school_head === true || record.is_principal === true);
          resolvedName = nameOf(headRecord) || nameOf(matches.find((record: any) => nameOf(record)));
        }

        // Compatibility fallback: some deployments store school-head accounts in `users`.
        if (!resolvedName) {
          const principalName = (record: any) => {
            const direct = record?.displayName || record?.fullName || record?.full_name || record?.name ||
              record?.schoolHeadName || record?.school_head_name || record?.principalName || record?.principal_name ||
              record?.teacherName || record?.teacher_name || record?.employeeName || record?.employee_name;
            if (direct && String(direct).trim()) return String(direct).trim();
            return [record?.firstName || record?.first_name, record?.middleName || record?.middle_name, record?.lastName || record?.last_name]
              .map((value: any) => String(value || "").trim()).filter(Boolean).join(" ");
          };
          const schoolFields = ["schoolId", "school_id", "schoolID", "schoolIDNumber", "assignedSchoolId", "assignedSchoolID"];
          const normalize = (value: any) => String(value ?? "").trim().replace(/\s+/g, "");
          const candidates: any[] = [lookupSchoolId];
          if (/^\d+$/.test(lookupSchoolId)) candidates.push(Number(lookupSchoolId));
          const userRecords = new Map<string, any>();
          for (const fieldName of schoolFields) {
            for (const candidate of candidates) {
              try {
                const usersSnap = await getDocs(query(collection(db, "users"), where(fieldName, "==", candidate)));
                usersSnap.docs.forEach(item => userRecords.set(item.id, { id: item.id, ...item.data() }));
              } catch (queryError) {
                // Different deployments may not have every optional field indexed/used.
                console.debug(`Principal lookup skipped users.${fieldName}`, queryError);
              }
            }
          }
          const matches = Array.from(userRecords.values()).filter((record: any) => {
            const recordSchoolId = record.schoolId ?? record.school_id ?? record.schoolID ?? record.schoolIDNumber ?? record.assignedSchoolId ?? record.assignedSchoolID;
            return normalize(recordSchoolId) === normalize(lookupSchoolId);
          });
          const roleOf = (record: any) => String(record.role || record.userRole || record.accountType || record.userType || record.position || record.designation || "").toLowerCase();
          const headRecord = matches.find((record: any) => /school.?head|principal|school.?administrator/.test(roleOf(record)) || record.isSchoolHead === true || record.isPrincipal === true || record.is_school_head === true || record.is_principal === true);
          resolvedName = principalName(headRecord) || principalName(matches.find((record: any) => principalName(record)));
        }

        const logoValue = schoolRecord?.schoolLogo || schoolRecord?.school_logo || schoolRecord?.logoUrl || schoolRecord?.logoURL || schoolRecord?.logo || schoolRecord?.schoolLogoUrl || schoolRecord?.school_logo_url || "";
        const depEdLogoValue = schoolRecord?.depEdLogo || schoolRecord?.depedLogo || schoolRecord?.dep_ed_logo || schoolRecord?.deped_logo || schoolRecord?.departmentLogo || "";
        const resolvedSchoolName = String(schoolRecord?.schoolName || schoolRecord?.name || schoolRecord?.school_name || schoolRecord?.officialName || schoolRecord?.nameOfSchool || "").trim();
        if (!cancelled) {
          setSchoolLogo(typeof logoValue === "string" ? logoValue : String(logoValue?.url || logoValue?.src || ""));
          setDepEdLogo(typeof depEdLogoValue === "string" ? depEdLogoValue : String(depEdLogoValue?.url || depEdLogoValue?.src || ""));
          setSchoolDisplayName(resolvedSchoolName);
          if (resolvedName) setResolvedSchoolHeadName(resolvedName);
          setPlan(prev => prev.schoolHeadName === resolvedName ? prev : { ...prev, schoolHeadName: resolvedName });
        }
        if (!schoolRecord) console.warn("No exact School List match in `schools` for school ID:", schoolId);
        else if (!resolvedName) console.warn("Matched School List record has no headOfSchool/principal name:", schoolId, schoolRecord);
      } catch (error) {
        console.error("Failed to load school details from School List:", error);
        if (!cancelled) {
          setSchoolLogo("");
          setDepEdLogo("");
          setSchoolDisplayName("");
          // Preserve the last successfully resolved school-head name for printing even
          // if an optional school-logo/detail read fails.
          setPlan(prev => prev.schoolHeadName ? prev : (resolvedSchoolHeadName ? { ...prev, schoolHeadName: resolvedSchoolHeadName } : prev));
        }
      }
    };

    void readSchoolHeadFromSchoolList();
    return () => { cancelled = true; };
  }, [schoolId, currentUser]);

  // Reapply the resolved school-head name after loading an older saved plan that
  // may have stored an empty schoolHeadName. This also keeps the PDF signature current.
  useEffect(() => {
    if (resolvedSchoolHeadName && String(plan.schoolHeadName || "").trim() !== resolvedSchoolHeadName) {
      setPlan(prev => prev.schoolHeadName === resolvedSchoolHeadName ? prev : { ...prev, schoolHeadName: resolvedSchoolHeadName });
    }
  }, [resolvedSchoolHeadName, plan.schoolHeadName]);

  // Firestore is the source of truth. Live subscription syncs saves from other computers.
  useEffect(() => {
    const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
    if (!uid) {
      setSavedPlans([]);
      setCloudMessage("Sign in to save and load lesson plans from Firestore.");
      return;
    }
    let cancelled = false;
    const plansQuery = query(collection(db, PLAN_RECORDS_COLLECTION), where("ownerUid", "==", uid));
    const unsubscribe = onSnapshot(plansQuery, snapshot => {
      if (cancelled) return;
      const latest = new Map<string, { plan: Plan; updatedAt: string }>();
      snapshot.docs.forEach(record => {
        const data = record.data() as any;
        const storedPlan = normalizeStoredPlan(data.plan || data);
        const identity = planListIdentity(storedPlan);
        const current = latest.get(identity);
        const updatedAt = String(data.updatedAt || "");
        if (!current || updatedAt >= current.updatedAt) latest.set(identity, { plan: storedPlan, updatedAt });
      });
      const plans = Array.from(latest.values()).map(item => item.plan)
        .sort((a, b) => Number(a.term || 1) - Number(b.term || 1) || Number(a.week || 1) - Number(b.week || 1));
      setSavedPlans(plans);
      setCloudMessage(`Live Firestore sync active — ${plans.length} lesson plan${plans.length === 1 ? "" : "s"} loaded.`);
    }, error => {
      console.error("Could not subscribe to ILAW lesson plans in Firestore:", error);
      if (!cancelled) setCloudMessage("Could not sync lesson plans from Firestore. Check your connection and Firestore permissions.");
    });
    return () => { cancelled = true; unsubscribe(); };
  }, [currentUser?.uid, currentUser?.id, currentUser?.userId, currentUser?.user_id, currentUser?.profile?.uid, currentUser?.profile?.id]);

  const planRecordId = (item: Plan, uid: string) => {
    // One canonical Firestore document per teacher + term + week + learning area.
    const safeKey = (value: unknown) => encodeURIComponent(String(value || "").trim().toLowerCase()).replace(/%/g, "_");
    return `${uid}_term_${safeKey(item.term || "1")}_week_${safeKey(item.week || "1")}_subject_${safeKey(item.learningAreas)}`;
  };

  const exportPlansToJson = () => {
    const allPlans = [...savedPlans];
    const current = normalizeStoredPlan({ ...plan, sessions: (plan.sessions || []).map(session => ({
      ...session,
      ...(flowDraftsRef.current[session.id] !== undefined ? { flow: flowDraftsRef.current[session.id] } : {}),
      ...(assessmentDraftsRef.current[session.id] !== undefined ? { assessment: assessmentDraftsRef.current[session.id] } : {}),
      ...(session.id === activeSessionTab && assessmentEditorRef.current ? { assessment: assessmentEditorRef.current.innerHTML } : {}),
    })) });
    const all = [...allPlans.filter(item => planListIdentity(item) !== planListIdentity(current)), ...(hasStoredPlanContent(current) ? [current] : [])]
      .sort((a, b) => Number(a.term || 1) - Number(b.term || 1) || Number(a.week || 1) - Number(b.week || 1));
    const payload = { format: "ilaw-lesson-plan-export", version: 1, exportedAt: new Date().toISOString(), partsIncluded: ["Lesson Information", "Intention", "Learning Experiences (all sessions)", "Assessment (all sessions)", "Ways Forward (all sessions)", "Learning Resources", "Opportunities for Integration", "References", "AI Declaration", "Instructional Coaching Notes", "Reflections"], plans: all };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ILAW-Lesson-Plans-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    setSavedMessage(`Exported ${all.length} complete ILAW lesson plan${all.length === 1 ? "" : "s"} to JSON, including every section and session.`);
  };

  const importPlansFromJson = async (file?: File) => {
    if (!file) return;
    const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
    if (!uid) {
      await showMessageWindow({ title: "Sign in required", message: "Please sign in before importing lesson plans into the database.", mode: "info" });
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const rawPlans = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.plans) ? parsed.plans : parsed?.plan ? [parsed.plan] : (parsed && typeof parsed === "object" && ("sessions" in parsed || "lessonTitle" in parsed) ? [parsed] : []);
      if (!rawPlans.length) throw new Error("No lesson plans found in the JSON file.");
      const imported = rawPlans.map((item: any) => normalizeStoredPlan(item?.plan || item));
      for (const item of imported) {
        const recordId = planRecordId(item, uid);
        await setDoc(doc(db, PLAN_RECORDS_COLLECTION, recordId), {
          ownerUid: uid,
          ownerEmail: String(currentUser?.email || currentUser?.profile?.email || ""),
          plan: item,
          term: String(item.term || "1"),
          week: String(item.week || "1"),
          lessonTitle: item.lessonTitle || "",
          updatedAt: new Date().toISOString(),
          importedAt: new Date().toISOString(),
          importFormat: parsed?.format || "legacy-json"
        }, { merge: true });
      }
      const records = await getDocs(query(collection(db, PLAN_RECORDS_COLLECTION), where("ownerUid", "==", uid)));
      const allPlans = records.docs.map(record => { const data = record.data() as any; return normalizeStoredPlan(data.plan || data); })
        .sort((a, b) => Number(a.term || 1) - Number(b.term || 1) || Number(a.week || 1) - Number(b.week || 1));
      setSavedPlans(allPlans);
      if (imported.length === 1) {
        openOrLoadPlan(imported[0]);
      }
      const message = `Imported ${imported.length} complete ILAW lesson plan${imported.length === 1 ? "" : "s"} into the database. All recognized fields and all session content were retained.`;
      setCloudMessage(message); setSavedMessage(message);
      await showMessageWindow({ title: "Import complete", message, mode: "info" });
    } catch (error) {
      console.error("ILAW JSON import failed:", error);
      await showMessageWindow({ title: "Import failed", message: error instanceof Error ? error.message : "The JSON file could not be imported. Check the file format and try again.", mode: "info" });
    } finally {
      if (importFileRef.current) importFileRef.current.value = "";
    }
  };

  const persistSubmissions = (next: Submission[]) => {
    setSubmissions(next);
    try { localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(next)); } catch {
      setWorkflowMessage("Could not save approval workflow data in this browser. The signature image may be too large.");
    }
    // Keep the same submission record in Firestore so School Head decisions are visible
    // to the teacher even when they use different devices or browsers.
    void Promise.all(next.map(async item => {
      try {
        await setDoc(doc(db, SUBMISSIONS_CLOUD_COLLECTION, item.id), item, { merge: true });
      } catch (error) {
        console.warn("Could not sync ILAW submission to Firestore:", error);
      }
    }));
  };

  useEffect(() => {
    let cancelled = false;
    const loadCloudSubmissions = async () => {
      try {
        const snapshot = await getDocs(collection(db, SUBMISSIONS_CLOUD_COLLECTION));
        if (cancelled) return;
        const cloudItems = snapshot.docs.map(entry => ({ ...(entry.data() as Submission), id: entry.id }));
        if (!cloudItems.length) return;
        setSubmissions(previous => {
          const merged = new Map<string, Submission>();
          previous.forEach(item => merged.set(item.id, item));
          cloudItems.forEach(item => merged.set(item.id, item));
          const next = Array.from(merged.values()).sort((a, b) =>
            new Date(b.reviewedAt || b.submittedAt).getTime() - new Date(a.reviewedAt || a.submittedAt).getTime()
          );
          try { localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(next)); } catch { /* Firestore remains the source of truth. */ }
          return next;
        });
      } catch (error) {
        console.warn("Could not load ILAW submissions from Firestore; using browser cache:", error);
      }
    };
    void loadCloudSubmissions();
    return () => { cancelled = true; };
  }, []);

  const persistChangeRequests = (next: ApprovedPlanChangeRequest[]) => {
    setChangeRequests(next);
    try { localStorage.setItem(CHANGE_REQUESTS_KEY, JSON.stringify(next)); } catch { /* Cloud copy is also attempted below. */ }
    void Promise.all(next.map(async request => {
      try { await setDoc(doc(db, CHANGE_REQUESTS_CLOUD_COLLECTION, request.id), request, { merge: true }); }
      catch (error) { console.warn("Could not sync ILAW approved-plan change request:", error); }
    }));
  };

  useEffect(() => {
    let cancelled = false;
    const loadChangeRequests = async () => {
      try {
        const snapshot = await getDocs(collection(db, CHANGE_REQUESTS_CLOUD_COLLECTION));
        if (cancelled || snapshot.empty) return;
        const cloudRequests = snapshot.docs.map(entry => ({ ...(entry.data() as ApprovedPlanChangeRequest), id: entry.id }));
        setChangeRequests(previous => {
          const merged = new Map<string, ApprovedPlanChangeRequest>();
          previous.forEach(request => merged.set(request.id, request));
          cloudRequests.forEach(request => merged.set(request.id, request));
          const next = Array.from(merged.values()).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
          try { localStorage.setItem(CHANGE_REQUESTS_KEY, JSON.stringify(next)); } catch { /* Firestore remains the source of truth. */ }
          return next;
        });
      } catch (error) { console.warn("Could not load ILAW change requests:", error); }
    };
    void loadChangeRequests();
    return () => { cancelled = true; };
  }, []);

  const requestApprovedPlanChange = async (item: Submission, type: "edit" | "delete") => {
    if (item.status !== "approved") return;
    const existing = changeRequests.find(request => request.submissionId === item.id && request.status === "pending");
    if (existing) {
      setWorkflowMessage(`A ${existing.type} request for this approved lesson plan is already waiting for System Admin approval.`);
      return;
    }
    const action = type === "edit" ? "edit" : "delete";
    let scope: "session" | "week" = "week";
    let sessionId: string | undefined;
    if (type === "delete") {
      const scopeOptions = ["Whole week / entire lesson plan", ...(item.plan.sessions || []).map((session, index) => `Session ${index + 1}`)];
      const selectedScope = await showMessageWindow({ title: "Choose what to delete", message: "Select whether the request is for the whole week's lesson plan or just one session. The School Head/System Admin must approve the request before deletion.", mode: "choice", inputLabel: "Deletion scope", options: scopeOptions, initialValue: scopeOptions[0], confirmLabel: "Continue" });
      if (typeof selectedScope !== "string") return;
      const selectedSession = selectedScope.match(/^Session (\d+)$/i);
      scope = selectedSession ? "session" : "week";
      if (selectedSession) sessionId = `session-${selectedSession[1]}`;
    }
    const note = await showMessageWindow({ title: `Request ${action === "edit" ? "Edit" : "Delete"}`, message: `Approved lesson plan: “${getLessonProperTitle(item.plan) || "Untitled lesson plan"}”. Enter the reason for this request.`, mode: "input", inputLabel: "Reason for request (required)", confirmLabel: "Send request", requireNonEmptyInput: true });
    if (typeof note !== "string") return;
    if (!note.trim()) {
      setWorkflowMessage("Please provide a reason before submitting a request.");
      return;
    }
    const request: ApprovedPlanChangeRequest = {
      id: `ilaw-change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      submissionId: item.id,
      type,
      status: "pending",
      planTitle: item.plan.lessonTitle || `Term ${item.plan.term || "1"}, Week ${item.plan.week || "1"}`,
      teacherName: item.teacherName,
      teacherEmail: item.teacherEmail,
      requestedAt: new Date().toISOString(),
      requestNote: note.trim(),
      scope: type === "delete" ? scope : undefined,
      sessionId: type === "delete" && scope === "session" ? sessionId : undefined,
    };
    persistChangeRequests([request, ...changeRequests]);
    setWorkflowMessage(`Your ${action} request was sent to System Admin for approval. The approved lesson plan has not been changed.`);
  };

  const reviewApprovedPlanChangeRequest = async (request: ApprovedPlanChangeRequest, decision: "approved" | "rejected") => {
    if (request.status !== "pending") return;
    const target = submissions.find(item => item.id === request.submissionId);
    if (decision === "approved" && !target) {
      setWorkflowMessage("The original lesson plan could not be found. This request cannot be approved.");
      return;
    }
    const note = await showMessageWindow({ title: `${decision === "approved" ? "Approve" : "Reject"} ${request.type === "edit" ? "Edit" : "Delete"} Request`, message: `Lesson plan: “${request.planTitle}”. ${decision === "rejected" ? "A reviewer note explaining the rejection is required." : "Enter a reviewer note for the teacher."}`, mode: "input", inputLabel: decision === "rejected" ? "Reviewer note / reason for rejection (required)" : "Reviewer note (optional)", confirmLabel: decision === "approved" ? "Approve request" : "Reject request", danger: decision === "rejected", requireNonEmptyInput: decision === "rejected" });
    if (typeof note !== "string") return;
    const reviewerName = String(currentUser?.displayName || currentUser?.name || currentUser?.email || "System Admin");
    const reviewed = changeRequests.map(item => item.id === request.id ? { ...item, status: decision, reviewedAt: new Date().toISOString(), reviewerName, reviewerNote: note.trim() } : item);
    persistChangeRequests(reviewed);
    if (decision === "approved" && target) {
      if (request.type === "delete") {
        // Approval authorizes deletion; the System Admin must use the explicit Delete button to execute it.
      } else {
        // Do not create a duplicate submission. Unlock the existing approved record for its owner.
        const editableRecord: Submission = {
          ...target,
          // Editing permission does not revoke the existing approval. The teacher may
          // save edits directly to this same approved record without another review.
          status: "approved",
          editApproved: true,
          reviewerName,
          reviewedAt: target.reviewedAt || new Date().toISOString(),
          reviewerNote: `System Admin authorized editing. The teacher may save changes directly without reapproval. ${note.trim()}`.trim(),
        };
        persistSubmissions(submissions.map(item => item.id === target.id ? editableRecord : item));
      }
    }
    setWorkflowMessage(decision === "approved"
      ? (request.type === "delete" ? `Deletion request approved for “${request.planTitle}”. The teacher can now complete the approved deletion from their lesson-plan list.` : `Edit request approved. The existing lesson plan is now editable; no duplicate was created.`)
      : `Request to ${request.type} “${request.planTitle}” was rejected.`);
  };

  const submitForApproval = (targetSessionId: string = activeSessionTab) => {
    const email = String(currentUser?.email || "").trim().toLowerCase();
    // Check approval for the specific target session, not whichever session happens to be selected in the editor.
    const identity = planListIdentity(plan);
    const matchingSubmission = submissions.find(item =>
      item.teacherEmail === email && planListIdentity(item.plan) === identity &&
      String(item.plan.lessonTitle || "").trim() === String(plan.lessonTitle || "").trim()
    );
    const targetAlreadyApproved = !!matchingSubmission && (
      (matchingSubmission.approvedSessionIds || []).includes(targetSessionId) ||
      matchingSubmission.sessionStatuses?.[targetSessionId] === "approved"
    );
    if (targetAlreadyApproved && !approvedEditMode) {
      setWorkflowMessage("This session has already been approved. Please print your lesson plan for signature.");
      return;
    }
    if (!getLessonProperTitle(plan).trim() || !(plan.teacherNames || userDisplayName).trim() || !plan.learningAreas.trim()) {
      setWorkflowMessage("Please enter a Lesson Title in LESSON PROPER and complete Learning Area/s. The teacher name is taken from your signed-in account.");
      return;
    }
    // Reflection is excluded from the required checklist.
    const requiredPlanParts: Array<[string, unknown]> = [
      ["Learning Competency and Curriculum Standards", plan.competencyStandards],
      ["Learning Resources", plan.learningResources],
      ["Opportunities for Integration", plan.integration],
      ["References", plan.references],
    ];
    const missingPlanParts = requiredPlanParts.filter(([, value]) => !String(value ?? "").trim()).map(([label]) => label);
    const missingSessionParts: string[] = [];
    (plan.sessions || []).forEach((session, index) => {
      const sessionParts: Array<[string, unknown]> = [
        [`Session ${index + 1}: Learning Objectives`, session.objectives],
        [`Session ${index + 1}: Learning Experience / Lesson Proper`, flowDraftsRef.current[session.id] !== undefined ? flowDraftsRef.current[session.id] : session.flow],
        [`Session ${index + 1}: Assessment`, session.assessment || session.examination || session.summative],
        [`Session ${index + 1}: Ways Forward`, session.waysForward],
      ];
      sessionParts.forEach(([label, value]) => { if (!String(value ?? "").replace(/<[^>]*>/g, " ").trim()) missingSessionParts.push(label); });
    });
    if (missingPlanParts.length || missingSessionParts.length) {
      const missing = [...missingPlanParts, ...missingSessionParts];
      setWorkflowMessage(`Complete all ILAW parts before submitting for approval. Reflection is not required yet. Missing: ${missing.join("; ")}`);
      return;
    }
    const planWithLiveEditors: Plan = {
      ...plan,
      objectivesApplyTargetsBySession: JSON.parse(JSON.stringify(objectivesApplyTargetsBySession)),
      intentionApplyTargetsBySession: JSON.parse(JSON.stringify(intentionApplyTargetsBySession)),
      learnerContextApplyTargetsBySession: JSON.parse(JSON.stringify(learnerContextApplyTargetsBySession)),
      lessonSubtitleApplyTargetsBySession: JSON.parse(JSON.stringify(plan.lessonSubtitleApplyTargetsBySession || {})),
      sessions: (plan.sessions || []).map(session => {
        const isActive = session.id === targetSessionId;
        const draftFlow = flowDraftsRef.current[session.id];
        const finalFlow = draftFlow !== undefined ? draftFlow : (session.flow || "");
        flowDraftsRef.current[session.id] = finalFlow;
        return {
          ...session,
          flow: finalFlow,
          assessment: (isActive && assessmentEditorRef.current)
            ? assessmentEditorRef.current.innerHTML
            : (assessmentDraftsRef.current[session.id] !== undefined ? assessmentDraftsRef.current[session.id] : (session.assessment || "")),
        };
      }),
    };
    const planSnapshot = normalizeStoredPlan(JSON.parse(JSON.stringify(planWithLiveEditors)));
    const savingSubject = String(planSnapshot.learningAreas || planWithLiveEditors.learningAreas || "Unspecified subject").trim() || "Unspecified subject";
    const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
    if (uid) {
      try {
        const recordId = planRecordId(planSnapshot, uid);
        void setDoc(doc(db, PLAN_RECORDS_COLLECTION, recordId), {
          ownerUid: uid,
          ownerEmail: email,
          plan: planSnapshot,
          term: String(planSnapshot.term || "1"),
          week: String(planSnapshot.week || "1"),
          lessonTitle: planSnapshot.lessonTitle || "",
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        console.warn("Could not save to plan records during submission:", err);
      }
    }
    const existing = submissions.find(x =>
      x.teacherEmail === email && planListIdentity(x.plan) === identity &&
      String(x.plan.lessonTitle || "").trim() === String(planSnapshot.lessonTitle || "").trim()
    );
    if (existing) {
      // Approval belongs to each session, not to the whole submission. Keep approvals
      // for sessions whose content has not changed; only changed/new sessions need review.
      const previousSessions = new Map<string, Session>((existing.plan.sessions || []).map(session => [session.id, session] as const));
      const nextSessions = planSnapshot.sessions || [];
      const sameSessionContent = (before: Session | undefined, after: Session) => {
        if (!before) return false;
        const comparable = (session: Session) => ({
          competencyStandards: session.competencyStandards || "",
          objectives: session.objectives || "",
          learnerContext: session.learnerContext || "",
          preLesson: session.preLesson || "",
          title: session.title || "",
          lessonSubtitleTitle: session.lessonSubtitleTitle || "",
          flow: session.flow || "",
          flowSequence: session.flowSequence || "",
          examination: session.examination || "",
          summative: session.summative || "",
          assessment: session.assessment || "",
          extendedLearning: session.extendedLearning || "",
          reflection: session.reflection || "",
          waysForward: session.waysForward || "",
          coachingNotes: session.coachingNotes || "",
        });
        return JSON.stringify(comparable(before)) === JSON.stringify(comparable(after));
      };
      const previouslyApproved = new Set(existing.approvedSessionIds || []);
      const nextApproved = nextSessions
        .filter(session => previouslyApproved.has(session.id) && sameSessionContent(previousSessions.get(session.id), session))
        .map(session => session.id);
      const previouslySubmitted = new Set(existing.submittedSessionIds || (existing.status === "pending"
        ? nextSessions.filter(session => existing.sessionStatuses?.[session.id] === "pending" || (!existing.sessionStatuses?.[session.id] && !previouslyApproved.has(session.id))).map(session => session.id)
        : []));
      const nextSubmitted = nextSessions
        .filter(session => previouslySubmitted.has(session.id) && sameSessionContent(previousSessions.get(session.id), session))
        .map(session => session.id);
      if (nextSessions.some(session => session.id === targetSessionId) && !nextSubmitted.includes(targetSessionId)) nextSubmitted.push(targetSessionId);
      const nextSessionStatuses: Record<string, "pending" | "approved" | "returned"> = {};
      nextSessions.forEach(session => {
        const unchanged = sameSessionContent(previousSessions.get(session.id), session);
        const oldStatus = existing.sessionStatuses?.[session.id] || (previouslyApproved.has(session.id) ? "approved" : undefined);
        if (unchanged && oldStatus === "approved" && session.id !== targetSessionId) {
          nextSessionStatuses[session.id] = "approved";
        } else if (session.id === targetSessionId) {
          nextSessionStatuses[session.id] = "pending";
        } else if (nextSubmitted.includes(session.id)) {
          nextSessionStatuses[session.id] = oldStatus === "returned" ? "returned" : "pending";
        }
      });
      nextApproved.forEach(sessionId => { nextSessionStatuses[sessionId] = "approved"; });
      const nextReviewNotes = Object.fromEntries(
        Object.entries(existing.sessionReviewNotes || {}).filter(([sessionId]) => nextSessions.some(session => session.id === sessionId) && sameSessionContent(previousSessions.get(sessionId), nextSessions.find(session => session.id === sessionId)!))
      );
      const allSessionsApproved = nextSessions.length > 0 && nextSessions.every(session => nextApproved.includes(session.id));
      const updated: Submission = {
        ...existing,
        plan: JSON.parse(JSON.stringify(planSnapshot)),
        teacherName: String(currentUser?.displayName || currentUser?.name || plan.teacherNames),
        submittedAt: new Date().toISOString(),
        status: allSessionsApproved ? "approved" : "pending",
        editApproved: false,
        approvedSessionIds: nextApproved,
        sessionReviewNotes: nextReviewNotes,
        sessionStatuses: nextSessionStatuses,
        submittedSessionIds: nextSubmitted,
      };
      persistSubmissions(submissions.map(item => item.id === existing.id ? updated : item));
      setPlan(planSnapshot);
      const preservedCount = nextApproved.length;
      setWorkflowMessage(preservedCount
        ? `Weekly plan updated. ${preservedCount} unchanged session approval${preservedCount === 1 ? " was" : "s were"} preserved. Only new or changed sessions need approval; each session is reviewed independently.`
        : "The weekly plan was updated. Each session will be reviewed independently; no duplicate submission was created.");
      return;
    }
    const item: Submission = {
      id: `ilaw-${Date.now()}`,
      plan: JSON.parse(JSON.stringify(planSnapshot)),
      teacherName: String(currentUser?.displayName || currentUser?.name || plan.teacherNames),
      teacherEmail: email,
      submittedAt: new Date().toISOString(),
      status: "pending",
      submittedSessionIds: [targetSessionId],
      sessionStatuses: { [targetSessionId]: "pending" }
    };
    persistSubmissions([item, ...submissions]);
    setPlan(planSnapshot);
    setWorkflowMessage("Submitted for School Head approval. Status will sync through the database when access is available.");
  };

  const saveReviewCoachingNotes = (item: Submission, sessionId: string, note: string) => {
    const updated = submissions.map(entry => {
      if (entry.id !== item.id) return entry;
      const sessions = (entry.plan.sessions || []).map(session =>
        session.id === sessionId ? { ...session, coachingNotes: note } : session
      );
      return {
        ...entry,
        plan: { ...entry.plan, sessions },
        coachingNotesUpdatedAt: new Date().toISOString(),
        coachingNotesUpdatedBy: String(currentUser?.displayName || currentUser?.name || currentUser?.email || "School Head")
      } as Submission;
    });
    persistSubmissions(updated);
    setWorkflowMessage("Instructional Coaching Notes saved. They will appear in the teacher's ILAW Lesson Plan when the submission syncs.");
  };

  const reviewSubmission = (item: Submission, status: "approved" | "returned", sessionId?: string) => {
    if (!sessionId) {
      setWorkflowMessage("Please select a session to review.");
      return;
    }
    const sessions = Array.isArray(item.plan.sessions) ? item.plan.sessions : [];
    const alreadyApproved = item.approvedSessionIds || [];
    const nextApproved = status === "approved" ? Array.from(new Set([...alreadyApproved, sessionId])) : alreadyApproved.filter(id => id !== sessionId);
    const nextSessionStatuses: Record<string, "pending" | "approved" | "returned"> = { ...(item.sessionStatuses || {}) };
    sessions.forEach(session => {
      if (!nextSessionStatuses[session.id]) nextSessionStatuses[session.id] = alreadyApproved.includes(session.id) ? "approved" : "pending";
    });
    nextSessionStatuses[sessionId] = status === "approved" ? "approved" : "returned";
    const allSessionsApproved = sessions.length > 0 && sessions.every(session => nextApproved.includes(session.id));
    const next = submissions.map(x => x.id === item.id ? {
      ...x,
      status: allSessionsApproved ? "approved" as const : "pending" as const,
      approvedSessionIds: nextApproved,
      sessionStatuses: nextSessionStatuses,
      sessionReviewNotes: { ...(x.sessionReviewNotes || {}), [sessionId]: reviewNote },
      reviewerName: String(currentUser?.displayName || currentUser?.name || "School Head"),
      reviewedAt: new Date().toISOString(),
      reviewerNote: reviewNote
    } : x);
    persistSubmissions(next);
    const sessionNumber = sessions.findIndex(session => session.id === sessionId) + 1;
    setWorkflowMessage(status === "approved"
      ? `Session ${sessionNumber} approved independently. ${allSessionsApproved ? "Every current session now has its own approval record." : "Other sessions keep their own approval status and can still be reviewed separately."}`
      : `Session ${sessionNumber} returned for revision. Other session approvals are unchanged.`);
    if (status === "approved") {
      const nextPendingIndex = sessions.findIndex(session => !nextApproved.includes(session.id));
      if (nextPendingIndex >= 0) setReviewSessionIndex(nextPendingIndex);
    }
    setReviewNote("");
  };

  const sectionLabel = (section: Section) => String(section.name || section.sectionName || section.label || "").trim();
  const sectionKey = (section: Section) => String(section.id || section.sectionId || section.section_id || sectionLabel(section)).trim().toLowerCase();
  const selectedSections = useMemo(() => {
    const selectedLabels = plan.gradeSection.split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
    if (!selectedLabels.length) return [] as Section[];
    return sections.filter(section => {
      const label = sectionLabel(section).toLowerCase();
      const key = sectionKey(section);
      const id = String(section.sectionId || section.section_id || "").trim().toLowerCase();
      return selectedLabels.some(selected => selected === label || selected === key || selected === id);
    });
  }, [sections, plan.gradeSection]);
  const subjectLabel = (subject: any) => String(subject?.name || subject?.subjectName || subject?.subject_name || subject?.learningArea || subject?.learningAreaName || subject?.learning_area || subject?.subject || subject?.title || subject?.label || "").trim();
  const assignedSectionSubjects = useMemo(() => {
    // Use the school-wide curriculum subject catalogue first; assigned subjects and
    // subjects embedded in sections are fallbacks for legacy data.
    const normalizeGrade = (value: any) => {
      const raw = String(value ?? "").trim().toLowerCase();
      const match = raw.match(/\d+/);
      return match ? String(Number(match[0])) : raw.replace(/^grade\s*/, "").trim();
    };
    const gradeOf = (record: any) => record?.gradeLevel ?? record?.grade_level ?? record?.grade ?? record?.gradeName ?? record?.grade_name;
    const selectedGrades = new Set<string>();
    if (sectionGradeFilter) {
      selectedGrades.add(normalizeGrade(sectionGradeFilter));
    } else {
      selectedSections.forEach(section => {
        const grade = gradeOf(section);
        if (grade !== undefined && grade !== null && String(grade).trim()) selectedGrades.add(normalizeGrade(grade));
      });
    }
    const gradeMatches = (record: any) => {
      const grade = gradeOf(record);
      // Global subjects without grade metadata are not assumed to belong to every grade.
      return grade !== undefined && grade !== null && String(grade).trim() !== "" &&
        (selectedGrades.size === 0 || selectedGrades.has(normalizeGrade(grade)));
    };
    const toRecords = (value: any): any[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value.flatMap(toRecords);
      if (typeof value === "string") return [{ name: value }];
      if (typeof value === "object") {
        if (Array.isArray(value.subjects) || Array.isArray(value.assignedSubjects)) return [...(value.subjects || []), ...(value.assignedSubjects || [])].flatMap(toRecords);
        return [value];
      }
      return [];
    };
    const gradeSections = sections.filter(section => {
      const grade = gradeOf(section);
      return selectedGrades.size === 0 || (grade !== undefined && selectedGrades.has(normalizeGrade(grade)));
    });
    const sectionRecords = gradeSections.flatMap(section => toRecords([
      section.subjects, section.assignedSubjects, section.subject,
      section.subjectName ? { subjectName: section.subjectName } : null
    ]));
    const globalRecords = globalSubjects.filter(gradeMatches);
    const assignmentRecords = assignedSubjects.filter(record => {
      const grade = gradeOf(record);
      if (grade !== undefined && String(grade).trim()) return selectedGrades.size === 0 || selectedGrades.has(normalizeGrade(grade));
      const sectionName = String(record?.sectionName || record?.section_name || record?.assignedSectionName || record?.assigned_section_name || record?.gradeSection || "").trim().toLowerCase();
      const sectionId = String(record?.sectionId || record?.section_id || record?.assignedSectionId || record?.assigned_section_id || "").trim().toLowerCase();
      return !sectionName && !sectionId;
    });
    return [...new Set([...globalRecords, ...assignmentRecords, ...sectionRecords].map(subjectLabel).filter(Boolean).map(name => name.trim()))]
      .sort((a, b) => a.localeCompare(b));
  }, [assignedSubjects, globalSubjects, sections, selectedSections, sectionGradeFilter]);
  const sectionGrade = (section: Section) => String(section.gradeLevel ?? section.grade ?? section.grade_level ?? section.gradeName ?? section.grade_name ?? "").trim();
  const availableSectionGrades = useMemo(() => [...new Set(sections.map(sectionGrade).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [sections]);
  const sectionSubjectOptions = useMemo(() => {
    const names: string[] = [];
    const flatten = (value: any): any[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value.flatMap(flatten);
      if (typeof value === "string") return [{ name: value }];
      if (typeof value === "object") {
        if (Array.isArray(value.subjects) || Array.isArray(value.assignedSubjects)) return [...(value.subjects || []), ...(value.assignedSubjects || [])].flatMap(flatten);
        return [value];
      }
      return [];
    };
    sections.forEach(section => flatten([section.subjects, section.assignedSubjects, section.subject, section.subjectName ? { subjectName: section.subjectName } : null]).forEach(record => {
      const name = subjectLabel(record);
      if (name) names.push(name);
    }));
    assignedSubjects.forEach(record => {
      const name = subjectLabel(record);
      if (name) names.push(name);
    });
    return [...new Set(names.map(name => name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [sections, assignedSubjects]);
  const termWeekGradeOptions = useMemo(() => {
    const values = [
      ...sections.map(section => sectionGrade(section)),
      ...assignedSubjects.map(record => String(record.gradeLevel ?? record.grade_level ?? record.grade ?? record.gradeName ?? record.grade_name ?? "").trim()),
      ...globalSubjects.map(record => String(record.gradeLevel ?? record.grade_level ?? record.grade ?? record.gradeName ?? record.grade_name ?? "").trim())
    ].filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [sections, assignedSubjects, globalSubjects]);
  const termWeekSubjectOptions = useMemo(() => {
    if (!selectedGradeLevel) return [] as string[];
    const normalizeGradeKey = (value: any) => {
      const raw = String(value ?? "").trim().toLowerCase();
      const match = raw.match(/\d+/);
      return match ? String(Number(match[0])) : raw.replace(/^grade\s*/, "").trim();
    };
    const targetGrade = normalizeGradeKey(selectedGradeLevel);
    const names: string[] = [];
    const flattenSubjectRecords = (value: any): any[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value.flatMap(flattenSubjectRecords);
      if (typeof value === "string") return [{ name: value }];
      if (typeof value === "object") {
        if (Array.isArray(value.subjects) || Array.isArray(value.assignedSubjects)) return [...(value.subjects || []), ...(value.assignedSubjects || [])].flatMap(flattenSubjectRecords);
        return [value];
      }
      return [];
    };
    sections.filter(section => normalizeGradeKey(sectionGrade(section)) === targetGrade).forEach(section => {
      flattenSubjectRecords([section.subjects, section.assignedSubjects, section.subject, section.subjectName ? { subjectName: section.subjectName } : null]).forEach(record => {
        const name = subjectLabel(record);
        if (name) names.push(name);
      });
    });
    [...assignedSubjects, ...globalSubjects].forEach(record => {
      const grade = record.gradeLevel ?? record.grade_level ?? record.grade ?? record.gradeName ?? record.grade_name;
      if (grade !== undefined && grade !== null && String(grade).trim() && normalizeGradeKey(grade) === targetGrade) {
        const name = subjectLabel(record);
        if (name) names.push(name);
      }
    });
    assignedSubjects.forEach(record => {
      const name = subjectLabel(record);
      if (!name) return;
      const sectionId = String(record.sectionId || record.section_id || record.assignedSectionId || record.assigned_section_id || record.classSectionId || record.class_section_id || record.section?.id || record.section?.sectionId || record.section?.section_id || "").trim().toLowerCase();
      const sectionName = String(record.sectionName || record.section_name || record.assignedSectionName || record.assigned_section_name || record.gradeSection || record.section?.name || record.section?.sectionName || (typeof record.section === "string" ? record.section : "")).trim().toLowerCase();
      const linkedSection = sections.find(section => normalizeGradeKey(sectionGrade(section)) === targetGrade && ((sectionId && [sectionKey(section), String(section.sectionId || section.section_id || "").trim().toLowerCase()].includes(sectionId)) || (sectionName && [sectionLabel(section).toLowerCase(), sectionKey(section)].includes(sectionName))));
      if (linkedSection) names.push(name);
    });
    return [...new Set(names.map(name => name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [selectedGradeLevel, sections, assignedSubjects, globalSubjects]);
  const filteredSectionOptions = useMemo(() => {
    const subjectMatchesSection = (section: Section, selectedSubject: string) => {
      if (!selectedSubject) return true;
      const key = sectionKey(section);
      const label = sectionLabel(section).toLowerCase();
      const id = String(section.sectionId || section.section_id || "").trim().toLowerCase();
      const embedded = [section.subjects, section.assignedSubjects, section.subject, section.subjectName ? { subjectName: section.subjectName } : null]
        .flatMap(value => {
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === "string") return [{ name: value }];
          if (typeof value === "object" && (Array.isArray(value.subjects) || Array.isArray(value.assignedSubjects))) return [...(value.subjects || []), ...(value.assignedSubjects || [])];
          return [value];
        });
      const hasEmbeddedSubject = embedded.some(record => subjectLabel(record).toLowerCase() === selectedSubject.toLowerCase());
      const hasAssignedSubject = assignedSubjects.some(record => {
        if (subjectLabel(record).toLowerCase() !== selectedSubject.toLowerCase()) return false;
        const sectionId = String(record.sectionId || record.section_id || record.assignedSectionId || record.assigned_section_id || record.classSectionId || record.class_section_id || record.section?.id || record.section?.sectionId || record.section?.section_id || "").trim().toLowerCase();
        const sectionName = String(record.sectionName || record.section_name || record.assignedSectionName || record.assigned_section_name || record.gradeSection || record.section?.name || record.section?.sectionName || (typeof record.section === "string" ? record.section : "")).trim().toLowerCase();
        if (sectionId || sectionName) return Boolean((sectionId && [key, id].includes(sectionId)) || (sectionName && [label, key].includes(sectionName)));
        const recordGrade = String(record.gradeLevel ?? record.grade ?? record.grade_level ?? "").trim();
        return Boolean(recordGrade && recordGrade === sectionGrade(section));
      });
      return hasEmbeddedSubject || hasAssignedSubject;
    };
    return sections.filter(section => {
      const grade = sectionGrade(section);
      return (!sectionGradeFilter || grade === sectionGradeFilter) && subjectMatchesSection(section, sectionSubjectFilter);
    });
  }, [sections, assignedSubjects, sectionGradeFilter, sectionSubjectFilter]);

  // Learning Area/s is chosen in the Term / Week modal and must remain unchanged
  // when the teacher changes the Grade Level filter or selected section(s).

  const lessonInformationComplete = Boolean(
    String(plan.learningAreas || "").trim() &&
    String(plan.gradeSection || "").trim() &&
    String(plan.noOfSessions || "").trim() &&
    String(plan.references || "").trim() &&
    String(plan.aiDeclaration || "").trim()
  );
  const currentPlanIsSaved = Boolean(savedPlanSignature && savedPlanSignature === JSON.stringify(plan));
  // Approval is available once Lesson Information is complete, there is at least
  // one session, and the exact current version has been saved. Reflection is optional.
  const lessonPlanComplete = Boolean(lessonInformationComplete && plan.sessions.length > 0);
  const canProceedToApproval = lessonPlanComplete && currentPlanIsSaved;

  const update = <K extends keyof Plan>(key: K, value: Plan[K]) =>
    setPlan(prev => ({ ...prev, [key]: value }));

  const updateSession = (id: string, key: keyof Omit<Session, "id">, value: any) =>
    setPlan(prev => ({ ...prev, sessions: prev.sessions.map(session => session.id === id ? { ...session, [key]: value } : session) }));

  // Section/subject changes must never leave content from the previous class visible.
  const clearSectionDependentContent = (keepTitle = false) => setPlan(prev => ({
    ...prev,
    lessonTitle: keepTitle ? prev.lessonTitle : "",
    competencyStandards: "",
    objectives: "",
    learnerContext: "",
    preLesson: "",
    references: "",
    learningResources: "",
    integration: "",
    formativeAssessment: "",
    extendedLearning: "",
    reflections: "",
    coachingNotes: "",
    sessions: prev.sessions.map((_, index) => makeSession(`session-${index + 1}`))
  }));

  // Keep every session tab accessible so the teacher can navigate directly to the last session
  // and complete its Reflection without being blocked by earlier sessions.
  const canOpenSessionTab = (_index: number) => true;
  const goToNextSessionTab = () => {
    if (currentSessionIndex >= 0 && currentSessionIndex < plan.sessions.length - 1) {
      if (!plan.sessions[currentSessionIndex]?.reflection?.trim()) {
        setWorkflowMessage(`Complete the Reflection for Session ${currentSessionIndex + 1} before proceeding.`);
        return;
      }
      setWorkflowMessage("");
      const nextSession = plan.sessions[currentSessionIndex + 1];
      if (nextSession) setActiveSessionTab(nextSession.id);
    }
  };

  const saveSelfCheck = async () => {
    const checklist = JSON.parse(JSON.stringify(plan.selfCheckItems || {}));
    const planWithChecklist: Plan = { ...plan, selfCheckItems: checklist };
    const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
    const teacherEmail = String(currentUser?.email || currentUser?.profile?.email || "").trim().toLowerCase();
    try {
      // Save this section independently: it must remain available even when the lesson plan is approved.
      const matchingSubmission = submissions.find(item =>
        (teacherEmail && item.teacherEmail?.toLowerCase() === teacherEmail) &&
        planListIdentity(item.plan) === planListIdentity(plan)
      ) || (approvedEditSubmissionId ? submissions.find(item => item.id === approvedEditSubmissionId) : undefined);
      if (matchingSubmission) {
        const updatedSubmission = { ...matchingSubmission, plan: { ...matchingSubmission.plan, selfCheckItems: checklist } };
        persistSubmissions(submissions.map(item => item.id === matchingSubmission.id ? updatedSubmission : item));
      }
      if (uid) {
        const recordId = planRecordId(planWithChecklist, uid);
        await setDoc(doc(db, PLAN_RECORDS_COLLECTION, recordId), {
          ownerUid: uid,
          ownerEmail: teacherEmail,
          plan: planWithChecklist,
          term: String(plan.term || "1"),
          week: String(plan.week || "1"),
          lessonTitle: plan.lessonTitle || "",
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      setPlan(prev => ({ ...prev, selfCheckItems: checklist }));
      setSavedMessage("Lesson Planning Self-Check / Peer Coaching saved separately. The lesson plan approval status was not changed.");
      setWorkflowMessage("Self-Check / Peer Coaching saved successfully, including for approved lesson plans.");
      await showMessageWindow({ title: "Self-Check Saved", message: "Your checklist ratings and notes were saved separately. The lesson plan remains approved and does not need reapproval.", mode: "info" });
    } catch (error) {
      console.error("ILAW self-check save failed:", error);
      setWorkflowMessage(`Could not save the Self-Check / Peer Coaching: ${error instanceof Error ? error.message : "Please try again."}`);
    }
  };

  const savePlan = async (planToSave: Plan = plan) => {
    const savingSessionIndex = Math.max(0, (planToSave.sessions || []).findIndex(session => session.id === activeSessionTab));
    const savingSessionNumber = savingSessionIndex + 1;
    // Saving is available from every session, including sessions that have already
    // been approved. Approval status is managed separately from saving the draft.
    // Flow is a controlled textarea, so its value is already in React state. Keep the
    // Assessment editor's live DOM snapshot because that field still uses contentEditable.
    const activeSessionWasSaved = (planToSave.sessions || []).some(session => session.id === activeSessionTab);
    const planWithLiveEditors: Plan = {
      ...planToSave,
      savedSessionIds: Array.from(new Set([...(planToSave.savedSessionIds || []), ...(activeSessionWasSaved ? [activeSessionTab] : [])])),
      objectivesApplyTargetsBySession: JSON.parse(JSON.stringify(objectivesApplyTargetsBySession)),
      intentionApplyTargetsBySession: JSON.parse(JSON.stringify(intentionApplyTargetsBySession)),
      learnerContextApplyTargetsBySession: JSON.parse(JSON.stringify(learnerContextApplyTargetsBySession)),
      lessonSubtitleApplyTargetsBySession: JSON.parse(JSON.stringify(plan.lessonSubtitleApplyTargetsBySession || {})),
      sessions: (planToSave.sessions || []).map(session => {
        const isActive = session.id === activeSessionTab;
        const draftFlow = flowDraftsRef.current[session.id];
        const finalFlow = draftFlow !== undefined ? draftFlow : (session.flow || "");
        flowDraftsRef.current[session.id] = finalFlow;
        return {
          ...session,
          flow: finalFlow,
          assessment: (isActive && assessmentEditorRef.current)
            ? assessmentEditorRef.current.innerHTML
            : (assessmentDraftsRef.current[session.id] !== undefined ? assessmentDraftsRef.current[session.id] : (session.assessment || "")),
        };
      }),
    };
    const planSnapshot = normalizeStoredPlan(JSON.parse(JSON.stringify(planWithLiveEditors)));
    const savingSubject = String(planSnapshot.learningAreas || planToSave.learningAreas || "Unspecified subject").trim() || "Unspecified subject";
    if (approvedEditSubmissionId) {
      const target = submissions.find(item => item.id === approvedEditSubmissionId);
      if (!target) {
        setWorkflowMessage("The lesson plan submission could not be found. Your changes were not saved.");
        return false;
      }
      const updated: Submission = {
        ...target,
        plan: JSON.parse(JSON.stringify(planSnapshot)),
        // Keep the approved state and existing approval/signature. Editing was already
        // authorized by the System Admin, so saving must not trigger another approval.
        status: "approved",
        editApproved: false,
        reviewerNote: "Teacher saved changes after an approved edit request. Existing approval retained; no reapproval required.",
      };
      persistSubmissions(submissions.map(item => item.id === updated.id ? updated : item));
      setSavedPlanSignature(JSON.stringify(planSnapshot));
      setApprovedEditSubmissionId(null);
      // After saving edits to an already-approved session, explicitly remain in
      // Lesson Proper. Approval is never opened automatically; it remains a manual tab choice.
      setActiveNavigationSection("03");
      const message = `Subject: ${savingSubject}\nSession ${savingSessionNumber} was saved successfully. The complete lesson plan was updated, and its existing approval remains valid; no reapproval or duplicate submission was created.`;
      setSavedMessage(message);
      setWorkflowMessage(`Session ${savingSessionNumber} saved successfully.`);
      await showMessageWindow({ title: `Session ${savingSessionNumber} Saved — ${savingSubject}`, message, mode: "info" });
      return true;
    }
    try {
      const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
      if (!uid) throw new Error("Please sign in before saving a lesson plan to the database.");
      // Reuse an existing Firestore document for this term/week/learning area,
      // including older records whose IDs also contained grade/section.
      const existingRecords = await getDocs(query(collection(db, PLAN_RECORDS_COLLECTION), where("ownerUid", "==", uid)));
      const matchingRecord = existingRecords.docs.find(record => {
        const data = record.data() as any;
        return planListIdentity(normalizeStoredPlan(data.plan || data)) === planListIdentity(planSnapshot);
      });
      const recordId = matchingRecord?.id || planRecordId(planSnapshot, uid);
      await setDoc(doc(db, PLAN_RECORDS_COLLECTION, recordId), {
        ownerUid: uid,
        ownerEmail: String(currentUser?.email || currentUser?.profile?.email || ""),
        plan: planSnapshot,
        term: String(planSnapshot.term || "1"),
        week: String(planSnapshot.week || "1"),
        lessonTitle: planSnapshot.lessonTitle || "",
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Keep any existing pending submission in sync with the saved plan
      const teacherEmail = String(currentUser?.email || "").trim().toLowerCase();
      const matchingSub = submissions.find(item =>
        item.teacherEmail === teacherEmail &&
        planListIdentity(item.plan) === planListIdentity(planSnapshot) &&
        item.status === "pending"
      );
      if (matchingSub) {
        const updatedSub: Submission = {
          ...matchingSub,
          plan: JSON.parse(JSON.stringify(planSnapshot)),
          submittedAt: new Date().toISOString(),
        };
        const nextSubmissions = submissions.map(item => item.id === matchingSub.id ? updatedSub : item);
        persistSubmissions(nextSubmissions);
      }

      const nextSavedPlans = [...savedPlans.filter(item => planListIdentity(item) !== planListIdentity(planSnapshot)), planSnapshot]
        .sort((a, b) => Number(a.term || 1) - Number(b.term || 1) || Number(a.week || 1) - Number(b.week || 1));
      setSavedPlans(nextSavedPlans);
      setPlan(planSnapshot);
      setSavedPlanSignature(JSON.stringify(planSnapshot));
      // Saving only saves the current lesson plan/session. It must never send
      // the teacher to Approval; the teacher completes the remaining ILAW parts
      // and chooses the Approval section explicitly when ready.
      setActiveNavigationSection("03");
      setObjectivesApplyTargetsBySession(planSnapshot.objectivesApplyTargetsBySession || {});
      setIntentionApplyTargetsBySession(planSnapshot.intentionApplyTargetsBySession || {});
      setSelectedTerm(String(planSnapshot.term || "1"));
      setSelectedWeek(String(planSnapshot.week || "1"));
      const message = `Subject: ${savingSubject}\nSession ${savingSessionNumber} for Term ${planSnapshot.term}, Week ${planSnapshot.week} was updated in the database.`;
      setSavedMessage(message); setWorkflowMessage(`Session ${savingSessionNumber} saved successfully.`); setCloudMessage(`Session ${savingSessionNumber} saved to the database successfully.`);
      await showMessageWindow({ title: `Session ${savingSessionNumber} Saved — ${savingSubject}`, message, mode: "info" });
      return true;
    } catch (error) {
      console.error("ILAW database save failed:", error);
      const rawMessage = error instanceof Error ? error.message : "Unknown database error.";
      const permissionDenied = /permission-denied|missing or insufficient permissions/i.test(rawMessage);
      const message = permissionDenied
        ? `Subject: ${savingSubject}\nSession ${savingSessionNumber} was not saved because Firestore denied access to the ${PLAN_RECORDS_COLLECTION} collection. The app code cannot override Firebase security rules. Add the ILAW lesson-plan rules to your existing Firestore rules and publish them, then sign in again. Details: ${rawMessage}`
        : `Subject: ${savingSubject}\nSession ${savingSessionNumber} could not be saved to the database. Check your connection and database configuration. Details: ${rawMessage}`;
      setSavedMessage(message); setWorkflowMessage(message); setCloudMessage(message);
      await showMessageWindow({ title: `Session ${savingSessionNumber} Save Failed — ${savingSubject}`, message, mode: "info" });
      return false;
    }
  };

  // Save optional PDF signatory changes immediately without triggering the
  // normal Save Session workflow (which may navigate to the Approval tab).
  const saveOptionalSignatorySettings = async (updatedPlan: Plan) => {
    setPlan(updatedPlan);
    try {
      const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
      if (!uid) throw new Error("Please sign in before saving PDF signatories.");
      const planSnapshot = normalizeStoredPlan(JSON.parse(JSON.stringify({
        ...updatedPlan,
        objectivesApplyTargetsBySession: JSON.parse(JSON.stringify(objectivesApplyTargetsBySession)),
        intentionApplyTargetsBySession: JSON.parse(JSON.stringify(intentionApplyTargetsBySession)),
      learnerContextApplyTargetsBySession: JSON.parse(JSON.stringify(learnerContextApplyTargetsBySession)),
      lessonSubtitleApplyTargetsBySession: JSON.parse(JSON.stringify(plan.lessonSubtitleApplyTargetsBySession || {})),
      })));
      await setDoc(doc(db, PLAN_RECORDS_COLLECTION, planRecordId(planSnapshot, uid)), {
        ownerUid: uid,
        ownerEmail: String(currentUser?.email || currentUser?.profile?.email || ""),
        plan: planSnapshot,
        term: String(planSnapshot.term || "1"),
        week: String(planSnapshot.week || "1"),
        lessonTitle: planSnapshot.lessonTitle || "",
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSavedPlans(prev => [...prev.filter(item => planListIdentity(item) !== planListIdentity(planSnapshot)), planSnapshot]
        .sort((a, b) => Number(a.term || 1) - Number(b.term || 1) || Number(a.week || 1) - Number(b.week || 1)));
      setSavedPlanSignature(JSON.stringify(planSnapshot));
      const teacherEmail = String(currentUser?.email || currentUser?.profile?.email || "").trim().toLowerCase();
      const matchingSub = submissions.find(item =>
        String(item.teacherEmail || "").trim().toLowerCase() === teacherEmail &&
        planListIdentity(item.plan) === planListIdentity(planSnapshot)
      );
      if (matchingSub) {
        const updatedSub = { ...matchingSub, plan: JSON.parse(JSON.stringify(planSnapshot)) };
        persistSubmissions(submissions.map(item => item.id === updatedSub.id ? updatedSub : item));
      }
      setSavedMessage("Additional signatories saved automatically.");
      setWorkflowMessage("Additional signatories saved automatically and will appear in Print PDF.");
    } catch (error) {
      console.error("Automatic PDF signatory save failed:", error);
      const message = `Additional signatories could not be saved automatically: ${error instanceof Error ? error.message : "Please check your connection and try again."}`;
      setWorkflowMessage(message);
      setSavedMessage(message);
    }
  };

  const field = (label: string, key: keyof Plan, placeholder = "", rows = 3) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{translate(label)}</span>
      <textarea disabled={controlsLocked}
        value={String(plan[key] ?? "")}
        onChange={e => update(key, e.target.value as any)}
        placeholder={translate(placeholder)}
        rows={rows}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );

  const input = (label: string, key: keyof Plan, placeholder = "") => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{translate(label)}</span>
      <input disabled={controlsLocked}
        value={String(plan[key] ?? "")}
        onChange={e => update(key, e.target.value as any)}
        placeholder={translate(placeholder)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );

  const section = (number: string, title: string, subtitle: string, children: React.ReactNode) => {
    if (activeNavigationSection !== number) return null;
    const palette: Record<string, { border: string; header: string; badge: string; title: string; accent: string }> = {
      "01": { border: "border-sky-200", header: "bg-sky-50", badge: "bg-sky-600 text-white", title: "text-sky-950", accent: "border-l-sky-500" },
      "02": { border: "border-violet-200", header: "bg-violet-50", badge: "bg-violet-600 text-white", title: "text-violet-950", accent: "border-l-violet-500" },
      "03": { border: "border-emerald-200", header: "bg-emerald-50", badge: "bg-emerald-600 text-white", title: "text-emerald-950", accent: "border-l-emerald-500" },
      "04": { border: "border-sky-200", header: "bg-sky-50", badge: "bg-sky-600 text-white", title: "text-sky-950", accent: "border-l-sky-500" },
      "05": { border: "border-amber-200", header: "bg-amber-50", badge: "bg-amber-500 text-white", title: "text-amber-950", accent: "border-l-amber-500" },
      "06": { border: "border-emerald-200", header: "bg-emerald-50", badge: "bg-emerald-600 text-white", title: "text-emerald-950", accent: "border-l-emerald-500" },
    };
    const colors = palette[number] || palette["01"];
    return (
      <section data-ilaw-section={number} className={`${number === "03" ? "overflow-visible" : "overflow-hidden"} rounded-xl border ${colors.border} border-l-4 ${colors.accent} bg-white shadow-sm`}>
        <div className={`border-b ${colors.border} ${colors.header} px-4 py-3`}>
          <div className="flex items-center gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black shadow-sm ${colors.badge}`}>{number}</span>
            <div className="min-w-0">
              <h3 className={`text-sm font-extrabold ${colors.title}`}>{translate(title)}</h3>
              <p className="mt-0.5 text-xs text-slate-600">{translate(subtitle)}</p>
            </div>
          </div>
        </div>
        {(["01", "03", "06"].includes(number)) ? (
          <fieldset disabled={controlsLocked && number !== "06"} className="grid gap-3 p-4 min-w-0" aria-disabled={controlsLocked && number !== "06"}>
            {children}
          </fieldset>
        ) : (
          <div className="grid gap-3 p-4">{children}</div>
        )}
      </section>
    );
  };

  const translate = (text: string) => {
    if (!isFilipino) return text;
    const dictionary: Record<string, string> = {
    'Lesson information': 'Impormasyon ng Aralin',
    'Basic details for the lesson plan.': 'Pangunahing detalye ng banghay-aralin.',
    'Lesson Proper': 'Paglinang ng Aralin',
    'Lesson planning workspace': 'Lugar ng Pagpaplano ng Aralin',
    'Lesson Objectives — By Session': 'Mga Layunin sa Pagkatuto — Bawat Sesyon',
    'Set the objectives for each session before planning its learning experiences.': 'Itakda ang mga layunin ng bawat sesyon bago planuhin ang mga karanasan sa pagkatuto.',
    'Learning Resources and Opportunities for Integration': 'Kagamitang Pampagkatuto at mga Pagkakataon para sa Integrasyon',
    'List available, inclusive materials and alternatives for emergencies or limited connectivity.': 'Ilista ang mga magagamit at inklusibong kagamitan, pati mga alternatibo sa emerhensiya o limitadong koneksiyon.',
    'Meaningful links to another learning area, special topic, or technology; write N/A if none.': 'Makabuluhang ugnayan sa ibang asignatura, natatanging paksa, o teknolohiya; isulat ang N/A kung wala.',
    'Lesson Subtitle Title': 'Pamagat ng Sesyon',
    'Lesson Plan Sequence for Pre-Lesson and Flow': 'Pagkakasunod-sunod ng Aralin para sa Bago ang Aralin at Daloy',
    'Pre-Lesson activities': 'Mga Gawain Bago ang Aralin',
    'Session focus / duration': 'Pokus / tagal ng sesyon',
    'Flow': 'Daloy ng Aralin',
    'Ways Forward / Next Steps': 'Mga Susunod na Hakbang',
    'Extended Learning Opportunities': 'Mga Pagkakataon para sa Pinalawak na Pagkatuto',
    'Reflection (required to proceed)': 'Pagninilay (kinakailangan upang magpatuloy)',
    'Lesson Title': 'Pamagat ng Aralin',
    'Learning Area': 'Asignatura',
    'Teacher Name(s)': 'Pangalan ng Guro/mga Guro',
    'School Head / Principal Name': 'Pangalan ng Punong-Guro',
    'Grade Level and Section': 'Baitang at Seksyon',
    'Term': 'Termino',
    'Week': 'Linggo',
    'References': 'Mga Sanggunian',
    'AI Use Declaration': 'Deklarasyon sa Paggamit ng AI',
    'Learning Competency and Curriculum Standards': 'Kasanayang Pampagkatuto at mga Pamantayan ng Kurikulum',
    'Learning Objectives': 'Mga Layunin sa Pagkatuto',
    'Learner Context': 'Konteksto ng mga Mag-aaral',
    'Pre-Lesson': 'Bago ang Aralin',
    'Learning Resources': 'Kagamitang Pampagkatuto',
    'Opportunities for integration': 'Mga Pagkakataon para sa Integrasyon',
    'Formative Assessment': 'Pagtatayang Formative',
    'Extended learning opportunities': 'Mga Pagkakataon para sa Pinalawak na Pagkatuto',
    'Reflections': 'Pagninilay',
    'Ways Forward': 'Mga Susunod na Hakbang',
    'Instructional Coaching Notes': 'Mga Tala para sa Instructional Coaching',
    'Lesson Information': 'Impormasyon ng Aralin',
    'Date of Instruction': 'Petsa ng Pagsasagawa',
    'Intention': 'Intensiyon',
    'Learning Experience': 'Karanasan sa Pagkatuto',
    'Assessment': 'Pagtataya',
    'School Head Approval': 'Pag-apruba ng Punong-Guro',
    'School Head Review': 'Pagsusuri ng Punong-Guro',
    'Lesson Planning Self-Check / Peer Coaching': 'Sariling Pagsusuri ng Banghay-Aralin / Peer Coaching',
    'Use before submitting or discussing the plan.': 'Gamitin bago isumite o talakayin ang banghay-aralin.',
    'Save draft': 'I-save ang draft',
    'Back to List': 'Bumalik sa Listahan',
    'New Plan': 'Bagong Banghay-Aralin',
    'Clear selected lesson': 'I-clear ang napiling aralin',
    'Preview PDF': 'I-preview ang PDF',
    'Draft guidance:': 'Gabay sa draft:',
    'Filter by Term': 'I-filter ayon sa Termino',
    'Filter by Week': 'I-filter ayon sa Linggo',
    'All existing terms': 'Lahat ng kasalukuyang termino',
    'All weeks': 'Lahat ng linggo',
    'No saved lesson plans match these filters yet.': 'Walang naka-save na banghay-aralin na tumutugma sa mga filter. Kumpletuhin ang banghay-aralin at i-click ang I-save ang draft upang maidagdag ito rito.',
    'Action': 'Aksyon',
    'Grade / Section': 'Baitang / Seksyon',
    'View Plan': 'Tingnan ang Banghay-Aralin',
    'Edit': 'I-edit',
    'Delete': 'Burahin',
    'My submissions': 'Aking mga isinumite',
    'My Lesson Plan Submissions': 'Aking mga Isinumiteng Banghay-Aralin',
    'Approved and waiting-for-approval lesson plans': 'Mga banghay-araling naaprubahan at naghihintay ng pag-apruba',
    'You have no approved or pending lesson plans yet.': 'Wala ka pang naaprubahan o nakabinbing banghay-aralin.',
    'Submitted': 'Isinumite',
    'Status': 'Katayuan',
    'For Approval': 'Para sa Pag-apruba',
    'Approval Remarks (optional)': 'Mga Puna sa Pag-apruba (opsyonal)',
    'Add remarks for the teacher, if any': 'Magdagdag ng puna para sa guro, kung mayroon',
    'Approve Lesson Plan': 'Aprubahan ang Banghay-Aralin',
    'Approve': 'Aprubahan',
    'Return': 'Ibalik',
    'Load plan': 'I-load ang banghay-aralin',
    'No pending submissions stored in this browser.': 'Walang nakabinbing isinumite na naka-save sa browser na ito.',
    'No submissions saved in this browser yet.': 'Wala pang naka-save na isinumite sa browser na ito.',
    'Signature attached': 'Nakalakip ang lagda',
    'Optional notes for the teacher': 'Opsyonal na tala para sa guro',
    'Lesson Plans for Approval': 'Mga Banghay-Aralin na Hihintay ng Pag-apruba',
    'There are no lesson plans waiting for approval in this browser.': 'Walang banghay-araling naghihintay ng pag-apruba sa browser na ito.',
    'Columnar Lesson Plan View': 'Kolum na Pagtingin sa Banghay-Aralin',
    'Close View': 'Isara ang Pagtingin',
    'Approval': 'Pag-apruba',
    'View / Print Plan': 'Tingnan / I-print ang Banghay-Aralin',
    'Approved · Locked': 'Naaprubahan · Naka-lock',
    'Untitled lesson plan': 'Walang Pamagat na Banghay-Aralin',
    'Learning area not specified': 'Hindi tinukoy ang asignatura',
    'Section not specified': 'Hindi tinukoy ang seksyon',
    'No email': 'Walang email',
    'Remarks:': 'Mga Puna:',
    'By ': 'Ni ',
    'Current user: ': 'Kasalukuyang user: ',
    'Reviewer access is available.': 'May access ang tagasuri.',
    'Intentions and appropriate learning competencies are clearly stated.': 'Malinaw na nakasaad ang mga layunin at angkop na kasanayang pampagkatuto.',
    'Intentions are evident across all sections; the plan is coherent.': 'Makikita ang mga layunin sa lahat ng bahagi; magkakaugnay ang banghay-aralin.',
    'Another teacher can implement the learning experience without additional explanation.': 'Maaaring maisagawa ng ibang guro ang karanasan sa pagkatuto nang walang karagdagang paliwanag.',
    'Learning Design Principles are intentionally embedded.': 'Sadyang isinama ang mga Prinsipyo ng Disenyo ng Pagkatuto.',
    'Meaningful integration opportunities are maximized.': 'Napakinabangan ang mga makabuluhang pagkakataon para sa integrasyon.',
    'The plan supports learners with disabilities, barriers, and varied contexts.': 'Sinusuportahan ng banghay-aralin ang mga mag-aaral na may kapansanan, hadlang sa pagkatuto, at magkakaibang konteksto.',
    'Assessment strategies are integrated throughout the session.': 'Isinama ang mga estratehiya sa pagtataya sa buong sesyon.',
    'Assessment produces evidence of whether learning was successful.': 'Nagbibigay ang pagtataya ng ebidensiya kung naging matagumpay ang pagkatuto.',
    'Interventions and next steps are actionable and informed by reflection.': 'Maisasagawa ang mga interbensiyon at susunod na hakbang at nakabatay sa pagninilay.',
    'Enter lesson title': 'Ilagay ang pamagat ng aralin',
    'Enter teacher name': 'Ilagay ang pangalan ng guro',
    'Select a grade level first': 'Pumili muna ng baitang',
    'Select learning area': 'Pumili ng asignatura',
    'No subjects found for this grade level': 'Walang nahanap na asignatura para sa baitang na ito',
    'All subjects listed for the selected grade level are shown here, regardless of teacher assignment. Changing the grade level refreshes the subject list; choose the learning area for this lesson.': 'Ipinapakita rito ang lahat ng asignatura para sa napiling baitang, anuman ang nakatalagang guro. Kapag binago ang baitang, maa-update ang listahan ng asignatura; piliin ang asignatura para sa araling ito.',
    'Name of School Head / Principal': 'Pangalan ng Punong-Guro',
    'No principal found; enter name if needed': 'Walang nahanap na punong-guro; ilagay ang pangalan kung kinakailangan',
    'School ID missing; enter school head name': 'Walang School ID; ilagay ang pangalan ng punong-guro',
    "Automatically matched to the signed-in user's school ID. You can enter or correct the name if it is not found.": 'Awtomatikong itinutugma sa School ID ng naka-sign in na user. Maaari mong ilagay o itama ang pangalan kung hindi ito makita.',
    'Filter by Grade Level': 'I-filter ayon sa Baitang',
    'All grade levels': 'Lahat ng baitang',
    'Filter by Subject': 'I-filter ayon sa Asignatura',
    'All subjects': 'Lahat ng asignatura',
    'Sections are filtered by the selected grade level and subject. Select one or more sections (hold Ctrl on Windows or Command on Mac).': 'Naka-filter ang mga seksyon ayon sa napiling baitang at asignatura. Pumili ng isa o higit pang seksyon (pindutin nang matagal ang Ctrl sa Windows o Command sa Mac).',
    'No sections match these filters. Try another grade level or subject.': 'Walang seksyong tumutugma sa mga filter na ito. Subukan ang ibang baitang o asignatura.',
    'Number of Sessions': 'Bilang ng mga Sesyon',
    'session': 'sesyon',
    'Complete Learning Area/s, Name of Teacher/s, Grade Level and Section, Number of Sessions, References, and Declaration of AI use to proceed.': 'Kumpletuhin ang Pamagat ng Aralin, Asignatura/mga Asignatura, Pangalan ng Guro/mga Guro, Baitang at Seksyon, Bilang ng mga Sesyon, Mga Sanggunian, at Pahayag sa Paggamit ng AI upang magpatuloy.',
    'Proceed to ILAW Lesson Plan': 'Magpatuloy sa Banghay-Aralin ng ILAW',
    'Intention — Shared Across All Sessions': '02. Intensiyon — Para sa Lahat ng Sesyon',
    'Complete the competency standards and learner context once. Write separate Learning Objectives inside each session.': 'Kumpletuhin nang isang beses ang mga pamantayan ng kasanayan at konteksto ng mag-aaral. Isulat ang magkakahiwalay na Layunin sa Pagkatuto sa bawat sesyon.',
    'Apply this Intention to selected sessions': 'Ilapat ang Intensiyong ito sa mga napiling sesyon',
    'Enter the learning competency and relevant curriculum/content/performance standards for the entire lesson.': 'Ilagay ang kasanayang pampagkatuto at kaugnay na pamantayan ng kurikulum/nilalaman/pagganap para sa buong aralin.',
    "Describe the learners' prior knowledge, strengths, needs, and possible barriers relevant to the whole lesson.": 'Ilarawan ang dating kaalaman, kalakasan, pangangailangan, at posibleng hadlang sa pagkatuto ng mga mag-aaral na may kaugnayan sa buong aralin.',
    "Each session has its own checkbox. Selected sessions receive these objectives now and stay synchronized when you edit the current session's objectives.": 'May sariling checkbox ang bawat sesyon. Tatanggapin ng mga napiling sesyon ang mga layuning ito at mananatiling magkakasabay ang mga ito kapag binago mo ang mga layunin ng kasalukuyang sesyon.',
    'Questions, observation notes, exit tickets, success criteria, or evidence of learning for this session.': 'Mga tanong, tala ng obserbasyon, exit ticket, pamantayan ng tagumpay, o ebidensiya ng pagkatuto para sa sesyong ito.',
    'Plan reteaching, enrichment, learner support, referrals, or adjustments based on the assessment.': 'Magplano ng muling pagtuturo, pagpapalawak ng pagkatuto, suporta sa mag-aaral, referral, o mga pagbabago batay sa pagtataya.',
    'Practice, enrichment, or support beyond this session.': 'Pagsasanay, pagpapalawak ng pagkatuto, o suportang lampas sa sesyong ito.',
    'What did learners understand? What needs reteaching or adjusting?': 'Ano ang naunawaan ng mga mag-aaral? Ano ang kailangang ituro muli o baguhin?',
    'Complete Lesson Information and enter a Reflection for every session before proceeding to Approval.': 'Kumpletuhin ang Impormasyon ng Aralin at maglagay ng Pagninilay para sa bawat sesyon bago magpatuloy sa Pag-apruba.',
    'The lesson plan is complete but has unsaved changes. Save the completed plan to enable Approval.': 'Kumpleto na ang banghay-aralin ngunit may mga pagbabagong hindi pa nai-save. I-save ang kumpletong banghay-aralin upang mabuksan ang Pag-apruba.',
    'Proceed to Approval and Printing': 'Magpatuloy sa Pag-apruba at Pagpi-print',
    'Record the formative assessment for each session. Use the editor toolbar to format responses and insert tables.': 'Itala ang formative assessment para sa bawat sesyon. Gamitin ang toolbar ng editor upang ayusin ang format ng mga sagot at maglagay ng mga talahanayan.',
    'Save this checklist separately. It remains editable and can be saved even after the lesson plan is approved.': 'I-save nang hiwalay ang checklist na ito. Maaari pa rin itong i-edit at i-save kahit naaprubahan na ang banghay-aralin.',
    'Save Self-Check / Peer Coaching': 'I-save ang Sariling Pagsusuri / Peer Coaching',
    'Complete the next steps for each session. These entries are saved with the corresponding session and included in the lesson plan printout.': 'Kumpletuhin ang mga susunod na hakbang para sa bawat sesyon. Naka-save ang mga ito kasama ng kaukulang sesyon at isinasama sa naka-print na banghay-aralin.',
    'Ways Forward for Session': 'Mga Susunod na Hakbang para sa Sesyon',
    'Next steps: reteaching, enrichment, learner support, referrals, or adjustments for the next lesson...': 'Mga susunod na hakbang: muling pagtuturo, pagpapalawak ng pagkatuto, suporta sa mag-aaral, referral, o pagbabago para sa susunod na aralin...',
    'Reflections (required to proceed)': 'Pagninilay (kinakailangan upang magpatuloy)',
    'Overall Reflections': 'Pangkalahatang Pagninilay',
    'After teaching all sessions: what changed in learner understanding? What should be adjusted, extended, or shared?': 'Matapos ituro ang lahat ng sesyon: ano ang nagbago sa pag-unawa ng mga mag-aaral? Ano ang dapat baguhin, palawakin, o ibahagi?',
    'Submission and Approval': 'Pagsusumite at Pag-apruba',
    'Submit the current lesson plan for review by the school head.': 'Isumite ang kasalukuyang banghay-aralin upang masuri ng punong-guro.',
    'Submit for Approval': 'Isumite para sa Pag-apruba',
    'Save Changes first': 'I-save muna ang mga Pagbabago',
    'Lesson Plans with Approved Sessions': 'Mga Banghay-Araling may mga Naaprubahang Sesyon',
    'These plans contain sessions approved individually by the School Head. Approval applies to each listed session, not automatically to the entire week.': 'Ang mga banghay-araling ito ay may mga sesyong inaprubahan nang paisa-isa ng punong-guro. Ang pag-apruba ay para sa bawat nakalistang sesyon, hindi awtomatikong para sa buong linggo.',
    'No approved lesson plans are available for your account yet.': 'Wala pang naaprubahang banghay-aralin para sa iyong account.',
    'View Coaching Notes': 'Tingnan ang mga Tala sa Coaching',
    'Save Changes': 'I-save ang mga Pagbabago',
    'Clear': 'I-clear',
    'Complete': 'Kumpleto',
    'Completed': 'Nakumpleto',
    'Needs entry': 'Kailangang punan',
    'View PDF / Print': 'Tingnan ang PDF / I-print',
    'Enter the subtitle/title (optional)': 'Ilagay ang pamagat/subtitle (opsyonal)',
    'Title is not required': 'Hindi kinakailangan ang pamagat',
    'Select a lesson sequence…': 'Pumili ng pagkakasunod-sunod ng aralin…',
    'Selecting a sequence automatically fills Pre-Lesson, Flow, and the Formative Assessment text in Assessment. You can edit the generated text to fit your lesson.': 'Kapag pumili ng pagkakasunod-sunod, awtomatikong mapupunan ang Bago ang Aralin, Daloy, at Pagtatayang Formative sa 04. Pagtataya. Maaari mong i-edit ang nabuong teksto upang umangkop sa iyong aralin.',
    'Prepare learners, activate prior knowledge, clarify objectives, and check readiness for this session.': 'Ihanda ang mga mag-aaral, buhayin ang dating kaalaman, linawin ang mga layunin, at suriin ang kahandaan para sa sesyong ito.',
    'e.g. Guided exploration — 45 minutes': 'hal. Gabay na paggalugad — 45 minuto',
    'Save Session': 'I-save ang Sesyon',
    "Saves the complete lesson plan, including all sessions and this session's latest entries.": 'Sine-save ang buong banghay-aralin, kasama ang lahat ng sesyon at pinakabagong inilagay sa sesyong ito.',
    "Complete each session's Reflection to proceed. The last session remains accessible so you can enter its Reflection; Preview PDF unlocks when every session has a Reflection.": 'Kumpletuhin ang Pagninilay ng bawat sesyon upang magpatuloy. Mananatiling maa-access ang huling sesyon upang mailagay ang Pagninilay nito; mabubuksan ang I-preview ang PDF kapag may Pagninilay na ang bawat sesyon.',
    'Session': 'Sesyon',
    'of': 'sa',
    'Save approved-plan edits to the existing submission': 'I-save ang mga pagbabago sa naaprubahang banghay-aralin sa kasalukuyang pagsusumite',
    'Save the lesson plan from Session': 'I-save ang banghay-aralin mula sa Sesyon',
    'Previous Session': 'Nakaraang Sesyon',
    'Next Session': 'Susunod na Sesyon',
    'Submit the lesson plan for School Head approval.': 'Isumite ang banghay-aralin para sa pag-apruba ng punong-guro.',
    'The selected session is already approved. Select an unapproved session to submit or update it.': 'Naaprubahan na ang napiling sesyon. Pumili ng sesyong hindi pa aprubado upang isumite o i-update ito.',
    'Save changes to the existing approved lesson plan; no reapproval is required.': 'I-save ang mga pagbabago sa kasalukuyang naaprubahang banghay-aralin; hindi na kailangan ng panibagong pag-apruba.',
    'Pop-up blocked': 'Na-block ang pop-up',
    'Please allow pop-ups for this site to view the approved ILAW PDF preview.': 'Payagan ang mga pop-up para sa site na ito upang makita ang PDF preview ng naaprubahang banghay-aralin ng ILAW.',
    'Preparing ILAW PDF Preview': 'Inihahanda ang PDF Preview ng ILAW',
    'Preparing approved ILAW Lesson Plan…': 'Inihahanda ang naaprubahang Banghay-Aralin ng ILAW…',
    'Print': 'I-print',
    'Approved by': 'Inaprubahan ni',
    'Select Week Number': 'Pumili ng Numero ng Linggo',
    'Cancel': 'Kanselahin',
    'All your saved drafts, pending submissions, and approved lesson plans': 'Lahat ng iyong naka-save na draft, nakabinbing pagsusumite, at naaprubahang banghay-aralin',
    'Term / Week': 'Termino / Linggo',
    'Date': 'Petsa',
    'Teacher': 'Guro',
    'Draft': 'Draft',
    'Open Draft': 'Buksan ang Draft',
    'Request Edit': 'Humiling ng Pag-edit',
    'Complete Approved Delete': 'Kumpletuhin ang Naaprubahang Pagbura',
    'Request Delete': 'Humiling ng Pagbura',
    'Edit Approved Plan': 'I-edit ang Naaprubahang Banghay-Aralin',
    'All Sessions Individually Approved': 'Indibidwal na Naaprubahan ang Lahat ng Sesyon',
    'Edit Approved Plan · Changes Allowed': 'Naaprubahang Banghay-Aralin · Pinapayagan ang mga Pagbabago',
    'Session Returned for Revision': 'Ibinalik ang Sesyon para sa Pagwawasto',
    'Sessions Awaiting Review': 'Mga Sesyong Naghihintay ng Pagsusuri',
    'Approved by School Head': 'Naaprubahan ng Punong-Guro',
    'Returned for revision': 'Ibinalik para sa pagwawasto',
    'Awaiting School Head approval': 'Naghihintay ng pag-apruba ng punong-guro',
    'Reviewed by': 'Sinuri ni',
    'Latest remarks:': 'Pinakabagong mga puna:',
    'Edit Request Rejected': 'Tinanggihan ang Kahilingan sa Pag-edit',
    'Delete Request Rejected': 'Tinanggihan ang Kahilingan sa Pagbura',
    'System Admin': 'System Admin',
    'Your reason:': 'Dahilan mo:',
    'Reason for rejection / reviewer note:': 'Dahilan ng pagtanggi / tala ng tagasuri:',
    'No reviewer note was provided.': 'Walang ibinigay na tala ang tagasuri.',
    'Each session is approved or returned independently. Approving one session does not approve or lock the other sessions in the same week.': 'Hiwalay na inaaprubahan o ibinabalik ang bawat sesyon. Ang pag-apruba sa isang sesyon ay hindi nangangahulugang aprubado o naka-lock na ang iba pang sesyon sa parehong linggo.',
    'School logo': 'Logo ng paaralan',
    'Reflection': 'Pagninilay',
    'Go to Reflection for Last Session': 'Pumunta sa Pagninilay ng Huling Sesyon',
    '04 · Assessment': '04 · Pagtataya',
    'Practice, enrichment, or support beyond this session...': 'Pagsasanay, pagpapalawak ng pagkatuto, o suportang lampas sa sesyong ito...',
    'Approved': 'Naaprubahan',
    'Pending': 'Nakabinbin',
    'References (books, websites, toolkits, etc.)': 'Mga Sanggunian (aklat, website, toolkit, atbp.)',
    'List references and links.': 'Ilista ang mga sanggunian at link.',
    'Name of Teacher/s': 'Pangalan ng Guro/mga Guro',
    'Week Number': 'Numero ng Linggo',
    'Go to the ILAW Lesson Plans list': 'Pumunta sa listahan ng mga Banghay-Aralin ng ILAW',
    'Approved lesson plans cannot be cleared here.': 'Hindi maaaring i-clear dito ang mga naaprubahang banghay-aralin.',
    'Clear the selected lesson plan': 'I-clear ang napiling banghay-aralin',
    'School Head / Principal': 'Punong-Guro',
    'Learning Area/s': 'Asignatura/mga Asignatura',
    'Term Number': 'Numero ng Termino',
    'Approved lesson plan opened.': 'Binuksan ang naaprubahang banghay-aralin.',
    'Pending lesson plan opened.': 'Binuksan ang nakabinbing banghay-aralin.',
    'Draft opened.': 'Binuksan ang draft.',
    'School Head Instructional Coaching Notes loaded in Section 06 — Rubric / Peer Coaching.': 'Na-load ang mga tala ng Instructional Coaching ng Punong-Guro sa Seksyon 06 — Rubric / Peer Coaching.',
    'Approve Session': 'Aprubahan ang Sesyon',
    'Return This Session': 'Ibalik ang Sesyong Ito',
    };
    return dictionary[text] || text;
  };

  const currentTeacherEmail = String(currentUser?.email || "").trim().toLowerCase();
  const planListIdentity = (item: Plan) => [
    item.term || "1",
    item.week || "1",
    item.learningAreas || "",
  ].map(value => String(value).trim().toLowerCase()).join("::");
  // A weekly plan is considered ready for PDF preview only when every current
  // session has an individual approval. The approval state of one session must
  // never lock or approve the remaining sessions.
  const isPlanApproved = (item: Plan) => submissions.some(submission => {
    if ((!currentTeacherEmail || submission.teacherEmail === currentTeacherEmail) === false) return false;
    if (planListIdentity(submission.plan) !== planListIdentity(item)) return false;
    const planSessions = Array.isArray(item.sessions) ? item.sessions : [];
    const submissionSessions = Array.isArray(submission.plan.sessions) ? submission.plan.sessions : [];
    if (!planSessions.length || !submissionSessions.length) return submission.status === "approved";
    return planSessions.every(session => {
      const savedSession = submissionSessions.find(candidate => candidate.id === session.id);
      if (!savedSession) return false;
      const state = submission.sessionStatuses?.[session.id] ||
        ((submission.approvedSessionIds || []).includes(session.id) ? "approved" : "pending");
      return state === "approved";
    });
  });
  const editSavedPlan = (item: Plan) => {
    if (isPlanApproved(item)) return;
    openOrLoadPlan(item, "Lesson plan loaded from the database. Save your changes when finished.");
  };
  const clearSelectedLesson = async () => {
    if (isPlanApproved(plan)) {
      setWorkflowMessage("This session has been approved and cannot be cleared here. Other sessions in the same weekly plan are reviewed separately.");
      return;
    }
    const title = plan.lessonTitle.trim() || `Term ${plan.term || selectedTerm || "1"}, Week ${plan.week || selectedWeek || "1"}`;
    if (await showMessageWindow({ title: "Clear lesson plan?", message: `Clear “${title}” from this device and the cloud database? Its saved-list entry and pending submission will also be removed. This cannot be undone.`, mode: "confirm", confirmLabel: "Clear lesson", danger: true }) !== true) return;

    const identity = planListIdentity(plan);
    const nextSavedPlans = savedPlans.filter(item => planListIdentity(item) !== identity);
    const nextSubmissions = submissions.filter(item =>
      !(planListIdentity(item.plan) === identity && item.teacherEmail === currentTeacherEmail && item.status !== "approved")
    );
    setSavedPlans(nextSavedPlans);
    setSubmissions(nextSubmissions);
    try {
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(nextSubmissions));
    } catch (error) {
      console.error("Could not clear the local ILAW lesson plan:", error);
      setWorkflowMessage("The lesson was cleared in the form, but some local data could not be updated.");
    }

    const uid = String(currentUser?.uid || currentUser?.id || "").trim();
    if (uid) {
      try {
        await deleteDoc(doc(db, CLOUD_COLLECTION, uid));
        setCloudMessage("Selected lesson cleared from this device and the cloud database.");
      } catch (error) {
        console.error("Could not delete ILAW lesson plan from the cloud database:", error);
        setCloudMessage("Local lesson data was cleared, but cloud deletion failed. Check your connection and database permissions.");
      }
    } else {
      setCloudMessage("Selected lesson cleared from this device. Sign in to clear a cloud-synced copy.");
    }
    setPlan(blankPlanForCurrentUser());
    setSelectedTerm("");
    setSelectedWeek("");
    setHasStartedPlan(false);
    setActiveSessionTab("session-1");
    setWorkflowMessage("Selected lesson cleared from the form and saved list.");
    setSavedMessage("");
  };

  const deleteSavedPlan = async (item: Plan) => {
    if (isPlanApproved(item)) return;
    const title = item.lessonTitle || `Term ${item.term || "1"}, Week ${item.week || "1"}`;
    const options = ["Whole week / entire lesson plan", ...(item.sessions || []).map((_, index) => `Session ${index + 1}`)];
    const selected = await showMessageWindow({ title: "Delete lesson plan", message: `Choose whether to remove the entire lesson plan “${title}” or only one session. This action cannot be undone.`, mode: "choice", inputLabel: "Delete scope", options, initialValue: options[0], confirmLabel: "Continue", danger: true });
    if (typeof selected !== "string") return;
    const sessionMatch = selected.match(/^Session (\d+)$/i);
    const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
    if (!uid) { setSavedMessage("Please sign in before deleting a lesson plan from the database."); return; }
    try {
      if (sessionMatch) {
        const sessionNumber = Number(sessionMatch[1]);
        const updatedPlan: Plan = { ...item, sessions: (item.sessions || []).filter((_, index) => index !== sessionNumber - 1), noOfSessions: String(Math.max(1, (item.sessions || []).length - 1)) };
        await setDoc(doc(db, PLAN_RECORDS_COLLECTION, planRecordId(item, uid)), updatedPlan);
        setSavedPlans(savedPlans.map(saved => planListIdentity(saved) === planListIdentity(item) ? updatedPlan : saved));
        if (planListIdentity(plan) === planListIdentity(item)) setPlan(updatedPlan);
        setSavedMessage(`Session ${sessionNumber} was deleted from “${title}”.`);
      } else {
        await deleteDoc(doc(db, PLAN_RECORDS_COLLECTION, planRecordId(item, uid)));
        setSavedPlans(savedPlans.filter(saved => planListIdentity(saved) !== planListIdentity(item)));
        setSavedMessage("The entire lesson plan was deleted from the database.");
      }
      setCloudMessage("Database updated successfully.");
    } catch (error) {
      console.error("Could not delete ILAW lesson plan from database:", error);
      setSavedMessage("Could not update the lesson plan in the database. Check your connection and permissions.");
    }
  };
  const teacherSubmissions = submissions
    .filter(item => item.teacherEmail === currentTeacherEmail && (item.status === "pending" || item.status === "approved" || item.status === "returned"))
    .sort((a, b) => new Date(b.reviewedAt || b.submittedAt).getTime() - new Date(a.reviewedAt || a.submittedAt).getTime());
  // Carry-over choices include sessions marked Not Executed in either the
  // previous week or the current selected week, for the same term and learning area.
  // Merge the active plan, drafts, and submitted plans while avoiding duplicates.
  const carryOverOptions = (() => {
    const currentWeekNumber = Number(selectedWeek);
    const previousWeekNumber = currentWeekNumber - 1;
    if (!selectedTerm || !selectedWeek || !selectedSubject) return [] as Array<{ key: string; plan: Plan; session: Session; sessionIndex: number; weekRelation: "current" | "previous" }>;
    const planCandidates: Plan[] = [
      plan,
      ...teacherSubmissions.map(item => item.plan),
      ...savedPlans.filter(draft => !teacherSubmissions.some(sub => planListIdentity(sub.plan) === planListIdentity(draft))),
    ];
    const results: Array<{ key: string; plan: Plan; session: Session; sessionIndex: number; weekRelation: "current" | "previous" }> = [];
    const seen = new Set<string>();
    planCandidates.forEach(sourcePlan => {
      const sourceWeek = Number(sourcePlan.week || "1");
      const weekRelation = sourceWeek === currentWeekNumber ? "current" : sourceWeek === previousWeekNumber && previousWeekNumber >= 1 ? "previous" : null;
      if (!weekRelation || String(sourcePlan.term || "1") !== selectedTerm) return;
      if (String(sourcePlan.learningAreas || "").trim().toLowerCase() !== selectedSubject.trim().toLowerCase()) return;
      if (String(sourcePlan.gradeSection || "").trim() && String(plan.gradeSection || "").trim() && String(sourcePlan.gradeSection || "").trim().toLowerCase() !== String(plan.gradeSection || "").trim().toLowerCase()) return;
      (sourcePlan.sessions || []).forEach((session, sessionIndex) => {
        if (session.instructionStatus !== "not-executed") return;
        // Do not offer the currently edited session as its own carry-over source.
        if (weekRelation === "current" && planListIdentity(sourcePlan) === planListIdentity(plan) && session.id === plan.sessions[currentSessionIndex]?.id) return;
        const key = `${planListIdentity(sourcePlan)}::${session.id || sessionIndex}`;
        if (seen.has(key)) return;
        seen.add(key);
        results.push({ key, plan: sourcePlan, session, sessionIndex, weekRelation });
      });
    });
    return results;
  })();
  const applyCarryOverSession = (key: string) => {
    const source = carryOverOptions.find(option => option.key === key);
    const targetSession = plan.sessions[currentSessionIndex];
    if (!source || !targetSession) return;
    const { id: _sourceId, instructionStatus: _sourceStatus, carryOverFrom: _sourceCarryOver, ...sourceContent } = source.session;
    const sourceLabel = `Term ${source.plan.term || "1"}, Week ${source.plan.week || "1"}, Session ${source.sessionIndex + 1}`;
    setPlan(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => session.id === targetSession.id
        ? { ...session, ...sourceContent, id: targetSession.id, instructionStatus: "not-marked", carryOverFrom: sourceLabel }
        : session),
    }));
    flowDraftsRef.current[targetSession.id] = String(source.session.flow || "");
    assessmentDraftsRef.current[targetSession.id] = String(source.session.assessment || "");
    setWorkflowMessage(`Copied ${sourceLabel} into Session ${currentSessionIndex + 1}. Review the content and update its instruction status when appropriate.`);
  };

  const editSubmission = async (item: Submission) => {
    if (item.status === "approved" && !item.editApproved) return;
    const title = item.plan.lessonTitle || `Term ${item.plan.term || "1"}, Week ${item.plan.week || "1"}`;
    if (item.editApproved) {
      if (item.teacherEmail !== currentTeacherEmail) return;
      if (await showMessageWindow({ title: "Edit approved lesson plan", message: `System Admin approved editing “${title}”. You can now edit all lesson fields and save changes to this same submission.`, mode: "confirm", confirmLabel: "Start editing" }) !== true) return;
      setApprovedEditSubmissionId(item.id);
    } else {
      if (item.status === "approved") return;
      if (await showMessageWindow({ title: "Edit submission?", message: `Edit “${title}”? This will remove the pending submission from the approval queue so you can revise it and submit it again.`, mode: "confirm", confirmLabel: "Continue editing" }) !== true) return;
      persistSubmissions(submissions.filter(submission => submission.id !== item.id));
    }
    openOrLoadPlan(item.plan, item.editApproved ? "Editing approved lesson plan is enabled. Update any fields and select Save Changes; the existing approval will remain valid." : "Pending submission removed from the approval queue. Edit the lesson plan, save it, then submit it again when ready.");
  };

  const deleteSubmission = async (item: Submission) => {
    // Approved submissions and records with an approved edit request must use the controlled workflow.
    if (item.status === "approved" || item.editApproved) return;
    const title = item.plan.lessonTitle || `Term ${item.plan.term || "1"}, Week ${item.plan.week || "1"}`;
    const options = ["Whole week / entire lesson plan", ...(item.plan.sessions || []).map((_, index) => `Session ${index + 1}`)];
    const selected = await showMessageWindow({ title: "Delete lesson plan", message: `Choose whether to delete the entire lesson plan “${title}” or only one session. This action cannot be undone.`, mode: "choice", inputLabel: "Delete scope", options, initialValue: options[0], confirmLabel: "Continue", danger: true });
    if (typeof selected !== "string") return;
    const sessionMatch = selected.match(/^Session (\d+)$/i);
    if (sessionMatch) {
      const sessionNumber = Number(sessionMatch[1]);
      const updatedPlan: Plan = { ...item.plan, sessions: (item.plan.sessions || []).filter((_, index) => index !== sessionNumber - 1), noOfSessions: String(Math.max(1, (item.plan.sessions || []).length - 1)) };
      const updatedItem: Submission = { ...item, plan: updatedPlan };
      persistSubmissions(submissions.map(submission => submission.id === item.id ? updatedItem : submission));
      setSavedPlans(savedPlans.map(saved => planListIdentity(saved) === planListIdentity(item.plan) ? updatedPlan : saved));
      try {
        await setDoc(doc(db, SUBMISSIONS_CLOUD_COLLECTION, item.id), updatedItem, { merge: true });
        setWorkflowMessage(`Session ${sessionNumber} was deleted from “${title}”.`);
      } catch (error) {
        console.warn("Could not sync session deletion:", error);
        setWorkflowMessage(`Session ${sessionNumber} was removed locally, but the cloud update failed. Please retry.`);
      }
      return;
    }
    persistSubmissions(submissions.filter(submission => submission.id !== item.id));
    setSavedPlans(savedPlans.filter(saved => planListIdentity(saved) !== planListIdentity(item.plan)));
    try {
      await deleteDoc(doc(db, SUBMISSIONS_CLOUD_COLLECTION, item.id));
      setWorkflowMessage("The entire lesson plan was deleted.");
    } catch (error) {
      console.warn("Could not sync submission deletion:", error);
      setWorkflowMessage("The lesson plan was removed locally, but cloud deletion failed. Please retry.");
    }
  };

  // The teacher who owns the submission executes deletion after System Admin approval.
  const executeApprovedDeleteRequest = async (item: Submission) => {
    if (item.teacherEmail !== currentTeacherEmail) {
      setWorkflowMessage("Only the teacher who owns this lesson plan can complete its approved deletion.");
      return;
    }
    const approvedRequest = changeRequests.find(request =>
      request.submissionId === item.id && request.teacherEmail === currentTeacherEmail && request.type === "delete" && request.status === "approved"
    );
    if (!approvedRequest) {
      setWorkflowMessage("A System Admin must approve your Delete request before you can remove this lesson plan.");
      return;
    }
    const title = item.plan.lessonTitle || `Term ${item.plan.term || "1"}, Week ${item.plan.week || "1"}`;
    const isSessionDelete = approvedRequest.scope === "session";
    const sessionNumber = Number(approvedRequest.sessionId?.match(/(\d+)/)?.[1] || approvedRequest.requestNote?.match(/session\s*(\d+)/i)?.[1] || 0);
    if (isSessionDelete && (!sessionNumber || sessionNumber < 1 || sessionNumber > item.plan.sessions.length)) {
      setWorkflowMessage("This approved request does not identify a valid session number. Ask the teacher to submit a new request specifying Session 1, Session 2, and so on.");
      return;
    }
    const confirmed = await showMessageWindow({
      title: isSessionDelete ? "Delete approved session?" : "Delete approved lesson plan?",
      message: isSessionDelete
        ? `Your request to delete Session ${sessionNumber} from “${title}” was approved. Remove only this session? This cannot be undone.`
        : `Your request to delete “${title}” was approved. Permanently delete this entire lesson plan? This cannot be undone.`,
      mode: "confirm",
      confirmLabel: isSessionDelete ? "Delete session" : "Delete lesson plan",
      danger: true
    });
    if (confirmed !== true) return;
    if (isSessionDelete) {
      const updatedPlan: Plan = { ...item.plan, sessions: item.plan.sessions.filter((_, index) => index !== sessionNumber - 1), noOfSessions: String(Math.max(1, item.plan.sessions.length - 1)) };
      const remainingSessions = updatedPlan.sessions || [];
      const approvedSessionIds = (item.approvedSessionIds || []).filter(id => remainingSessions.some(session => session.id === id));
      const sessionStatuses = Object.fromEntries(remainingSessions.map(session => [session.id, item.sessionStatuses?.[session.id] || (approvedSessionIds.includes(session.id) ? "approved" : "pending")]));
      const allRemainingApproved = remainingSessions.length > 0 && remainingSessions.every(session => approvedSessionIds.includes(session.id));
      const updatedItem: Submission = { ...item, plan: updatedPlan, approvedSessionIds, sessionStatuses, status: allRemainingApproved ? "approved" : "pending", reviewerNote: `Session ${sessionNumber} was deleted by the teacher after an approved request. Approval statuses for remaining sessions were preserved.` };
      persistSubmissions(submissions.map(submission => submission.id === item.id ? updatedItem : submission));
      const nextSavedPlans = savedPlans.map(saved => planListIdentity(saved) === planListIdentity(item.plan) ? updatedPlan : saved);
      setSavedPlans(nextSavedPlans);
      try { await setDoc(doc(db, SUBMISSIONS_CLOUD_COLLECTION, item.id), updatedItem, { merge: true }); setWorkflowMessage(`Deleted Session ${sessionNumber} from “${title}”. The updated plan is pending review.`); }
      catch (error) { console.warn("Could not sync session deletion:", error); setWorkflowMessage("Session deleted locally, but cloud update failed. Please retry."); }
      return;
    }
    const nextSubmissions = submissions.filter(submission => submission.id !== item.id);
    const nextSavedPlans = savedPlans.filter(saved => planListIdentity(saved) !== planListIdentity(item.plan));
    persistSubmissions(nextSubmissions);
    setSavedPlans(nextSavedPlans);
    try {
      await deleteDoc(doc(db, SUBMISSIONS_CLOUD_COLLECTION, item.id));
      const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
      if (uid) {
        try { await deleteDoc(doc(db, PLAN_RECORDS_COLLECTION, planRecordId(item.plan, uid))); }
        catch (savedPlanError) { console.warn("Could not delete related saved-plan record:", savedPlanError); }
      }
      setWorkflowMessage(`You deleted the approved lesson plan: ${title}.`);
    } catch (error) {
      console.warn("Could not delete approved ILAW submission from cloud:", error);
      setWorkflowMessage("The lesson plan was removed from this view, but cloud deletion failed. Please retry or check the connection.");
    }
  };

  // System administrators may permanently remove an entire pending or approved submission.
  const deleteAdminSubmission = async (item: Submission) => {
    const title = getLessonProperTitle(item.plan) || `Term ${item.plan.term || "1"}, Week ${item.plan.week || "1"}`;
    if (await showMessageWindow({ title: "Delete entire lesson plan?", message: `System Admin: permanently delete the entire ${item.status} lesson plan “${title}” submitted by ${item.teacherName || item.teacherEmail || "the teacher"}? All sessions in this submission will be removed. This cannot be undone.`, mode: "confirm", confirmLabel: "Delete entire plan", danger: true }) !== true) return;
    try {
      await deleteDoc(doc(db, SUBMISSIONS_CLOUD_COLLECTION, item.id));
      const nextSubmissions = submissions.filter(submission => submission.id !== item.id);
      const nextSavedPlans = savedPlans.filter(saved => planListIdentity(saved) !== planListIdentity(item.plan));
      persistSubmissions(nextSubmissions);
      setSavedPlans(nextSavedPlans);
      setWorkflowMessage(`System Admin permanently deleted the entire ${item.status} lesson plan: ${title}.`);
    } catch (error) {
      console.error("Could not delete ILAW lesson plan as System Admin:", error);
      setWorkflowMessage("The lesson plan could not be deleted from the database. No local records were removed; please check permissions and try again.");
    }
  };

  const chooseTermWeek = (term: string, week: string, subject: string = selectedSubject) => {
    setSelectedTerm(term);
    setSelectedWeek(week);
    setSelectedSubject(subject);
    setWorkflowMessage("");
    if (!term || !week || !subject) return;
    // Keep plans for different subjects separate even when their term and week match.
    const matchingSubmission = teacherSubmissions.find(item =>
      String(item.plan.term || "1") === term &&
      String(item.plan.week || "1") === week &&
      String(item.plan.learningAreas || "").trim().toLowerCase() === subject.trim().toLowerCase()
    );
    const matchingDraft = [...savedPlans].reverse().find(item =>
      String(item.term || "1") === term &&
      String(item.week || "1") === week &&
      String(item.learningAreas || "").trim().toLowerCase() === subject.trim().toLowerCase()
    );
    const existingPlan = matchingSubmission?.plan || matchingDraft;
    if (existingPlan) {
      openOrLoadPlan({ ...existingPlan, term, week, learningAreas: subject }, matchingSubmission
        ? `Loaded your ${matchingSubmission.status} lesson plan for Term ${term}, Week ${week}, ${subject}.`
        : `Loaded the saved lesson plan for Term ${term}, Week ${week}, ${subject}.`);
    } else {
      openOrLoadPlan({ ...blankPlan(), term, week, learningAreas: subject }, `No existing lesson plan for Term ${term}, Week ${week}, ${subject}. A blank form is ready.`);
    }
  };

  const roleValue = String(currentUser?.role || currentUser?.userRole || currentUser?.accountType || currentUser?.userType || "").trim().toLowerCase().replace(/[ _-]+/g, "");
  const isSystemAdmin = isSystemAdminProp || currentUser?.isSystemAdmin === true || currentUser?.isAdmin === true || ["systemadmin", "admin", "administrator"].includes(roleValue);

  if (isSystemAdmin) {
    const adminSubmissions = submissions
      .filter(item => item.status === "pending" || item.status === "approved" || item.status === "returned")
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const adminPendingCount = adminSubmissions.filter(item => item.status === "pending").length;
    const adminApprovedCount = adminSubmissions.filter(item => item.status === "approved").length;
    return (
      <div className="w-full min-w-0 space-y-5 text-slate-800">
        {messageWindow}
        <header className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">System Administration</p><h1 className="text-2xl font-black text-slate-900">ILAW Lesson Plan Management</h1><p className="mt-1 text-sm text-slate-600">Manage pending and approved lesson plans, and review teacher requests to edit or delete approved plans.</p></div>
          <div className="flex flex-wrap gap-2"><span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-extrabold text-amber-800">{adminPendingCount} Pending</span><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-extrabold text-emerald-800">{adminApprovedCount} Approved</span></div>
        </header>
        {workflowMessage && <p role="status" className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">{workflowMessage}</p>}
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-3"><h2 className="font-extrabold text-slate-900">Approved Plan Edit / Delete Requests</h2><p className="mt-1 text-xs text-slate-600">Review teacher requests before changing an approved ILAW Lesson Plan. Approving Edit unlocks the existing approved submission for its teacher; no duplicate submission is created.</p></div>
          {changeRequests.filter(request => request.status === "pending").length === 0 ? <p className="p-5 text-sm text-slate-500">No edit or deletion requests are waiting for approval.</p> :
            <div className="w-full overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="border-b px-3 py-3">Request</th><th className="border-b px-3 py-3">Lesson Plan</th><th className="border-b px-3 py-3">{translate("Teacher")}</th><th className="border-b px-3 py-3">Reason</th><th className="border-b px-3 py-3">Requested</th><th className="border-b px-3 py-3">{translate("Action")}</th></tr></thead><tbody>{changeRequests.filter(request => request.status === "pending").map(request => <tr key={request.id} className="border-b border-slate-100"><td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${request.type === "edit" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>{request.type === "edit" ? "Edit request" : `Delete ${request.scope === "session" ? "session" : "whole week"}`}</span></td><td className="px-3 py-3 font-bold">{request.planTitle}{request.scope === "session" ? ` · ${request.sessionId || "session unspecified"}` : ""}</td><td className="px-3 py-3">{request.teacherName || "—"}<p className="text-xs text-slate-500">{request.teacherEmail}</p></td><td className="max-w-xs whitespace-pre-wrap px-3 py-3">{request.requestNote || "—"}</td><td className="whitespace-nowrap px-3 py-3">{new Date(request.requestedAt).toLocaleDateString()}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => reviewApprovedPlanChangeRequest(request, "approved")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-700">Approve {request.type === "edit" ? "Edit" : "Delete"}</button><button type="button" onClick={() => reviewApprovedPlanChangeRequest(request, "rejected")} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-50">Reject</button></div></td></tr>)}</tbody></table></div>}
          {changeRequests.some(request => request.status !== "pending") && <details className="border-t border-slate-100 px-4 py-3"><summary className="cursor-pointer text-sm font-bold text-slate-700">Request history ({changeRequests.filter(request => request.status !== "pending").length})</summary><div className="mt-3 space-y-2">{changeRequests.filter(request => request.status !== "pending").map(request => <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-xs"><span><strong>{request.type === "edit" ? "Edit" : "Delete"}</strong> · {request.planTitle} · {request.teacherName}</span><span className={request.status === "approved" ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>{request.status.toUpperCase()} {request.reviewerName ? `by ${request.reviewerName}` : ""}</span></div>)}</div></details>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
          <div className="border-b border-rose-100 bg-rose-50 px-4 py-3">
            <h2 className="font-extrabold text-slate-900">All Lesson Plans — System Admin</h2>
            <p className="mt-1 text-xs text-slate-600">Delete an entire lesson plan, including every session in that submission. Deletion is permanent and requires confirmation.</p>
          </div>
          {adminSubmissions.length === 0 ? <p className="p-5 text-sm text-slate-500">There are no lesson plans to manage.</p> :
            <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr><th className="border-b px-3 py-3">Term / Week</th>
                <th className="border-b px-3 py-3">Teacher</th>
                <th className="border-b px-3 py-3">Learning Area</th>
                {/* <th className="border-b px-3 py-3">Date of Instruction</th> */}
                <th className="border-b px-3 py-3">Status</th>
                <th className="border-b px-3 py-3">Action</th></tr>
                </thead><tbody>
              {adminSubmissions.map(item => 
                <tr key={`admin-plan-${item.id}`} className="border-b border-slate-100">
                  <td className="whitespace-nowrap px-3 py-3 font-semibold">Term {item.plan.term || "1"} · Week {item.plan.week || "1"}</td>
                  <td className="px-3 py-3">{item.teacherName || "—"}<p className="text-xs text-slate-500">{item.teacherEmail}</p></td>
                  <td className="px-3 py-3">{item.plan.learningAreas || "—"}</td>
                  {/* <td className="whitespace-nowrap px-3 py-3">{formatSessionInstructionDates(item.plan) || "—"}</td> */}
                  <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${item.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{item.status === "approved" ? "Approved" : item.status === "returned" ? "Returned" : "Pending"}</span><p className="mt-1 text-xs text-slate-500">{(item.plan.sessions || []).length} session(s)</p></td>
                  <td className="px-3 py-3"><button type="button" onClick={() => void deleteAdminSubmission(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-rose-700"><Trash2 size={13}/> Delete Entire Plan</button></td>
                  </tr>)}
            </tbody></table></div>}
        </section>
      </div>
    );
  }

  if (!hasStartedPlan && !isSchoolHead) {
    const totalPlansCount = teacherSubmissions.length + savedPlans.filter(draft => !teacherSubmissions.some(sub => planListIdentity(sub.plan) === planListIdentity(draft))).length;
    return (
      <div className="ilaw-print-document m-0 p-0 w-full min-w-0 max-w-none space-y-4 text-slate-800">
        {messageWindow}
        {/* Same header structure and styling as main ILAW Lesson Plan */}
        <div
          className="no-print relative z-0 box-border m-0 w-screen min-w-0 max-w-none border-b border-slate-200 bg-white p-0 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          style={{ width: "100vw", maxWidth: "100vw", marginLeft: "calc(50% - 50vw)", backgroundColor: "var(--ilaw-header-background, #ffffff)" }}
        >
          {/* Header of ILAW Lesson Plan */}
          <header className="w-full min-w-0 max-w-none border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex w-full min-w-0 flex-col items-start justify-between gap-4 px-4 py-3 sm:px-6 md:flex-row md:items-center">
              <div className="flex w-full min-w-0 items-center gap-4 md:w-auto">
                {schoolLogo ? (
                  <img src={schoolLogo} alt="School logo" className="h-9 w-9 shrink-0 object-contain" referrerPolicy="no-referrer" onError={() => setSchoolLogo("")} />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                    <BookOpen size={19} />
                  </div>
                )}
                {depEdLogo && (
                  <img src={depEdLogo} alt="DepEd logo" className="h-9 w-9 shrink-0 object-contain" referrerPolicy="no-referrer" onError={() => setDepEdLogo("")} />
                )}
                <div className="min-w-0">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                    {isFilipino ? "Lugar ng Pagpaplano ng Aralin" : "Lesson planning workspace"}
                  </p>
                  {schoolDisplayName && (
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{schoolDisplayName}</p>
                  )}
                  <h1 className="block text-left text-lg font-black leading-tight text-slate-900 dark:text-white">
                    {isFilipino ? "Banghay-Aralin ng ILAW" : "ILAW Lesson Plan"}
                  </h1>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isFilipino ? "Aking mga Isinumiteng Banghay-Aralin" : "My Lesson Plan Submissions"}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="truncate text-slate-600 dark:text-slate-400">
                      {totalPlansCount} {isFilipino ? (totalPlansCount === 1 ? "plano" : "mga plano") : (totalPlansCount === 1 ? "plan" : "plans")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="no-print flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <span>{isFilipino ? "Wika" : "Language"}</span>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value as "fil" | "en")}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="fil">Filipino</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const currentGrade = sectionGradeFilter || (selectedSections[0] ? sectionGrade(selectedSections[0]) : "");
                    setSelectedGradeLevel(currentGrade);
                    setSelectedSubject(String(plan.learningAreas || selectedSubject || ""));
                    setShowTermWeekModal(true);
                  }}
                  className="no-print inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300"
                >
                  <BookOpen size={15} /> {isFilipino ? "Pumili ng Termino at Linggo" : "Select Term and Week"}
                </button>
              </div>
            </div>
          </header>
        </div>

        <div className="w-full space-y-4 px-4 sm:px-6">
          {workflowMessage && <p role="status" className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">{workflowMessage}</p>}
          {showTermWeekModal && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="term-week-modal-title">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">ILAW Lesson Planning</p><h2 id="term-week-modal-title" className="mt-1 text-lg font-black text-slate-900">Select Term and Week</h2><p className="mt-1 text-sm text-slate-500">Choose both values to load an existing plan or start with a blank form.</p></div>
                <button type="button" onClick={() => setShowTermWeekModal(false)} aria-label="Close modal" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Term <span className="text-rose-600">*</span></span>
                  <select value={selectedTerm} onChange={e => chooseTermWeek(e.target.value, selectedWeek)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                    <option value="">Select Term</option>{[1,2,3,4].map(n => <option key={n} value={String(n)}>Term {n}</option>)}
                  </select>
                </label>
                <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-bold text-slate-700">Grade Level <span className="text-rose-600">*</span></span>
                  <select value={selectedGradeLevel} onChange={e => { setSelectedGradeLevel(e.target.value); setSelectedSubject(""); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                    <option value="">Select Grade Level</option>{termWeekGradeOptions.map(grade => <option key={grade} value={grade}>Grade {grade.replace(/^grade\s*/i, "")}</option>)}
                  </select>
                </label>
                <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-bold text-slate-700">Subject / Learning Area <span className="text-rose-600">*</span></span>
                  <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); }} disabled={!selectedGradeLevel} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50">
                    <option value="">{selectedGradeLevel ? "Select Subject" : "Select a grade level first"}</option>{termWeekSubjectOptions.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                  {selectedGradeLevel && termWeekSubjectOptions.length === 0 && <span className="mt-1 block text-xs text-amber-700">No subjects are available for this grade level.</span>}
                </label>
                <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Week Number <span className="text-rose-600">*</span></span>
                  <select value={selectedWeek} onChange={e => chooseTermWeek(selectedTerm, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                    <option value="">{translate("Select Week Number")}</option>{Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={String(n)}>{isFilipino ? `Linggo ${n}` : `Week ${n}`}</option>)}
                  </select>
                </label>
              </div>
              {workflowMessage && <p role="status" className="mx-5 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">{workflowMessage}</p>}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowTermWeekModal(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{translate("Cancel")}</button>
                {(() => {
                  const hasExistingSelectedPlan = Boolean(selectedTerm && selectedWeek && (
                    teacherSubmissions.some(item => String(item.plan.term || "1") === selectedTerm && String(item.plan.week || "1") === selectedWeek && String(item.plan.learningAreas || "").trim().toLowerCase() === selectedSubject.trim().toLowerCase()) ||
                    savedPlans.some(item => String(item.term || "1") === selectedTerm && String(item.week || "1") === selectedWeek && String(item.learningAreas || "").trim().toLowerCase() === selectedSubject.trim().toLowerCase())
                  ));
                  return <button type="button" disabled={!selectedTerm || !selectedWeek || !selectedGradeLevel || !selectedSubject} onClick={() => { chooseTermWeek(selectedTerm, selectedWeek, selectedSubject); setActiveSessionTab("session-1"); setHasStartedPlan(true); setShowTermWeekModal(false); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"><BookOpen size={17} /> {hasExistingSelectedPlan ? "View Lesson Plan" : "Create ILAW Lesson Plan"}</button>;
                })()}
              </div>
            </div>
          </div>}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3"><div><h2 className="font-extrabold text-slate-900">{isFilipino ? "Aking mga Isinumiteng Banghay-Aralin" : "My Lesson Plan Submissions"}</h2><p className="mt-0.5 text-xs text-slate-500">{translate("All your saved drafts, pending submissions, and approved lesson plans")}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{totalPlansCount} plans</span></div>
            {(teacherSubmissions.length === 0 && savedPlans.length === 0) ? <p className="p-5 text-sm text-slate-500">{isFilipino ? "Wala pang banghay-aralin. I-save ang draft o magsumite ng banghay-aralin upang makita ito rito." : "No lesson plans yet. Save a draft or submit a lesson plan to see it here."}</p> :
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] table-fixed border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="border-b px-3 py-3">{translate("Term")}</th>
                      <th className="border-b px-3 py-3">{translate("Week")}</th>
                      <th className="border-b px-3 py-3">{translate("Learning Area")}</th>
                      <th className="border-b px-3 py-3">{translate("Status")}</th>
                      <th className="border-b px-3 py-3">{translate("Action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                      {teacherSubmissions.map(item =>
                      <tr key={`submission-${item.id}`} className="border-b border-slate-100 align-top">
                        <td className="whitespace-nowrap px-3 py-3 font-semibold">Term {item.plan.term || "1"}</td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold">Week {item.plan.week || "1"}</td>
                        <td className="px-3 py-3">{item.plan.learningAreas || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${item.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{translate(item.status === "approved" ? "Approved" : "Pending")}</span></td>
                        <td className="px-3 py-3"><div className="flex min-w-[220px] flex-wrap items-center gap-1.5"><button type="button" onClick={() => openOrLoadPlan(item.plan, `${item.status === "approved" ? "Approved" : "Pending"} lesson plan opened.`)} className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-50">{translate("View Plan")}</button>{item.status === "approved" && <>{changeRequests.some(request => request.submissionId === item.id && request.teacherEmail === currentTeacherEmail && request.type === "delete" && request.status === "approved") ? <button type="button" onClick={() => executeApprovedDeleteRequest(item)} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-rose-700"><Trash2 size={12}/> Complete Approved Delete</button> : <button type="button" disabled={changeRequests.some(request => request.submissionId === item.id && request.status === "pending")} onClick={() => requestApprovedPlanChange(item, "delete")} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={12}/> Request Delete</button>}</>}{(item.status !== "approved" || item.editApproved) && <button type="button" onClick={() => deleteSubmission(item)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-bold text-rose-700"><Trash2 size={12}/> Delete</button>}</div></td>
                      </tr>)}
                      {savedPlans.filter(draft => !teacherSubmissions.some(sub => planListIdentity(sub.plan) === planListIdentity(draft))).map((item, i) =>
                      <tr key={`draft-${item.term}-${item.week}-${item.lessonTitle}-${i}`} className="border-b border-slate-100 align-top">
                        <td className="whitespace-nowrap px-3 py-3 font-semibold">Term {item.term || "1"}</td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold">Week {item.week || "1"}</td>
                        <td className="px-3 py-3">{item.learningAreas || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-3"><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-700">{translate("Draft")}</span></td>
                        <td className="px-3 py-3"><div className="flex min-w-[220px] flex-wrap items-center gap-1.5"><button type="button" onClick={() => openOrLoadPlan(item, "Draft opened.")} className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-extrabold text-indigo-700">{translate("Open Draft")}</button><button type="button" onClick={() => editSavedPlan(item)} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-2 text-xs font-bold text-amber-800"><Pencil size={12}/> Edit</button><button type="button" onClick={() => deleteSavedPlan(item)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-bold text-rose-700"><Trash2 size={12}/> Delete</button></div></td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>}
          </section>
        </div>
      </div>
    );
  }

  if (isSchoolHead) {
    const pendingSubmissions = submissions.filter(item => item.status === "pending");
    // Show each submitted session that is actually awaiting approval as its own row.
    // Approved and returned sessions are not mixed into the pending-approval queue.
    const pendingSessionEntries = pendingSubmissions.flatMap(item => {
      const sessions = Array.isArray(item.plan.sessions) ? item.plan.sessions : [];
      const submittedIds = item.submittedSessionIds;
      return sessions.map((session, index) => {
        const state = item.sessionStatuses?.[session.id];
        const alreadyApproved = state === "approved" || (item.approvedSessionIds || []).includes(session.id);
        const isSubmitted = submittedIds
          ? submittedIds.includes(session.id)
          : (state === "pending" || state === "returned" || (item.status === "pending" && !alreadyApproved));
        return { item, session, index, state, isSubmitted, alreadyApproved, learningArea: item.plan.learningAreas || "—" };
      }).filter(entry => entry.isSubmitted && !entry.alreadyApproved && entry.state !== "returned");
    });
    const pendingSessionCount = pendingSessionEntries.length;
    // Merge pending sessions from the same lesson plan into one table row when
    // their Term, Week Number, and Learning Area match. Each session keeps its
    // own View Session action and remains individually approvable.
    type PendingSessionEntry = typeof pendingSessionEntries[number];
    const pendingSessionGroups: PendingSessionEntry[][] = Array.from(pendingSessionEntries.reduce((groups, entry) => {
      const groupKey = [
        entry.item.id,
        String(entry.item.plan.term || "").trim().toLowerCase(),
        String(entry.item.plan.week || "").trim().toLowerCase(),
        String(entry.learningArea || "").trim().toLowerCase(),
      ].join("::");
      const group = groups.get(groupKey) || [];
      group.push(entry);
      groups.set(groupKey, group);
      return groups;
    }, new Map<string, PendingSessionEntry[]>()).values());
    const approveAllPendingSessions = async () => {
      if (pendingSessionCount === 0) {
        await showMessageWindow({ title: "No Pending Sessions", message: "There are no submitted pending sessions to approve.", mode: "info" });
        return;
      }
      const confirmation = await showMessageWindow({ title: "Approve All Pending Sessions", message: `This will approve ${pendingSessionCount} pending submitted session${pendingSessionCount === 1 ? "" : "s"} across all lesson plans awaiting approval. Sessions returned for revision and sessions not submitted will not be approved. This action applies approval to each eligible session. Continue?`, mode: "confirm", confirmLabel: "Approve All", danger: false });
      if (!confirmation) return;
      const now = new Date().toISOString();
      const reviewer = String(currentUser?.displayName || currentUser?.name || currentUser?.email || "School Head");
      const next = submissions.map(item => {
        if (item.status !== "pending") return item;
        const sessions = Array.isArray(item.plan.sessions) ? item.plan.sessions : [];
        const submittedIds = item.submittedSessionIds;
        const approvedIds = new Set(item.approvedSessionIds || []);
        const nextStatuses: Record<string, "pending" | "approved" | "returned"> = { ...(item.sessionStatuses || {}) };
        sessions.forEach(session => {
          const state = nextStatuses[session.id];
          const isSubmitted = submittedIds ? submittedIds.includes(session.id) : (state === "pending" || state === "returned" || (item.status === "pending" && !approvedIds.has(session.id)));
          if (isSubmitted && state !== "returned" && state !== "approved" && !approvedIds.has(session.id)) {
            nextStatuses[session.id] = "approved";
            approvedIds.add(session.id);
          }
        });
        const allSessionsApproved = sessions.length > 0 && sessions.every(session => approvedIds.has(session.id) || nextStatuses[session.id] === "approved");
        return {
          ...item,
          status: allSessionsApproved ? "approved" as const : "pending" as const,
          approvedSessionIds: Array.from(approvedIds),
          sessionStatuses: nextStatuses,
          reviewerName: reviewer,
          reviewedAt: now,
          reviewerNote: "All pending submitted sessions approved by School Head using Approve All Pending Sessions."
        };
      });
      persistSubmissions(next);
      setViewingSubmissionId(null);
      setWorkflowMessage(`Approved ${pendingSessionCount} pending session${pendingSessionCount === 1 ? "" : "s"} across all lesson plans awaiting approval.`);
      await showMessageWindow({ title: "Bulk Approval Complete", message: `${pendingSessionCount} pending session${pendingSessionCount === 1 ? " was" : "s were"} approved successfully. Sessions returned for revision and sessions not submitted were left unchanged.`, mode: "info" });
    };
    const viewingSubmission = submissions.find(item => item.id === viewingSubmissionId && item.status === "pending") || null;
    const reviewPlan = viewingSubmission?.plan;
    const columnRow = (label: string, value: React.ReactNode) => (
      <tr key={label}>
        <th className="w-1/4 border border-slate-300 bg-slate-100 px-3 py-2 text-left align-top text-xs font-extrabold text-slate-700">{label}</th>
        <td className="whitespace-pre-wrap break-words border border-slate-300 px-3 py-2 align-top text-sm text-slate-800">{value || "—"}</td>
      </tr>
    );
    return (
      <div className="w-full min-w-0 space-y-5 text-slate-800">
        {messageWindow}
        <header className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{isFilipino ? "Banghay-Aralin ng ILAW" : "ILAW Lesson Plan"}</p><h1 className="text-2xl font-black text-slate-900">{translate("School Head Approval")}</h1><p className="mt-1 text-sm text-slate-600">{translate("Each session is approved or returned independently. Approving one session does not approve or lock the other sessions in the same week.")}</p></div>
          <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1.5 text-sm font-extrabold text-amber-800">{pendingSessionCount} {isFilipino ? "Sesyon na Nakabinbin" : "Pending Sessions"}</span>
        </header>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-extrabold">{isFilipino ? "Mga Sesyong Naghihintay ng Pag-apruba" : "Lesson Plans for Approval — Pending Sessions"}</h2><p className="mt-1 text-xs text-slate-500">{isFilipino ? "Pinagsasama sa isang row ang mga sesyong magkapareho ang Term, Week Number, at Learning Area; maaari pa ring suriin nang magkakahiwalay ang bawat sesyon." : "Sessions with the same Term, Week Number, and Learning Area are grouped in one row; each session can still be reviewed separately."}</p></div><button type="button" onClick={approveAllPendingSessions} disabled={pendingSessionCount === 0} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"><CheckCircle2 size={15}/>{isFilipino ? `Aprubahan Lahat ng Nakabinbing Sesyon (${pendingSessionCount})` : `Approve All Pending Sessions (${pendingSessionCount})`}</button></div>
          {pendingSessionEntries.length === 0 ? <p className="p-6 text-sm text-slate-500">{isFilipino ? "Walang sesyong naghihintay ng pag-apruba." : "There are no sessions awaiting approval."}</p> :
            <div className="w-full overflow-x-auto"><table className="w-full min-w-[980px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">{translate("Term")}</th><th className="px-4 py-3">{translate("Week")}</th><th className="px-4 py-3">{translate("Learning Area")}</th><th className="px-4 py-3">{translate("Grade / Section")}</th><th className="px-4 py-3">{translate("Teacher")}</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">{translate("Submitted")}</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{pendingSessionGroups.map(group => { const first = group[0]; const { item, learningArea } = first; return <tr key={`${item.id}-${item.plan.term}-${item.plan.week}-${String(learningArea).toLowerCase()}`} className={viewingSubmissionId === item.id ? "bg-indigo-50/60" : "hover:bg-slate-50"}><td className="whitespace-nowrap px-4 py-3 font-semibold">{item.plan.term || "—"}</td><td className="whitespace-nowrap px-4 py-3 font-semibold">{item.plan.week || "—"}</td><td className="px-4 py-3 font-semibold">{learningArea}</td><td className="px-4 py-3">{item.plan.gradeSection || "—"}</td><td className="px-4 py-3">{item.teacherName || "—"}<p className="text-xs text-slate-500">{item.teacherEmail}</p></td><td className="px-4 py-3"><div className="space-y-2">{group.map(({ session, index }) => <div key={`${item.id}-${session.id}`} className="rounded-lg border border-slate-200 bg-white p-2"><p className="font-bold">Session {index + 1}: {session.lessonSubtitleTitle || session.title || "Untitled session"}</p><span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">{isFilipino ? "Naghihintay ng pag-apruba" : "Pending approval"}</span></div>)}</div></td><td className="whitespace-nowrap px-4 py-3">{new Date(item.submittedAt).toLocaleDateString()}</td><td className="px-4 py-3"><button type="button" onClick={() => { const firstPending = group[0]; setViewingSubmissionId(item.id); setReviewSessionIndex(firstPending.index); setReviewNote(""); setReviewCoachingNote(String(firstPending.session.coachingNotes || "")); setWorkflowMessage(""); }} className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-50"><BookOpen size={14}/>{isFilipino ? "Suriin ang mga Sesyon" : "Review Sessions"}</button><p className="mt-1 text-xs text-slate-500">{group.length} pending session{group.length === 1 ? "" : "s"}</p></td></tr>; })}</tbody></table></div>}
        </section>
        {viewingSubmission && reviewPlan && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-2 sm:p-5" role="dialog" aria-modal="true" aria-label="School Head lesson plan approval">
          <section className="max-h-[94vh] w-full max-w-7xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{isFilipino ? "Kolum na Pagtingin sa Banghay-Aralin" : "Columnar Lesson Plan View"}</p><h2 className="text-xl font-black">{getLessonProperTitle(reviewPlan) || "Untitled lesson plan"}</h2><p className="mt-1 text-sm text-slate-600">Term {reviewPlan.term || "—"} · Week {reviewPlan.week || "—"} · {reviewPlan.learningAreas || "Learning area not specified"}</p></div><button type="button" onClick={() => setViewingSubmissionId(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700">{translate("Close View")}</button></div>
          <div className="w-full overflow-x-auto p-3 sm:p-5"><table className="w-full min-w-[680px] table-fixed border-collapse"><tbody>
            {columnRow("Term", `Term ${reviewPlan.term || "—"}`)}{columnRow("Week Number", `Week ${reviewPlan.week || "—"}`)}{columnRow("Lesson Title", getLessonProperTitle(reviewPlan))}{columnRow("Learning Area/s", reviewPlan.learningAreas)}{columnRow("Grade Level and Section", reviewPlan.gradeSection)}{columnRow("Date of Instruction", formatSessionInstructionDates(reviewPlan) || "—")}{columnRow("Name of Teacher/s", reviewPlan.teacherNames || viewingSubmission.teacherName)}{columnRow("School Head / Principal", reviewPlan.schoolHeadName)}
            <tr><th colSpan={2} className="border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-sm font-extrabold text-indigo-900">Intention — Lesson Overview</th></tr>
            {columnRow("Learning Competency and Curriculum Standards", reviewPlan.competencyStandards)}{columnRow("Learner Context", reviewPlan.learnerContext)}{columnRow("AI Use Declaration", reviewPlan.aiDeclaration)}
            <tr><th colSpan={2} className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-sm font-extrabold text-emerald-900">Learning Experiences — Resources and Integration</th></tr>
            {columnRow("Learning Resources", reviewPlan.learningResources)}{columnRow("Opportunities for Integration", reviewPlan.integration)}
            <tr><th colSpan={2} className="border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-sm font-extrabold text-indigo-900">Session to Review — Full Session Content</th></tr>
            {(() => {
              const sessions = reviewPlan.sessions || [];
              const approvedIds = viewingSubmission.approvedSessionIds || [];
              const submittedIds = viewingSubmission.submittedSessionIds;
              const sessionEntries = sessions.map((session, index) => {
                const state = viewingSubmission.sessionStatuses?.[session.id];
                const isApproved = approvedIds.includes(session.id) || state === "approved";
                const isSubmitted = submittedIds ? submittedIds.includes(session.id) : (state === "pending" || state === "returned" || (viewingSubmission.status === "pending" && !isApproved));
                return { session, index, isApproved, isSubmitted };
              });
              const selectedEntry = sessionEntries.find(entry => entry.index === reviewSessionIndex && entry.isSubmitted && !entry.isApproved) || sessionEntries.find(entry => entry.isSubmitted && !entry.isApproved) || sessionEntries.find(entry => entry.isSubmitted) || sessionEntries[0];
              return sessionEntries.length > 0 ? <>
                <tr><th className="w-1/4 border border-slate-300 bg-slate-100 px-3 py-2 text-left align-top text-xs font-extrabold text-slate-700">Select Session</th><td className="border border-slate-300 px-3 py-2">
                  <div className="mt-2 flex flex-wrap gap-2">{sessionEntries.map(({ session, index, isApproved, isSubmitted }) => <button key={session.id || index} type="button" disabled={!isSubmitted} onClick={() => { setReviewSessionIndex(index); setReviewCoachingNote(String(reviewPlan.sessions?.[index]?.coachingNotes || "")); }} className={`rounded-full px-3 py-1 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-60 ${isApproved ? "bg-emerald-100 text-emerald-800" : isSubmitted ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>Session {index + 1}: {isApproved ? "Approved" : isSubmitted ? (viewingSubmission.sessionStatuses?.[session.id] === "returned" ? "Returned" : "Pending") : "Not submitted"}</button>)}</div></td></tr>
                {(() => { const session = selectedEntry.session; const index = selectedEntry.index; const isApproved = selectedEntry.isApproved; return <><tr><th colSpan={2} className={`border px-3 py-2 text-left text-sm font-extrabold ${isApproved ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>Session {index + 1} Status: {isApproved ? "Approved" : "Pending Approval"}{viewingSubmission.sessionReviewNotes?.[session.id] ? ` — Remarks: ${viewingSubmission.sessionReviewNotes[session.id]}` : ""}</th></tr>{!session.hideLessonSubtitleTitle && columnRow(`Session ${index + 1} — Lesson Subtitle Title`, session.lessonSubtitleTitle)}{columnRow(`Session ${index + 1} — Session Focus / Duration`, session.title)}{columnRow(`Session ${index + 1} — Learning Objectives`, session.objectives)}{columnRow(`Session ${index + 1} — Pre-Lesson`, session.preLesson)}{columnRow(`Session ${index + 1} — Learning Activities / Flow`, <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: /<[a-z][\s\S]*>/i.test(session.flow || "") ? assessmentHtml(session.flow || "") : flowMarkdownToHtml(session.flow || "") }} />)}{columnRow(`Session ${index + 1} — Formative Assessment`, <div className="ilaw-assessment-content" dangerouslySetInnerHTML={{ __html: assessmentHtml(session.assessment || reviewPlan.formativeAssessment || "") }} />)}{columnRow(`Session ${index + 1} — Assessment Materials (04. ASSESSMENT)`, (session.assessmentAttachments || []).length ? <div className="space-y-2">{(session.assessmentAttachments || []).map(attachment => <div key={attachment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3"><div className="min-w-0"><p className="break-all font-semibold text-slate-800">{attachment.name}</p><p className="text-xs text-slate-500">{attachment.included === false ? "Not included by teacher" : "Included in assessment"} · {attachment.type?.includes("pdf") || attachment.name.toLowerCase().endsWith(".pdf") ? "PDF" : "Word document"}</p></div><button type="button" disabled={materialsLoading} onClick={() => void previewAssessmentAttachment(attachment, viewingSubmission.teacherEmail || viewingSubmission.teacherName || materialsOwner)} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"><BookOpen size={14}/>{isFilipino ? "I-preview ang File" : "Preview File"}</button></div>)}</div> : <span className="text-sm text-slate-500">No assessment files uploaded for this session.</span>)}{columnRow(`Session ${index + 1} — Extended Learning`, session.extendedLearning || reviewPlan.extendedLearning)}{columnRow(`Session ${index + 1} — Reflection`, session.reflection || reviewPlan.reflections)}{columnRow(`Session ${index + 1} — Ways Forward`, session.waysForward)}{columnRow(`Session ${index + 1} — Instructional Coaching Notes`, session.coachingNotes)}</>; })()}
              </> : <tr><td colSpan={2} className="border border-slate-300 bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-600">No sessions found in this lesson plan.</td></tr>;
            })()}
            {columnRow("References", reviewPlan.references)}
          </tbody></table></div>
          <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
            <h3 className="font-extrabold text-slate-900">{isFilipino ? "Pag-apruba" : "Approval"}</h3>
            {(() => { const selectedSession = (reviewPlan.sessions || [])[reviewSessionIndex]; return selectedSession ? <div className="rounded-xl border border-indigo-200 bg-white p-4"><label className="block text-sm font-extrabold text-indigo-900">Instructional Coaching Notes — Session {reviewSessionIndex + 1}<span className="mt-1 block text-xs font-normal text-slate-600">These notes are written by the School Head and shared with the teacher in Section 06 — Rubric / Peer Coaching.</span><textarea value={reviewCoachingNote} onChange={e => setReviewCoachingNote(e.target.value)} rows={5} placeholder="Provide actionable coaching feedback, identify strengths and support needs, and agree on next steps." className="mt-3 w-full rounded-xl border border-indigo-200 bg-white p-3 text-sm font-normal focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"/></label><button type="button" onClick={() => saveReviewCoachingNotes(viewingSubmission, selectedSession.id, reviewCoachingNote)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"><Save size={15}/> Save Coaching Notes for Teacher</button></div> : null; })()}
            <label className="block text-sm font-bold text-slate-700">{isFilipino ? "Mga puna para sa sesyong ito (opsyonal)" : "Remarks for this session (optional)"}<textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3} placeholder="Add approval or revision remarks for this session" className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal"/></label>
            {workflowMessage && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{workflowMessage}</p>}
            {(() => { const sessions = (reviewPlan.sessions || []).map((session, index) => { const state = viewingSubmission.sessionStatuses?.[session.id]; const isApproved = (viewingSubmission.approvedSessionIds || []).includes(session.id) || state === "approved"; const submittedIds = viewingSubmission.submittedSessionIds; const isSubmitted = submittedIds ? submittedIds.includes(session.id) : (state === "pending" || state === "returned" || (viewingSubmission.status === "pending" && !isApproved)); return { session, index, isApproved, isSubmitted }; }); const selectedEntry = sessions.find(entry => entry.index === reviewSessionIndex && entry.isSubmitted && !entry.isApproved) || sessions.find(entry => entry.isSubmitted && !entry.isApproved) || sessions.find(entry => entry.isSubmitted) || sessions[0]; const currentSession = selectedEntry?.session; const sessionNumber = selectedEntry ? selectedEntry.index + 1 : 0; const hasSessionSubmission = !!currentSession && !!selectedEntry?.isSubmitted && [currentSession.title, currentSession.preLesson, currentSession.flow, currentSession.assessment, currentSession.extendedLearning, currentSession.reflection, currentSession.waysForward, currentSession.coachingNotes].some(value => String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim().length > 0); return currentSession && selectedEntry?.isApproved ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Session {sessionNumber} has already been approved. Select another submitted session to review it.</p> : currentSession && !selectedEntry?.isSubmitted ? <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-600">Session {sessionNumber} has not been submitted by the teacher. It cannot be approved yet.</p> : currentSession && hasSessionSubmission ? <><div className="flex flex-wrap gap-2"><button type="button" onClick={() => reviewSubmission(viewingSubmission, "approved", currentSession.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-700"><CheckCircle2 size={17}/> Approve Session {sessionNumber}</button><button type="button" onClick={() => reviewSubmission(viewingSubmission, "returned", currentSession.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-rose-700"><RotateCcw size={16}/> Return This Session</button></div></> : currentSession ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">Session {sessionNumber} has no submitted content. It cannot be approved until the teacher submits this session.</p> : <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">There are no sessions to review.</p>; })()}
          </div>
          </section>
        </div>}
        {assessmentPreview && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Assessment attachment preview"><section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><header className="flex items-center justify-between gap-3 border-b border-slate-200 p-4"><div className="min-w-0"><h2 className="font-extrabold text-slate-900">Assessment File Preview</h2><p className="break-all text-sm text-slate-600">{assessmentPreview.name}</p></div><button type="button" onClick={closeAssessmentPreview} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Close</button></header><div className="min-h-[60vh] flex-1 overflow-auto bg-slate-100 p-3">{assessmentPreview.type.includes("pdf") || assessmentPreview.name.toLowerCase().endsWith(".pdf") ? <iframe title={assessmentPreview.name} src={assessmentPreview.url} className="h-[70vh] w-full rounded-lg border border-slate-300 bg-white" /> : <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-center"><p className="font-bold text-slate-800">Word document ready to open or download</p><p className="mt-2 text-sm text-slate-600">Your browser may not display Word files directly. Download the file to review its contents.</p><a href={assessmentPreview.url} download={assessmentPreview.name} className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Download Word File</a></div>}</div></section></div>}
      </div>
    );
  }

  return (
    <div className="ilaw-print-document m-0 p-0 w-full min-w-0 max-w-none space-y-3 text-slate-800">
      {messageWindow}
      {/* ILAW workspace header stays below the Institutional Header and does not cover its profile menu. */}
      <div
        className="no-print relative z-0 box-border m-0 w-screen min-w-0 max-w-none border-b border-slate-200 bg-white p-0 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        style={{ width: "100vw", maxWidth: "100vw", marginLeft: "calc(50% - 50vw)", backgroundColor: "var(--ilaw-header-background, #ffffff)" }}
      >
        {/* Header of ILAW Lesson Plan */}
        <header className="w-full min-w-0 max-w-none border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex w-full min-w-0 flex-col items-start justify-between gap-4 px-4 py-3 sm:px-6 md:flex-row md:items-center">
            <div className="flex w-full min-w-0 items-center gap-4 md:w-auto">
              {schoolLogo ? <img src={schoolLogo} alt="School logo" className="h-9 w-9 shrink-0 object-contain" referrerPolicy="no-referrer" onError={() => setSchoolLogo("")} /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><BookOpen size={19} /></div>}
              {depEdLogo && <img src={depEdLogo} alt="DepEd logo" className="h-9 w-9 shrink-0 object-contain" referrerPolicy="no-referrer" onError={() => setDepEdLogo("")} />}
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">{isFilipino ? "Lugar ng Pagpaplano ng Aralin" : "Lesson planning workspace"}</p>
                {schoolDisplayName && <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{schoolDisplayName}</p>}
                <button type="button" onClick={() => { if (!approvedEditMode) { setHasStartedPlan(false); setShowTermWeekModal(false); window.scrollTo({ top: 0, behavior: "smooth" }); } }} disabled={approvedEditMode} title={translate("Go to the ILAW Lesson Plans list")} className="block text-left text-lg font-black leading-tight text-slate-900 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-default dark:text-white">{isFilipino ? "Banghay-Aralin ng ILAW" : "ILAW Lesson Plan"}</button>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Term {plan.term || "1"}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Week {plan.week || "1"}</span>
                  {plan.lessonTitle && (
                    <>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="max-w-[200px] truncate font-bold text-slate-800 dark:text-slate-200 sm:max-w-xs">{plan.lessonTitle}</span>
                    </>
                  )}
                  {plan.learningAreas && (
                    <>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="truncate text-slate-600 dark:text-slate-400">{plan.learningAreas}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="no-print flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
              {/* <button
                type="button"
                onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.assign("/"); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <ArrowLeft size={15} /> {isFilipino ? "Bumalik sa Institutional Dashboard" : "Back to Institutional Dashboard"}
              </button> */}
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <span>{isFilipino ? "Wika" : "Language"}</span>
                <select value={language} onChange={e => {
                  const nextLanguage = e.target.value as "fil" | "en";
                  const nextIsFilipino = nextLanguage === "fil";
                  setLanguage(nextLanguage);
                  // Translate only untouched sequence-generated fields. Preserve any text the teacher has edited.
                  setPlan(prev => ({
                    ...prev,
                    sessions: prev.sessions.map(session => {
                      const key = session.flowSequence || "";
                      if (!key) return session;
                      const english = FLOW_SEQUENCE_TEMPLATES[key];
                      const filipino = getFlowSequenceTemplate(key, true);
                      if (!english || !filipino) return session;
                      const oldTemplate = nextIsFilipino ? english : filipino;
                      const newTemplate = nextIsFilipino ? filipino : english;
                      const preLesson = session.preLesson === oldTemplate.preLesson ? newTemplate.preLesson : session.preLesson;
                      const flow = session.flow === oldTemplate.flow ? newTemplate.flow : session.flow;
                      const assessment = session.assessment === oldTemplate.assessment ? newTemplate.assessment : session.assessment;
                      if (flow !== session.flow) flowDraftsRef.current[session.id] = flow;
                      if (assessment !== session.assessment) assessmentDraftsRef.current[session.id] = assessment;
                      return { ...session, preLesson, flow, assessment };
                    })
                  }));
                }} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <option value="fil">Filipino</option><option value="en">English</option>
                </select>
              </label>
              {/* <button type="button" onClick={exportPlansToJson} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Download size={14}/> Export JSON</button>
              <button type="button" onClick={() => importFileRef.current?.click()} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Upload size={14}/> Import JSON</button> */}
              <input ref={importFileRef} type="file" accept=".json,application/json" className="hidden" onChange={e => void importPlansFromJson(e.target.files?.[0])}/>
              <button type="button" disabled={approvedEditMode} onClick={() => { setHasStartedPlan(false); setShowTermWeekModal(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><ArrowLeft size={15}/> {translate("Back to List")}</button>
              <button type="button" disabled={approvedEditMode} onClick={() => { setPlan(blankPlanForCurrentUser()); setSavedPlanSignature(""); setSelectedTerm(""); setSelectedWeek(""); setActiveNavigationSection("01"); setHasStartedPlan(false); setShowTermWeekModal(true); setActiveSessionTab("session-1"); setWorkflowMessage(""); setSavedMessage(""); setObjectivesApplyTargetsBySession({}); setIntentionApplyTargetsBySession({}); flowDraftsRef.current = {}; }} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300"><BookOpen size={15}/> {translate("New Plan")}</button>
              <button type="button" disabled={controlsLocked || approvedEditMode} title={controlsLocked || approvedEditMode ? translate("Approved lesson plans cannot be cleared here.") : translate("Clear the selected lesson plan")} onClick={clearSelectedLesson} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:bg-slate-800 dark:text-rose-400"><Trash2 size={14}/> {translate("Clear")}</button>
            </div>
          </div>
        </header>
      </div>

      {/* Section navigation stays in normal document flow and scrolls with the page. */}
      <nav aria-label={isFilipino ? "Navigasyon sa mga bahagi ng banghay-aralin" : "Lesson plan section navigation"} className="no-print flex w-screen max-w-none flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 shadow-sm sm:px-6 bg-slate-50 dark:bg-slate-900 dark:border-slate-700" style={{ width: "100vw", maxWidth: "100vw", marginLeft: "calc(50% - 50vw)" }}>
          <span className="mr-1 text-xs font-extrabold uppercase tracking-wide text-slate-500">{isFilipino ? "Pumunta sa:" : "Jump to:"}</span>
          {[
            { number: "01", label: isFilipino ? "Impormasyon ng Aralin" : "Lesson Information" },
            { number: "03", label: "Lesson Proper" },
            { number: "06", label: "Rubric / Peer Coaching" },
            { number: "07", label: isFilipino ? "Pag-apruba" : "Approval" },
            { number: "08", label: isFilipino ? "Mga Kagamitang Aralin" : "Lesson Materials" },
          ].map(item => (
            <button
              key={item.number}
              type="button"
              onClick={() => {
                if (item.number === "03" && !lessonInformationComplete) return;
                // Approval navigation is always available. Only individually saved
                // sessions are shown inside the Approval section.
                setActiveNavigationSection(item.number);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={item.number === "03" && !lessonInformationComplete}
              title={item.number === "03" && !lessonInformationComplete ? "Complete Lesson Information first." : undefined}
              aria-current={activeNavigationSection === item.number ? "page" : undefined}
              className={`rounded-lg border px-3 py-1.5 text-center text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                activeNavigationSection === item.number
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-indigo-200 bg-indigo-50 text-indigo-800 hover:border-indigo-400 hover:bg-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300"
              }`}
            >
              {item.label}
            </button>
          ))}
      </nav>
      {/* No spacer is needed because the section navigation is not sticky. */}
      <div className="no-print h-[0rem] sm:h-[0rem] md:h-[0rem]" aria-hidden="false" />

      {approvedEditMode && <div role="status" className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-900">System Admin authorized editing for this approved lesson plan. All lesson fields and formatting controls are enabled. Use <strong>{translate("Save Changes")}</strong> to update the existing approved submission; no reapproval is required.</div>}
      {savedMessage && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{savedMessage}</div>}
      {cloudMessage && <div role="status" className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800">{cloudMessage}</div>}
      {/* <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-900">
        {currentUser?.displayName || currentUser?.name ? <span> Current user: {currentUser.displayName || currentUser.name}.</span> : null}
        {isSchoolHead ? <span> Reviewer access is available.</span> : null}
      </div> */}

      {/* <div aria-label="ILAW section color legend" className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700">
        <span className="mr-1 text-slate-500">{isFilipino ? "Gabay sa Kulay ng ILAW:" : "ILAW color guide:"}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-sky-900"><span className="h-2.5 w-2.5 rounded-full bg-sky-600"/>{isFilipino ? "Impormasyon ng Aralin" : "Lesson Information"}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-violet-900"><span className="h-2.5 w-2.5 rounded-full bg-violet-600"/>{isFilipino ? "Intensiyon / Pagninilay" : "Intention / Reflection"}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-900"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600"/>{isFilipino ? "Lesson Proper" : "Lesson Proper"}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-900"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"/>{isFilipino ? "Coaching / Mga Susunod na Hakbang" : "Coaching / Ways Forward"}</span>
      </div> */}

      

      {section("01", "Lesson information", "Basic details for the lesson plan. Term, Week, and Learning Area/s are selected in Select Term and Week.", <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{translate("Filter by Grade Level")}</span>
            <select value={sectionGradeFilter} onChange={e => { setSectionGradeFilter(e.target.value); const allowed = sections.filter(section => !e.target.value || sectionGrade(section) === e.target.value).map(sectionLabel); const current = plan.gradeSection.split(",").map(value => value.trim()).filter(Boolean); if (current.some(value => !allowed.includes(value))) { setPlan(prev => ({ ...prev, gradeSection: current.filter(value => allowed.includes(value)).join(", "), lessonTitle: "", competencyStandards: "", objectives: "", learnerContext: "", preLesson: "", references: "", learningResources: "", integration: "", formativeAssessment: "", extendedLearning: "", reflections: "", coachingNotes: "", sessions: prev.sessions.map((_, index) => makeSession(`session-${index + 1}`)) })); setActiveSessionTab("session-1"); } }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">{translate("All grade levels")}</option>{availableSectionGrades.map(grade => <option key={grade} value={grade}>Grade {grade.replace(/^grade\s*/i, "")}</option>)}</select>
          </label>
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{translate("Filter by Subject")}</span>
            <select value={sectionSubjectFilter} onChange={e => { setSectionSubjectFilter(e.target.value); const next = sections.filter(section => (!sectionGradeFilter || sectionGrade(section) === sectionGradeFilter)); const names = next.filter(section => !e.target.value || (() => { const embedded = [section.subjects, section.assignedSubjects, section.subject, section.subjectName ? { subjectName: section.subjectName } : null].flatMap(value => !value ? [] : Array.isArray(value) ? value : typeof value === "string" ? [{ name: value }] : typeof value === "object" && (Array.isArray(value.subjects) || Array.isArray(value.assignedSubjects)) ? [...(value.subjects || []), ...(value.assignedSubjects || [])] : [value]); return embedded.some(record => subjectLabel(record).toLowerCase() === e.target.value.toLowerCase()) || assignedSubjects.some(record => { const subjectName = subjectLabel(record).toLowerCase(); const sectionId = String(record.sectionId || record.section_id || record.assignedSectionId || record.assigned_section_id || record.classSectionId || record.class_section_id || record.section?.id || record.section?.sectionId || record.section?.section_id || "").trim().toLowerCase(); const sectionName = String(record.sectionName || record.section_name || record.assignedSectionName || record.assigned_section_name || record.gradeSection || record.section?.name || record.section?.sectionName || (typeof record.section === "string" ? record.section : "")).trim().toLowerCase(); return subjectName === e.target.value.toLowerCase() && ((sectionId && [sectionKey(section), String(section.sectionId || section.section_id || "").trim().toLowerCase()].includes(sectionId)) || (sectionName && [sectionLabel(section).toLowerCase(), sectionKey(section)].includes(sectionName)) || (!sectionId && !sectionName && String(record.gradeLevel ?? record.grade ?? record.grade_level ?? "").trim() === sectionGrade(section))); }); })()).map(sectionLabel); const current = plan.gradeSection.split(",").map(value => value.trim()).filter(Boolean); if (current.some(value => !names.includes(value))) { setPlan(prev => ({ ...prev, gradeSection: current.filter(value => names.includes(value)).join(", "), lessonTitle: "", competencyStandards: "", objectives: "", learnerContext: "", preLesson: "", references: "", learningResources: "", integration: "", formativeAssessment: "", extendedLearning: "", reflections: "", coachingNotes: "", sessions: prev.sessions.map((_, index) => makeSession(`session-${index + 1}`)) })); setActiveSessionTab("session-1"); } }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">{translate("All subjects")}</option>{sectionSubjectOptions.map(subject => <option key={subject} value={subject}>{subject}</option>)}</select>
          </label>
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{translate("Grade Level and Section")}</span>
            <select multiple value={plan.gradeSection.split(",").map(value => value.trim()).filter(Boolean)} onChange={e => { const selected = Array.from(e.currentTarget.selectedOptions).map((option: HTMLOptionElement) => option.value); const nextSections = selected.join(", "); setPlan(prev => ({ ...prev, gradeSection: nextSections })); setWorkflowMessage(""); }} className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
              {filteredSectionOptions.map((section, i) => { const label = sectionLabel(section); const grade = sectionGrade(section); const display = grade && !label.toLowerCase().includes(grade.toLowerCase()) ? `Grade ${grade.replace(/^grade\s*/i, "")} - ${label}` : label; return <option key={`${sectionKey(section)}-${i}`} value={label}>{display}</option>; })}
            </select>
            <span className="mt-1 block text-xs text-slate-500">{translate("Sections are filtered by the selected grade level and subject. Select one or more sections (hold Ctrl on Windows or Command on Mac).")}</span>
            {filteredSectionOptions.length === 0 && <span className="mt-1 block text-xs font-semibold text-amber-700">{translate("No sections match these filters. Try another grade level or subject.")}</span>}
          </label>
        </div>
        <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{translate("Number of Sessions")}</span><select value={plan.noOfSessions} onChange={e => {
          const count = Math.max(1, Math.min(10, Number(e.target.value) || 1));
          const next = [...plan.sessions];
          while (next.length < count) next.push(makeSession(`session-${next.length + 1}`));
          while (next.length > count) next.pop();
          setPlan(prev => ({ ...prev, noOfSessions: String(count), sessions: next }));
          if (count === 1 || (!next.some(s => s.id === activeSessionTab) && activeSessionTab !== "reflection")) {
            setActiveSessionTab(next[0]?.id || "session-1");
          }
          setActiveWaysForwardSessionIndex(prev => Math.min(prev, Math.max(0, count - 1)));
        }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="1">{isFilipino ? "1 sesyon" : "1 session"}</option>
          <option value="2">{isFilipino ? "2 sesyon" : "2 sessions"}</option>
          <option value="3">{isFilipino ? "3 sesyon" : "3 sessions"}</option>
          <option value="4">{isFilipino ? "4 sesyon" : "4 sessions"}</option>
          <option value="5">{isFilipino ? "5 sesyon" : "5 sessions"}</option>
        </select></label>
        {field("References (books, websites, toolkits, etc.)", "references", "List references and links.", 2)}
        <div className="md:col-span-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="block text-sm font-bold text-slate-700">{isFilipino ? "Pahayag sa Paggamit ng AI" : "Declaration of AI use"}</span>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <input type="checkbox" checked={Boolean(plan.aiNotUsed)} disabled={controlsLocked} onChange={e => {
              const checked = e.target.checked;
              setPlan(prev => ({ ...prev, aiNotUsed: checked, aiDeclaration: checked ? (isFilipino ? "Ipinapahayag ko na hindi ako gumamit ng AI sa pagbuo ng araling ito." : "I declare that I did not use AI in developing this lesson.") : "" }));
            }} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm font-medium leading-relaxed text-slate-700">{isFilipino ? "Ipinapahayag ko na hindi ako gumamit ng AI sa pagbuo ng araling ito." : "I declare that I did not use AI in developing this lesson."}</span>
          </label>
          {plan.aiNotUsed ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{isFilipino ? "Napili ang pahayag: Hindi ako gumamit ng AI sa pagbuo ng araling ito." : "Declaration selected: I did not use AI in developing this lesson."}</p>
          ) : field(isFilipino ? "Kung gumamit ng AI, ilarawan kung paano ito ginamit" : "If AI was used, describe how it was used", "aiDeclaration", isFilipino ? "Ilarawan kung paano ginamit ang AI. Sumangguni sa DO 3, s. 2026, Annex A." : "Cite how AI was used. Refer to DO 3, s. 2026, Annex A.", 3)}
          <p className="text-xs text-slate-500">{isFilipino ? "Sumangguni sa DO 3, s. 2026, Annex A. Lagyan lamang ng tsek kung hindi gumamit ng AI." : "Refer to DO 3, s. 2026, Annex A. Select the checkbox only if no AI was used."}</p>
        </div>
        <div className="md:col-span-2 mt-2 flex flex-col items-end gap-2 border-t border-sky-100 pt-4">
          {!lessonInformationComplete && <p className="w-full text-xs text-amber-700">{translate("Complete Learning Area/s, Name of Teacher/s, Grade Level and Section, Number of Sessions, References, and Declaration of AI use to proceed.")}</p>}
          <button type="button" disabled={!lessonInformationComplete} onClick={async () => { const saved = await savePlan(plan); if (saved) { setActiveNavigationSection("03"); window.scrollTo({ top: 0, behavior: "smooth" }); } }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-300">{translate("Proceed to ILAW Lesson Plan")} <ArrowRight size={16}/></button>
        </div>
      </div>)}



      {false && section("02", "Intention", "Decide what learners should master, and plan around their context.", <>
        {field("Learning Competency and Curriculum Standards", "competencyStandards", "Write the applicable curriculum competency/ies and content or performance standards.", 4)}
        {field("Learning Objectives", "objectives", "List the knowledge, skills, or tasks learners should demonstrate by the end of the sessions. Make objectives observable.", 4)}
        {field("Learner Context", "learnerContext", "Describe recent performance, strengths, interests, and possible barriers to learning.", 4)}
      </>)}

      

      {section("03", "Lesson Proper", "Plan the pre-lesson activities, lesson flow, assessment, and ways forward for each session.", <>
        <div className="space-y-4">
          {/* Section 03 Session Tabs: always keep single session selected */}
          <div className="-mx-1 flex flex-wrap gap-2 border-b border-slate-200 bg-white px-1 py-2 shadow-md" role="tablist" aria-label={isFilipino ? "Mga tab ng sesyon sa paglinang ng aralin" : "Lesson Proper session tabs"}>
            {plan.sessions.map((s, i) => {
              const allowed = canOpenSessionTab(i);
              const active = activeSessionTab === s.id;
              return (
                <div key={s.id} className="inline-flex items-center gap-1.5">
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={!allowed}
                  onClick={() => {
                    if (allowed) {
                      setActiveSessionTab(s.id);
                      setWorkflowMessage("");
                    }
                  }}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Session {i + 1}{s.reflection?.trim() ? " ✓" : ""}
                </button>
                {/* {i === plan.sessions.length - 1 && <button type="button" onClick={() => { setActiveSessionTab(s.id); setWorkflowMessage(""); window.setTimeout(() => document.getElementById(`ilaw-session-reflection-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150); }} className={`rounded-xl border px-3 py-2 text-xs font-bold ${s.reflection?.trim() ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"}`} title={`Go to Reflection for Last Session`}>{translate("Reflection")}</button>} */}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2" role="tablist" aria-label="Lesson Proper categories">
            {[
              { label: isFilipino ? "Intensiyon" : "Intentions", target: "ilaw-intentions-tab" },
              { label: isFilipino ? "Karanasan sa Pagkatuto" : "Learning Experience", target: "ilaw-learning-experience-tab" },
              { label: isFilipino ? "Pagtataya" : "Assessment", target: "ilaw-assessment-tab" },
              { label: isFilipino ? "Mga Susunod na Hakbang" : "Ways Forward", target: "ilaw-ways-forward-tab" },
            ].map(tab => <button key={tab.target} type="button" role="tab" aria-selected={activeLessonProperTab === tab.label} onClick={() => setActiveLessonProperTab(tab.label)} className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${activeLessonProperTab === tab.label ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-indigo-50"}`}>{tab.label}</button>)}
            <button type="button" onClick={() => { const parts = isFilipino ? ["Intensiyon", "Karanasan sa Pagkatuto", "Pagtataya", "Mga Susunod na Hakbang"] : ["Intentions", "Learning Experience", "Assessment", "Ways Forward"]; const current = parts.findIndex(part => part === activeLessonProperTab); if (current < parts.length - 1) setActiveLessonProperTab(parts[current + 1]); }} disabled={(isFilipino ? ["Intensiyon", "Karanasan sa Pagkatuto", "Pagtataya", "Mga Susunod na Hakbang"] : ["Intentions", "Learning Experience", "Assessment", "Ways Forward"]).indexOf(activeLessonProperTab) === 3} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">{isFilipino ? "Susunod na Bahagi" : "Next Part"} <span aria-hidden="true">→</span></button>
          </div>
              <div className="mb-3 grid gap-3 rounded-lg border border-teal-200 bg-teal-50/60 p-3 sm:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-xs font-bold text-teal-900">{isFilipino ? `Petsa ng Pagsasagawa — Sesyon ${currentSessionIndex + 1}` : `Date of Instruction — Session ${currentSessionIndex + 1}`}</span><input type="date" disabled={controlsLocked} value={plan.sessions[currentSessionIndex]?.dateOfInstruction || ""} onChange={e => updateSession(plan.sessions[currentSessionIndex]?.id || "session-1", "dateOfInstruction", e.target.value)} className="w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"/><span className="mt-1 block text-[11px] text-slate-500">{isFilipino ? "Itakda ang petsa para sa sesyong ito lamang." : "Set the instruction date for this session only."}</span></label>
                <label className="block"><span className="mb-1.5 block text-xs font-bold text-teal-900">{isFilipino ? "Katayuan ng Pagsasagawa" : "Instruction Status"}</span><select disabled={controlsLocked} value={plan.sessions[currentSessionIndex]?.instructionStatus || "not-marked"} onChange={e => updateSession(plan.sessions[currentSessionIndex]?.id || "session-1", "instructionStatus", e.target.value as Session["instructionStatus"])} className="w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm"><option value="not-marked">{isFilipino ? "Hindi pa minamarkahan" : "Not marked"}</option><option value="executed">{isFilipino ? "Naipatupad" : "Executed"}</option><option value="not-executed">{isFilipino ? "Hindi naipatupad — maaaring i-carry over" : "Not executed — available for carry over"}</option></select></label>
                <label className="block"><span className="mb-1.5 block text-xs font-bold text-teal-900">{isFilipino ? "Carry Over mula sa Kasalukuyan o Nakaraang Linggo" : "Carry Over from Current or Previous Week"}</span><p className="mb-1.5 text-[11px] font-semibold text-teal-800">{isFilipino ? `Mula sa kasalukuyan o nakaraang linggo → Kasalukuyang Linggo ${selectedWeek || "—"}, Sesyon ${currentSessionIndex + 1}` : `Current or previous week → Current Week ${selectedWeek || "—"}, Current Session ${currentSessionIndex + 1}`}</p><select disabled={controlsLocked || carryOverOptions.length === 0} value="" onChange={e => { if (e.target.value) applyCarryOverSession(e.target.value); }} className="w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"><option value="">{carryOverOptions.length ? (isFilipino ? "Pumili ng hindi naipatupad na sesyon…" : "Select an unexecuted session…") : (isFilipino ? "Walang sesyong minarkahang Hindi Naipatupad sa kasalukuyan o nakaraang linggo" : "No sessions marked Not Executed in the current or previous week")}</option>{carryOverOptions.map(option => <option key={option.key} value={option.key}>{option.weekRelation === "current" ? (isFilipino ? "Kasalukuyang Linggo" : "Current Week") : (isFilipino ? "Nakaraang Linggo" : "Previous Week")} · Term {option.plan.term || "1"} · Week {option.plan.week || "1"} — Session {option.sessionIndex + 1}{option.session.lessonSubtitleTitle?.trim() ? `: ${option.session.lessonSubtitleTitle.trim()}` : option.session.title?.trim() ? `: ${option.session.title.trim()}` : ""}</option>)}</select><p className="mt-1 text-[11px] text-slate-500">{isFilipino ? `Ang nilalaman ay kokopyahin sa kasalukuyang Linggo ${selectedWeek || "—"}, Sesyon ${currentSessionIndex + 1}.` : `The selected lesson content will be copied into the current Week ${selectedWeek || "—"}, Session ${currentSessionIndex + 1}.`}</p></label>
              </div>
              {plan.sessions[currentSessionIndex]?.carryOverFrom && <p className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">{isFilipino ? "Carry over mula sa" : "Carried over from"} {plan.sessions[currentSessionIndex].carryOverFrom}</p>}

            <div id="ilaw-intentions-tab" className={`mb-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 ${(activeLessonProperTab === "Intensiyon" || activeLessonProperTab === "Intentions") ? "" : "hidden"}` }>
        <div className="mb-3 border-b border-indigo-200 pb-2">
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-indigo-900">{isFilipino ? "Intensiyon" : "Intentions"}</h4>
          <p className="mt-1 text-xs text-slate-600">{isFilipino ? "Ilagay ang kasanayang pampagkatuto at mga pamantayan ng kurikulum para sa sesyong ito. Gamitin ang mga checkbox upang ilapat ito sa mga napiling sesyon." : "Enter the learning competency and curriculum standards for this session. Use the checkboxes below to apply them to selected sessions."}</p>
        </div>
        <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-slate-700">{translate("Learning Competency and Curriculum Standards")} — {isFilipino ? `Sesyon ${currentSessionIndex + 1}` : `Session ${currentSessionIndex + 1}`}</span><textarea disabled={controlsLocked} rows={3} value={plan.sessions[currentSessionIndex]?.competencyStandards || ""} onChange={e => { const value = e.target.value; const sessionId = plan.sessions[currentSessionIndex]?.id || "session-1"; const linkedTargetIds = intentionApplyTargetsBySession[sessionId] || []; setPlan(prev => ({ ...prev, sessions: prev.sessions.map(session => session.id === sessionId || linkedTargetIds.includes(session.id) ? { ...session, competencyStandards: value } : session) })); }} placeholder={isFilipino ? "Ilagay ang kasanayang pampagkatuto at kaugnay na pamantayan ng kurikulum para sa sesyong ito." : "Enter the learning competency and relevant curriculum/content/performance standards for this session."} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
        {currentSessionIndex >= 0 && currentSessionIndex < plan.sessions.length - 1 && <div className="mt-3 rounded-lg border border-indigo-100 bg-white p-3">
          <p className="mb-2 text-xs font-bold text-indigo-900">{isFilipino ? "Ilapat ang Intensiyong ito sa mga napiling sesyon" : "Apply this Intention to selected sessions"}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {plan.sessions.map((session, index) => {
              const sourceId = plan.sessions[currentSessionIndex]?.id || plan.sessions[0]?.id || "session-1";
              if (index <= currentSessionIndex) return null;
              return <label key={session.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={(intentionApplyTargetsBySession[sourceId] || []).includes(session.id)} disabled={controlsLocked} onChange={e => {
                  const checked = e.target.checked;
                  const existing = intentionApplyTargetsBySession[sourceId] || [];
                  const nextTargets = { ...intentionApplyTargetsBySession, [sourceId]: checked ? [...existing.filter(id => id !== session.id), session.id] : existing.filter(id => id !== session.id) };
                  setIntentionApplyTargetsBySession(nextTargets);
                  setPlan(prev => {
                    const source = prev.sessions.find(item => item.id === sourceId);
                    return { ...prev, intentionApplyTargetsBySession: nextTargets, ...(checked && source ? { sessions: prev.sessions.map(item => item.id === session.id ? { ...item, competencyStandards: source.competencyStandards || "" } : item) } : {}) };
                  });
                }} className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                {isFilipino ? `Sesyon ${index + 1}` : `Session ${index + 1}`}
              </label>;
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">{isFilipino ? "Lagyan ng tsek ang mga sesyong may parehong kasanayang pampagkatuto at pamantayan ng kurikulum. Makokopya at masi-synchronize ang mga napiling sesyon habang ine-edit ang kasalukuyang sesyon." : "Check sessions that share the same learning competency and curriculum standards. Selected sessions receive these values and stay synchronized when you edit this session."}</p>
        </div>}
      </div>
      <div className={`mb-4 rounded-xl border border-teal-200 bg-teal-50/40 p-4 ${(activeLessonProperTab === "Intensiyon" || activeLessonProperTab === "Intentions") ? "" : "hidden"}`}>
        <div className="mb-3 border-b border-teal-200 pb-2">
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-teal-900">{isFilipino ? "Konteksto ng Aralin — Bawat Sesyon" : "Lesson Context — By Session"}</h4>
          <p className="mt-1 text-xs text-slate-600">{isFilipino ? "Hiwalay ito sa 02. Intensiyon. Itakda ang konteksto para sa kasalukuyang sesyon at piliin kung aling mga sesyon ang gagamit ng parehong konteksto." : "Separate from Intention. Set the context for this session and choose which other sessions should share it."}</p>
        </div>
        <label className="block"><span className="mb-1 block text-xs font-bold text-slate-700">{translate("Learner Context")} — {isFilipino ? `Sesyon ${currentSessionIndex + 1}` : `Session ${currentSessionIndex + 1}`}</span>
          <textarea disabled={controlsLocked} rows={3} value={plan.sessions[currentSessionIndex]?.learnerContext || ""} onChange={e => { const value = e.target.value; const sessionId = plan.sessions[currentSessionIndex]?.id || "session-1"; const linkedTargetIds = learnerContextApplyTargetsBySession[sessionId] || []; setPlan(prev => ({ ...prev, sessions: prev.sessions.map(session => session.id === sessionId || linkedTargetIds.includes(session.id) ? { ...session, learnerContext: value } : session) })); }} placeholder={isFilipino ? "Ilarawan ang dating kaalaman, kalakasan, pangangailangan, at posibleng hadlang sa pagkatuto ng mga mag-aaral sa sesyong ito." : "Describe the learners' prior knowledge, strengths, needs, and possible barriers relevant to this session."} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        </label>
        {currentSessionIndex >= 0 && currentSessionIndex < plan.sessions.length - 1 && <div className="mt-3 rounded-lg border border-teal-100 bg-white p-3">
          <p className="mb-2 text-xs font-bold text-teal-900">{isFilipino ? "Ilapat ang Konteksto ng Aralin sa mga napiling sesyon" : "Apply this Lesson Context to selected sessions"}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {plan.sessions.map((session, index) => {
              const sourceId = plan.sessions[currentSessionIndex]?.id || plan.sessions[0]?.id || "session-1";
              if (index <= currentSessionIndex) return null;
              return <label key={session.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={(learnerContextApplyTargetsBySession[sourceId] || []).includes(session.id)} disabled={controlsLocked} onChange={e => {
                  const checked = e.target.checked;
                  const existing = learnerContextApplyTargetsBySession[sourceId] || [];
                  const nextTargets = { ...learnerContextApplyTargetsBySession, [sourceId]: checked ? [...existing.filter(id => id !== session.id), session.id] : existing.filter(id => id !== session.id) };
                  setLearnerContextApplyTargetsBySession(nextTargets);
                  setPlan(prev => {
                    const source = prev.sessions.find(item => item.id === sourceId);
                    return { ...prev, learnerContextApplyTargetsBySession: nextTargets, ...(checked && source ? { sessions: prev.sessions.map(item => item.id === session.id ? { ...item, learnerContext: source.learnerContext || "" } : item) } : {}) };
                  });
                }} className="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500" />
                {isFilipino ? `Sesyon ${index + 1}` : `Session ${index + 1}`}
              </label>;
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">{isFilipino ? "Piliin lamang ang mga sesyong may parehong konteksto. Hiwalay ang mga pagpiling ito sa checkbox ng 02. Intensiyon." : "Select only sessions that share this context. These checkboxes are independent from the sharing choices in Intention."}</p>
        </div>}
      </div>
          <div className={`mb-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 ${(activeLessonProperTab === "Intensiyon" || activeLessonProperTab === "Intentions") ? "" : "hidden"}`}>
        <div className="mb-3 border-b border-indigo-200 pb-2">
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-indigo-900">{isFilipino ? "Mga Layunin sa Pagkatuto — Bawat Sesyon" : "Learning Objectives — By Session"}</h4>
          <p className="mt-1 text-xs text-slate-600">{isFilipino ? "Itakda ang mga layunin ng bawat sesyon bago planuhin ang mga karanasan sa pagkatuto." : "Set the objectives for each session before planning its learning experiences."}</p>
        </div>
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label={isFilipino ? "Mga tab ng sesyon ng aralin" : "Lesson session tabs"}>
          {/* {plan.sessions.map((s, i) => {
            const allowed = canOpenSessionTab(i);
            const active = activeSessionTab === s.id;
            return <div key={s.id} className="inline-flex items-center gap-1.5">
              <button type="button" role="tab" aria-selected={active} disabled={!allowed} onClick={() => { if (allowed) { setActiveSessionTab(s.id); setWorkflowMessage(""); } }} className={`rounded-xl border px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}>Session {i + 1}{s.reflection?.trim() ? " ✓" : ""}</button>
              {i === plan.sessions.length - 1 && <button type="button" onClick={() => { setActiveSessionTab(s.id); setWorkflowMessage(""); window.setTimeout(() => document.getElementById(`ilaw-session-reflection-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150); }} className={`rounded-xl border px-3 py-2 text-xs font-bold ${s.reflection?.trim() ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"}`} title={`Go to Reflection for Last Session`}>{translate("Reflection")}</button>}
            </div>;
          })} */}
        </div>
        {currentSessionIndex >= 0 && <div className={`mb-4 rounded-xl border border-teal-200 bg-teal-50/60 p-4 ${(activeLessonProperTab === "Karanasan sa Pagkatuto" || activeLessonProperTab === "Learning Experience") ? "" : "hidden"}`}>
          <h4 className="text-sm font-extrabold text-teal-900">{isFilipino ? `Mga Kagamitang Pampagkatuto — Sesyon ${currentSessionIndex + 1}` : `Uploaded Lesson Materials — Session ${currentSessionIndex + 1}`}</h4>
          <p className="mt-1 text-xs text-slate-600">{isFilipino ? "Piliin ang mga na-upload na file na gagamitin sa sesyong ito. Isasama ang mga napili sa naka-print na banghay-aralin." : "Select the uploaded files to use for this session. Selected materials will appear under this session in the lesson plan and printout."}</p>
          {(() => {
            const session = plan.sessions[currentSessionIndex];
            const currentPlanKey = `${String(plan.term || "1")}-${String(plan.week || "1")}-${String(plan.learningAreas || "").trim().toLowerCase()}-${String(plan.lessonTitle || "").trim().toLowerCase()}`;
            const sessionMaterials = lessonMaterials.filter(material => {
              const explicitlyAssigned = (session?.lessonMaterialIds || []).includes(material.id);
              const hasSessionMetadata = Boolean(material.sessionId || material.lessonPlanKey || material.learningArea);
              const metadataMatches = material.sessionId === session?.id && material.lessonPlanKey === currentPlanKey && String(material.learningArea || "").trim().toLowerCase() === String(plan.learningAreas || "").trim().toLowerCase();
              return explicitlyAssigned || (!hasSessionMetadata && metadataMatches) || metadataMatches;
            });
            return materialsLoading && lessonMaterials.length === 0 ? <p className="mt-3 text-sm text-slate-500">Loading uploaded materials…</p> : sessionMaterials.length === 0 ? <p className="mt-3 text-sm text-slate-500">No materials uploaded for this session and Learning Area. Upload files in the Lesson Materials tab for this session first.</p> : <div className="mt-3 grid gap-2 sm:grid-cols-2">{sessionMaterials.map(material => <label key={material.id} className="flex items-start gap-2 rounded-lg border border-teal-100 bg-white p-3 text-sm text-slate-700"><input type="checkbox" className="mt-0.5" disabled={controlsLocked} checked={(session?.lessonMaterialIds || []).includes(material.id)} onChange={e => { const selected = session?.lessonMaterialIds || []; const next = e.target.checked ? [...selected.filter(id => id !== material.id), material.id] : selected.filter(id => id !== material.id); updateSession(session?.id || "session-1", "lessonMaterialIds", next); }} /><span className="break-all font-medium">{material.name}<span className="mt-1 block text-xs text-slate-500">{material.type}</span></span></label>)}</div>;
          })()}
        </div>}
        {currentSessionIndex >= 0 && <div className={(activeLessonProperTab === "Intensiyon" || activeLessonProperTab === "Intentions") ? "" : "hidden"}>
          <label className="block"><span className="mb-1 block text-xs font-bold text-indigo-800">Learning Objectives — Session {currentSessionIndex + 1}</span><textarea disabled={controlsLocked} rows={4} value={plan.sessions[currentSessionIndex]?.objectives || ""} onChange={e => {
            const value = e.target.value;
            const sourceId = plan.sessions[currentSessionIndex]?.id || plan.sessions[0]?.id || "session-1";
            const linkedTargetIds = objectivesApplyTargetsBySession[sourceId] || [];
            setPlan(prev => ({ ...prev, sessions: prev.sessions.map(session => session.id === sourceId || linkedTargetIds.includes(session.id) ? ({ ...session, objectives: value }) : session) }));
          }} placeholder="Write clear, measurable learning objectives for this session. Use observable action verbs and align them with the session activities and assessment." className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm" /></label>
          {currentSessionIndex >= 0 && currentSessionIndex < plan.sessions.length - 1 && <div className="mt-3 rounded-lg border border-indigo-100 bg-white p-3">
            <p className="mb-2 text-xs font-bold text-indigo-900">{isFilipino ? "Ilapat ang mga layuning ito sa mga napiling sesyon" : "Apply these objectives to selected sessions"}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {plan.sessions.map((session, index) => {
                const currentSessionId = plan.sessions[currentSessionIndex]?.id || plan.sessions[0]?.id || "session-1";
                if (index <= currentSessionIndex) return null;
                return (
                  <label key={session.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={(objectivesApplyTargetsBySession[currentSessionId] || []).includes(session.id)}
                      disabled={controlsLocked}
                      onChange={e => {
                        const sourceId = currentSessionId;
                        const targetId = session.id;
                        const checked = e.target.checked;
                        const existing = objectivesApplyTargetsBySession[sourceId] || [];
                        const nextTargets = {
                          ...objectivesApplyTargetsBySession,
                          [sourceId]: checked ? [...existing.filter(id => id !== targetId), targetId] : existing.filter(id => id !== targetId)
                        };
                        setObjectivesApplyTargetsBySession(nextTargets);
                        setPlan(prev => {
                          const sourceObjectives = prev.sessions.find(item => item.id === sourceId)?.objectives || "";
                          return {
                            ...prev,
                            objectivesApplyTargetsBySession: nextTargets,
                            ...(checked ? { sessions: prev.sessions.map(item => item.id === targetId ? { ...item, objectives: sourceObjectives } : item) } : {})
                          };
                        });
                      }}
                      className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Session {index + 1}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">{translate("Each session has its own checkbox. Selected sessions receive these objectives now and stay synchronized when you edit the current session's objectives.")}</p>
          </div>}
        </div>}
      </div>



          {currentSessionIndex >= 0 && <div role="tabpanel" className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h4 className="font-extrabold text-indigo-900">Session {currentSessionIndex + 1}</h4><p className="text-xs text-slate-500">{isFilipino ? "Kumpletuhin ang Pagninilay ng sesyong ito upang mabuksan ang susunod na sesyon." : "Complete each session's Reflection to proceed. The last session remains accessible so you can enter its Reflection; Preview PDF unlocks when every session has a Reflection."}</p></div><span className="rounded-lg border border-indigo-200 bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-800">{currentSessionIndex + 1} of {plan.sessions.length}</span></div>
            <div className={`mb-3 border-b border-slate-200 pb-2 ${(activeLessonProperTab === "Karanasan sa Pagkatuto" || activeLessonProperTab === "Learning Experience") ? "" : "hidden"}`}>
              <h5 className="text-sm font-extrabold uppercase tracking-wide text-emerald-800">{isFilipino ? "Karanasan sa Pagkatuto" : "Learning Experience"}</h5>
            </div>
            <div className={(activeLessonProperTab === "Karanasan sa Pagkatuto" || activeLessonProperTab === "Learning Experience") ? "mb-4" : "hidden"}>
              <label className="mb-2 block"><span className="mb-1 block text-xs font-bold text-slate-600">{isFilipino ? `Pamagat ng Sesyon — Sesyon ${currentSessionIndex + 1}` : `Lesson Title — Session ${currentSessionIndex + 1}`}</span><input disabled={controlsLocked || Boolean(plan.sessions[currentSessionIndex]?.hideLessonSubtitleTitle)} value={plan.sessions[currentSessionIndex]?.lessonSubtitleTitle || ""} onChange={e => { const sourceId = plan.sessions[currentSessionIndex]?.id || "session-1"; const value = e.target.value; const linkedIds = plan.lessonSubtitleApplyTargetsBySession?.[sourceId] || []; setPlan(prev => ({ ...prev, sessions: prev.sessions.map(session => session.id === sourceId || linkedIds.includes(session.id) ? { ...session, lessonSubtitleTitle: value } : session) })); }} placeholder={isFilipino ? "Ilagay ang pamagat o subtitle (opsyonal)" : "Enter this session's lesson title"} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"/></label>
              {plan.sessions.length > 1 && <div className="mb-3 rounded-lg border border-indigo-100 bg-white p-3">
                <p className="mb-2 text-xs font-bold text-indigo-900">{isFilipino ? "Ilapat ang pamagat na ito sa mga napiling sesyon" : "Apply this Lesson Title to selected sessions"}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">{plan.sessions.map((session, index) => { const sourceId = plan.sessions[currentSessionIndex]?.id || "session-1"; if (session.id === sourceId) return null; const checked = (plan.lessonSubtitleApplyTargetsBySession?.[sourceId] || []).includes(session.id); return <label key={session.id} className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={checked} disabled={controlsLocked} onChange={e => { const targetId = session.id; const isChecked = e.target.checked; const existing = plan.lessonSubtitleApplyTargetsBySession?.[sourceId] || []; const nextTargets = { ...(plan.lessonSubtitleApplyTargetsBySession || {}), [sourceId]: isChecked ? [...existing.filter(id => id !== targetId), targetId] : existing.filter(id => id !== targetId) }; setPlan(prev => { const sourceTitle = prev.sessions.find(item => item.id === sourceId)?.lessonSubtitleTitle || ""; return { ...prev, lessonSubtitleApplyTargetsBySession: nextTargets, ...(isChecked ? { sessions: prev.sessions.map(item => item.id === targetId ? { ...item, lessonSubtitleTitle: sourceTitle } : item) } : {}) }; }); }} className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"/>Session {index + 1}</label>; })}</div>
                <p className="mt-2 text-xs text-slate-500">{isFilipino ? "Bawat sesyon ay may sariling pamagat. Lagyan ng tsek ang mga sesyong nais gumamit ng parehong pamagat; mananatiling magkakasabay ang napili habang ine-edit ang pamagat na ito." : "Each session keeps its own title unless selected. Checked sessions receive this title now and stay synchronized when you edit it."}</p>
              </div>}
              <label className="flex cursor-pointer items-start gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" disabled={controlsLocked} checked={Boolean(plan.sessions[currentSessionIndex]?.hideLessonSubtitleTitle)} onChange={e => { const sessionId = plan.sessions[currentSessionIndex]?.id || "session-1"; const checked = e.target.checked; updateSession(sessionId, "hideLessonSubtitleTitle", checked); if (checked) updateSession(sessionId, "lessonSubtitleTitle", ""); }} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"/><span>{isFilipino ? "Walang pamagat na kailangan — huwag ipakita sa School Head view" : "Title is not required"}</span></label>
            </div>
            <label className={(activeLessonProperTab === "Karanasan sa Pagkatuto" || activeLessonProperTab === "Learning Experience") ? "mb-4 block" : "hidden"}><span className="mb-1 block text-xs font-bold text-violet-800">{isFilipino ? "Pagkakasunod-sunod ng Aralin para sa Bago ang Aralin at Daloy" : "Lesson Plan Sequence for Pre-Lesson and Flow"}</span><select disabled={controlsLocked} value={plan.sessions[currentSessionIndex]?.flowSequence || ""} onChange={e => { const sessionId = plan.sessions[currentSessionIndex]?.id || plan.sessions[0]?.id || "session-1"; const key = e.target.value; const session = plan.sessions[currentSessionIndex] || plan.sessions[0]; const template = getFlowSequenceTemplate(key, isFilipino); updateSession(sessionId, "flowSequence", key); if (template) { updateSession(sessionId, "preLesson", template.preLesson); updateSession(sessionId, "flow", template.flow); updateSession(sessionId, "assessment", template.assessment); flowDraftsRef.current[sessionId] = template.flow; } }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">{isFilipino ? "Pumili ng pagkakasunod-sunod ng aralin…" : "Select a lesson sequence…"}</option>{Object.entries(FLOW_SEQUENCE_TEMPLATES).map(([key, template]) => <option key={key} value={key}>{getFlowSequenceTemplate(key, isFilipino)?.label || template.label}</option>)}</select><p className="mt-1 text-xs text-slate-500">{isFilipino ? "Kapag pumili ng pagkakasunod-sunod, awtomatikong mapupunan ang Bago ang Aralin, Daloy, at Pagtatayang Formative sa 04. Pagtataya. Maaari mong i-edit ang nabuong teksto." : "Selecting a sequence automatically fills Pre-Lesson, Flow, and the Formative Assessment text in Assessment. You can edit the generated text to fit your lesson."}</p></label>
            <label className={(activeLessonProperTab === "Karanasan sa Pagkatuto" || activeLessonProperTab === "Learning Experience") ? "mb-4 block" : "hidden"}><span className="mb-1 block text-xs font-bold text-violet-800">{isFilipino ? `Mga Gawain Bago ang Aralin — Sesyon ${currentSessionIndex + 1}` : `Pre-Lesson activities for Session ${currentSessionIndex + 1}`}</span><textarea disabled={controlsLocked} rows={5} value={plan.sessions[currentSessionIndex]?.preLesson || ""} onChange={e => updateSession(plan.sessions[currentSessionIndex]?.id || "session-1", "preLesson", e.target.value)} placeholder={isFilipino ? "Ihanda ang mga mag-aaral, buhayin ang dating kaalaman, linawin ang mga layunin, at suriin ang kahandaan para sa sesyong ito." : "Prepare learners, activate prior knowledge, clarify objectives, and check readiness for this session."} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
<label className={(activeLessonProperTab === "Karanasan sa Pagkatuto" || activeLessonProperTab === "Learning Experience") ? "mb-4 block" : "hidden"}><span className="mb-1 block text-xs font-bold text-slate-600">{isFilipino ? "Pokus / tagal ng sesyon" : "Session focus / duration"}</span><input disabled={controlsLocked} value={plan.sessions[currentSessionIndex]?.title || ""} onChange={e => updateSession(plan.sessions[currentSessionIndex]?.id || "session-1", "title", e.target.value)} placeholder={isFilipino ? "hal. Gabay na paggalugad — 45 minuto" : "e.g. Guided exploration — 45 minutes"} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"/></label>
            <div className={(activeLessonProperTab === "Karanasan sa Pagkatuto" || activeLessonProperTab === "Learning Experience") ? "mb-4 block" : "hidden"}>
              <label htmlFor="ilaw-session-flow" className="mb-1 block text-xs font-bold text-slate-600">{isFilipino ? "Daloy ng Aralin" : "Flow"}</label>
              <textarea
                id="ilaw-session-flow"
                disabled={controlsLocked}
                rows={12}
                value={(() => {
                  const currentSession = plan.sessions[currentSessionIndex] || plan.sessions[0];
                  const raw = currentSession?.flow || "";
                  return /<[a-z][\s\S]*>/i.test(raw) ? flowHtmlToText(raw) : raw;
                })()}
                onChange={e => {
                  const currentSession = plan.sessions[currentSessionIndex] || plan.sessions[0];
                  const sessionId = currentSession?.id || "session-1";
                  const value = e.target.value;
                  flowDraftsRef.current[sessionId] = value;
                  updateSession(sessionId, "flow", value);
                }}
                placeholder={isFilipino ? "Pumili sa itaas ng pagkakasunod-sunod upang awtomatikong maglagay ng mungkahing daloy, o isulat ang sarili mong mga hakbang. Gumamit ng bagong linya sa bawat gawain." : "Select a lesson sequence above to automatically add a suggested Flow, or write your own steps. Use a new line for each activity."}
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              />
            </div>
            <div className={(activeLessonProperTab === "Pagtataya" || activeLessonProperTab === "Assessment") ? "mt-5 rounded-xl border border-sky-200 bg-sky-50/50 p-4" : "hidden"}>
              <h5 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-sky-900">{isFilipino ? `04. Pagtataya — Sesyon ${currentSessionIndex + 1}` : `Assessment — Session ${currentSessionIndex + 1}`}</h5>
              <label id="ilaw-assessment-tab" className="block"><span className="mb-1 block text-xs font-bold text-slate-700">{isFilipino ? "Pagtatayang Formative" : "Formative Assessment"}</span><textarea disabled={controlsLocked} rows={5} value={plan.sessions[currentSessionIndex].assessment || ""} onChange={e => updateSession(plan.sessions[currentSessionIndex].id, "assessment", e.target.value)} placeholder={translate("Questions, observation notes, exit tickets, success criteria, or evidence of learning for this session.")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
              <div className="mt-4 rounded-lg border border-sky-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-sm font-bold text-slate-800">{isFilipino ? "Mga Kalakip ng Pagtataya" : "Assessment Attachments"}</p><p className="mt-1 text-xs text-slate-500">{isFilipino ? "Mag-upload ng rubric o gabay sa pagmamarka bilang PDF o Word file para sa sesyong ito." : "Upload a rubric, scoring guide, or other assessment file (PDF or Word) for this session only."}</p></div>
                  <input ref={assessmentAttachmentInputRef} type="file" multiple accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={e => void uploadAssessmentAttachments(e.target.files)} />
                  <button type="button" disabled={controlsLocked || materialsLoading} onClick={() => assessmentAttachmentInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-3 py-2 text-sm font-bold text-white hover:bg-sky-800 disabled:opacity-50"><Upload size={15}/>{isFilipino ? "Mag-upload ng File" : "Upload File"}</button>
                </div>
                {(plan.sessions[currentSessionIndex].assessmentAttachments || []).length > 0 && <ul className="mt-3 space-y-2">{(plan.sessions[currentSessionIndex].assessmentAttachments || []).map(attachment => <li key={attachment.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${attachment.included === false ? "border-slate-200 bg-slate-50 opacity-75" : "border-sky-200 bg-white"}`}><div className="flex min-w-0 flex-1 flex-wrap items-center gap-3"><div className="flex flex-wrap items-center gap-3"><label className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" disabled={controlsLocked || materialsLoading} checked={attachment.included !== false} onChange={e => { const included = e.target.checked; const sessionId = plan.sessions[currentSessionIndex].id; setPlan(prev => ({ ...prev, sessions: prev.sessions.map(session => session.id === sessionId ? { ...session, assessmentAttachments: (session.assessmentAttachments || []).map(item => item.id === attachment.id ? { ...item, included } : item) } : session) })); }} className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600" />{attachment.included === false ? (isFilipino ? "Hindi kasama" : "Not included") : (isFilipino ? "Isama" : "Include")}</label></div><span className={`break-all ${attachment.included === false ? "text-slate-500 line-through" : "text-slate-700"}`}>{attachment.name}<span className="ml-2 text-xs text-slate-500">{attachment.type.includes("pdf") || attachment.name.toLowerCase().endsWith(".pdf") ? "PDF" : "Word"}</span></span></div><div className="flex gap-2"><button type="button" disabled={materialsLoading} onClick={() => { const material = lessonMaterials.find(item => item.id === attachment.id) || ({ ...attachment, owner: materialsOwner, uploadedAt: "", lessonPlanKey: "", sessionId: plan.sessions[currentSessionIndex].id, learningArea: plan.learningAreas } as StoredLessonMaterial); void downloadLessonMaterial(material); }} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"><Download size={13}/>{isFilipino ? "I-download" : "Download"}</button><button type="button" disabled={materialsLoading} title={isFilipino ? "Permanenteng burahin mula sa Google Drive" : "Permanently delete from Google Drive"} onClick={() => void deleteAssessmentAttachment(attachment, plan.sessions[currentSessionIndex].id)} className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"><Trash2 size={13}/>{isFilipino ? "Burahin" : "Delete"}</button></div></li>)}</ul>}
                {materialsMessage && <p role="status" className="mt-2 text-xs text-sky-800">{materialsMessage}</p>}
              </div>
            </div>
            <div className={(activeLessonProperTab === "Karanasan sa Pagkatuto" || activeLessonProperTab === "Learning Experience") ? "mt-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4" : "hidden"}>
          <div className="mb-3 border-b border-emerald-200 pb-2"><h4 className="text-sm font-extrabold uppercase tracking-wide text-emerald-800">{isFilipino ? "Kagamitang Pampagkatuto at mga Pagkakataon para sa Integrasyon" : "Learning Resources and Opportunities for Integration"}</h4><p className="mt-1 text-xs text-slate-600">{isFilipino ? "Ilagay dito ang mga kagamitang gagamitin at mga ugnayan sa ibang asignatura o paksa." : "Enter the materials learners will use and meaningful links to other learning areas or topics."}</p></div>
          {field("Learning Resources", "learningResources", "List available, inclusive materials and alternatives for emergencies or limited connectivity.", 3)}
          {field("Opportunities for integration", "integration", "Meaningful links to another learning area, special topic, or technology; write N/A if none.", 3)}
        </div>
            <div id="ilaw-ways-forward-tab" className={(activeLessonProperTab === "Mga Susunod na Hakbang" || activeLessonProperTab === "Ways Forward") ? "mt-5 rounded-xl border border-amber-200 bg-amber-50/50 p-4" : "hidden"}>
              <h5 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-amber-900">{isFilipino ? `Mga Susunod na Hakbang — Sesyon ${currentSessionIndex + 1}` : `Ways Forward — Session ${currentSessionIndex + 1}`}</h5>
              <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-slate-700">{isFilipino ? "Mga Susunod na Hakbang" : "Ways Forward / Next Steps"}</span><textarea disabled={controlsLocked} rows={4} value={plan.sessions[currentSessionIndex].waysForward || ""} onChange={e => updateSession(plan.sessions[currentSessionIndex].id, "waysForward", e.target.value)} placeholder={translate("Plan reteaching, enrichment, learner support, referrals, or adjustments based on the assessment.")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
              <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-slate-700">{isFilipino ? "Mga Pagkakataon para sa Pinalawak na Pagkatuto" : "Extended Learning Opportunities"}</span><textarea disabled={controlsLocked} rows={3} value={plan.sessions[currentSessionIndex].extendedLearning || ""} onChange={e => updateSession(plan.sessions[currentSessionIndex].id, "extendedLearning", e.target.value)} placeholder={translate("Practice, enrichment, or support beyond this session.")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold text-violet-800">{isFilipino ? "Pagninilay (kinakailangan upang magpatuloy)" : "Reflection (required to proceed)"}</span><textarea id={`ilaw-session-reflection-${plan.sessions[currentSessionIndex].id}`} disabled={controlsLocked} rows={3} value={plan.sessions[currentSessionIndex].reflection || ""} onChange={e => { updateSession(plan.sessions[currentSessionIndex].id, "reflection", e.target.value); setWorkflowMessage(""); }} placeholder={translate("What did learners understand? What needs reteaching or adjusting?")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-3">
              <div>
                <p className="text-sm font-extrabold text-emerald-900">{isFilipino ? `I-save ang Sesyon ${currentSessionIndex + 1}` : `Save Session ${currentSessionIndex + 1}`}</p>
                <p className="mt-0.5 text-xs text-slate-500">{isFilipino ? "Sine-save ang buong banghay-aralin kasama ang lahat ng sesyon." : "Saves the complete lesson plan, including all sessions and this session's latest entries."}</p>
              </div>
              <button type="button" onClick={() => void savePlan()} disabled={approvedEditMode && !approvedEditSubmissionId} title={approvedEditMode ? "Save approved-plan edits to the existing submission" : `Save the lesson plan from Session ${currentSessionIndex + 1}`} className="no-print inline-flex items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-300"><Save size={16}/> {approvedEditMode ? "Save Changes" : `Save Session ${currentSessionIndex + 1}`}</button>
            </div>
            {workflowMessage && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{workflowMessage}</p>}
            <div className="mt-4 flex justify-start gap-2"><button type="button" disabled={currentSessionIndex === 0} onClick={() => setActiveSessionTab(plan.sessions[currentSessionIndex - 1].id)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-40">{isFilipino ? "← Nakaraang Sesyon" : "← Previous Session"}</button></div>
          </div>}
        </div>
        <div className="mt-5 flex flex-col items-end gap-2 border-t border-slate-200 pt-4">
          {!lessonPlanComplete && <p className="w-full text-xs text-amber-700">{translate("Complete Lesson Information and add at least one session before proceeding to Approval. Reflections are optional.")}</p>}
          {lessonPlanComplete && !currentPlanIsSaved && <p className="w-full text-xs text-amber-700">{translate("The lesson plan is complete but has unsaved changes. Save the completed plan to enable Approval.")}</p>}
          <div className="flex w-full justify-end pt-1">
            <button type="button" onClick={() => { const parts = isFilipino ? ["Intensiyon", "Karanasan sa Pagkatuto", "Pagtataya", "Mga Susunod na Hakbang"] : ["Intentions", "Learning Experience", "Assessment", "Ways Forward"]; const current = parts.findIndex(part => part === activeLessonProperTab); if (current < parts.length - 1) { setActiveLessonProperTab(parts[current + 1]); document.getElementById(["ilaw-intentions-tab", "ilaw-learning-experience-tab", "ilaw-assessment-tab", "ilaw-ways-forward-tab"][current + 1])?.scrollIntoView({ behavior: "smooth", block: "start" }); } }} disabled={(isFilipino ? ["Intensiyon", "Karanasan sa Pagkatuto", "Pagtataya", "Mga Susunod na Hakbang"] : ["Intentions", "Learning Experience", "Assessment", "Ways Forward"]).indexOf(activeLessonProperTab) === 3} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">{isFilipino ? "Susunod na Bahagi" : "Next Part"} <span aria-hidden="true">→</span></button>
          </div>
        </div>
      </>) }

      {false && section("04", isFilipino ? "Pagtataya" : "Assessment", "Formative Assessment", <>
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
          <h4 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-sky-900">{translate("04 · Assessment")}</h4>
          <p className="mb-4 text-xs text-slate-600">{translate("Record the formative assessment for each session. Use the editor toolbar to format responses and insert tables.")}</p>
          {field("Formative Assessment — Overall", "formativeAssessment", "Describe the formative assessment approach, evidence of learning, and success criteria.", 4)}
        </div>
        <div className="space-y-4">
          {plan.sessions.map((session, index) => <div key={session.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 font-extrabold text-sky-900">Session {index + 1}{session.title ? ` — ${session.title}` : ""}</h4>
            <label className="mb-2 block"><span className="mb-1 block text-sm font-bold text-slate-700">{isFilipino ? "Pagtatayang Formative" : "Formative Assessment"}</span><textarea disabled={controlsLocked} rows={5} value={session.assessment || ""} onChange={e => updateSession(session.id, "assessment", e.target.value)} placeholder={isFilipino ? "Mga tanong, tala ng obserbasyon, exit ticket, pamantayan ng tagumpay, o ebidensiya ng pagkatuto..." : "Questions, observation notes, exit tickets, success criteria, or learner evidence..."} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" /></label>
          </div>)}
        </div>
      </>)}

      {section("06", "RUBRIC FOR LESSON PLANNING SELF-CHECK AND/OR PEER COACHING", "Use this rubric before submitting the lesson plan or during peer coaching.", <>
        <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="mb-3 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><ClipboardCheck size={17}/></span><div><h3 className="font-extrabold text-indigo-900">{isFilipino ? "Mga Tala para sa Instructional Coaching" : "Instructional Coaching Notes"}</h3><p className="text-xs text-slate-600">{isFilipino ? "Isinusulat ng School Head ang mga tala sa pagsusuri at makikita ito ng guro rito matapos ma-save at mag-sync." : "Written by the School Head in the review panel. Saved notes are shared here with the teacher after syncing."}</p></div></div>
          <div className="space-y-4">
            {plan.sessions.map((session, index) => <label key={session.id} className="block rounded-lg border border-indigo-100 bg-white p-3"><span className="mb-1 block text-sm font-bold text-indigo-900">{isFilipino ? "Sesyon" : "Session"} {index + 1}{session.lessonSubtitleTitle ? ` — ${session.lessonSubtitleTitle}` : ""}</span><textarea disabled readOnly rows={4} value={session.coachingNotes || ""} placeholder={isFilipino ? "Lalabas dito ang tala ng School Head matapos itong i-save sa pagsusuri." : "School Head coaching notes will appear here after they are saved in the review panel."} className="w-full rounded-lg border border-indigo-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed" /></label>)}
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ClipboardCheck size={17}/></span><div><h3 className="font-extrabold">{isFilipino ? "Lesson Planning Self-Check / Peer Coaching" : "Lesson Planning Self-Check / Peer Coaching"}</h3><p className="text-xs text-slate-500">{isFilipino ? "Gamitin bago isumite o talakayin ang banghay-aralin." : "Use this checklist before submitting the plan or discussing it with a peer coach."}</p></div></div>
          {[
            "Intentions and appropriate learning competencies are clearly stated.",
            "Intentions are evident across all sections; the plan is coherent.",
            "Another teacher can implement the learning experience without additional explanation.",
            "Learning Design Principles are intentionally embedded.",
            "Meaningful integration opportunities are maximized.",
            "The plan supports learners with disabilities, barriers, and varied contexts.",
            "Assessment strategies are integrated throughout the session.",
            "Assessment produces evidence of whether learning was successful.",
            "Interventions and next steps are actionable and informed by reflection."
          ].map((item, i) => {
            const translatedItem = isFilipino ? ({ "Intentions and appropriate learning competencies are clearly stated.": "Malinaw na nakasaad ang mga layunin at angkop na kasanayang pampagkatuto.", "Intentions are evident across all sections; the plan is coherent.": "Makikita ang mga layunin sa lahat ng bahagi; magkakaugnay ang banghay-aralin.", "Another teacher can implement the learning experience without additional explanation.": "Maaaring maisagawa ng ibang guro ang karanasan sa pagkatuto nang walang karagdagang paliwanag.", "Learning Design Principles are intentionally embedded.": "Sadyang isinama ang mga Prinsipyo ng Disenyo ng Pagkatuto.", "Meaningful integration opportunities are maximized.": "Napakinabangan ang mga makabuluhang pagkakataon para sa integrasyon.", "The plan supports learners with disabilities, barriers, and varied contexts.": "Sinusuportahan ng banghay-aralin ang mga mag-aaral na may kapansanan, hadlang sa pagkatuto, at magkakaibang konteksto.", "Assessment strategies are integrated throughout the session.": "Isinama ang mga estratehiya sa pagtataya sa buong sesyon.", "Assessment produces evidence of whether learning was successful.": "Nagbibigay ang pagtataya ng ebidensiya kung naging matagumpay ang pagkatuto.", "Interventions and next steps are actionable and informed by reflection.": "Maisasagawa ang mga interbensiyon at susunod na hakbang at nakabatay sa pagninilay." } as Record<string, string>)[item] || item : item;
            const saved = plan.selfCheckItems?.[String(i)] || { status: "not-yet" as const, note: "" };
            return <SelfCheckRow key={item} item={translatedItem} index={i} isFilipino={isFilipino} status={saved.status} note={saved.note} onChange={(field, value) => setPlan(prev => ({ ...prev, selfCheckItems: { ...(prev.selfCheckItems || {}), [String(i)]: { ...(prev.selfCheckItems?.[String(i)] || { status: "not-yet", note: "" }), [field]: value } } }))}/>;
          })}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-100 pt-4">
            <p className="text-xs text-slate-500">{translate("Save this checklist separately. It remains editable and can be saved even after the lesson plan is approved.")}</p>
            <button type="button" onClick={() => void saveSelfCheck()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700"><Save size={15}/> {translate("Save Self-Check / Peer Coaching")}</button>
          </div>
        </div>
      </>)}

      {false && section("05", isFilipino ? "Mga Susunod na Hakbang" : "Ways Forward", isFilipino ? "Itala ang mga susunod na hakbang para sa bawat sesyon." : "Record actionable next steps for each session, including reteaching, enrichment, and learner support.", <>
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <h4 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-amber-900">{isFilipino ? "05 · Mga Susunod na Hakbang" : "05 · Ways Forward"}</h4>
          <p className="text-xs text-slate-600">{translate("Complete the next steps for each session. These entries are saved with the corresponding session and included in the lesson plan printout.")}</p>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Ways Forward session tabs">
            {plan.sessions.map((session, index) => {
              const active = Math.min(activeWaysForwardSessionIndex, Math.max(0, plan.sessions.length - 1)) === index;
              const complete = Boolean(session.waysForward?.trim());
              return <button key={session.id} type="button" role="tab" aria-selected={active} onClick={() => setActiveWaysForwardSessionIndex(index)} className={`rounded-xl border px-4 py-2 text-sm font-bold ${active ? "border-amber-600 bg-amber-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}>Session {index + 1}{complete ? " ✓" : ""}</button>;
            })}
          </div>
          {(() => {
            const index = Math.min(activeWaysForwardSessionIndex, Math.max(0, plan.sessions.length - 1));
            const session = plan.sessions[index];
            if (!session) return null;
            return <div key={session.id} role="tabpanel" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2"><h4 className="font-extrabold text-amber-900">Session {index + 1}{session.title ? ` — ${session.title}` : ""}</h4><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${session.waysForward?.trim() ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{session.waysForward?.trim() ? "Completed" : "Needs entry"}</span></div>
              <label className="block"><span className="mb-1 block text-xs font-bold text-amber-800">{isFilipino ? `Mga Susunod na Hakbang para sa Sesyon ${index + 1}` : `Ways Forward for Session ${index + 1}`}</span><textarea disabled={controlsLocked} rows={4} value={session.waysForward || ""} onChange={e => updateSession(session.id, "waysForward", e.target.value)} placeholder={translate("Next steps: reteaching, enrichment, learner support, referrals, or adjustments for the next lesson...")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"/></label>
              <label className="mt-3 block"><span className="mb-1 block text-xs font-bold text-amber-800">{translate("Extended learning opportunities")}</span><textarea disabled={controlsLocked} rows={3} value={session.extendedLearning || ""} onChange={e => updateSession(session.id, "extendedLearning", e.target.value)} placeholder={translate("Practice, enrichment, or support beyond this session...")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
              <label className="mt-3 block"><span className="mb-1 block text-xs font-bold text-violet-800">{translate("Reflections (required to proceed)")}</span><textarea disabled={controlsLocked} rows={3} value={session.reflection || ""} onChange={e => { updateSession(session.id, "reflection", e.target.value); setWorkflowMessage(""); }} placeholder={translate("What did learners understand? What needs reteaching or adjusting?")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
              <div className="mt-4 flex justify-between gap-2"><button type="button" disabled={index === 0} onClick={() => setActiveWaysForwardSessionIndex(index - 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-40">{isFilipino ? "← Nakaraang Sesyon" : "← Previous Session"}</button><button type="button" disabled={index >= plan.sessions.length - 1} onClick={() => setActiveWaysForwardSessionIndex(index + 1)} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{isFilipino ? "Susunod na Sesyon →" : "Next Session →"}</button></div>
            </div>;
          })()}
        </div>
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
          <h4 className="mb-2 font-extrabold text-violet-900">{translate("Overall Reflections")}</h4>
          {field("Reflections", "reflections", "After teaching all sessions: what changed in learner understanding? What should be adjusted, extended, or shared?", 5)}
        </div>
      </>)}

      {activeNavigationSection === "08" && <section className="no-print rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 className="text-lg font-extrabold text-slate-900">{isFilipino ? "Mga Kagamitang Aralin" : "Lesson Materials"}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">{isFilipino ? "Pumili ng sesyon upang mag-upload ng mga kagamitang para lamang sa sesyon at Learning Area na ito." : "Choose a session before uploading. Each file is associated with this lesson plan, session, and Learning Area only."}{firestoreUserEmail && <span className="mt-1 block font-semibold text-slate-700">Signed-in user: {firestoreUserEmail}</span>}</p>
          </div>
          <div className="flex flex-wrap gap-2"><input ref={materialsInputRef} type="file" multiple className="hidden" onChange={e => void uploadLessonMaterials(e.target.files)} /><button type="button" onClick={() => materialsInputRef.current?.click()} disabled={materialsLoading || !plan.sessions.length} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"><Upload size={16}/>{isFilipino ? "Mag-upload sa Sesyong Ito" : "Upload to This Session"}</button><button type="button" onClick={() => void refreshLessonMaterials()} disabled={materialsLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><RotateCcw size={15}/>Refresh</button></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Lesson material sessions">
          {plan.sessions.map((session, index) => <button key={session.id} type="button" role="tab" aria-selected={activeMaterialsSessionIndex === index} onClick={() => setActiveMaterialsSessionIndex(index)} className={`rounded-xl border px-4 py-2 text-sm font-bold ${activeMaterialsSessionIndex === index ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-teal-50"}`}>Session {index + 1}</button>)}
        </div>
        {(() => {
          const session = plan.sessions[activeMaterialsSessionIndex] || plan.sessions[0];
          const planKey = `${String(plan.term || "1")}-${String(plan.week || "1")}-${String(plan.learningAreas || "").trim().toLowerCase()}-${String(plan.lessonTitle || "").trim().toLowerCase()}`;
          const sessionMaterials = lessonMaterials.filter(material => {
            const explicitlyAssigned = (session?.lessonMaterialIds || []).includes(material.id);
            const metadataMatches = material.sessionId === session?.id && material.lessonPlanKey === planKey && String(material.learningArea || "").trim().toLowerCase() === String(plan.learningAreas || "").trim().toLowerCase();
            // The saved session assignment is authoritative when an Apps Script
            // list response omits the optional metadata fields.
            return explicitlyAssigned || metadataMatches;
          });
          return <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/40 p-4" role="tabpanel">
            <div className="mb-3"><h3 className="font-extrabold text-teal-950">Session {activeMaterialsSessionIndex + 1}{session?.lessonSubtitleTitle ? ` — ${session.lessonSubtitleTitle}` : session?.title ? ` — ${session.title}` : ""}</h3><p className="mt-1 text-sm text-slate-600">Learning Area: <span className="font-bold">{plan.learningAreas || "Not selected"}</span> · Term {plan.term || "1"} · Week {plan.week || "1"}</p></div>
            {materialsMessage && <p role="status" className="mb-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{materialsMessage}</p>}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">File name</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Uploaded</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{materialsLoading && lessonMaterials.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Loading saved materials…</td></tr> : sessionMaterials.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No materials uploaded for this session and Learning Area yet. Select “Upload to This Session” to add files.</td></tr> : sessionMaterials.map(material => <tr key={material.id}><td className="px-4 py-3"><div className="flex items-center gap-2 font-semibold text-slate-800"><BookOpen size={16} className="shrink-0 text-teal-700"/><span className="break-all">{material.name}</span></div><p className="mt-1 text-xs text-slate-500">{material.type}</p></td><td className="px-4 py-3 whitespace-nowrap">{material.size < 1024 * 1024 ? `${Math.max(1, Math.round(material.size / 1024))} KB` : `${(material.size / (1024 * 1024)).toFixed(2)} MB`}</td><td className="px-4 py-3 whitespace-nowrap">{new Date(material.uploadedAt).toLocaleDateString()}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => void downloadLessonMaterial(material)} className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-50"><Download size={14}/>Download</button><button type="button" onClick={() => void removeLessonMaterial(material)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"><Trash2 size={14}/>Delete</button></div></td></tr>)}</tbody></table></div>
          </div>;
        })()}
        <p className="mt-3 text-xs leading-5 text-slate-500">Files are filtered by the selected session, lesson plan (term/week/title), and Learning Area. The Google Apps Script upload/list endpoint must preserve these metadata fields for the association to remain available after refresh.</p>
      </section>}

      {activeNavigationSection === "07" && <section data-ilaw-submission className="no-print rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-sky-950">{isFilipino ? `Mga Sesyon para sa Term ${plan.term || "1"}, Linggo ${plan.week || "1"}` : `Sessions for Term ${plan.term || "1"}, Week ${plan.week || "1"}`}</h3>
              <p className="mt-1 text-xs text-slate-600">{isFilipino ? "Bawat sesyon ay may sariling button para isumite ito nang hiwalay para sa pag-apruba." : "Each session has its own button to submit it separately for approval."}</p>
            </div>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-extrabold text-sky-900">{plan.sessions.filter(session => (plan.savedSessionIds || []).includes(session.id)).length} {isFilipino ? "Naka-save na Sesyon" : "Saved Sessions"}</span>
          </div>
          <div className="mt-3 space-y-2">
            {plan.sessions.filter(session => (plan.savedSessionIds || []).includes(session.id)).length === 0
              ? <p className="rounded-lg border border-sky-100 bg-white p-3 text-sm text-slate-500">{isFilipino ? "Wala pang naka-save na sesyon para sa pag-apruba. Piliin ang sesyon at i-click ang I-save ang Sesyon upang lumabas ito rito." : "No saved sessions are available for approval yet. Select a session and click Save Session for it to appear here."}</p>
              : plan.sessions.filter(session => (plan.savedSessionIds || []).includes(session.id)).map(session => {
              const sessionIndex = plan.sessions.findIndex(item => item.id === session.id);
              const email = String(currentUser?.email || "").trim().toLowerCase();
              const relatedSubmission = submissions.find(item => item.teacherEmail === email && planListIdentity(item.plan) === planListIdentity(plan) && String(item.plan.lessonTitle || "").trim() === String(plan.lessonTitle || "").trim());
              const explicitStatus = relatedSubmission?.sessionStatuses?.[session.id];
              const isApproved = (relatedSubmission?.approvedSessionIds || []).includes(session.id) || explicitStatus === "approved";
              const isSubmitted = (relatedSubmission?.submittedSessionIds || []).includes(session.id) || (!relatedSubmission?.submittedSessionIds && !!relatedSubmission && (explicitStatus === "pending" || explicitStatus === "returned"));
              const status = isApproved ? "approved" : explicitStatus === "returned" ? "returned" : isSubmitted ? "pending" : "saved";
              const statusLabel = status === "approved" ? (isFilipino ? "Naaprubahan" : "Approved") : status === "returned" ? (isFilipino ? "Ibinabalik para baguhin" : "Returned for revision") : status === "pending" ? (isFilipino ? "Naghihintay ng pag-apruba" : "Awaiting approval") : (isFilipino ? "Naka-save · Handa nang isumite" : "Saved · Ready to submit");
              const statusClass = status === "approved" ? "bg-emerald-100 text-emerald-800" : status === "returned" ? "bg-rose-100 text-rose-800" : status === "pending" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800";
              const buttonLabel = approvedEditMode ? (isFilipino ? "I-save muna ang mga pagbabago" : "Save Changes first") : isApproved ? (isFilipino ? "Naaprubahan na" : "Already Approved") : status === "pending" ? (isFilipino ? "Naisumite na" : "Submitted") : (isFilipino ? `Isumite ang Sesyon ${sessionIndex + 1} para sa Pag-apruba` : `Submit Session ${sessionIndex + 1} for Approval`);
              return <div key={session.id} className="flex flex-col gap-3 rounded-lg border border-sky-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-slate-800">{isFilipino ? `Sesyon ${sessionIndex + 1}` : `Session ${sessionIndex + 1}`} — {session.lessonSubtitleTitle || session.title || (isFilipino ? "Walang pamagat ng sesyon" : "Untitled session")}</p><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusClass}`}>{statusLabel}</span></div><p className="mt-1 text-xs text-slate-500">{session.title || session.objectives || (isFilipino ? "Wala pang pokus na nakalagay." : "No session focus added yet.")}</p></div>
                <button type="button" disabled={controlsLocked || approvedEditMode || isApproved || status === "pending"} title={isApproved ? "This session has already been approved." : status === "pending" ? "This session is already awaiting approval." : approvedEditMode ? "Save changes to the existing approved lesson plan first." : `Submit Session ${sessionIndex + 1} individually for School Head approval.`} onClick={() => submitForApproval(session.id)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"><Send size={15}/> {buttonLabel}</button>
              </div>;
            })}
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
              <h3 className="font-extrabold text-indigo-950">{isFilipino ? "Mga Katagdagang lagda sa PDF" : "Additional Signatories"}</h3>
              <p className="mt-1 text-xs text-slate-600">{isFilipino ? "Piliin ang checkbox para isama ang itinalagang guro sa naka-print na PDF. Kapag may piniling lumagda, siya ang Checked by at ang Punong-Guro ay Noted by. Kung walang pinili, ang Punong-Guro ang Checked by." : "Check a box to include an assigned teacher in the PDF. When at least one signatory is included, the first is Checked by and the School Head is Noted by. If neither is included, the School Head remains Checked by."}</p>
              {[1, 2].map(slot => {
                const includedKey = slot === 1 ? "additionalSignatory1Included" : "additionalSignatory2Included";
                const teacherKey = slot === 1 ? "additionalSignatory1TeacherId" : "additionalSignatory2TeacherId";
                const nameKey = slot === 1 ? "additionalSignatory1Name" : "additionalSignatory2Name";
                const roleKey = slot === 1 ? "additionalSignatory1Role" : "additionalSignatory2Role";
                const selectedId = String((plan as any)[teacherKey] || "");
                return <div key={slot} className="mt-3 grid gap-3 rounded-lg border border-indigo-100 bg-white p-3 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800"><input type="checkbox" checked={Boolean((plan as any)[includedKey])} onChange={e => { const updatedPlan = { ...plan, [includedKey]: e.target.checked }; void saveOptionalSignatorySettings(updatedPlan); }} />{isFilipino ? `Isama ang Lumalagda ${slot}` : `Include Signatory ${slot}`}</label>
                  <label className="block text-xs font-bold text-slate-700">{isFilipino ? "Itinalagang Guro" : "Assign Teacher"}<select value={selectedId} onChange={e => { const teacher = schoolTeacherOptions.find(item => item.id === e.target.value); const updatedPlan = { ...plan, [teacherKey]: e.target.value, [nameKey]: teacher?.name || "", ...(slot === 1 ? { additionalSignatory1Role: plan.additionalSignatory1Role || "Master Teacher" } : {}) }; void saveOptionalSignatorySettings(updatedPlan); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">{isFilipino ? "Pumili ng guro mula sa paaralan" : "Select a teacher from this school"}</option>{schoolTeacherOptions.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}{teacher.role ? ` — ${teacher.role}` : ""}</option>)}</select></label>
                  <label className="block text-xs font-bold text-slate-700">{isFilipino ? "Pangalan sa Lagda" : "Signature Name"}<input readOnly value={String((plan as any)[nameKey] || "")} placeholder={isFilipino ? "Awtomatikong mapupuno mula sa napiling guro" : "Auto-filled from selected teacher"} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                  <label className="block text-xs font-bold text-slate-700">{isFilipino ? "Posisyon / Designasyon" : "Position / Designation"}<input value={String((plan as any)[roleKey] || "")} onChange={e => { const updatedPlan = { ...plan, [roleKey]: e.target.value }; void saveOptionalSignatorySettings(updatedPlan); }} placeholder={slot === 1 ? "Master Teacher" : "Teacher / Other designation"} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
                </div>;
              })}
            </div>
            <h3 className="font-extrabold text-slate-800">{translate("Submission and Approval")}</h3>
            <p className="mt-1 text-sm text-slate-500">{isFilipino ? "Isumite lamang ang sesyong pinili mo; ang ibang sesyon ay mananatiling hiwalay." : "Submit only the session you choose; other sessions remain separate."}</p>
          </div>
        </div>
        {workflowMessage && <p role="status" className="mt-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-800">{workflowMessage}</p>}
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h4 className="font-extrabold text-emerald-900">{translate("Lesson Plans with Approved Sessions")}</h4><p className="mt-1 text-xs text-slate-600">{translate("These plans contain sessions approved individually by the School Head. Approval applies to each listed session, not automatically to the entire week.")}</p></div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">{submissions.filter(x => x.status === "approved" && x.teacherEmail === String(currentUser?.email || "").trim().toLowerCase()).length} Approved</span>
          </div>
          {submissions.filter(x => x.status === "approved" && x.teacherEmail === String(currentUser?.email || "").trim().toLowerCase()).length === 0
            ? <p className="mt-3 rounded-lg border border-emerald-100 bg-white p-3 text-sm text-slate-500">{translate("No approved lesson plans are available for your account yet.")}</p>
            : <div className="mt-3 space-y-2">{submissions.filter(x => x.status === "approved" && x.teacherEmail === String(currentUser?.email || "").trim().toLowerCase()).sort((a, b) => new Date(b.reviewedAt || b.submittedAt).getTime() - new Date(a.reviewedAt || a.submittedAt).getTime()).map(x => <div key={x.id} className="flex flex-col gap-3 rounded-lg border border-emerald-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="font-bold text-slate-800">{getLessonProperTitle(x.plan) || "Untitled lesson plan"}</p><p className="mt-1 text-xs text-slate-500">Term {x.plan.term || "—"} · Week {x.plan.week || "—"} · {x.plan.learningAreas || "Learning area not specified"} · {x.plan.gradeSection || "Section not specified"}</p><p className="mt-1 text-xs text-emerald-700">Approved by {x.reviewerName || "School Head"}{x.reviewedAt ? ` · ${new Date(x.reviewedAt).toLocaleDateString()}` : ""}</p>{x.reviewerNote && <p className="mt-1 text-xs text-slate-600">Remarks: {x.reviewerNote}</p>}</div>
              <div className="no-print flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={() => { const previewWindow = window.open("", "_blank"); if (!previewWindow) { void showMessageWindow({ title: "Pop-up blocked", message: "Please allow pop-ups for this site to view the approved ILAW PDF preview.", mode: "info" }); return; } previewWindow.document.write('<!doctype html><title>Preparing ILAW PDF Preview</title><body style="font:16px Arial,sans-serif;padding:32px">Preparing approved ILAW Lesson Plan…</body>'); pendingApprovedPdfWindowRef.current = previewWindow; openOrLoadPlan(x.plan); setPreviewApprovedPlanOnRender(true); setWorkflowMessage(`Viewing approved ILAW Lesson Plan: ${getLessonProperTitle(x.plan) || "Untitled lesson plan"}. Use Print to save it as PDF.`); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"><Printer size={14}/> {translate("View PDF / Print")}</button>
              </div>
            </div>)}</div>}
        </div>
        {/* <div className="mt-4 rounded-xl border border-slate-100 p-4">
          <h4 className="font-bold text-slate-800">{isFilipino ? "Aking mga isinumite" : "My submissions"}</h4>
          {submissions.filter(x => x.teacherEmail === String(currentUser?.email || "").trim().toLowerCase()).length === 0
            ? <p className="mt-2 text-sm text-slate-500">{translate("No submissions saved in this browser yet.")}</p>
            : <div className="mt-2 space-y-2">{submissions.filter(x => x.teacherEmail === String(currentUser?.email || "").trim().toLowerCase()).map(x => <div key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"><span className="font-semibold">{getLessonProperTitle(x.plan) || "Untitled lesson plan"}</span><span className="capitalize">{x.status} · {new Date(x.submittedAt).toLocaleString()}</span>{x.reviewerSignature && <span className="text-emerald-700">{translate("Signature attached")}</span>}{(x.plan.sessions || []).some(session => String(session.coachingNotes || "").trim()) && <button type="button" onClick={() => { openOrLoadPlan(x.plan, "School Head Instructional Coaching Notes loaded in Section 06 — Rubric / Peer Coaching."); setActiveNavigationSection("06"); }} className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-extrabold text-indigo-700 hover:bg-indigo-50">{translate("View Coaching Notes")}</button>}</div>)}</div>}
        </div> */}
        {isSchoolHead && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h4 className="font-extrabold text-slate-800">{isFilipino ? "Pagsusuri ng Punong-Guro — Bawat Sesyon" : "School Head Review — Per Session"}</h4>
          <p className="mt-1 text-xs text-slate-600">{isFilipino ? "Aprubahan o ibalik ang bawat isinumiteng sesyon nang magkakahiwalay. Walang button para aprubahan ang buong linggo." : "Approve or return each submitted session separately. There is no whole-week approval button."}</p>
          <label className="mt-3 block text-xs font-bold text-slate-700">{isFilipino ? "Mga puna para sa sesyon (opsyonal)" : "Remarks for session (optional)"}<textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={2} placeholder={isFilipino ? "Maglagay ng puna para sa napiling sesyon" : "Add remarks for the session being reviewed"} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"/></label>
          <div className="mt-3 space-y-3">{submissions.filter(x => (x.submittedSessionIds || []).some(id => x.sessionStatuses?.[id] === "pending" || x.sessionStatuses?.[id] === "returned") || (x.status === "pending" && !x.submittedSessionIds)).length === 0 ? <p className="text-sm text-slate-500">{translate("No pending sessions to review.")}</p> : submissions.filter(x => (x.submittedSessionIds || []).some(id => x.sessionStatuses?.[id] === "pending" || x.sessionStatuses?.[id] === "returned") || (x.status === "pending" && !x.submittedSessionIds)).map(x => <div key={x.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold">{getLessonProperTitle(x.plan) || "Untitled lesson plan"}</p><p className="text-xs text-slate-500">By {x.teacherName} · {x.teacherEmail || "No email"} · Term {x.plan.term || "—"} · Week {x.plan.week || "—"}</p></div><button type="button" onClick={() => openOrLoadPlan(x.plan, `Loaded ${x.teacherName}'s lesson plan.`)} className="rounded-lg border px-3 py-1.5 text-xs font-bold">{translate("Load plan")}</button></div>
            <div className="mt-3 space-y-2">{(x.plan.sessions || []).map((session, index) => {
              const sessionState = x.sessionStatuses?.[session.id] || ((x.approvedSessionIds || []).includes(session.id) ? "approved" : "pending");
              const submitted = x.submittedSessionIds ? x.submittedSessionIds.includes(session.id) : x.status === "pending";
              if (!submitted) return null;
              const approved = sessionState === "approved" || (x.approvedSessionIds || []).includes(session.id);
              const returned = sessionState === "returned";
              return <div key={session.id || index} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div><p className="text-sm font-bold">{isFilipino ? `Sesyon ${index + 1}` : `Session ${index + 1}`} — {session.lessonSubtitleTitle || session.title || (isFilipino ? "Walang pamagat" : "Untitled session")}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold ${approved ? "bg-emerald-100 text-emerald-800" : returned ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{approved ? (isFilipino ? "Naaprubahan" : "Approved") : returned ? (isFilipino ? "Ibinalik para baguhin" : "Returned for revision") : (isFilipino ? "Naghihintay ng pag-apruba" : "Awaiting approval")}</span></div>
                {!approved && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => reviewSubmission(x, "approved", session.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"><CheckCircle2 size={13}/> {isFilipino ? `Aprubahan ang Sesyon ${index + 1}` : `Approve Session ${index + 1}`}</button><button type="button" onClick={() => reviewSubmission(x, "returned", session.id)} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"><RotateCcw size={13}/> {isFilipino ? "Ibalik para baguhin" : "Return for revision"}</button></div>}
                {x.sessionReviewNotes?.[session.id] && <p className="w-full whitespace-pre-wrap text-xs text-slate-600">{isFilipino ? "Puna" : "Remarks"}: {x.sessionReviewNotes[session.id]}</p>}
              </div>;
            })}</div>
          </div>)}</div>
        </div>}
      </section>}
      {submissions.filter(x => x.plan.lessonTitle === plan.lessonTitle && x.status === "approved" && x.reviewerSignature).slice(0, 1).map(x => <section key={x.id} className="approval-signature-block rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-bold">{isFilipino ? "Pag-apruba ng Punong-Guro" : "School Head Approval"}</h3>
        <p className="mt-1 text-sm">Status: Approved · {x.reviewedAt ? new Date(x.reviewedAt).toLocaleString() : ""}</p>
        {x.reviewerNote && <p className="mt-1 text-sm">Remarks: {x.reviewerNote}</p>}
        {x.reviewerSignature && <img src={x.reviewerSignature} alt="School head signature" className="mt-3 max-h-20 max-w-56 object-contain"/>}
        <p className="mt-1 text-sm font-semibold">{x.reviewerName || "School Head"}</p>
      </section>)}
      <div className="ilaw-deped-print">
        <header className="deped-print-header">
          <div className="deped-print-brand" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", width: "100%", minHeight: "38px" }}>
            {/* <div style={{ width: "42px", minWidth: "42px", display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
              {schoolLogo && <img src={schoolLogo} alt="School logo" style={{ width: "38px", height: "38px", maxWidth: "38px", maxHeight: "38px", objectFit: "contain" }} referrerPolicy="no-referrer" />}
            </div> */}
            <div style={{ flex: 1, minWidth: 0, textAlign: "center", lineHeight: 1.1 }}>
              <div className="deped-school">
                  REPUBLIC OF THE PHILIPPINES
                  <br />
                  DEPARTMENT OF EDUCATION
                </div>
             <h1>{(schoolDisplayName || "SCHOOL NAME").toUpperCase()}</h1>
            </div>
            {/* <div style={{ width: "42px", minWidth: "42px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              {depEdLogo && <img src={depEdLogo} alt="DepEd logo" style={{ width: "38px", height: "38px", maxWidth: "38px", maxHeight: "38px", objectFit: "contain" }} referrerPolicy="no-referrer" />}
            </div> */}
          </div>
          <h2>{isFilipino ? "ARAW-ARAW NA BANGHAY-ARALIN (ILAW)" : "DAILY LESSON PLAN (ILAW)"}</h2>
          <h3>S.Y. 2026-2027</h3>
        </header>
        <table className="deped-meta"><tbody>
          <tr><th>{isFilipino ? "Termino" : "Term"}</th><td>{plan.term || "1"}</td><th>{isFilipino ? "Linggo" : "Week"}</th><td>{plan.week || "1"}</td></tr>
          <tr><th>{isFilipino ? "Paksa" : "Lesson Title"}</th><td>{getLessonProperTitle(plan)}</td><th>{isFilipino ? "Asignatura" : "Learning Area"}</th><td>{plan.learningAreas}</td></tr>
          <tr><th>{isFilipino ? "Baitang at Seksyon" : "Grade Level and Section"}</th><td colSpan={3}>{plan.gradeSection}</td></tr>
          <tr><th>{isFilipino ? "Petsa ng Pagsasagawa" : "Date of Instruction"}</th><td colSpan={3}>{formatSessionInstructionDates(plan) || "—"}</td></tr>
          <tr><th>{isFilipino ? "Sanggunian" : "References"}</th><td colSpan={3}>{plan.references}</td></tr>
          <tr><th>{isFilipino ? "Deklarasyon sa Paggamit ng AI" : "AI Use Declaration"}</th><td colSpan={3}>{plan.aiDeclaration}</td></tr>
        </tbody></table>
        <table className="deped-meta"><tbody>
          <tr><th className="deped-label">{isFilipino ? "Kasanayang Pampagkatuto at mga Pamantayan ng Kurikulum" : "Learning Competency and Curriculum Standards"}</th><td>{plan.competencyStandards}</td></tr>
          <tr><th className="deped-label">{isFilipino ? "Konteksto ng mga Mag-aaral" : "Learner Context"}</th><td>{plan.learnerContext}</td></tr>
        </tbody></table>
        <table className="deped-session-table">
          <colgroup>
            <col style={{ width: "14%" }} />
            {plan.sessions.map(s => <col key={s.id} style={{ width: `${86 / plan.sessions.length}%` }} />)}
          </colgroup>
          <thead><tr><th>{isFilipino ? "Bahagi ng Aralin" : "Lesson Component"}</th>{plan.sessions.map((s, i) => <th key={s.id}>{isFilipino ? "Sesyon" : "Session"} {i + 1}{s.title ? ` — ${s.title}` : ""}</th>)}</tr></thead>
          <tbody>
            {(() => {
              const row = (labelFil: string, labelEn: string, getValue: (s: Session) => string) => <tr key={labelEn}><th>{isFilipino ? labelFil : labelEn}</th>{plan.sessions.map(s => <td key={s.id}>{getValue(s) || ""}</td>)}</tr>;
              const group = (labelFil: string, labelEn: string) => <tr key={`group-${labelEn}`} className="deped-section-heading"><th colSpan={plan.sessions.length + 1}>{isFilipino ? labelFil : labelEn}</th></tr>;
              return <>
                {group("MGA KARANASAN SA PAGKATUTO", "LEARNING EXPERIENCES")}
                {!isSchoolHead && <tr key="lesson-subtitle-title"><th>{isFilipino ? "Pamagat ng Sesyon" : "Lesson Title"}</th>{(() => { const sessions = plan.sessions; const links = plan.lessonSubtitleApplyTargetsBySession || {}; const cells: any[] = []; let i = 0; while (i < sessions.length) { const current = sessions[i]; let span = 1; const linkedIds = links[current.id] || []; if (current.lessonSubtitleTitle) { for (let j = i + 1; j < sessions.length && linkedIds.includes(sessions[j].id) && sessions[j].lessonSubtitleTitle === current.lessonSubtitleTitle; j++) span++; } cells.push(<td key={current.id} colSpan={span}>{current.lessonSubtitleTitle || ""}</td>); i += span; } return cells; })()}</tr>}\n                {row("Pokus / Tagal ng Sesyon", "Session Focus / Duration", s => s.title)}\n                {row("Mga Layunin sa Pagkatuto", "Learning Objectives", s => s.objectives)}
                {row("Mga Kagamitang Pampagkatuto", "Lesson Materials", s => (s.lessonMaterialIds || []).map(id => lessonMaterials.find(material => material.id === id)?.name).filter(Boolean).join("\n"))}
                {row("Bago ang Aralin / Pre-Lesson", "Pre-Lesson", s => s.preLesson)}
                {<tr key="flow"><th>{isFilipino ? "Daloy" : "Flow"}</th>{plan.sessions.map(s => <td key={s.id}><div className="ilaw-assessment-content" dangerouslySetInnerHTML={{ __html: /<[a-z][\s\S]*>/i.test(s.flow || "") ? assessmentHtml(s.flow || "") : flowMarkdownToHtml(s.flow || "") }} /></td>)}</tr>}
                {row("Kagamitang Pampagkatuto", "Learning Resources", () => plan.learningResources)}
                {row("Mga Pagkakataon para sa Integrasyon", "Opportunities for integration", () => plan.integration)}
                {group("PAGTATAYA", "ASSESSMENT")}
                {<tr key="assessment"><th>{isFilipino ? "Pagtataya na Formative" : "Formative Assessment"}</th>{plan.sessions.map(s => <td key={s.id}><div className="ilaw-assessment-content" dangerouslySetInnerHTML={{__html: assessmentHtml(s.assessment || plan.formativeAssessment || "")}} /></td>)}</tr>}
                {group("MGA SUSUNOD NA HAKBANG", "WAYS FORWARD")}
                {row("Mga Pagkakataon para sa Pinalawak na Pagkatuto", "Extended learning opportunities", s => s.extendedLearning || plan.extendedLearning)}
                {row("Pagninilay", "Reflections", s => s.reflection || plan.reflections)}
                {row("Mga Susunod na Hakbang", "Ways Forward", s => s.waysForward)}
              </>;
            })()}
          </tbody>
        </table>
        {(() => {
          const optionalSignatories = [
            { included: Boolean(plan.additionalSignatory1Included), name: String(plan.additionalSignatory1Name || "").trim(), role: String(plan.additionalSignatory1Role || "Master Teacher").trim() || "Master Teacher" },
            { included: Boolean(plan.additionalSignatory2Included), name: String(plan.additionalSignatory2Name || "").trim(), role: String(plan.additionalSignatory2Role || "Teacher").trim() || "Teacher" }
          ].filter(item => item.included);
          const checkedBy = optionalSignatories[0];
          const additionalReviewer = optionalSignatories[1];
          const schoolHeadName = String(plan.schoolHeadName || resolvedSchoolHeadName || currentUser?.school?.headOfSchoolName || currentUser?.school?.headOfSchool || currentUser?.school?.schoolHeadName || currentUser?.school?.principalName || currentUser?.assignedSchool?.headOfSchoolName || currentUser?.assignedSchool?.headOfSchool || currentUser?.assignedSchool?.schoolHeadName || currentUser?.assignedSchool?.principalName || "").trim();
          return <div className="deped-signatures">
            <div>{isFilipino ? "Inihanda ni:" : "Prepared by:"}<br/><br/><strong>{userDisplayName || plan.teacherNames || "____________________________"}</strong><br/>{isFilipino ? "Guro" : "Teacher"}</div>
            {checkedBy ? <div>{isFilipino ? "Sinuri ni:" : "Checked by:"}<br/><br/><strong>{checkedBy.name || "____________________________"}</strong><br/>{checkedBy.role || "Master Teacher"}</div> : <div>{isFilipino ? "Sinuri ni:" : "Checked by:"}<br/><br/><strong>{schoolHeadName || "____________________________"}</strong><br/>{isFilipino ? "Punong-Guro" : "School Head / Principal"}</div>}
            {additionalReviewer && <div>{isFilipino ? "Sinuri rin ni:" : "Reviewed by:"}<br/><br/><strong>{additionalReviewer.name || "____________________________"}</strong><br/>{additionalReviewer.role || "Teacher"}</div>}
            {checkedBy && <div>{isFilipino ? "Pinagtibay ni:" : "Noted by:"}<br/><br/><strong>{schoolHeadName || "____________________________"}</strong><br/>{isFilipino ? "Punong-Guro" : "School Head / Principal"}</div>}
          </div>;
        })()}
        <h3 className="deped-check-title">{isFilipino ? "RUBRIK PARA SA SARILING PAGSUSURI NG BANGHAY-ARALIN AT/O PEER COACHING" : "LESSON PLAN SELF-CHECK AND/OR PEER COACHING RUBRIC"}</h3>
        <table className="deped-check"><thead><tr><th>{isFilipino ? "Masasabi ko na sa aking banghay-aralin..." : "I can say that my lesson plan..."}</th><th>{isFilipino ? "Oo" : "Yes"}</th><th>{isFilipino ? "Hindi / Pa" : "Not yet"}</th><th>{isFilipino ? "Bakit? / Ano ang magpapabuti nito?" : "Why? / What would improve it?"}</th></tr></thead><tbody>
          {(isFilipino ? [
            "Malinaw na nailahad ang mga intensiyon at angkop ang mga kasanayang pampagkatuto.",
            "Magkakaugnay ang mga intensiyon at lahat ng bahagi ng banghay-aralin.",
            "Malinaw ang karanasan sa pagkatuto at maisasagawa ito ng ibang guro.",
            "Maayos ang disenyo ng karanasan sa pagkatuto at naipaloob ang Learning Design Principles.",
            "Nasusulit ang mga pagkakataon para sa integrasyon.",
            "Inklusibo ang karanasan at nagbibigay ng suporta sa magkakaibang pangangailangan ng mga mag-aaral.",
            "Naipaloob ang pagtataya sa kabuuan ng sesyon upang makita ang pag-unlad at pangangailangan ng suporta.",
            "Nagbibigay ng ebidensiya ang pagtataya kung matagumpay ang pagkatuto.",
            "Maisasagawa ang mga susunod na interbensiyon at maiiaangkop ang pagkatuto batay sa pagninilay."
          ] : [
            "Intentions are clear and appropriate learning competencies are included.",
            "Intentions are aligned with all parts of the lesson plan.",
            "The learning experience is clear and another teacher could implement it.",
            "The learning experience is well designed and incorporates Learning Design Principles.",
            "The learning experience makes good use of integration opportunities.",
            "The learning experience is inclusive and supports learners with varied needs and contexts.",
            "Assessment strategies are embedded throughout the session to identify progress and support needs.",
            "Assessment strategies provide evidence of successful learning.",
            "Next interventions are actionable and adapt or extend learning based on reflection."
          ]).map(item => <tr key={item}><td>{item}</td><td></td><td></td><td></td></tr>)}
        </tbody></table>
        <section className="coaching-notes-print">
          <h3>{isFilipino ? "MGA TALA PARA SA INSTRUCTIONAL COACHING" : "INSTRUCTIONAL COACHING NOTES"}</h3>
          <table className="deped-session-table coaching-notes-table">
            <thead><tr><th>{isFilipino ? "Sesyon" : "Session"}</th><th>{isFilipino ? "Mga Tala / Feedback / Suporta" : "Coaching Notes / Feedback / Support"}</th></tr></thead>
            <tbody>{plan.sessions.map((session, i) => <tr key={session.id}><th>{isFilipino ? "Sesyon" : "Session"} {i + 1}{session.title ? ` — ${session.title}` : ""}</th><td>{session.coachingNotes || ""}</td></tr>)}</tbody>
          </table>
        </section>
        <footer className="deped-logo-footer">
          <div className="deped-footer-logos">
            {schoolLogo && <img src={schoolLogo} alt="School logo" referrerPolicy="no-referrer" />}
            {depEdLogo && <img src={depEdLogo} alt="DepEd logo" referrerPolicy="no-referrer" />}
          </div>
        </footer>
      </div>
      <style>{`
        @page { size: legal landscape; margin: 0.32in 0.35in 0.35in 0.35in; }
        @media print {
          /* Use the full printable page and allow the document to paginate naturally. */
          @page { size: legal landscape; margin: 0.28in 0.32in 0.32in 0.32in; }
          html, body, #root { display: block !important; width: 100% !important; height: auto !important; min-height: 0 !important; max-height: none !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: #fff !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          /* Remove clipping/containment from app-shell ancestors that can truncate later print pages. */
          /* Force every ancestor of the print document to participate in normal print flow.
             App shells often use hidden/scrollable/fixed-height wrappers that suppress later pages. */
          *:has(.ilaw-print-document) { display: block !important; position: static !important; inset: auto !important; float: none !important; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; transform: none !important; contain: none !important; content-visibility: visible !important; break-inside: auto !important; page-break-inside: auto !important; }
          body * { visibility: hidden !important; }
          .ilaw-standalone-page, .ilaw-standalone-page *, .ilaw-print-page, .ilaw-print-page *, .ilaw-print-document, .ilaw-print-document * { visibility: visible !important; }
          .ilaw-standalone-page { position: static !important; inset: auto !important; display: block !important; width: 100% !important; height: auto !important; min-height: 0 !important; max-height: none !important; box-sizing: border-box !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; background: #fff !important; }
          .ilaw-print-document { position: static !important; inset: auto !important; display: block !important; float: none !important; width: 100% !important; height: auto !important; min-height: 0 !important; max-height: none !important; max-width: none !important; min-width: 0 !important; box-sizing: border-box !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: #fff !important; break-inside: auto !important; page-break-inside: auto !important; break-before: auto !important; break-after: auto !important; transform: none !important; contain: none !important; content-visibility: visible !important; }
          .ilaw-print-document .ilaw-deped-print { display: block !important; position: static !important; width: 100% !important; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; break-inside: auto !important; page-break-inside: auto !important; }
          .ilaw-print-document * { max-width: 100% !important; box-sizing: border-box !important; }
          .no-print, button { display: none !important; }
          section, label, .approval-signature-block { box-shadow: none !important; }
          .ilaw-deped-print, .ilaw-deped-print * { overflow: visible !important; }
          textarea, input { border: 1px solid #aaa !important; color: #111 !important; }
          textarea { white-space: pre-wrap !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .ilaw-print-document > :not(.ilaw-deped-print) { display: none !important; }
          .ilaw-deped-print { display: block !important; visibility: visible !important; position: relative !important; inset: auto !important; float: none !important; width: 100% !important; height: auto !important; min-height: 0 !important; max-height: none !important; max-width: none !important; margin: 0 !important; padding: 0 !important; box-sizing: border-box !important; color: #111 !important; font: 8.5pt Arial, sans-serif !important; overflow: visible !important; break-before: auto !important; break-after: auto !important; break-inside: auto !important; page-break-before: auto !important; page-break-after: auto !important; page-break-inside: auto !important; transform: none !important; }
          .ilaw-deped-print * { visibility: visible !important; }
          .deped-print-header { text-align: center; line-height: 1.1; margin: 0 auto 8px; padding-bottom: 4px; border-bottom: 1px solid #888; }
          .deped-print-brand { gap: 5px !important; min-height: 38px !important; }
          .deped-print-brand > div:first-child, .deped-print-brand > div:last-child { width: 42px !important; min-width: 42px !important; }
          .deped-print-brand img { width: 38px !important; height: 38px !important; max-width: 38px !important; max-height: 38px !important; }
          .deped-print-header h1 { font-size: 12pt; margin: 2px 0; }
          .deped-print-header h2 { font-size: 11pt; margin: 2px 0; }
          .deped-print-header h3 { font-size: 9pt; margin: 2px 0; }
          .deped-school { font-size: 8pt; }
          .deped-principal-name { margin: 4px 0; font-size: 8.5pt; }
          .ilaw-deped-print { overflow: visible !important; break-inside: auto !important; page-break-inside: auto !important; }
          .ilaw-deped-print table { border-collapse: collapse !important; width: 100% !important; max-width: 100% !important; table-layout: fixed !important; margin: 0 0 6px !important; page-break-inside: auto !important; break-inside: auto !important; }
          .ilaw-deped-print table, .ilaw-deped-print tbody, .ilaw-deped-print tr { overflow: visible !important; height: auto !important; max-height: none !important; }
          .ilaw-deped-print table { break-before: auto !important; break-after: auto !important; }
          /* Do not keep a multi-page table or its wrapper together as one unbreakable block. */
          .ilaw-deped-print table, .ilaw-deped-print tbody, .ilaw-deped-print tr,
          .ilaw-deped-print td, .ilaw-deped-print th, .coaching-notes-print,
          .coaching-notes-table { max-height: none !important; overflow: visible !important; }
          .ilaw-deped-print { widows: 2 !important; orphans: 2 !important; }
          .ilaw-deped-print thead { display: table-header-group; }
          .ilaw-deped-print tfoot { display: table-footer-group; }
          /* Let long lesson-plan rows flow across pages instead of being clipped or pushed off-page. */
          .ilaw-deped-print tr { page-break-inside: auto !important; break-inside: auto !important; }
          .ilaw-deped-print td, .ilaw-deped-print th { page-break-inside: auto !important; break-inside: auto !important; }
          .ilaw-deped-print .deped-meta tr, .ilaw-deped-print .deped-check tr, .ilaw-deped-print .coaching-notes-table tr { break-inside: avoid !important; page-break-inside: avoid !important; }
          .ilaw-deped-print .deped-section-heading { page-break-inside: avoid !important; break-inside: avoid !important; }
          .ilaw-deped-print table { -webkit-region-break-inside: auto !important; }
          .ilaw-deped-print, .ilaw-deped-print table, .ilaw-deped-print tbody, .ilaw-deped-print tr, .coaching-notes-print, .coaching-notes-table { height: auto !important; max-height: none !important; overflow: visible !important; }
          .ilaw-deped-print p, .ilaw-deped-print td, .ilaw-deped-print th { orphans: 2; widows: 2; }
          .ilaw-deped-print img { max-width: 38px !important; max-height: 38px !important; object-fit: contain !important; }
          .ilaw-deped-print p, .ilaw-deped-print h1, .ilaw-deped-print h2, .ilaw-deped-print h3, .ilaw-deped-print h4 { overflow-wrap: anywhere !important; color: #111 !important; }
          .ilaw-deped-print .deped-signatures { break-inside: avoid !important; page-break-inside: avoid !important; page-break-before: auto !important; }
          .ilaw-deped-print th, .ilaw-deped-print td { min-width: 0 !important; height: auto !important; max-height: none !important; }
          .ilaw-deped-print th, .ilaw-deped-print td { border: 1px solid #555 !important; padding: 3px 4px !important; vertical-align: top !important; white-space: pre-wrap !important; overflow-wrap: anywhere !important; word-break: break-word !important; color: #111 !important; }
          .ilaw-deped-print th { font-weight: bold; background: #f0f0f0 !important; }
          .ilaw-deped-print .deped-section-heading th { background: #dfe7f3 !important; text-align: left; font-weight: 800; letter-spacing: .4px; padding: 5px 6px; border-top: 2px solid #555; }
          .deped-meta th { width: 17%; text-align: left; }
          .deped-meta td { width: 33%; }
          .deped-meta .deped-label { width: 23%; }
          .deped-session-table { page-break-inside: auto; font-size: 8pt; }
          .deped-session-table th:first-child { width: 14%; }
          .deped-session-table td { width: auto; font-size: 7.5pt; }
          .deped-session-table th { font-size: 7.5pt; }
          .deped-session-table tr { break-inside: auto !important; page-break-inside: auto !important; }
          .deped-session-table td, .deped-session-table th { white-space: pre-wrap !important; overflow-wrap: anywhere !important; word-break: normal; }
          .deped-session-table td { line-height: 1.2; }
          .ilaw-deped-print h1, .ilaw-deped-print h2, .ilaw-deped-print h3, .ilaw-deped-print h4 { break-after: avoid-page !important; page-break-after: avoid !important; }
          .ilaw-deped-print .deped-section-heading { break-after: avoid-page !important; page-break-after: avoid !important; }
          .ilaw-deped-print img { break-inside: avoid !important; page-break-inside: avoid !important; }
          .deped-session-table th { overflow-wrap: anywhere; }
          .deped-signatures { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; align-items: flex-start !important; justify-content: space-between !important; gap: 12px !important; width: 100% !important; margin: 18px auto 22px !important; page-break-inside: avoid !important; break-inside: avoid !important; }
          .deped-signatures > div { display: block !important; flex: 1 1 0 !important; width: auto !important; min-width: 0 !important; max-width: none !important; margin: 0 !important; text-align: center !important; overflow-wrap: anywhere !important; }
          .deped-logo-footer { display: block !important; width: 100%; margin-top: 10px; padding-top: 5px; border-top: 1px solid #aaa; break-inside: avoid; page-break-inside: avoid; }
          .deped-footer-logos { display: flex; justify-content: flex-start; align-items: center; gap: 6px; }
          .deped-footer-logos img { display: block; width: 28px !important; height: 28px !important; max-width: 28px !important; max-height: 28px !important; object-fit: contain !important; }
          .coaching-notes-print { page-break-inside: auto !important; break-inside: auto !important; margin-top: 10px; }
          .coaching-notes-print h3 { font-weight: bold; text-align: center; margin: 8px 0 5px; }
          .coaching-notes-table { page-break-inside: auto !important; break-inside: auto !important; }
          /* Start the self-check rubric on a fresh page so it cannot be pushed off the end
             of the lesson-plan table or lost at a page boundary. Let its rows paginate. */
          .ilaw-deped-print .deped-check-title {
            display: block !important; visibility: visible !important; color: #111 !important;
            break-before: page !important; page-break-before: always !important;
            break-after: avoid-page !important; page-break-after: avoid !important;
            text-align: center !important; font-size: 9pt !important; margin: 0 0 8px !important;
          }
          .ilaw-deped-print table.deped-check {
            display: table !important; visibility: visible !important; width: 100% !important;
            height: auto !important; max-height: none !important; overflow: visible !important;
            font-size: 8pt !important; break-inside: auto !important; page-break-inside: auto !important;
          }
          .ilaw-deped-print .deped-check thead { display: table-header-group !important; }
          .ilaw-deped-print .deped-check tbody { display: table-row-group !important; }
          .ilaw-deped-print .deped-check tr {
            display: table-row !important; height: auto !important; max-height: none !important;
            overflow: visible !important; break-inside: auto !important; page-break-inside: auto !important;
          }
          .ilaw-deped-print .deped-check th, .ilaw-deped-print .deped-check td {
            visibility: visible !important; overflow: visible !important; white-space: normal !important;
            overflow-wrap: anywhere !important; vertical-align: top !important;
          }
          .deped-signatures { break-inside: avoid !important; page-break-inside: avoid !important; }
          .deped-check th:first-child { width: 56%; }
          .deped-check th:nth-child(2), .deped-check th:nth-child(3) { width: 8%; }
          .deped-check th:nth-child(4) { width: 28%; }
        }
        @media screen {
          .ilaw-deped-print { display: none; }
        }
      `}</style>
    </div>
  );
}

function SelfCheckRow({ item, index, isFilipino, status, note, onChange }: { item: string; index: number; isFilipino: boolean; status: "yes" | "not-yet"; note: string; onChange: (field: "status" | "note", value: any) => void; key?: React.Key }) {
  return <div className="grid gap-2 rounded-xl border border-slate-100 p-3 md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)] md:items-center">
    <p className="text-sm text-slate-700">{index + 1}. {item}</p>
    <select value={status} onChange={e => onChange("status", e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <option value="yes">{isFilipino ? "Oo" : "Yes"}</option><option value="not-yet">{isFilipino ? "Hindi pa" : "Not Yet"}</option>
    </select>
    <input value={note} onChange={e => onChange("note", e.target.value)} placeholder={isFilipino ? "Bakit? / Ano ang magpapabuti nito?" : "Why? / What will make it better?"} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
  </div>;
}