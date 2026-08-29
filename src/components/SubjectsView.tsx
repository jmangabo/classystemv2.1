import React, { useState } from "react";
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  Search, 
  Check, 
  X, 
  Settings2, 
  Sparkles, 
  Sliders, 
  User, 
  Layers, 
  Percent,
  CheckCircle2
} from "lucide-react";
import { Subject, Section, UserProfile, TermNumber } from "../types";

interface SubjectsViewProps {
  subjects: Subject[];
  onAddSubject: (subject: Subject) => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
  selectedSection?: Section | null;
  currentUser?: UserProfile;
  globalSettings?: any;
  isSectionAdviser?: boolean;
  globalSubjects?: Subject[];
  onUpdateSection?: (sec: Partial<Section>) => void;
  onBack?: () => void;
}

export function SubjectsView({
  subjects,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  selectedSection,
  currentUser,
  globalSettings,
  isSectionAdviser,
  globalSubjects,
  onUpdateSection,
  onBack
}: SubjectsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState<number>(selectedSection ? selectedSection.gradeLevel : 7);
  const [subjectType, setSubjectType] = useState<Subject["subjectType"]>("CORE");
  const [group, setGroup] = useState<Subject["group"]>("Revised K-10 Curriculum");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [wwWeight, setWwWeight] = useState<number>(40);
  const [ptWeight, setPtWeight] = useState<number>(40);
  const [taWeight, setTaWeight] = useState<number>(20);
  const [isZeroBasedGrading, setIsZeroBasedGrading] = useState<boolean>(false);
  const [unit, setUnit] = useState<number>(1);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setName("");
    setGradeLevel(selectedSection ? selectedSection.gradeLevel : 7);
    setSubjectType("CORE");
    setGroup("Revised K-10 Curriculum");
    setTeacherEmail(currentUser?.email || "");
    setWwWeight(40);
    setPtWeight(40);
    setTaWeight(20);
    setIsZeroBasedGrading(false);
    setUnit(1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setEditingSubject(s);
    setName(s.name);
    setGradeLevel(s.gradeLevel || (selectedSection ? selectedSection.gradeLevel : 7));
    setSubjectType(s.subjectType || "CORE");
    setGroup(s.group || "Revised K-10 Curriculum");
    setTeacherEmail(s.teacherEmail || "");
    setWwWeight(s.wwWeight || 40);
    setPtWeight(s.ptWeight || 40);
    setTaWeight(s.taWeight || 20);
    setIsZeroBasedGrading(!!s.isZeroBasedGrading);
    setUnit(s.unit || 1);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Subject name is required");
      return;
    }
    const totalWeight = Number(wwWeight) + Number(ptWeight) + Number(taWeight);
    if (totalWeight !== 100) {
      alert(`The sum of WW (${wwWeight}%) + PT (${ptWeight}%) + QA/Exam (${taWeight}%) must equal 100%. Current total: ${totalWeight}%`);
      return;
    }

    const payload: Subject = {
      id: editingSubject?.id || `subj_${Date.now()}`,
      sectionId: selectedSection?.id,
      name: name.trim(),
      gradeLevel: Number(gradeLevel),
      subjectType,
      group,
      teacherEmail: teacherEmail.trim(),
      wwWeight: Number(wwWeight),
      ptWeight: Number(ptWeight),
      taWeight: Number(taWeight),
      isZeroBasedGrading,
      unit: Number(unit),
      offeredTerms: editingSubject?.offeredTerms || [1, 2, 3, 4]
    };

    if (editingSubject) {
      onEditSubject(payload);
    } else {
      onAddSubject(payload);
    }
    setIsModalOpen(false);
  };

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.teacherEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="text-indigo-600" size={22} />
              {selectedSection ? `Curriculum Subjects (${selectedSection.name})` : "Global Curriculum Subject Catalog"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Configure DepEd Order weightings (Written Works, Performance Tasks, Quarterly Exam) and teacher assignments.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all cursor-pointer"
        >
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <Search className="text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subject title, curriculum track, or teacher email..."
            className="w-full bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none"
          />
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookOpen size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-bold text-slate-600">No subjects configured</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add Subject" to configure subjects for this curriculum.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Subject Title</th>
                  <th className="py-3.5 px-4">Curriculum Track</th>
                  <th className="py-3.5 px-4">Grading Weights (WW / PT / QA)</th>
                  <th className="py-3.5 px-4">Assigned Teacher</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSubjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{s.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Grade {s.gradeLevel}</span>
                        <span>&bull;</span>
                        <span className="font-bold text-indigo-600">{s.subjectType}</span>
                        {s.isZeroBasedGrading && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold">0-Based</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {s.group}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200" title="Written Works">
                          WW: {s.wwWeight}%
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Performance Tasks">
                          PT: {s.ptWeight}%
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200" title="Quarterly Exam">
                          QA: {s.taWeight}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {s.teacherEmail ? (
                        <span className="flex items-center gap-1.5">
                          <User size={13} className="text-slate-400" /> {s.teacherEmail}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit Subject"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove "${s.name}"?`)) {
                              onDeleteSubject(s.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Subject"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={18} />
                {editingSubject ? "Edit Subject Configuration" : "Add New Subject"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Subject Title
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics, Science, Araling Panlipunan"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Subject Type
                  </label>
                  <select
                    value={subjectType}
                    onChange={(e) => setSubjectType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="CORE">CORE</option>
                    <option value="APPLIED">APPLIED</option>
                    <option value="SPECIALIZED">SPECIALIZED</option>
                    <option value="ELECTIVE">ELECTIVE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Grade Level
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Curriculum Track / Strand Group
                </label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="Revised K-10 Curriculum">Revised K-10 Curriculum / MATATAG</option>
                  <option value="SHS Core Subjects, Other SHS Academic Electives">SHS Core Subjects / Academic Electives</option>
                  <option value="SHS TechPro Electives">SHS TechPro / TVL Electives</option>
                  <option value="SHS Work Immersion">SHS Work Immersion</option>
                  <option value="SHS Arts, Sports, Health and Wellness Electives">SHS Arts & Sports Electives</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Assigned Teacher Email
                </label>
                <input
                  type="email"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="teacher@deped.gov.ph"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              {/* Weights */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>DepEd Grading Weights (%)</span>
                  <span className={`font-mono ${Number(wwWeight) + Number(ptWeight) + Number(taWeight) === 100 ? "text-emerald-600" : "text-rose-600 font-black"}`}>
                    Total: {Number(wwWeight) + Number(ptWeight) + Number(taWeight)}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Written Works</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={wwWeight}
                      onChange={(e) => setWwWeight(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Perf. Tasks</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ptWeight}
                      onChange={(e) => setPtWeight(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Quarter Exam</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={taWeight}
                      onChange={(e) => setTaWeight(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-100 cursor-pointer"
                >
                  {editingSubject ? "Save Changes" : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
