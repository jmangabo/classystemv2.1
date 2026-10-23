import React, { useEffect, useMemo, useRef, useState } from "react";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
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

type Session = { id: string; competencyStandards: string; objectives: string; learnerContext: string; preLesson: string; title: string; flow: string; flowSequence?: string; assessment: string; extendedLearning: string; reflection: string; waysForward: string; coachingNotes: string };
type Plan = {
  lessonTitle: string;
  term: string;
  week: string;
  learningAreas: string;
  teacherNames: string;
  schoolHeadName: string;
  gradeSection: string;
  noOfSessions: string;
  references: string;
  aiDeclaration: string;
  competencyStandards: string;
  objectives: string;
  learnerContext: string;
  preLesson: string;
  sessions: Session[];
  learningResources: string;
  integration: string;
  formativeAssessment: string;
  extendedLearning: string;
  reflections: string;
  coachingNotes: string;
  objectivesApplyTargetsBySession?: Record<string, string[]>;
  intentionApplyTargetsBySession?: Record<string, string[]>;
};

const FLOW_SEQUENCE_TEMPLATES: Record<string, { label: string; preLesson: string; flow: string }> = {
  "5e": {
    label: "5E's",
    preLesson: "1. Engage: Present a motivating question, short situation, image, or real-life problem.\n2. Activate prior knowledge and connect it to the lesson objectives.\n3. State the learning targets and success criteria.",
    flow: "1. ENGAGE (5–10 min) — Introduce a hook or problem; invite learners to share initial ideas.\n2. EXPLORE (10–15 min) — Learners investigate, observe, solve, or work with examples in pairs/groups. Teacher facilitates and asks probing questions.\n3. EXPLAIN (10–15 min) — Learners explain findings; teacher clarifies concepts, models processes, and addresses misconceptions.\n4. ELABORATE (10–15 min) — Learners apply the concept to a new task, context, or real-life situation.\n5. EVALUATE (5–10 min) — Check understanding through an exit ticket, short task, oral response, or other evidence of learning.\nDifferentiation / support: Provide scaffolds, examples, language support, or extension tasks as needed."
  },
  "matatag": {
    label: "MATATAG Framework",
    preLesson: "1. Connect the lesson to learners' prior knowledge, experiences, and context.\n2. Share the lesson purpose, learning targets, and expected output in learner-friendly language.\n3. Prepare materials and identify possible misconceptions or needed scaffolds.",
    flow: "1. CONNECT — Elicit prior knowledge and introduce a meaningful context or essential question.\n2. EXPLICIT TEACHING / MODELING — Explain key concepts and demonstrate the skill or process using clear examples.\n3. GUIDED PRACTICE — Work through examples with prompts, feedback, and checks for understanding.\n4. COLLABORATIVE APPLICATION — Learners discuss, investigate, or complete a task with peers.\n5. INDEPENDENT APPLICATION — Learners demonstrate the target skill or understanding independently or in an authentic task.\n6. SYNTHESIS AND CHECK FOR UNDERSTANDING — Summarize key learning, address misconceptions, and collect evidence of progress.\nAdaptation: Adjust scaffolds, pacing, materials, and enrichment to learners' needs and the lesson competency."
  },
  "review-motivation-discussion": {
    label: "Review–Motivation–Discussion Sequence",
    preLesson: "1. Review the previous lesson or prerequisite skill using 2–3 quick questions.\n2. Check learners' readiness and address one important misconception.\n3. Motivate learning with a short story, picture, demonstration, current issue, or real-life question.\n4. Present the lesson objective and connect it to the motivation activity.",
    flow: "1. REVIEW (5–8 min) — Recall key ideas from the previous lesson; use quick oral questions or a brief retrieval task.\n2. MOTIVATION (5 min) — Present a hook or real-life situation and ask learners to predict, notice, or wonder.\n3. DISCUSSION / DEVELOPMENT (15–20 min) — Explain the new concept through examples, questioning, demonstration, and learner responses.\n4. GUIDED OR GROUP TASK (10–15 min) — Learners apply the key idea with teacher guidance or peer collaboration.\n5. GENERALIZATION (3–5 min) — Learners state the main takeaway or answer the essential question.\n6. QUICK CHECK (3–5 min) — Use an exit ticket, short response, or practice item to identify next steps."
  },
  "4as": {
    label: "4A's Framework",
    preLesson: "1. Prepare a short activity or stimulus related to learners' experience.\n2. Recall prerequisite knowledge and introduce the lesson purpose.\n3. Prepare guiding questions that move learners from experience to concept and application.",
    flow: "1. ACTIVITY (8–12 min) — Learners complete a task, examine a stimulus, solve a problem, or work with an example.\n2. ANALYSIS (8–12 min) — Learners describe observations, compare answers, and discuss guiding questions.\n3. ABSTRACTION (10–15 min) — Learners formulate the key idea; teacher clarifies and summarizes the concept or rule.\n4. APPLICATION (10–15 min) — Learners use the concept or skill in a new problem, practical task, or real-life situation.\n5. CLOSURE / CHECK (3–5 min) — Learners share a takeaway and complete a brief check for understanding."
  },
  "teacher-made": {
    label: "Teacher's made",
    preLesson: "1. Review or activate prior knowledge: [write activity].\n2. Motivate and connect to learners' experiences: [write prompt/activity].\n3. Share lesson objectives and success criteria: [write targets].",
    flow: "1. [Opening / review / motivation] — Describe the teacher and learner actions.\n2. [Teaching / exploration / discussion] — Describe the key learning experience.\n3. [Guided practice / collaboration] — Describe learner task and teacher support.\n4. [Independent application] — Describe the output or performance expected.\n5. [Synthesis / formative check] — Describe how understanding will be checked.\n6. Differentiation / materials / time allotment: [customize as needed]."
  }
};

const makeSession = (id = `session-${Date.now()}`): Session => ({
  id, competencyStandards: "", objectives: "", learnerContext: "", preLesson: "", title: "", flow: "", flowSequence: "", assessment: "", extendedLearning: "", reflection: "", waysForward: "", coachingNotes: ""
});

const blankPlan = (): Plan => ({
  lessonTitle: "", term: "1", week: "1", learningAreas: "", teacherNames: "", schoolHeadName: "", gradeSection: "",
  noOfSessions: "4", references: "",
  aiDeclaration: "AI was used to support drafting and organizing the lesson plan. The teacher reviewed and adapted the content for accuracy, learner context, and curriculum alignment. Complete/correct this declaration in accordance with DO 3, s. 2026, Annex A.",
  competencyStandards: "", objectives: "", learnerContext: "", preLesson: "",
  sessions: [makeSession("session-1"), makeSession("session-2"), makeSession("session-3"), makeSession("session-4")], learningResources: "", integration: "",
  formativeAssessment: "", extendedLearning: "", reflections: "", coachingNotes: "",
  objectivesApplyTargetsBySession: {}, intentionApplyTargetsBySession: {}
});

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
      competencyStandards: String(stored.competencyStandards ?? (index === 0 ? value?.competencyStandards : "") ?? ""),
      objectives: String(stored.objectives ?? value?.objectives ?? ""),
      learnerContext: String(stored.learnerContext ?? (index === 0 ? value?.learnerContext : "") ?? ""),
      preLesson: String(stored.preLesson ?? (index === 0 ? value?.preLesson : "") ?? ""),
      title: String(stored.title ?? stored.sessionTitle ?? ""),
      flow: (() => {
        const raw = String(stored.flow ?? stored.learningExperience ?? "");
        return /<[a-z][\s\S]*>/i.test(raw) ? flowHtmlToText(raw) : raw;
      })(),
      assessment: String(stored.assessment ?? ""),
      extendedLearning: String(stored.extendedLearning ?? ""),
      reflection: String(stored.reflection ?? ""),
      waysForward: String(stored.waysForward ?? ""),
      coachingNotes: String(stored.coachingNotes ?? "")
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
      ["competencyStandards", "objectives", "learnerContext", "preLesson", "title", "flow", "assessment", "extendedLearning", "reflection", "waysForward", "coachingNotes"]
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
export default function ILAWLessonPlan({ currentUser, assignedSubjects = [], globalSubjects = [], sections = [], isSchoolHead = false, isSystemAdmin: isSystemAdminProp = false }: Props) {
  type MessageDialogOptions = { title: string; message: string; mode: "info" | "confirm" | "input"; inputLabel?: string; initialValue?: string; confirmLabel?: string; danger?: boolean };
  const [messageDialog, setMessageDialog] = useState<MessageDialogOptions | null>(null);
  const [messageDialogInput, setMessageDialogInput] = useState("");
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
  const messageWindow = messageDialog ? <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && messageDialog.mode === "info") closeMessageWindow(true); }}><section role="dialog" aria-modal="true" aria-labelledby="ilaw-message-window-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><h2 id="ilaw-message-window-title" className="text-lg font-extrabold text-slate-900">{messageDialog.title}</h2><button type="button" aria-label="Close message" onClick={() => closeMessageWindow(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={18}/></button></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{messageDialog.message}</p>{messageDialog.mode === "input" && <label className="mt-4 block text-sm font-bold text-slate-700">{messageDialog.inputLabel || "Details"}<textarea autoFocus value={messageDialogInput} onChange={event => setMessageDialogInput(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => closeMessageWindow(messageDialog.mode === "info" ? true : null)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{messageDialog.mode === "info" ? "Close" : "Cancel"}</button>{messageDialog.mode !== "info" && <button type="button" onClick={() => closeMessageWindow(messageDialog.mode === "input" ? messageDialogInput : true)} className={`rounded-xl px-4 py-2 text-sm font-extrabold text-white ${messageDialog.danger ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>{messageDialog.confirmLabel || (messageDialog.mode === "input" ? "Submit" : "Confirm")}</button>}</div></section></div> : null;
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
        .ilaw-pdf-preview .deped-signatures { display: flex !important; justify-content: space-between !important; gap: 12% !important; margin: 22px 5% 24px !important; break-inside: avoid !important; }
        .ilaw-pdf-preview .deped-signatures > div { width: 44% !important; text-align: center !important; line-height: 1.35 !important; }
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
  const [showTermWeekModal, setShowTermWeekModal] = useState(false);
  const [listTermFilter, setListTermFilter] = useState("all");
  const [listWeekFilter, setListWeekFilter] = useState("all");
  const [showPlanList, setShowPlanList] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [language, setLanguage] = useState<"fil" | "en">("en");
  const isFilipino = language === "fil";
  const [activeSessionTab, setActiveSessionTab] = useState("session-1");
  const currentSessionIndex = useMemo(() => {
    const list = Array.isArray(plan.sessions) && plan.sessions.length ? plan.sessions : [];
    const idx = list.findIndex(s => s.id === activeSessionTab);
    return idx >= 0 ? idx : 0;
  }, [plan.sessions, activeSessionTab]);
  const [objectivesApplyTargetsBySession, setObjectivesApplyTargetsBySession] = useState<Record<string, string[]>>(() => plan.objectivesApplyTargetsBySession || {});
  const [intentionApplyTargetsBySession, setIntentionApplyTargetsBySession] = useState<Record<string, string[]>>(() => plan.intentionApplyTargetsBySession || {});
  // Checkbox selections are stored inside the plan so they survive Save and reopening.
  useEffect(() => {
    setObjectivesApplyTargetsBySession(plan.objectivesApplyTargetsBySession || {});
    setIntentionApplyTargetsBySession(plan.intentionApplyTargetsBySession || {});
  }, [plan.objectivesApplyTargetsBySession, plan.intentionApplyTargetsBySession]);

  const openOrLoadPlan = (planToLoad: Plan, statusMsg?: string) => {
    const normalized = normalizeStoredPlan(planToLoad);
    (normalized.sessions || []).forEach(session => {
      flowDraftsRef.current[session.id] = String(session.flow || "");
      assessmentDraftsRef.current[session.id] = String(session.assessment || "");
    });
    setPlan(normalized);
    setObjectivesApplyTargetsBySession(normalized.objectivesApplyTargetsBySession || {});
    setIntentionApplyTargetsBySession(normalized.intentionApplyTargetsBySession || {});
    setSelectedTerm(String(normalized.term || "1"));
    setSelectedWeek(String(normalized.week || "1"));
    setActiveSessionTab(normalized.sessions[0]?.id || "session-1");
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
  const approvedEditMode = Boolean(approvedEditSubmissionId);
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try { return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || "[]"); } catch { return []; }
  });
  const [changeRequests, setChangeRequests] = useState<ApprovedPlanChangeRequest[]>(() => {
    try { return JSON.parse(localStorage.getItem(CHANGE_REQUESTS_KEY) || "[]"); } catch { return []; }
  });
  const isCurrentPlanApproved = !approvedEditMode && submissions.some(item =>
    item.status === "approved" &&
    item.teacherEmail === String(currentUser?.email || "").trim().toLowerCase() &&
    String(item.plan.term || "1") === String(plan.term || "1") &&
    String(item.plan.week || "1") === String(plan.week || "1") &&
    String(item.plan.lessonTitle || "").trim() === String(plan.lessonTitle || "").trim()
  );
  const controlsLocked = isCurrentPlanApproved && !approvedEditMode;
  const [reviewNote, setReviewNote] = useState("");
  const [reviewCoachingNote, setReviewCoachingNote] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [workflowMessage, setWorkflowMessage] = useState("");
  const [viewingSubmissionId, setViewingSubmissionId] = useState<string | null>(null);
  const [reviewSessionIndex, setReviewSessionIndex] = useState(0);
  const [cloudMessage, setCloudMessage] = useState("");

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
  const schoolId = String(
    currentUser?.schoolId || currentUser?.school_id || currentUser?.schoolID || currentUser?.schoolIDNumber ||
    currentUser?.assignedSchoolId || currentUser?.assignedSchoolID || currentUser?.schoolNumber ||
    currentUser?.school?.schoolId || currentUser?.school?.school_id || currentUser?.school?.schoolID || currentUser?.school?.schoolIDNumber || currentUser?.school?.id ||
    currentUser?.assignedSchool?.schoolId || currentUser?.assignedSchool?.school_id || currentUser?.assignedSchool?.schoolID || currentUser?.assignedSchool?.id ||
    currentUser?.profile?.schoolId || currentUser?.profile?.school_id || currentUser?.profile?.schoolID || currentUser?.profile?.schoolIDNumber ||
    currentUser?.teacherProfile?.schoolId || currentUser?.teacherProfile?.school_id || currentUser?.teacherProfile?.schoolID || currentUser?.teacherProfile?.schoolIDNumber ||
    currentUser?.teacher?.schoolId || currentUser?.teacher?.school_id || currentUser?.teacher?.schoolID ||
    currentUser?.schoolAssignment?.schoolId || currentUser?.schoolAssignment?.school_id || currentUser?.schoolAssignment?.id || ""
  ).trim();

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
    setPlan(prev => prev.schoolHeadName ? { ...prev, schoolHeadName: "" } : prev);

    const normalizeSchoolId = (value: any) => String(value ?? "").trim().replace(/\s+/g, "");
    const nameOf = (record: any): string => {
      if (!record) return "";
      const direct = record.headOfSchool ?? record.head_of_school ?? record.schoolHeadName ?? record.school_head_name ?? record.schoolHeadFullName ?? record.school_head_full_name ??
        record.principalName ?? record.principal_name ?? record.principalFullName ??
        record.schoolHeadFullName ?? record.schoolHead ?? record.school_head ?? record.principal ??
        record.head_of_school ?? record.schoolLeaderName;
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
      if (!schoolId) {
        console.warn("Cannot resolve principal: signed-in user profile has no school ID.", currentUser);
        return;
      }
      try {
        // The app's School List is stored in Firestore `schools`, keyed by the schoolId field.
        const candidates = [schoolId];
        if (/^\d+$/.test(schoolId)) candidates.push(Number(schoolId) as any);
        let schoolRecord: any = null;

        const schoolIdFields = ["schoolId", "school_id", "schoolID", "schoolIDNumber"];
        for (const fieldName of schoolIdFields) {
          for (const candidate of candidates) {
            const snap = await getDocs(query(collection(db, "schools"), where(fieldName, "==", candidate)));
            const match = snap.docs.find(item => {
              const data = item.data();
              return normalizeSchoolId(data.schoolId ?? data.school_id ?? data.schoolID ?? data.schoolIDNumber) === normalizeSchoolId(schoolId);
            });
            if (match) {
              schoolRecord = { id: match.id, ...match.data() };
              break;
            }
          }
          if (schoolRecord) break;
        }

        // Some School List entries use the school ID as the document ID.
        if (!schoolRecord) {
          const direct = await getDoc(doc(db, "schools", schoolId));
          if (direct.exists()) {
            const data = direct.data();
            const storedId = data.schoolId ?? data.school_id ?? data.schoolID ?? data.schoolIDNumber ?? direct.id;
            if (normalizeSchoolId(storedId) === normalizeSchoolId(schoolId)) {
              schoolRecord = { id: direct.id, ...data };
            }
          }
        }

        let resolvedName = nameOf(schoolRecord);

        // Some deployments keep the principal's name on the user profile rather than
        // directly on the School List document. If the school record has no name,
        // search users assigned to this exact school ID and prefer a School Head/Principal account.
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
          const candidates: any[] = [schoolId];
          if (/^\d+$/.test(schoolId)) candidates.push(Number(schoolId));
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
            return normalize(recordSchoolId) === normalize(schoolId);
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
          setPlan(prev => prev.schoolHeadName ? { ...prev, schoolHeadName: "" } : prev);
        }
      }
    };

    void readSchoolHeadFromSchoolList();
    return () => { cancelled = true; };
  }, [schoolId]);

  // Saved lesson plans are database records, not browser-local drafts. Load every plan
  // owned by the signed-in user so the list survives across devices and sessions.
  useEffect(() => {
    const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
    if (!uid) {
      setCloudMessage("Sign in to save and load lesson plans from the database.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const records = await getDocs(query(collection(db, PLAN_RECORDS_COLLECTION), where("ownerUid", "==", uid)));
        if (cancelled) return;
        const plans = records.docs.map(record => {
          const data = record.data() as any;
          return normalizeStoredPlan(data.plan || data);
        }).sort((a, b) => Number(a.term || 1) - Number(b.term || 1) || Number(a.week || 1) - Number(b.week || 1));
        setSavedPlans(plans);
        setCloudMessage(`Loaded ${plans.length} lesson plan${plans.length === 1 ? "" : "s"} from the database.`);
        // If the list has records and the form is still blank, open the latest database plan.
        if (plans.length && !hasStoredPlanContent(plan)) {
          const latest = plans[plans.length - 1];
          openOrLoadPlan(latest);
        }
      } catch (error) {
        console.error("Could not load ILAW lesson plans from database:", error);
        if (!cancelled) setCloudMessage("Could not load lesson plans from the database. Check your connection and Firestore permissions.");
      }
    })();
    return () => { cancelled = true; };
  }, [currentUser?.uid, currentUser?.id, currentUser?.userId, currentUser?.user_id, currentUser?.email]);

  const planRecordId = (item: Plan, uid: string) => `${uid}_term_${String(item.term || "1")}_week_${String(item.week || "1")}`;

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
      const selectedScope = await showMessageWindow({ title: "Delete request scope", message: "Choose the scope by entering WEEK to request deletion of the whole ILAW lesson plan, or SESSION to request deletion of one session. For a session request, include the session number in the reason.", mode: "input", inputLabel: "Enter WEEK or SESSION", initialValue: "WEEK", confirmLabel: "Continue" });
      if (typeof selectedScope !== "string") return;
      scope = selectedScope.trim().toLowerCase() === "session" ? "session" : "week";
    }
    const note = await showMessageWindow({ title: `Request ${action === "edit" ? "Edit" : "Delete"}`, message: `Approved lesson plan: “${item.plan.lessonTitle || "Untitled lesson plan"}”. ${scope === "session" ? "Specify the session number in your reason." : ""} Enter the reason for this request.`, mode: "input", inputLabel: "Reason for request", confirmLabel: "Send request" });
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
      sessionId: type === "delete" && scope === "session" ? (note.match(/session\s*(\d+)/i)?.[1] ? `session-${note.match(/session\s*(\d+)/i)?.[1]}` : undefined) : undefined,
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
    const note = await showMessageWindow({ title: `${decision === "approved" ? "Approve" : "Reject"} ${request.type === "edit" ? "Edit" : "Delete"} Request`, message: `Lesson plan: “${request.planTitle}”. Add an optional note for the teacher.`, mode: "input", inputLabel: "Reviewer note (optional)", confirmLabel: decision === "approved" ? "Approve request" : "Reject request", danger: decision === "rejected" });
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

  const submitForApproval = () => {
    if (isCurrentPlanApproved && !approvedEditMode) {
      setWorkflowMessage("This lesson plan is already approved. Saving, clearing, or submitting it again is disabled. Request and receive edit authorization before making changes.");
      return;
    }
    if (!plan.lessonTitle.trim() || !plan.teacherNames.trim() || !plan.learningAreas.trim()) {
      setWorkflowMessage("Please complete Lesson Title, Learning Area/s, and Name of Teacher/s before submitting.");
      return;
    }
    const email = String(currentUser?.email || "").trim().toLowerCase();
    // A lesson plan draft is identified by term and week—not its title, learning area, or grade/section.
    // Editing the title or pressing Submit again must update the same submission, not create a duplicate.
    const identity = planListIdentity(plan);
    const planWithLiveEditors: Plan = {
      ...plan,
      objectivesApplyTargetsBySession: JSON.parse(JSON.stringify(objectivesApplyTargetsBySession)),
      intentionApplyTargetsBySession: JSON.parse(JSON.stringify(intentionApplyTargetsBySession)),
      sessions: (plan.sessions || []).map(session => {
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
      x.teacherEmail === email && planListIdentity(x.plan) === identity && x.status !== "approved"
    );
    if (existing) {
      const updated: Submission = {
        ...existing,
        plan: JSON.parse(JSON.stringify(planSnapshot)),
        teacherName: String(currentUser?.displayName || currentUser?.name || plan.teacherNames),
        submittedAt: new Date().toISOString(),
        status: "pending",
        editApproved: false,
        approvedSessionIds: [],
        sessionReviewNotes: {},
      };
      persistSubmissions(submissions.map(item => item.id === existing.id ? updated : item));
      setPlan(planSnapshot);
      setWorkflowMessage("The existing lesson plan submission was updated and sent for approval. No duplicate was created.");
      return;
    }
    const item: Submission = {
      id: `ilaw-${Date.now()}`,
      plan: JSON.parse(JSON.stringify(planSnapshot)),
      teacherName: String(currentUser?.displayName || currentUser?.name || plan.teacherNames),
      teacherEmail: email,
      submittedAt: new Date().toISOString(),
      status: "pending"
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
    const allSessionsApproved = sessions.length > 0 && sessions.every(session => nextApproved.includes(session.id));
    const next = submissions.map(x => x.id === item.id ? {
      ...x,
      status: allSessionsApproved ? "approved" as const : "pending" as const,
      approvedSessionIds: nextApproved,
      sessionReviewNotes: { ...(x.sessionReviewNotes || {}), [sessionId]: reviewNote },
      reviewerName: String(currentUser?.displayName || currentUser?.name || "School Head"),
      reviewedAt: new Date().toISOString(),
      reviewerNote: reviewNote
    } : x);
    persistSubmissions(next);
    const sessionNumber = sessions.findIndex(session => session.id === sessionId) + 1;
    setWorkflowMessage(status === "approved"
      ? (allSessionsApproved ? `Session ${sessionNumber} approved. All sessions are now approved; the lesson plan is complete.` : `Session ${sessionNumber} approved only. Other sessions remain pending approval.`)
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

  useEffect(() => {
    if (!selectedSections.length) return;
    const options = assignedSectionSubjects;
    if (options.length > 0 && (!plan.learningAreas || !options.includes(plan.learningAreas))) {
      // When the section changes, select a subject belonging to that section instead of
      // keeping the previous section's learning area.
      update("learningAreas", options[0]);
    } else if (options.length === 0 && plan.learningAreas) {
      update("learningAreas", "");
    }
  // Update the Learning Area when the selected section or its assignments change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSections, assignedSectionSubjects]);

  const update = <K extends keyof Plan>(key: K, value: Plan[K]) =>
    setPlan(prev => ({ ...prev, [key]: value }));

  const updateSession = (id: string, key: keyof Omit<Session, "id">, value: string) =>
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

  const canOpenSessionTab = (index: number) => index === 0 || plan.sessions.slice(0, index).every(s => Boolean(s.reflection?.trim()));
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

  const savePlan = async (planToSave: Plan = plan) => {
    if (isCurrentPlanApproved && !approvedEditMode) {
      const message = "This lesson plan is already approved. Save is disabled unless an edit request has been approved.";
      setWorkflowMessage(message);
      setSavedMessage(message);
      return;
    }
    // Flow is a controlled textarea, so its value is already in React state. Keep the
    // Assessment editor's live DOM snapshot because that field still uses contentEditable.
    const planWithLiveEditors: Plan = {
      ...planToSave,
      objectivesApplyTargetsBySession: JSON.parse(JSON.stringify(objectivesApplyTargetsBySession)),
      intentionApplyTargetsBySession: JSON.parse(JSON.stringify(intentionApplyTargetsBySession)),
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
    if (approvedEditSubmissionId) {
      const target = submissions.find(item => item.id === approvedEditSubmissionId);
      if (!target) {
        setWorkflowMessage("The lesson plan submission could not be found. Your changes were not saved.");
        return;
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
      setApprovedEditSubmissionId(null);
      const message = "Changes saved successfully to the existing approved lesson plan. Its approval remains valid; no reapproval or duplicate submission was created.";
      setSavedMessage(message);
      setWorkflowMessage("Changes saved. The lesson plan remains approved.");
      await showMessageWindow({ title: "Changes Saved", message, mode: "info" });
      return;
    }
    try {
      const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
      if (!uid) throw new Error("Please sign in before saving a lesson plan to the database.");
      const recordId = planRecordId(planSnapshot, uid);
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

      // Also backup to local storage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(planSnapshot));
      } catch (storageErr) {
        console.warn("Could not write to local storage backup:", storageErr);
      }

      const nextSavedPlans = [...savedPlans.filter(item => planListIdentity(item) !== planListIdentity(planSnapshot)), planSnapshot]
        .sort((a, b) => Number(a.term || 1) - Number(b.term || 1) || Number(a.week || 1) - Number(b.week || 1));
      setSavedPlans(nextSavedPlans);
      setPlan(planSnapshot);
      setObjectivesApplyTargetsBySession(planSnapshot.objectivesApplyTargetsBySession || {});
      setIntentionApplyTargetsBySession(planSnapshot.intentionApplyTargetsBySession || {});
      setSelectedTerm(String(planSnapshot.term || "1"));
      setSelectedWeek(String(planSnapshot.week || "1"));
      const message = `The complete ILAW Lesson Plan was saved to the database for Term ${planSnapshot.term}, Week ${planSnapshot.week}. All sections and sessions are included.`;
      setSavedMessage(message); setWorkflowMessage(message); setCloudMessage("Saved to the database successfully.");
      await showMessageWindow({ title: "Saved", message, mode: "info" });
    } catch (error) {
      console.error("ILAW database save failed:", error);
      const rawMessage = error instanceof Error ? error.message : "Unknown database error.";
      const permissionDenied = /permission-denied|missing or insufficient permissions/i.test(rawMessage);
      const message = permissionDenied
        ? `Firestore denied access to the ${PLAN_RECORDS_COLLECTION} collection. The app code cannot override Firebase security rules. Add the ILAW lesson-plan rules to your existing Firestore rules and publish them, then sign in again. Details: ${rawMessage}`
        : `Unable to save the lesson plan to the database. Check your connection and database configuration. Details: ${rawMessage}`;
      setSavedMessage(message); setWorkflowMessage(message); setCloudMessage(message);
      await showMessageWindow({ title: "Save failed", message, mode: "info" });
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
      <section data-ilaw-section={number} className={`overflow-hidden rounded-xl border ${colors.border} border-l-4 ${colors.accent} bg-white shadow-sm`}>
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
          <fieldset disabled={controlsLocked} className="grid gap-3 p-4 min-w-0" aria-disabled={controlsLocked}>
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
    'Interventions and next steps are actionable and informed by reflection.': 'Maisasagawa ang mga interbensiyon at susunod na hakbang at nakabatay sa pagninilay.'
    };
    return dictionary[text] || text;
  };

  const currentTeacherEmail = String(currentUser?.email || "").trim().toLowerCase();
  const planListIdentity = (item: Plan) => [item.term || "1", item.week || "1"].map(value => String(value).trim()).join("::").toLowerCase();
  const isPlanApproved = (item: Plan) => submissions.some(submission =>
    submission.status === "approved" &&
    (!currentTeacherEmail || submission.teacherEmail === currentTeacherEmail) &&
    planListIdentity(submission.plan) === planListIdentity(item)
  );
  const editSavedPlan = (item: Plan) => {
    if (isPlanApproved(item)) return;
    openOrLoadPlan(item, "Lesson plan loaded from the database. Save your changes when finished.");
  };
  const clearSelectedLesson = async () => {
    if (isPlanApproved(plan)) {
      setWorkflowMessage("Approved lesson plans are locked and cannot be cleared.");
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
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LOCAL_META_KEY);
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
    setPlan(blankPlan());
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
    if (await showMessageWindow({ title: "Delete saved lesson plan?", message: `Delete the saved lesson plan “${title}”? This cannot be undone.`, mode: "confirm", confirmLabel: "Delete", danger: true }) !== true) return;
    const uid = String(currentUser?.uid || currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.profile?.uid || currentUser?.profile?.id || "").trim();
    if (!uid) {
      setSavedMessage("Please sign in before deleting a lesson plan from the database.");
      return;
    }
    try {
      await deleteDoc(doc(db, PLAN_RECORDS_COLLECTION, planRecordId(item, uid)));
      const next = savedPlans.filter(saved => planListIdentity(saved) !== planListIdentity(item));
      setSavedPlans(next);
      setSavedMessage("Lesson plan deleted from the database.");
      setCloudMessage("Database updated successfully.");
    } catch (error) {
      console.error("Could not delete ILAW lesson plan from database:", error);
      setSavedMessage("Could not delete the lesson plan from the database. Check your connection and permissions.");
    }
  };
  const teacherSubmissions = submissions
    .filter(item => item.teacherEmail === currentTeacherEmail && (item.status === "pending" || item.status === "approved" || item.status === "returned"))
    .sort((a, b) => new Date(b.reviewedAt || b.submittedAt).getTime() - new Date(a.reviewedAt || a.submittedAt).getTime());

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
    if (await showMessageWindow({ title: "Delete pending submission?", message: `Delete the pending submission “${title}”? This cannot be undone.`, mode: "confirm", confirmLabel: "Delete submission", danger: true }) !== true) return;
    persistSubmissions(submissions.filter(submission => submission.id !== item.id));
    const nextSavedPlans = savedPlans.filter(saved => planListIdentity(saved) !== planListIdentity(item.plan));
    setSavedPlans(nextSavedPlans);
    try {
      setWorkflowMessage("Pending submission deleted.");
    } catch {
      setWorkflowMessage("Submission deleted, but the saved-plan list could not be updated in this browser.");
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
      const updatedItem: Submission = { ...item, plan: updatedPlan, approvedSessionIds: [], status: "pending", reviewerNote: `Session ${sessionNumber} was deleted by the teacher after an approved request. Remaining sessions require review.` };
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

  // System administrators may remove either pending or approved submissions after confirmation.
  const deleteAdminSubmission = async (item: Submission) => {
    const title = item.plan.lessonTitle || `Term ${item.plan.term || "1"}, Week ${item.plan.week || "1"}`;
    if (await showMessageWindow({ title: "Delete lesson plan?", message: `System Admin: permanently delete the ${item.status} lesson plan “${title}” submitted by ${item.teacherName || item.teacherEmail || "the teacher"}? This cannot be undone.`, mode: "confirm", confirmLabel: "Delete permanently", danger: true }) !== true) return;
    const nextSubmissions = submissions.filter(submission => submission.id !== item.id);
    const nextSavedPlans = savedPlans.filter(saved => planListIdentity(saved) !== planListIdentity(item.plan));
    persistSubmissions(nextSubmissions);
    setSavedPlans(nextSavedPlans);
    try {
      setWorkflowMessage(`Deleted ${item.status} lesson plan: ${title}.`);
    } catch {
      setWorkflowMessage("Submission was deleted, but the saved-plan list could not be updated in this browser.");
    }
  };

  const chooseTermWeek = (term: string, week: string) => {
    setSelectedTerm(term);
    setSelectedWeek(week);
    setWorkflowMessage("");
    if (!term || !week) {
      setPlan(blankPlan());
      setHasStartedPlan(false);
      return;
    }
    // Prefer the latest teacher submission for this term/week, then a locally saved draft.
    const matchingSubmission = teacherSubmissions.find(item =>
      String(item.plan.term || "1") === term && String(item.plan.week || "1") === week
    );
    const matchingDraft = [...savedPlans].reverse().find(item =>
      String(item.term || "1") === term && String(item.week || "1") === week
    );
    const existingPlan = matchingSubmission?.plan || matchingDraft;
    if (existingPlan) {
      openOrLoadPlan({ ...existingPlan, term, week }, matchingSubmission
        ? `Loaded your ${matchingSubmission.status} lesson plan for Term ${term}, Week ${week}.`
        : `Loaded the saved lesson plan for Term ${term}, Week ${week}.`);
    } else {
      openOrLoadPlan({ ...blankPlan(), term, week }, `No existing lesson plan for Term ${term}, Week ${week}. A blank form is ready.`);
    }
  };

  const roleValue = String(currentUser?.role || currentUser?.userRole || currentUser?.accountType || currentUser?.userType || "").trim().toLowerCase().replace(/[ _-]+/g, "");
  const isSystemAdmin = isSystemAdminProp || currentUser?.isSystemAdmin === true || currentUser?.isAdmin === true || ["systemadmin", "admin", "administrator"].includes(roleValue);

  if (isSystemAdmin) {
    const adminSubmissions = submissions
      .filter(item => item.status === "pending" || item.status === "approved")
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
            <div className="w-full overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="border-b px-3 py-3">Request</th><th className="border-b px-3 py-3">Lesson Plan</th><th className="border-b px-3 py-3">Teacher</th><th className="border-b px-3 py-3">Reason</th><th className="border-b px-3 py-3">Requested</th><th className="border-b px-3 py-3">Action</th></tr></thead><tbody>{changeRequests.filter(request => request.status === "pending").map(request => <tr key={request.id} className="border-b border-slate-100"><td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${request.type === "edit" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>{request.type === "edit" ? "Edit request" : `Delete ${request.scope === "session" ? "session" : "whole week"}`}</span></td><td className="px-3 py-3 font-bold">{request.planTitle}{request.scope === "session" ? ` · ${request.sessionId || "session unspecified"}` : ""}</td><td className="px-3 py-3">{request.teacherName || "—"}<p className="text-xs text-slate-500">{request.teacherEmail}</p></td><td className="max-w-xs whitespace-pre-wrap px-3 py-3">{request.requestNote || "—"}</td><td className="whitespace-nowrap px-3 py-3">{new Date(request.requestedAt).toLocaleDateString()}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => reviewApprovedPlanChangeRequest(request, "approved")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-700">Approve {request.type === "edit" ? "Edit" : "Delete"}</button><button type="button" onClick={() => reviewApprovedPlanChangeRequest(request, "rejected")} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-50">Reject</button></div></td></tr>)}</tbody></table></div>}
          {changeRequests.some(request => request.status !== "pending") && <details className="border-t border-slate-100 px-4 py-3"><summary className="cursor-pointer text-sm font-bold text-slate-700">Request history ({changeRequests.filter(request => request.status !== "pending").length})</summary><div className="mt-3 space-y-2">{changeRequests.filter(request => request.status !== "pending").map(request => <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-xs"><span><strong>{request.type === "edit" ? "Edit" : "Delete"}</strong> · {request.planTitle} · {request.teacherName}</span><span className={request.status === "approved" ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>{request.status.toUpperCase()} {request.reviewerName ? `by ${request.reviewerName}` : ""}</span></div>)}</div></details>}
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-extrabold text-slate-900">All Pending and Approved Lesson Plans</h2><p className="mt-1 text-xs text-slate-500">Use the request queue above to approve or reject changes to approved plans.</p></div>
          {adminSubmissions.length === 0 ? <p className="p-6 text-sm text-slate-500">No pending or approved lesson plan submissions are available in this browser.</p> :
            <div className="w-full overflow-x-auto"><table className="w-full min-w-[980px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="border-b px-3 py-3">Term / Week</th><th className="border-b px-3 py-3">Lesson Title</th><th className="border-b px-3 py-3">Learning Area</th><th className="border-b px-3 py-3">Grade / Section</th><th className="border-b px-3 py-3">Teacher</th><th className="border-b px-3 py-3">Submitted</th><th className="border-b px-3 py-3">Status</th><th className="border-b px-3 py-3">Action</th></tr></thead><tbody>{adminSubmissions.map(item => <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="whitespace-nowrap px-3 py-3 font-semibold">Term {item.plan.term || "—"} · Week {item.plan.week || "—"}</td><td className="px-3 py-3 font-bold">{item.plan.lessonTitle || "Untitled lesson plan"}</td><td className="px-3 py-3">{item.plan.learningAreas || "—"}</td><td className="px-3 py-3">{item.plan.gradeSection || "—"}</td><td className="px-3 py-3">{item.teacherName || "—"}<p className="text-xs text-slate-500">{item.teacherEmail || "No email"}</p></td><td className="whitespace-nowrap px-3 py-3">{new Date(item.submittedAt).toLocaleDateString()}</td><td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${item.status === "approved" ? "bg-emerald-100 text-emerald-800" : item.status === "returned" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{item.status === "approved" ? "Approved" : item.status === "returned" ? "Returned for Revision" : "Pending"}</span>{item.reviewerName && <p className="mt-1 text-xs text-slate-500">By {item.reviewerName}</p>}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1.5">{item.status === "approved" && <button type="button" disabled={!changeRequests.some(request => request.submissionId === item.id && request.type === "edit" && request.status === "pending")} title={!changeRequests.some(request => request.submissionId === item.id && request.type === "edit" && request.status === "pending") ? "Teacher must submit an Edit request first." : "Approve the teacher's pending Edit request."} onClick={() => { const request = changeRequests.find(request => request.submissionId === item.id && request.type === "edit" && request.status === "pending"); if (request) reviewApprovedPlanChangeRequest(request, "approved"); }} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-extrabold text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"><Pencil size={13}/> Edit</button>}{item.status === "approved" ? (() => { const pendingDelete = changeRequests.find(request => request.submissionId === item.id && request.type === "delete" && request.status === "pending"); const approvedDelete = changeRequests.some(request => request.submissionId === item.id && request.type === "delete" && request.status === "approved"); return pendingDelete ? <button type="button" onClick={() => reviewApprovedPlanChangeRequest(pendingDelete, "approved")} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-50"><Trash2 size={13}/> Approve Delete</button> : approvedDelete ? <span className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Approved — teacher will delete</span> : <span className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500">No delete request</span>; })() : <button type="button" onClick={() => deleteAdminSubmission(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-50"><Trash2 size={13}/> Delete</button>}</div></td></tr>)}</tbody></table></div>}
        </section>
      </div>
    );
  }

  if (!hasStartedPlan && !isSchoolHead) {
    return (
      <div className="w-full min-w-0 space-y-4 text-slate-800">
        {messageWindow}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><BookOpen size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">ILAW Lesson Planning</p>
              <h1 className="text-xl font-black text-slate-900">ILAW Lesson Plans</h1>
              <p className="mt-1 text-sm text-slate-600">Select a Term and Week in the modal to create or open a lesson plan.</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowTermWeekModal(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700">
            <BookOpen size={17} /> Select Term and Week
          </button>
        </header>
        {(selectedTerm || selectedWeek) && <p className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm font-semibold text-indigo-800">Current selection: {selectedTerm ? `Term ${selectedTerm}` : "No term selected"} · {selectedWeek ? `Week ${selectedWeek}` : "No week selected"}</p>}
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
              <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Week Number <span className="text-rose-600">*</span></span>
                <select value={selectedWeek} onChange={e => chooseTermWeek(selectedTerm, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                  <option value="">Select Week Number</option>{Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={String(n)}>Week {n}</option>)}
                </select>
              </label>
            </div>
            {workflowMessage && <p role="status" className="mx-5 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">{workflowMessage}</p>}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowTermWeekModal(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
              {(() => {
                const hasExistingSelectedPlan = Boolean(selectedTerm && selectedWeek && (
                  teacherSubmissions.some(item => String(item.plan.term || "1") === selectedTerm && String(item.plan.week || "1") === selectedWeek) ||
                  savedPlans.some(item => String(item.term || "1") === selectedTerm && String(item.week || "1") === selectedWeek)
                ));
                return <button type="button" disabled={!selectedTerm || !selectedWeek} onClick={() => { chooseTermWeek(selectedTerm, selectedWeek); setActiveSessionTab("session-1"); setHasStartedPlan(true); setShowTermWeekModal(false); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"><BookOpen size={17} /> {hasExistingSelectedPlan ? "View Lesson Plan" : "Create ILAW Lesson Plan"}</button>;
              })()}
            </div>
          </div>
        </div>}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3"><div><h2 className="font-extrabold text-slate-900">My Lesson Plan Submissions</h2><p className="mt-0.5 text-xs text-slate-500">All your saved drafts, pending submissions, and approved lesson plans</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{teacherSubmissions.length + savedPlans.filter(draft => !teacherSubmissions.some(sub => planListIdentity(sub.plan) === planListIdentity(draft))).length} plans</span></div>
          {(teacherSubmissions.length === 0 && savedPlans.length === 0) ? <p className="p-5 text-sm text-slate-500">No lesson plans yet. Save a draft or submit a lesson plan to see it here.</p> :
            <div className="w-full overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="border-b px-3 py-3">Term / Week</th><th className="border-b px-3 py-3">Lesson Title</th><th className="border-b px-3 py-3">Learning Area</th><th className="border-b px-3 py-3">Date</th><th className="border-b px-3 py-3">Status</th><th className="border-b px-3 py-3">Action</th></tr></thead><tbody>
            {teacherSubmissions.map(item => <tr key={`submission-${item.id}`} className="border-b border-slate-100"><td className="whitespace-nowrap px-3 py-3 font-semibold">Term {item.plan.term || "1"} · Week {item.plan.week || "1"}</td><td className="px-3 py-3 font-bold">{item.plan.lessonTitle || "Untitled lesson plan"}</td><td className="px-3 py-3">{item.plan.learningAreas || "—"}</td><td className="whitespace-nowrap px-3 py-3">{new Date(item.submittedAt).toLocaleDateString()}</td><td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${item.status === "approved" ? "bg-emerald-100 text-emerald-800" : item.editApproved ? "bg-indigo-100 text-indigo-800" : (item.approvedSessionIds || []).length > 0 ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"}`}>{item.status === "approved" ? "All Sessions Approved" : item.editApproved ? "Edit Approved Plan · Changes Allowed" : (item.approvedSessionIds || []).length > 0 ? `Partially Approved (${(item.approvedSessionIds || []).length}/${(item.plan.sessions || []).length} sessions)` : item.status === "returned" ? "Returned for Revision" : "Pending"}</span><div className="mt-2 flex flex-wrap gap-1">{(item.plan.sessions || []).map((session, index) => { const isSessionApproved = (item.approvedSessionIds || []).includes(session.id); const note = item.sessionReviewNotes?.[session.id]; return <span key={session.id || index} title={note || (isSessionApproved ? "Approved by School Head" : "Awaiting School Head approval")} className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${isSessionApproved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>Session {index + 1}: {isSessionApproved ? "Approved" : "Pending"}</span>; })}</div>{item.reviewerName && <p className="mt-1 text-xs text-slate-500">Reviewed by {item.reviewerName}</p>}{item.reviewerNote && <p className="mt-1 max-w-xs whitespace-pre-wrap text-xs text-slate-500">Latest remarks: {item.reviewerNote}</p>}</td><td className="px-3 py-3"><div className="flex flex-wrap items-center gap-1.5"><button type="button" onClick={() => openOrLoadPlan(item.plan, `${item.status === "approved" ? "Approved" : "Pending"} lesson plan opened.`)} className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-50">View Plan</button>{item.status === "approved" && <><button type="button" onClick={() => requestApprovedPlanChange(item, "edit")} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-2 text-xs font-bold text-amber-800"><Pencil size={12}/> Request Edit</button>{changeRequests.some(request => request.submissionId === item.id && request.teacherEmail === currentTeacherEmail && request.type === "delete" && request.status === "approved") ? <button type="button" onClick={() => executeApprovedDeleteRequest(item)} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-rose-700"><Trash2 size={12}/> Complete Approved Delete</button> : <button type="button" disabled={changeRequests.some(request => request.submissionId === item.id && request.status === "pending")} onClick={() => requestApprovedPlanChange(item, "delete")} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={12}/> Request Delete</button>}</>}{(item.status !== "approved" || item.editApproved) && <><button type="button" onClick={() => editSubmission(item)} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-2 text-xs font-bold text-amber-800"><Pencil size={12}/> {item.editApproved ? "Edit Approved Plan" : "Edit"}</button><button type="button" onClick={() => deleteSubmission(item)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-bold text-rose-700"><Trash2 size={12}/> Delete</button></>}</div></td></tr>)}
            {savedPlans.filter(draft => !teacherSubmissions.some(sub => planListIdentity(sub.plan) === planListIdentity(draft))).map((item, i) => <tr key={`draft-${item.term}-${item.week}-${item.lessonTitle}-${i}`} className="border-b border-slate-100"><td className="whitespace-nowrap px-3 py-3 font-semibold">Term {item.term || "1"} · Week {item.week || "1"}</td><td className="px-3 py-3 font-bold">{item.lessonTitle || "Untitled lesson plan"}</td><td className="px-3 py-3">{item.learningAreas || "—"}</td><td className="whitespace-nowrap px-3 py-3">—</td><td className="px-3 py-3"><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-700">Draft</span></td><td className="px-3 py-3"><div className="flex flex-wrap items-center gap-1.5"><button type="button" onClick={() => openOrLoadPlan(item, "Draft opened.")} className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-extrabold text-indigo-700">Open Draft</button><button type="button" onClick={() => editSavedPlan(item)} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-2 text-xs font-bold text-amber-800"><Pencil size={12}/> Edit</button><button type="button" onClick={() => deleteSavedPlan(item)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-bold text-rose-700"><Trash2 size={12}/> Delete</button></div></td></tr>)}
            </tbody></table></div>}
        </section>
      </div>
    );
  }

  if (isSchoolHead) {
    const pendingSubmissions = submissions.filter(item => item.status === "pending");
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
          <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{isFilipino ? "Banghay-Aralin ng ILAW" : "ILAW Lesson Plan"}</p><h1 className="text-2xl font-black text-slate-900">School Head Approval</h1><p className="mt-1 text-sm text-slate-600">Approve or return each session independently. The lesson plan is marked fully approved only after every session is approved.</p></div>
          <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1.5 text-sm font-extrabold text-amber-800">{pendingSubmissions.length} Pending</span>
        </header>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-extrabold">Lesson Plans for Approval</h2></div>
          {pendingSubmissions.length === 0 ? <p className="p-6 text-sm text-slate-500">There are no lesson plans waiting for approval in this browser.</p> :
            <div className="w-full overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Term / Week</th><th className="px-4 py-3">Lesson Title</th><th className="px-4 py-3">Learning Area</th><th className="px-4 py-3">Grade / Section</th><th className="px-4 py-3">Teacher</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{pendingSubmissions.map(item => <tr key={item.id} className={viewingSubmissionId === item.id ? "bg-indigo-50/60" : "hover:bg-slate-50"}><td className="whitespace-nowrap px-4 py-3 font-semibold">Term {item.plan.term || "—"}<br/>Week {item.plan.week || "—"}</td><td className="px-4 py-3 font-bold">{item.plan.lessonTitle || "Untitled lesson plan"}</td><td className="px-4 py-3">{item.plan.learningAreas || "—"}</td><td className="px-4 py-3">{item.plan.gradeSection || "—"}</td><td className="px-4 py-3">{item.teacherName || "—"}<p className="text-xs text-slate-500">{item.teacherEmail}</p></td><td className="whitespace-nowrap px-4 py-3">{new Date(item.submittedAt).toLocaleDateString()}</td><td className="px-4 py-3"><button type="button" onClick={() => { setViewingSubmissionId(item.id); setReviewSessionIndex(0); setReviewNote(""); setReviewCoachingNote(String(item.plan.sessions?.[0]?.coachingNotes || "")); setWorkflowMessage(""); }} className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-50"><BookOpen size={14}/> View</button></td></tr>)}</tbody></table></div>}
        </section>
        {viewingSubmission && reviewPlan && <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Columnar Lesson Plan View</p><h2 className="text-xl font-black">{reviewPlan.lessonTitle || "Untitled lesson plan"}</h2><p className="mt-1 text-sm text-slate-600">Term {reviewPlan.term || "—"} · Week {reviewPlan.week || "—"} · {reviewPlan.learningAreas || "Learning area not specified"}</p></div><button type="button" onClick={() => setViewingSubmissionId(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700">Close View</button></div>
          <div className="w-full overflow-x-auto p-3 sm:p-5"><table className="w-full min-w-[680px] table-fixed border-collapse"><tbody>
            {columnRow("Term", `Term ${reviewPlan.term || "—"}`)}{columnRow("Week Number", `Week ${reviewPlan.week || "—"}`)}{columnRow("Lesson Title", reviewPlan.lessonTitle)}{columnRow("Learning Area/s", reviewPlan.learningAreas)}{columnRow("Grade Level and Section", reviewPlan.gradeSection)}{columnRow("Name of Teacher/s", reviewPlan.teacherNames || viewingSubmission.teacherName)}{columnRow("School Head / Principal", reviewPlan.schoolHeadName)}
            <tr><th colSpan={2} className="border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-sm font-extrabold text-indigo-900">Intention — Lesson Overview</th></tr>
            {columnRow("Learning Competency and Curriculum Standards", reviewPlan.competencyStandards)}{columnRow("Learner Context", reviewPlan.learnerContext)}{columnRow("AI Use Declaration", reviewPlan.aiDeclaration)}
            <tr><th colSpan={2} className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-sm font-extrabold text-emerald-900">Learning Experiences — Resources and Integration</th></tr>
            {columnRow("Learning Resources", reviewPlan.learningResources)}{columnRow("Opportunities for Integration", reviewPlan.integration)}
            <tr><th colSpan={2} className="border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-sm font-extrabold text-indigo-900">Session to Review — Full Session Content</th></tr>
            {(() => {
              const sessions = reviewPlan.sessions || [];
              const approvedIds = viewingSubmission.approvedSessionIds || [];
              const sessionEntries = sessions.map((session, index) => ({ session, index, isApproved: approvedIds.includes(session.id) }));
              const selectedEntry = sessionEntries.find(entry => entry.index === reviewSessionIndex) || sessionEntries.find(entry => !entry.isApproved) || sessionEntries[0];
              return sessionEntries.length > 0 ? <>
                <tr><th className="w-1/4 border border-slate-300 bg-slate-100 px-3 py-2 text-left align-top text-xs font-extrabold text-slate-700">Select Session</th><td className="border border-slate-300 px-3 py-2"><select value={String(selectedEntry.index)} onChange={e => { const nextIndex = Number(e.target.value); setReviewSessionIndex(nextIndex); setReviewCoachingNote(String(reviewPlan.sessions?.[nextIndex]?.coachingNotes || "")); }} className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{sessionEntries.map(({ session, index, isApproved }) => <option key={session.id || index} value={index}>{isApproved ? "Approved" : "Pending approval"} · Session {index + 1}{session.title ? ` — ${session.title}` : ""}</option>)}</select><div className="mt-2 flex flex-wrap gap-2">{sessionEntries.map(({ session, index, isApproved }) => <button key={session.id || index} type="button" onClick={() => { setReviewSessionIndex(index); setReviewCoachingNote(String(reviewPlan.sessions?.[index]?.coachingNotes || "")); }} className={`rounded-full px-3 py-1 text-xs font-extrabold ${isApproved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>Session {index + 1}: {isApproved ? "Approved" : "Pending"}</button>)}</div></td></tr>
                {(() => { const session = selectedEntry.session; const index = selectedEntry.index; const isApproved = selectedEntry.isApproved; return <><tr><th colSpan={2} className={`border px-3 py-2 text-left text-sm font-extrabold ${isApproved ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>Session {index + 1} Status: {isApproved ? "Approved" : "Pending Approval"}{viewingSubmission.sessionReviewNotes?.[session.id] ? ` — Remarks: ${viewingSubmission.sessionReviewNotes[session.id]}` : ""}</th></tr>{columnRow(`Session ${index + 1} — Title`, session.title)}{columnRow(`Session ${index + 1} — Learning Objectives`, session.objectives)}{columnRow(`Session ${index + 1} — Pre-Lesson`, session.preLesson)}{columnRow(`Session ${index + 1} — Learning Activities / Flow`, <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: /<[a-z][\s\S]*>/i.test(session.flow || "") ? assessmentHtml(session.flow || "") : flowMarkdownToHtml(session.flow || "") }} />)}{columnRow(`Session ${index + 1} — Formative Assessment`, <div className="ilaw-assessment-content" dangerouslySetInnerHTML={{ __html: assessmentHtml(session.assessment || reviewPlan.formativeAssessment || "") }} />)}{columnRow(`Session ${index + 1} — Extended Learning`, session.extendedLearning || reviewPlan.extendedLearning)}{columnRow(`Session ${index + 1} — Reflection`, session.reflection || reviewPlan.reflections)}{columnRow(`Session ${index + 1} — Ways Forward`, session.waysForward)}{columnRow(`Session ${index + 1} — Instructional Coaching Notes`, session.coachingNotes)}</>; })()}
              </> : <tr><td colSpan={2} className="border border-slate-300 bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-600">No sessions found in this lesson plan.</td></tr>;
            })()}
            {columnRow("References", reviewPlan.references)}
          </tbody></table></div>
          <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
            <h3 className="font-extrabold text-slate-900">Approval</h3>
            {(() => { const selectedSession = (reviewPlan.sessions || [])[reviewSessionIndex]; return selectedSession ? <div className="rounded-xl border border-indigo-200 bg-white p-4"><label className="block text-sm font-extrabold text-indigo-900">Instructional Coaching Notes — Session {reviewSessionIndex + 1}<span className="mt-1 block text-xs font-normal text-slate-600">These notes are written by the School Head and shared with the teacher in Section 06 — Rubric / Peer Coaching.</span><textarea value={reviewCoachingNote} onChange={e => setReviewCoachingNote(e.target.value)} rows={5} placeholder="Provide actionable coaching feedback, identify strengths and support needs, and agree on next steps." className="mt-3 w-full rounded-xl border border-indigo-200 bg-white p-3 text-sm font-normal focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"/></label><button type="button" onClick={() => saveReviewCoachingNotes(viewingSubmission, selectedSession.id, reviewCoachingNote)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-700"><Save size={15}/> Save Coaching Notes for Teacher</button></div> : null; })()}
            <label className="block text-sm font-bold text-slate-700">Remarks for this session (optional)<textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3} placeholder="Add approval or revision remarks for this session" className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal"/></label>
            {workflowMessage && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{workflowMessage}</p>}
            {(() => { const sessions = (reviewPlan.sessions || []).map((session, index) => ({ session, index, isApproved: (viewingSubmission.approvedSessionIds || []).includes(session.id) })); const selectedEntry = sessions.find(entry => entry.index === reviewSessionIndex) || sessions.find(entry => !entry.isApproved); const currentSession = selectedEntry?.session; const sessionNumber = selectedEntry ? selectedEntry.index + 1 : 0; const hasSessionSubmission = !!currentSession && [currentSession.title, currentSession.preLesson, currentSession.flow, currentSession.assessment, currentSession.extendedLearning, currentSession.reflection, currentSession.waysForward, currentSession.coachingNotes].some(value => String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim().length > 0); return currentSession && !selectedEntry.isApproved ? <><div className="flex flex-wrap gap-2"><button type="button" disabled={!hasSessionSubmission} title={!hasSessionSubmission ? "This session has no submitted content yet." : undefined} onClick={() => hasSessionSubmission && reviewSubmission(viewingSubmission, "approved", currentSession.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300"><CheckCircle2 size={17}/> Approve Session {sessionNumber}</button><button type="button" disabled={!hasSessionSubmission} title={!hasSessionSubmission ? "This session has no submitted content yet." : undefined} onClick={() => hasSessionSubmission && reviewSubmission(viewingSubmission, "returned", currentSession.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300"><RotateCcw size={16}/> Return This Session</button></div>{!hasSessionSubmission && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">Session {sessionNumber} has no submitted content. The Approve Session and Return This Session buttons are disabled until the teacher submits content for this session.</p>}</> : currentSession ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Session {sessionNumber} has already been approved. Select a pending session to review another session.</p> : <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">There are no sessions to review.</p>; })()}
          </div>
        </section>}
      </div>
    );
  }

  return (
    <div className="ilaw-print-document w-full min-w-0 max-w-none space-y-3 text-slate-800">
      {messageWindow}
      {/* Sticky Top Header Container (like in Gradebook): Header directly on top of Main Navigation */}
      <div className="no-print sticky top-0 z-40 -mx-4 -mt-4 mb-4 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-slate-900/95 md:-mx-6 md:-mt-6">
        {/* Header of ILAW Lesson Plan */}
        <header className="w-full min-w-0 max-w-none border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex w-full min-w-0 flex-col items-start justify-between gap-4 px-4 py-3 sm:px-6 md:flex-row md:items-center">
            <div className="flex w-full min-w-0 items-center gap-4 md:w-auto">
              {schoolLogo ? <img src={schoolLogo} alt="School logo" className="h-9 w-9 shrink-0 object-contain" referrerPolicy="no-referrer" onError={() => setSchoolLogo("")} /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><BookOpen size={19} /></div>}
              {depEdLogo && <img src={depEdLogo} alt="DepEd logo" className="h-9 w-9 shrink-0 object-contain" referrerPolicy="no-referrer" onError={() => setDepEdLogo("")} />}
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">{isFilipino ? "Lugar ng Pagpaplano ng Aralin" : "Lesson planning workspace"}</p>
                {schoolDisplayName && <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{schoolDisplayName}</p>}
                <h1 className="text-lg font-black leading-tight text-slate-900 dark:text-white">{isFilipino ? "Banghay-Aralin ng ILAW" : "ILAW Lesson Plan"}</h1>
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
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <span>{isFilipino ? "Wika" : "Language"}</span>
                <select value={language} onChange={e => setLanguage(e.target.value as "fil" | "en")} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <option value="fil">Filipino</option><option value="en">English</option>
                </select>
              </label>
              <button type="button" onClick={exportPlansToJson} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Download size={14}/> Export JSON</button>
              <button type="button" onClick={() => importFileRef.current?.click()} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Upload size={14}/> Import JSON</button>
              <input ref={importFileRef} type="file" accept=".json,application/json" className="hidden" onChange={e => void importPlansFromJson(e.target.files?.[0])}/>
              <button type="button" disabled={approvedEditMode} onClick={() => { setHasStartedPlan(false); setShowTermWeekModal(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><ArrowLeft size={15}/> Back to List</button>
              <button type="button" disabled={approvedEditMode} onClick={() => { setPlan(blankPlan()); setSelectedTerm(""); setSelectedWeek(""); setHasStartedPlan(false); setActiveSessionTab("session-1"); setWorkflowMessage(""); setSavedMessage(""); setObjectivesApplyTargetsBySession({}); setIntentionApplyTargetsBySession({}); flowDraftsRef.current = {}; }} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300"><BookOpen size={15}/> New Plan</button>
              <button type="button" onClick={() => void savePlan()} disabled={controlsLocked || (approvedEditMode && !approvedEditSubmissionId)} title={controlsLocked ? "This lesson plan is approved. Request and receive edit authorization before saving." : approvedEditMode ? "Save approved-plan edits to the existing submission" : "Save the complete ILAW Lesson Plan to the database"} className="no-print inline-flex items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-300"><Save size={16}/> {approvedEditMode ? "Save Changes" : "Save"}</button>
              <button type="button" disabled={controlsLocked || approvedEditMode} title={controlsLocked || approvedEditMode ? "Approved lesson plans cannot be cleared here." : "Clear the selected lesson plan"} onClick={clearSelectedLesson} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:bg-slate-800 dark:text-rose-400"><Trash2 size={14}/> Clear</button>
              <button type="button" onClick={() => openPdfPreview()} disabled={!isPlanApproved(plan)} title={isPlanApproved(plan) ? "Preview the school-head-approved lesson plan PDF" : "Preview PDF is available after the School Head approves this lesson plan"} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Printer size={15}/> Preview PDF</button>
            </div>
          </div>
        </header>

        {/* Main Navigation directly below the header */}
        <nav aria-label={isFilipino ? "Navigasyon sa mga bahagi ng banghay-aralin" : "Lesson plan section navigation"} className="flex w-full flex-wrap items-center gap-2 px-4 py-2 sm:px-6 bg-slate-50/80 dark:bg-slate-900/60">
          <span className="mr-1 text-xs font-extrabold uppercase tracking-wide text-slate-500">{isFilipino ? "Pumunta sa:" : "Jump to:"}</span>
          {[
            { number: "01", label: isFilipino ? "Impormasyon ng Aralin" : "Lesson Information" },
            { number: "03", label: "Lesson Proper" },
            { number: "06", label: "Rubric / Peer Coaching" },
            { number: "07", label: isFilipino ? "Pag-apruba" : "Approval" },
          ].map(item => (
            <button
              key={item.number}
              type="button"
              onClick={() => {
                setActiveNavigationSection(item.number);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-current={activeNavigationSection === item.number ? "page" : undefined}
              className={`rounded-lg border px-3 py-1.5 text-center text-xs font-bold transition ${
                activeNavigationSection === item.number
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-indigo-200 bg-indigo-50 text-indigo-800 hover:border-indigo-400 hover:bg-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300"
              }`}
            >
              {item.number}. {item.label}
            </button>
          ))}
        </nav>
      </div>

      {approvedEditMode && <div role="status" className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-900">System Admin authorized editing for this approved lesson plan. All lesson fields and formatting controls are enabled. Use <strong>Save Changes</strong> to update the existing approved submission; no reapproval is required.</div>}
      {savedMessage && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{savedMessage}</div>}
      {cloudMessage && <div role="status" className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800">{cloudMessage}</div>}
      <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-900">
        <strong>{isFilipino ? "Gabay sa draft:" : "Draft guidance:"}</strong> {isFilipino ? "Ihambing ang mga kasanayan sa opisyal na gabay sa kurikulum at repasuhin ang deklarasyon sa paggamit ng AI batay sa DO 3, s. 2026, Annex A." : "Check competencies against the official curriculum guide and review the AI-use declaration against DO 3, s. 2026, Annex A."}
        {currentUser?.displayName || currentUser?.name ? <span> Current user: {currentUser.displayName || currentUser.name}.</span> : null}
        {isSchoolHead ? <span> Reviewer access is available.</span> : null}
      </div>

      <div aria-label="ILAW section color legend" className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700">
        <span className="mr-1 text-slate-500">{isFilipino ? "Gabay sa Kulay ng ILAW:" : "ILAW color guide:"}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-sky-900"><span className="h-2.5 w-2.5 rounded-full bg-sky-600"/>{isFilipino ? "Impormasyon ng Aralin" : "Lesson Information"}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-violet-900"><span className="h-2.5 w-2.5 rounded-full bg-violet-600"/>{isFilipino ? "Intensiyon / Pagninilay" : "Intention / Reflection"}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-900"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600"/>{isFilipino ? "Lesson Proper" : "Lesson Proper"}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-900"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"/>{isFilipino ? "Coaching / Mga Susunod na Hakbang" : "Coaching / Ways Forward"}</span>
      </div>

      

      {section("01", "Lesson information", "Basic details for the lesson plan.", <div className="grid gap-4 md:grid-cols-2">
        <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Term</span><select value={plan.term} onChange={e => update("term", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">{[1,2,3,4].map(n => <option key={n} value={String(n)}>Term {n}</option>)}</select></label>
        <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Week</span><select value={plan.week} onChange={e => update("week", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">{Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={String(n)}>Week {n}</option>)}</select></label>
        {input("Lesson Title", "lessonTitle", "Enter lesson title")}
        <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Learning Area/s</span>
          <select value={plan.learningAreas} onChange={e => { const nextSubject = e.target.value; if (nextSubject !== plan.learningAreas) { update("learningAreas", nextSubject); clearSectionDependentContent(); setActiveSessionTab("session-1"); } }} disabled={(!sectionGradeFilter && !plan.gradeSection) || assignedSectionSubjects.length === 0} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50">
            <option value="">{(!sectionGradeFilter && !plan.gradeSection) ? "Select a grade level first" : assignedSectionSubjects.length ? "Select learning area" : "No subjects found for this grade level"}</option>
            {assignedSectionSubjects.map((subject, i) => <option key={`${subject}-${i}`} value={subject}>{subject}</option>)}
          </select>
          <span className="mt-1 block text-xs text-slate-500">All subjects listed for the selected grade level are shown here, regardless of teacher assignment. Changing the grade level refreshes the subject list; choose the learning area for this lesson.</span>
        </label>
        {input("Name of Teacher/s", "teacherNames", userDisplayName || "Enter teacher name")}
        <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Name of School Head / Principal</span><input disabled={controlsLocked} value={plan.schoolHeadName || ""} onChange={e => update("schoolHeadName", e.target.value)} placeholder={plan.schoolHeadName ? "" : schoolId ? "No principal found; enter name if needed" : "School ID missing; enter school head name"} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/><span className="mt-1 block text-xs text-slate-500">Automatically matched to the signed-in user's school ID. You can enter or correct the name if it is not found.</span></label>
        <div className="space-y-3">
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Filter by Grade Level</span>
            <select value={sectionGradeFilter} onChange={e => { setSectionGradeFilter(e.target.value); const allowed = sections.filter(section => !e.target.value || sectionGrade(section) === e.target.value).map(sectionLabel); const current = plan.gradeSection.split(",").map(value => value.trim()).filter(Boolean); if (current.some(value => !allowed.includes(value))) { setPlan(prev => ({ ...prev, gradeSection: current.filter(value => allowed.includes(value)).join(", "), learningAreas: "", lessonTitle: "", competencyStandards: "", objectives: "", learnerContext: "", preLesson: "", references: "", learningResources: "", integration: "", formativeAssessment: "", extendedLearning: "", reflections: "", coachingNotes: "", sessions: prev.sessions.map((_, index) => makeSession(`session-${index + 1}`)) })); setActiveSessionTab("session-1"); } }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">All grade levels</option>{availableSectionGrades.map(grade => <option key={grade} value={grade}>Grade {grade.replace(/^grade\s*/i, "")}</option>)}</select>
          </label>
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Filter by Subject</span>
            <select value={sectionSubjectFilter} onChange={e => { setSectionSubjectFilter(e.target.value); const next = sections.filter(section => (!sectionGradeFilter || sectionGrade(section) === sectionGradeFilter)); const names = next.filter(section => !e.target.value || (() => { const embedded = [section.subjects, section.assignedSubjects, section.subject, section.subjectName ? { subjectName: section.subjectName } : null].flatMap(value => !value ? [] : Array.isArray(value) ? value : typeof value === "string" ? [{ name: value }] : typeof value === "object" && (Array.isArray(value.subjects) || Array.isArray(value.assignedSubjects)) ? [...(value.subjects || []), ...(value.assignedSubjects || [])] : [value]); return embedded.some(record => subjectLabel(record).toLowerCase() === e.target.value.toLowerCase()) || assignedSubjects.some(record => { const subjectName = subjectLabel(record).toLowerCase(); const sectionId = String(record.sectionId || record.section_id || record.assignedSectionId || record.assigned_section_id || record.classSectionId || record.class_section_id || record.section?.id || record.section?.sectionId || record.section?.section_id || "").trim().toLowerCase(); const sectionName = String(record.sectionName || record.section_name || record.assignedSectionName || record.assigned_section_name || record.gradeSection || record.section?.name || record.section?.sectionName || (typeof record.section === "string" ? record.section : "")).trim().toLowerCase(); return subjectName === e.target.value.toLowerCase() && ((sectionId && [sectionKey(section), String(section.sectionId || section.section_id || "").trim().toLowerCase()].includes(sectionId)) || (sectionName && [sectionLabel(section).toLowerCase(), sectionKey(section)].includes(sectionName)) || (!sectionId && !sectionName && String(record.gradeLevel ?? record.grade ?? record.grade_level ?? "").trim() === sectionGrade(section))); }); })()).map(sectionLabel); const current = plan.gradeSection.split(",").map(value => value.trim()).filter(Boolean); if (current.some(value => !names.includes(value))) { setPlan(prev => ({ ...prev, gradeSection: current.filter(value => names.includes(value)).join(", "), learningAreas: "", lessonTitle: "", competencyStandards: "", objectives: "", learnerContext: "", preLesson: "", references: "", learningResources: "", integration: "", formativeAssessment: "", extendedLearning: "", reflections: "", coachingNotes: "", sessions: prev.sessions.map((_, index) => makeSession(`session-${index + 1}`)) })); setActiveSessionTab("session-1"); } }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">All subjects</option>{sectionSubjectOptions.map(subject => <option key={subject} value={subject}>{subject}</option>)}</select>
          </label>
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Grade Level and Section</span>
            <select multiple value={plan.gradeSection.split(",").map(value => value.trim()).filter(Boolean)} onChange={e => { const selected = Array.from(e.currentTarget.selectedOptions).map((option: HTMLOptionElement) => option.value); const nextSections = selected.join(", "); setPlan(prev => ({ ...prev, gradeSection: nextSections, learningAreas: "", lessonTitle: "", competencyStandards: "", objectives: "", learnerContext: "", preLesson: "", references: "", learningResources: "", integration: "", formativeAssessment: "", extendedLearning: "", reflections: "", coachingNotes: "", sessions: prev.sessions.map((_, index) => makeSession(`session-${index + 1}`)) })); setActiveSessionTab("session-1"); setWorkflowMessage(""); }} className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
              {filteredSectionOptions.map((section, i) => { const label = sectionLabel(section); const grade = sectionGrade(section); const display = grade && !label.toLowerCase().includes(grade.toLowerCase()) ? `Grade ${grade.replace(/^grade\s*/i, "")} - ${label}` : label; return <option key={`${sectionKey(section)}-${i}`} value={label}>{display}</option>; })}
            </select>
            <span className="mt-1 block text-xs text-slate-500">Sections are filtered by the selected grade level and subject. Select one or more sections (hold Ctrl on Windows or Command on Mac).</span>
            {filteredSectionOptions.length === 0 && <span className="mt-1 block text-xs font-semibold text-amber-700">No sections match these filters. Try another grade level or subject.</span>}
          </label>
        </div>
        <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Number of Sessions</span><select value={plan.noOfSessions} onChange={e => {
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
          <option value="1">1 session</option>
          <option value="2">2 sessions</option>
          <option value="3">3 sessions</option>
          <option value="4">4 sessions</option>
          <option value="5">5 sessions</option>
        </select></label>
        {field("References (books, websites, toolkits, etc.)", "references", "List references and links.", 2)}
        <div className="md:col-span-2">{field("Declaration of AI use", "aiDeclaration", "Cite how AI was used. Refer to DO 3, s. 2026, Annex A.", 3)}</div>
      </div>)}



      {false && section("02", "Intention", "Decide what learners should master, and plan around their context.", <>
        {field("Learning Competency and Curriculum Standards", "competencyStandards", "Write the applicable curriculum competency/ies and content or performance standards.", 4)}
        {field("Learning Objectives", "objectives", "List the knowledge, skills, or tasks learners should demonstrate by the end of the sessions. Make objectives observable.", 4)}
        {field("Learner Context", "learnerContext", "Describe recent performance, strengths, interests, and possible barriers to learning.", 4)}
      </>)}

      <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
        <div className="mb-3 border-b border-indigo-200 pb-2">
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-indigo-900">02. Intention — Shared Across All Sessions</h4>
          <p className="mt-1 text-xs text-slate-600">Complete the competency standards and learner context once. Write separate Learning Objectives inside each session.</p>
        </div>
        <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-slate-700">Learning Competency and Curriculum Standards</span><textarea disabled={controlsLocked} rows={3} value={plan.competencyStandards || ""} onChange={e => { const value = e.target.value; const sourceId = plan.sessions[currentSessionIndex]?.id || plan.sessions[0]?.id || "session-1"; const linkedTargetIds = intentionApplyTargetsBySession[sourceId] || []; setPlan(prev => ({ ...prev, competencyStandards: value, sessions: prev.sessions.map(session => (session.id === sourceId || linkedTargetIds.includes(session.id)) ? ({ ...session, competencyStandards: value }) : session) })); }} placeholder="Enter the learning competency and relevant curriculum/content/performance standards for the entire lesson." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
        <label className="block"><span className="mb-1 block text-xs font-bold text-slate-700">Learner Context</span><textarea disabled={controlsLocked} rows={3} value={plan.learnerContext || ""} onChange={e => { const value = e.target.value; const sourceId = plan.sessions[currentSessionIndex]?.id || plan.sessions[0]?.id || "session-1"; const linkedTargetIds = intentionApplyTargetsBySession[sourceId] || []; setPlan(prev => ({ ...prev, learnerContext: value, sessions: prev.sessions.map(session => (session.id === sourceId || linkedTargetIds.includes(session.id)) ? ({ ...session, learnerContext: value }) : session) })); }} placeholder="Describe the learners' prior knowledge, strengths, needs, and possible barriers relevant to the whole lesson." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
        {plan.sessions.length > 1 && currentSessionIndex >= 0 && <div className="mt-3 rounded-lg border border-indigo-100 bg-white p-3">
          <p className="mb-2 text-xs font-bold text-indigo-900">Apply this Intention to selected sessions</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {plan.sessions.map((session, index) => {
              const currentSessionId = plan.sessions[currentSessionIndex]?.id || plan.sessions[0]?.id || "session-1";
              if (index === currentSessionIndex) return null;
              return (
                <label key={session.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={(intentionApplyTargetsBySession[currentSessionId] || []).includes(session.id)}
                    disabled={controlsLocked}
                    onChange={e => {
                      const sourceId = currentSessionId;
                      const targetId = session.id;
                      const checked = e.target.checked;
                      const existing = intentionApplyTargetsBySession[sourceId] || [];
                      const nextTargets = {
                        ...intentionApplyTargetsBySession,
                        [sourceId]: checked ? [...existing.filter(id => id !== targetId), targetId] : existing.filter(id => id !== targetId)
                      };
                      setIntentionApplyTargetsBySession(nextTargets);
                      setPlan(prev => ({
                        ...prev,
                        intentionApplyTargetsBySession: nextTargets,
                        ...(checked ? { sessions: prev.sessions.map(item => item.id === targetId ? { ...item, competencyStandards: prev.competencyStandards || "", learnerContext: prev.learnerContext || "" } : item) } : {})
                      }));
                    }}
                    className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Session {index + 1}
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">Select sessions to receive these shared Intention fields. Checked sessions stay synchronized when you edit the competency standards or learner context above.</p>
        </div>}
      </div>

      <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
        <div className="mb-3 border-b border-indigo-200 pb-2">
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-indigo-900">Learning Objectives — By Session</h4>
          <p className="mt-1 text-xs text-slate-600">Set the objectives for each session before planning its learning experiences.</p>
        </div>
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Lesson session tabs">
          {plan.sessions.map((s, i) => {
            const allowed = canOpenSessionTab(i);
            const active = activeSessionTab === s.id;
            return <button key={s.id} type="button" role="tab" aria-selected={active} disabled={!allowed} onClick={() => { if (allowed) { setActiveSessionTab(s.id); setWorkflowMessage(""); } }} className={`rounded-xl border px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}>Session {i + 1}{s.reflection?.trim() ? " ✓" : ""}</button>;
          })}
        </div>
        {currentSessionIndex >= 0 && <div>
          <label className="block"><span className="mb-1 block text-xs font-bold text-indigo-800">Learning Objectives — Session {currentSessionIndex + 1}</span><textarea disabled={controlsLocked} rows={4} value={plan.sessions[currentSessionIndex]?.objectives || ""} onChange={e => {
            const value = e.target.value;
            const sourceId = plan.sessions[currentSessionIndex]?.id || plan.sessions[0]?.id || "session-1";
            const linkedTargetIds = objectivesApplyTargetsBySession[sourceId] || [];
            setPlan(prev => ({ ...prev, sessions: prev.sessions.map(session => session.id === sourceId || linkedTargetIds.includes(session.id) ? ({ ...session, objectives: value }) : session) }));
          }} placeholder="Write clear, measurable learning objectives for this session. Use observable action verbs and align them with the session activities and assessment." className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm" /></label>
          {plan.sessions.length > 1 && <div className="mt-3 rounded-lg border border-indigo-100 bg-white p-3">
            <p className="mb-2 text-xs font-bold text-indigo-900">Apply these objectives to selected sessions</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {plan.sessions.map((session, index) => {
                const currentSessionId = plan.sessions[currentSessionIndex]?.id || plan.sessions[0]?.id || "session-1";
                if (index === currentSessionIndex) return null;
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
            <p className="mt-2 text-xs text-slate-500">Each session has its own checkbox. Selected sessions receive these objectives now and stay synchronized when you edit the current session's objectives.</p>
          </div>}
        </div>}
      </div>

      {section("03", "Lesson Proper", "Plan the pre-lesson activities, lesson flow, assessment, and ways forward for each session.", <>
        <div className="space-y-4">
          {/* Section 03 Session Tabs: always keep single session selected */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lesson Proper session tabs">
            {plan.sessions.map((s, i) => {
              const allowed = canOpenSessionTab(i);
              const active = activeSessionTab === s.id;
              return (
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
              );
            })}
          </div>

          {currentSessionIndex >= 0 && <div role="tabpanel" className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h4 className="font-extrabold text-indigo-900">Session {currentSessionIndex + 1}</h4><p className="text-xs text-slate-500">Complete this session's Reflection to unlock the next session.</p></div><span className="rounded-lg border border-indigo-200 bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-800">{currentSessionIndex + 1} of {plan.sessions.length}</span></div>
            <div className="mb-3 border-b border-slate-200 pb-2">
              <h5 className="text-sm font-extrabold uppercase tracking-wide text-emerald-800">03. Lesson Proper</h5>
            </div>
            <label className="mb-4 block"><span className="mb-1 block text-xs font-bold text-violet-800">Lesson Plan Sequence for Pre-Lesson and Flow</span><select disabled={controlsLocked} value={plan.sessions[currentSessionIndex]?.flowSequence || ""} onChange={e => { const sessionId = plan.sessions[currentSessionIndex]?.id || plan.sessions[0]?.id || "session-1"; const key = e.target.value; const template = FLOW_SEQUENCE_TEMPLATES[key]; updateSession(sessionId, "flowSequence", key); if (template) { updateSession(sessionId, "preLesson", template.preLesson); updateSession(sessionId, "flow", template.flow); flowDraftsRef.current[sessionId] = template.flow; } }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Select a lesson sequence…</option>{Object.entries(FLOW_SEQUENCE_TEMPLATES).map(([key, template]) => <option key={key} value={key}>{template.label}</option>)}</select><p className="mt-1 text-xs text-slate-500">Selecting a sequence automatically fills both Pre-Lesson and Flow. You can edit the generated text to fit your lesson.</p></label>
            <label className="mb-4 block"><span className="mb-1 block text-xs font-bold text-violet-800">Pre-Lesson activities for Session {currentSessionIndex + 1}</span><textarea disabled={controlsLocked} rows={5} value={plan.sessions[currentSessionIndex]?.preLesson || ""} onChange={e => updateSession(plan.sessions[currentSessionIndex]?.id || "session-1", "preLesson", e.target.value)} placeholder="Prepare learners, activate prior knowledge, clarify objectives, and check readiness for this session." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
            <label className="mb-4 block"><span className="mb-1 block text-xs font-bold text-slate-600">Session focus / duration</span><input disabled={controlsLocked} value={plan.sessions[currentSessionIndex]?.title || ""} onChange={e => updateSession(plan.sessions[currentSessionIndex]?.id || "session-1", "title", e.target.value)} placeholder="e.g. Guided exploration — 45 minutes" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"/></label>
            <div className="mb-4 block">
              <label htmlFor="ilaw-session-flow" className="mb-1 block text-xs font-bold text-slate-600">Flow</label>
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
                placeholder="Select a lesson sequence above to automatically add a suggested Flow, or write your own steps. Use a new line for each activity."
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              />
              <p className="mt-1 text-xs text-slate-500">Enter the lesson flow as plain text. Use separate lines for each activity or step. Your text is saved with the session and displayed in the report and School Head review.</p>
            </div>
            <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
              <h5 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-sky-900">04. Assessment — Session {currentSessionIndex + 1}</h5>
              <label className="block"><span className="mb-1 block text-xs font-bold text-slate-700">Formative Assessment</span><textarea disabled={controlsLocked} rows={5} value={plan.sessions[currentSessionIndex].assessment || ""} onChange={e => updateSession(plan.sessions[currentSessionIndex].id, "assessment", e.target.value)} placeholder="Questions, observation notes, exit tickets, success criteria, or evidence of learning for this session." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="mb-3 border-b border-emerald-200 pb-2"><h4 className="text-sm font-extrabold uppercase tracking-wide text-emerald-800">{isFilipino ? "Kagamitang Pampagkatuto at mga Pagkakataon para sa Integrasyon" : "Learning Resources and Opportunities for Integration"}</h4><p className="mt-1 text-xs text-slate-600">{isFilipino ? "Ilagay dito ang mga kagamitang gagamitin at mga ugnayan sa ibang asignatura o paksa." : "Enter the materials learners will use and meaningful links to other learning areas or topics."}</p></div>
          {field("Learning Resources", "learningResources", "List available, inclusive materials and alternatives for emergencies or limited connectivity.", 3)}
          {field("Opportunities for integration", "integration", "Meaningful links to another learning area, special topic, or technology; write N/A if none.", 3)}
        </div>
            </div>
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <h5 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-amber-900">05. Ways Forward — Session {currentSessionIndex + 1}</h5>
              <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-slate-700">Ways Forward / Next Steps</span><textarea disabled={controlsLocked} rows={4} value={plan.sessions[currentSessionIndex].waysForward || ""} onChange={e => updateSession(plan.sessions[currentSessionIndex].id, "waysForward", e.target.value)} placeholder="Plan reteaching, enrichment, learner support, referrals, or adjustments based on the assessment." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
              <label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-slate-700">Extended Learning Opportunities</span><textarea disabled={controlsLocked} rows={3} value={plan.sessions[currentSessionIndex].extendedLearning || ""} onChange={e => updateSession(plan.sessions[currentSessionIndex].id, "extendedLearning", e.target.value)} placeholder="Practice, enrichment, or support beyond this session." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold text-violet-800">Reflection (required to proceed)</span><textarea disabled={controlsLocked} rows={3} value={plan.sessions[currentSessionIndex].reflection || ""} onChange={e => { updateSession(plan.sessions[currentSessionIndex].id, "reflection", e.target.value); setWorkflowMessage(""); }} placeholder="What did learners understand? What needs reteaching or adjusting?" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
            </div>
            {workflowMessage && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{workflowMessage}</p>}
            <div className="mt-4 flex justify-start gap-2"><button type="button" disabled={currentSessionIndex === 0} onClick={() => setActiveSessionTab(plan.sessions[currentSessionIndex - 1].id)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-40">← Previous Session</button></div>
          </div>}
        </div>
        {currentSessionIndex >= 0 && currentSessionIndex < plan.sessions.length - 1 && <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={controlsLocked || !String(plan.sessions[currentSessionIndex]?.reflection || "").trim()}
            onClick={goToNextSessionTab}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {`Proceed to Session ${currentSessionIndex + 2} →`}
          </button>
        </div>}
        <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => {
              setActiveNavigationSection("07");
              window.setTimeout(() => {
                document.querySelector("[data-ilaw-submission]")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Proceed to 07. Approval <ArrowRight size={16} />
          </button>
        </div>
      </>) }

      {false && section("04", isFilipino ? "Pagtataya" : "Assessment", "Formative Assessment", <>
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
          <h4 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-sky-900">04 · Assessment</h4>
          <p className="mb-4 text-xs text-slate-600">Record the formative assessment for each session. Use the editor toolbar to format responses and insert tables.</p>
          {field("Formative Assessment — Overall", "formativeAssessment", "Describe the formative assessment approach, evidence of learning, and success criteria.", 4)}
        </div>
        <div className="space-y-4">
          {plan.sessions.map((session, index) => <div key={session.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 font-extrabold text-sky-900">Session {index + 1}{session.title ? ` — ${session.title}` : ""}</h4>
            <label className="mb-2 block"><span className="mb-1 block text-sm font-bold text-slate-700">Formative Assessment</span><textarea disabled={controlsLocked} rows={5} value={session.assessment || ""} onChange={e => updateSession(session.id, "assessment", e.target.value)} placeholder="Questions, observation notes, exit tickets, success criteria, or learner evidence..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" /></label>
          </div>)}
        </div>
      </>)}

      {section("06", "RUBRIC FOR LESSON PLANNING SELF-CHECK AND/OR PEER COACHING", "Use this rubric before submitting the lesson plan or during peer coaching.", <>
        <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="mb-3 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><ClipboardCheck size={17}/></span><div><h3 className="font-extrabold text-indigo-900">{isFilipino ? "Mga Tala para sa Instructional Coaching" : "Instructional Coaching Notes"}</h3><p className="text-xs text-slate-600">{isFilipino ? "Isinusulat ng School Head ang mga tala sa pagsusuri at makikita ito ng guro rito matapos ma-save at mag-sync." : "Written by the School Head in the review panel. Saved notes are shared here with the teacher after syncing."}</p></div></div>
          <div className="space-y-4">
            {plan.sessions.map((session, index) => <label key={session.id} className="block rounded-lg border border-indigo-100 bg-white p-3"><span className="mb-1 block text-sm font-bold text-indigo-900">{isFilipino ? "Sesyon" : "Session"} {index + 1}{session.title ? ` — ${session.title}` : ""}</span><textarea disabled readOnly rows={4} value={session.coachingNotes || ""} placeholder={isFilipino ? "Lalabas dito ang tala ng School Head matapos itong i-save sa pagsusuri." : "School Head coaching notes will appear here after they are saved in the review panel."} className="w-full rounded-lg border border-indigo-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed" /></label>)}
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
          ].map((item, i) => <SelfCheckRow key={item} item={isFilipino ? ({ "Intentions and appropriate learning competencies are clearly stated.": "Malinaw na nakasaad ang mga layunin at angkop na kasanayang pampagkatuto.", "Intentions are evident across all sections; the plan is coherent.": "Makikita ang mga layunin sa lahat ng bahagi; magkakaugnay ang banghay-aralin.", "Another teacher can implement the learning experience without additional explanation.": "Maaaring maisagawa ng ibang guro ang karanasan sa pagkatuto nang walang karagdagang paliwanag.", "Learning Design Principles are intentionally embedded.": "Sadyang isinama ang mga Prinsipyo ng Disenyo ng Pagkatuto.", "Meaningful integration opportunities are maximized.": "Napakinabangan ang mga makabuluhang pagkakataon para sa integrasyon.", "The plan supports learners with disabilities, barriers, and varied contexts.": "Sinusuportahan ng banghay-aralin ang mga mag-aaral na may kapansanan, hadlang sa pagkatuto, at magkakaibang konteksto.", "Assessment strategies are integrated throughout the session.": "Isinama ang mga estratehiya sa pagtataya sa buong sesyon.", "Assessment produces evidence of whether learning was successful.": "Nagbibigay ang pagtataya ng ebidensiya kung naging matagumpay ang pagkatuto.", "Interventions and next steps are actionable and informed by reflection.": "Maisasagawa ang mga interbensiyon at susunod na hakbang at nakabatay sa pagninilay." } as Record<string, string>)[item] || item : item} index={i} isFilipino={isFilipino}/>)}
        </div>
      </>)}

      {false && section("05", isFilipino ? "Mga Susunod na Hakbang" : "Ways Forward", isFilipino ? "Itala ang mga susunod na hakbang para sa bawat sesyon." : "Record actionable next steps for each session, including reteaching, enrichment, and learner support.", <>
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <h4 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-amber-900">05 · Ways Forward</h4>
          <p className="text-xs text-slate-600">Complete the next steps for each session. These entries are saved with the corresponding session and included in the lesson plan printout.</p>
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
              <label className="block"><span className="mb-1 block text-xs font-bold text-amber-800">Ways Forward for Session {index + 1}</span><textarea disabled={controlsLocked} rows={4} value={session.waysForward || ""} onChange={e => updateSession(session.id, "waysForward", e.target.value)} placeholder="Next steps: reteaching, enrichment, learner support, referrals, or adjustments for the next lesson..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"/></label>
              <label className="mt-3 block"><span className="mb-1 block text-xs font-bold text-amber-800">Extended learning opportunities</span><textarea disabled={controlsLocked} rows={3} value={session.extendedLearning || ""} onChange={e => updateSession(session.id, "extendedLearning", e.target.value)} placeholder="Practice, enrichment, or support beyond this session..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
              <label className="mt-3 block"><span className="mb-1 block text-xs font-bold text-violet-800">Reflections (required to proceed)</span><textarea disabled={controlsLocked} rows={3} value={session.reflection || ""} onChange={e => { updateSession(session.id, "reflection", e.target.value); setWorkflowMessage(""); }} placeholder="What did learners understand? What needs reteaching or adjusting?" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
              <div className="mt-4 flex justify-between gap-2"><button type="button" disabled={index === 0} onClick={() => setActiveWaysForwardSessionIndex(index - 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-40">← Previous Session</button><button type="button" disabled={index >= plan.sessions.length - 1} onClick={() => setActiveWaysForwardSessionIndex(index + 1)} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Next Session →</button></div>
            </div>;
          })()}
        </div>
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
          <h4 className="mb-2 font-extrabold text-violet-900">Overall Reflections</h4>
          {field("Reflections", "reflections", "After teaching all sessions: what changed in learner understanding? What should be adjusted, extended, or shared?", 5)}
        </div>
      </>)}

      {activeNavigationSection === "07" && <section data-ilaw-submission className="no-print rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-800">Submission and Approval</h3>
            <p className="mt-1 text-sm text-slate-500">Submit the current lesson plan for review by the school head.</p>
          </div>
          <button type="button" disabled={controlsLocked || approvedEditMode} title={controlsLocked ? "This lesson plan is already approved and cannot be submitted again." : approvedEditMode ? "Save changes to the existing approved lesson plan; no reapproval is required." : "Submit the lesson plan for School Head approval."} onClick={submitForApproval} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"><Send size={16}/> {approvedEditMode ? "Save Changes first" : "Submit for Approval"}</button>
        </div>
        {workflowMessage && <p role="status" className="mt-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-800">{workflowMessage}</p>}
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h4 className="font-extrabold text-emerald-900">My Approved Lesson Plans</h4><p className="mt-1 text-xs text-slate-600">Approved lesson plans submitted by your account. Open a plan to load it into the print-ready lesson template.</p></div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">{submissions.filter(x => x.status === "approved" && x.teacherEmail === String(currentUser?.email || "").trim().toLowerCase()).length} Approved</span>
          </div>
          {submissions.filter(x => x.status === "approved" && x.teacherEmail === String(currentUser?.email || "").trim().toLowerCase()).length === 0
            ? <p className="mt-3 rounded-lg border border-emerald-100 bg-white p-3 text-sm text-slate-500">No approved lesson plans are available for your account yet.</p>
            : <div className="mt-3 space-y-2">{submissions.filter(x => x.status === "approved" && x.teacherEmail === String(currentUser?.email || "").trim().toLowerCase()).sort((a, b) => new Date(b.reviewedAt || b.submittedAt).getTime() - new Date(a.reviewedAt || a.submittedAt).getTime()).map(x => <div key={x.id} className="flex flex-col gap-3 rounded-lg border border-emerald-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="font-bold text-slate-800">{x.plan.lessonTitle || "Untitled lesson plan"}</p><p className="mt-1 text-xs text-slate-500">Term {x.plan.term || "—"} · Week {x.plan.week || "—"} · {x.plan.learningAreas || "Learning area not specified"} · {x.plan.gradeSection || "Section not specified"}</p><p className="mt-1 text-xs text-emerald-700">Approved by {x.reviewerName || "School Head"}{x.reviewedAt ? ` · ${new Date(x.reviewedAt).toLocaleDateString()}` : ""}</p>{x.reviewerNote && <p className="mt-1 text-xs text-slate-600">Remarks: {x.reviewerNote}</p>}</div>
              <div className="no-print flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={() => { const previewWindow = window.open("", "_blank"); if (!previewWindow) { void showMessageWindow({ title: "Pop-up blocked", message: "Please allow pop-ups for this site to view the approved ILAW PDF preview.", mode: "info" }); return; } previewWindow.document.write('<!doctype html><title>Preparing ILAW PDF Preview</title><body style="font:16px Arial,sans-serif;padding:32px">Preparing approved ILAW Lesson Plan…</body>'); pendingApprovedPdfWindowRef.current = previewWindow; openOrLoadPlan(x.plan); setPreviewApprovedPlanOnRender(true); setWorkflowMessage(`Viewing approved ILAW Lesson Plan: ${x.plan.lessonTitle || "Untitled lesson plan"}. Use Print to save it as PDF.`); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"><Printer size={14}/> View PDF / Print</button>
                <button type="button" onClick={() => openOrLoadPlan(x.plan, `Loaded approved lesson plan: ${x.plan.lessonTitle || "Untitled lesson plan"}.`)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100"><BookOpen size={14}/> Load to Editor</button>
              </div>
            </div>)}</div>}
        </div>
        <div className="mt-4 rounded-xl border border-slate-100 p-4">
          <h4 className="font-bold text-slate-800">{isFilipino ? "Aking mga isinumite" : "My submissions"}</h4>
          {submissions.filter(x => x.teacherEmail === String(currentUser?.email || "").trim().toLowerCase()).length === 0
            ? <p className="mt-2 text-sm text-slate-500">No submissions saved in this browser yet.</p>
            : <div className="mt-2 space-y-2">{submissions.filter(x => x.teacherEmail === String(currentUser?.email || "").trim().toLowerCase()).map(x => <div key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"><span className="font-semibold">{x.plan.lessonTitle || "Untitled lesson plan"}</span><span className="capitalize">{x.status} · {new Date(x.submittedAt).toLocaleString()}</span>{x.reviewerSignature && <span className="text-emerald-700">Signature attached</span>}{(x.plan.sessions || []).some(session => String(session.coachingNotes || "").trim()) && <button type="button" onClick={() => { openOrLoadPlan(x.plan, "School Head Instructional Coaching Notes loaded in Section 06 — Rubric / Peer Coaching."); setActiveNavigationSection("06"); }} className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-extrabold text-indigo-700 hover:bg-indigo-50">View Coaching Notes</button>}</div>)}</div>}
        </div>
        {isSchoolHead && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h4 className="font-extrabold text-slate-800">{isFilipino ? "Pagsusuri ng Punong-Guro" : "School Head Review"}</h4>
          <textarea disabled value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={2} placeholder="Optional notes for the teacher" className="mt-3 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"/>
          <div className="mt-3 space-y-3">{submissions.filter(x => x.status === "pending").length === 0 ? <p className="text-sm text-slate-500">No pending submissions stored in this browser.</p> : submissions.filter(x => x.status === "pending").map(x => <div key={x.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold">{x.plan.lessonTitle || "Untitled lesson plan"}</p><p className="text-xs text-slate-500">By {x.teacherName} · {x.teacherEmail || "No email"} · {new Date(x.submittedAt).toLocaleString()}</p></div><div className="flex gap-2"><button type="button" onClick={() => openOrLoadPlan(x.plan, `Loaded ${x.teacherName}'s lesson plan.`)} className="rounded-lg border px-3 py-1.5 text-xs font-bold">Load plan</button><button type="button" onClick={() => reviewSubmission(x, "approved")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"><CheckCircle2 size={13}/> Approve</button><button type="button" onClick={() => reviewSubmission(x, "returned")} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"><RotateCcw size={13}/> Return</button></div></div>
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
          <tr><th>{isFilipino ? "Paksa" : "Lesson Title"}</th><td>{plan.lessonTitle}</td><th>{isFilipino ? "Asignatura" : "Learning Area"}</th><td>{plan.learningAreas}</td></tr>
          <tr><th>{isFilipino ? "Pangalan ng Guro/mga Guro" : "Teacher Name(s)"}</th><td>{plan.teacherNames || userDisplayName || "—"}</td><th>{isFilipino ? "Baitang at Seksyon" : "Grade Level and Section"}</th><td>{plan.gradeSection}</td></tr>
          <tr><th>{isFilipino ? "Pangalan ng Punong-Guro" : "School Head / Principal Name"}</th><td colSpan={3}>{plan.schoolHeadName || "—"}</td></tr>
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
                {row("Mga Layunin sa Pagkatuto", "Learning Objectives", s => s.objectives)}
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
        <div className="deped-signatures"><div>{isFilipino ? "Inihanda ni:" : "Prepared by:"}<br/><br/><strong>{plan.teacherNames || "____________________________"}</strong><br/>{isFilipino ? "Guro" : "Teacher"}</div><div>{isFilipino ? "Sinuri ni:" : "Checked by:"}<br/><br/><strong>{plan.schoolHeadName || "____________________________"}</strong><br/>{isFilipino ? "Punong-Guro" : "School Head / Principal"}</div></div>
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
          .deped-signatures { display: flex; justify-content: space-between; gap: 20%; margin: 18px 5% 22px; page-break-inside: avoid; }
          .deped-signatures > div { width: 40%; text-align: center; }
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

function SelfCheckRow({ item, index, isFilipino }: { item: string; index: number; isFilipino: boolean; key?: React.Key }) {
  const [status, setStatus] = useState("not-yet");
  const [note, setNote] = useState("");
  return <div className="grid gap-2 rounded-xl border border-slate-100 p-3 md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)] md:items-center">
    <p className="text-sm text-slate-700">{index + 1}. {item}</p>
    <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <option value="yes">{isFilipino ? "Oo" : "Yes"}</option><option value="not-yet">{isFilipino ? "Hindi pa" : "Not Yet"}</option>
    </select>
    <input disabled value={note} onChange={e => setNote(e.target.value)} placeholder={isFilipino ? "Bakit? / Ano ang magpapabuti nito?" : "Why? / What will make it better?"} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
  </div>;
}
