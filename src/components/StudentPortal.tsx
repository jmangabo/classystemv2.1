import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  FileText, 
  LogOut, 
  Palette, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  User, 
  School as SchoolIcon,
  ShieldCheck,
  Download
} from "lucide-react";
import { db, auth } from "../firebase";
import { collectionGroup, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Student, Subject, Section } from "../types";
import { formatStudentName } from "../utils";
import { MATATAGReportCardModal } from "./MATATAGReportCardModal";

interface StudentPortalProps {
  onOpenThemeModal?: () => void;
  onLogout?: () => void;
  globalSettings?: any;
  activeSchool?: any;
}

export function StudentPortal({
  onOpenThemeModal,
  onLogout,
  globalSettings,
  activeSchool
}: StudentPortalProps) {
  const currentUser = auth.currentUser;
  const [student, setStudent] = useState<Student | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportCard, setShowReportCard] = useState(false);
  const [searchLrn, setSearchLrn] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function loadStudentData() {
      if (!currentUser?.email) {
        setLoading(false);
        return;
      }
      try {
        // Query students collectionGroup matching current user's email
        const q = query(
          collectionGroup(db, "students"),
          where("email", "==", currentUser.email.toLowerCase().trim())
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const stData = { id: docSnap.id, ...(docSnap.data() as any) } as Student;
          setStudent(stData);

          // Get section
          const sectionRef = docSnap.ref.parent.parent;
          if (sectionRef) {
            const secSnap = await getDoc(sectionRef);
            if (secSnap.exists()) {
              const secData = { id: secSnap.id, ...(secSnap.data() as any) } as Section;
              setSection(secData);

              // Load section subjects
              const subSnap = await getDocs(query(collectionGroup(db, "subjects"), where("sectionId", "==", secData.id)));
              const subList: Subject[] = [];
              subSnap.forEach((sDoc) => {
                subList.push({ id: sDoc.id, ...(sDoc.data() as any) });
              });
              setSubjects(subList);
            }
          }
        }
      } catch (err) {
        console.error("Error loading student portal data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
  }, [currentUser]);

  const handleLrnLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLrn.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const q = query(
        collectionGroup(db, "students"),
        where("lrn", "==", searchLrn.trim())
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const stData = { id: docSnap.id, ...(docSnap.data() as any) } as Student;
        setStudent(stData);

        const sectionRef = docSnap.ref.parent.parent;
        if (sectionRef) {
          const secSnap = await getDoc(sectionRef);
          if (secSnap.exists()) {
            const secData = { id: secSnap.id, ...(secSnap.data() as any) } as Section;
            setSection(secData);

            const subSnap = await getDocs(query(collectionGroup(db, "subjects"), where("sectionId", "==", secData.id)));
            const subList: Subject[] = [];
            subSnap.forEach((sDoc) => {
              subList.push({ id: sDoc.id, ...(sDoc.data() as any) });
            });
            setSubjects(subList);
          }
        }
      } else {
        setStudent(null);
      }
    } catch (err) {
      console.error("Error searching student LRN:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">DepEd Learner Portal</h1>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                  Official
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
                {activeSchool?.name || "Centralized Learner Assessment System"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors"
                title="Theme Settings"
              >
                <Palette size={16} />
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <LogOut size={14} /> <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* LRN Search Bar if not linked */}
        {!student && !loading && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 max-w-xl mx-auto text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Search size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Find Learner Record</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Enter your official 12-digit Learner Reference Number (LRN) to view your enrolled subjects, quarterly marks, and attendance.
            </p>
            <form onSubmit={handleLrnLookup} className="flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                required
                maxLength={12}
                value={searchLrn}
                onChange={(e) => setSearchLrn(e.target.value.replace(/\D/g, ""))}
                placeholder="12-digit LRN (e.g. 109021234567)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-100"
              >
                Search
              </button>
            </form>
            {searched && !student && (
              <p className="text-xs font-bold text-rose-600">No student record found with LRN: {searchLrn}</p>
            )}
          </div>
        )}

        {/* Student Profile & Overview */}
        {student && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  {student.photo ? (
                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-indigo-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{formatStudentName(student)}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                      {student.status || "Active"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                    <span>LRN: <strong className="font-mono text-slate-800">{student.lrn || "N/A"}</strong></span>
                    <span>&bull;</span>
                    <span>Section: <strong className="text-slate-800">{section?.name || student.sectionName || "MATATAG"}</strong></span>
                    <span>&bull;</span>
                    <span>Grade: <strong className="text-slate-800">{section?.gradeLevel || student.gradeLevel || 7}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => setShowReportCard(true)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all cursor-pointer"
                >
                  <FileText size={16} /> View Electronic SF9 Card
                </button>
              </div>
            </div>

            {/* Quarterly Performance Summary */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-600" /> Enrolled Subjects & Grades
                </h3>
                <span className="text-xs text-slate-400 font-medium">School Year {section?.schoolYear || "2025-2026"}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Subject</th>
                      <th className="py-3 px-2 text-center">Q1</th>
                      <th className="py-3 px-2 text-center">Q2</th>
                      <th className="py-3 px-2 text-center">Q3</th>
                      <th className="py-3 px-2 text-center">Q4</th>
                      <th className="py-3 px-2 text-center">Final</th>
                      <th className="py-3 px-2 text-center">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {subjects.map((sub) => {
                      const subGrades = student.grades?.[sub.id] || {};
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">{sub.name}</td>
                          {[1, 2, 3, 4].map((t) => (
                            <td key={t} className="py-3 px-2 text-center font-mono">
                              {subGrades[t as any] ? "Encoded" : "-"}
                            </td>
                          ))}
                          <td className="py-3 px-2 text-center font-bold text-indigo-700">-</td>
                          <td className="py-3 px-2 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                              Enrolled
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SF9 Modal */}
      {showReportCard && student && section && (
        <MATATAGReportCardModal
          student={student}
          section={section}
          subjects={subjects}
          onClose={() => setShowReportCard(false)}
        />
      )}
    </div>
  );
}
