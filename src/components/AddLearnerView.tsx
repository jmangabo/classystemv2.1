import React, { useState } from "react";
import { 
  UserPlus, 
  Users, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  User, 
  Camera, 
  Sparkles, 
  Check, 
  Layers, 
  Award,
  Upload,
  Calendar,
  Phone,
  MapPin,
  Heart
} from "lucide-react";
import { Student, Section } from "../types";
import { formatStudentName } from "../utils";

interface AddLearnerViewProps {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSave: (e: React.FormEvent) => void;
  students: Student[];
  sections: Section[];
  unenrolledStudents: Student[];
  onEnrollAllLearners?: () => void;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onDeleteMany?: (studentIds: string[]) => void;
  editingId: string | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onBulkEnroll?: (studentIds: string[]) => void;
  onCancelEdit: () => void;
  sectionName?: string;
  schoolYear?: string;
}

export function AddLearnerView({
  form,
  setForm,
  onSave,
  students,
  sections,
  unenrolledStudents,
  onEnrollAllLearners,
  onEdit,
  onDelete,
  onDeleteMany,
  editingId,
  searchTerm,
  onSearchChange,
  onBulkEnroll,
  onCancelEdit,
  sectionName,
  schoolYear
}: AddLearnerViewProps) {
  const [activeFormTab, setActiveFormTab] = useState<"demographics" | "family" | "health">("demographics");

  const handleChange = (field: string, val: any) => {
    setForm((prev: any) => ({ ...prev, [field]: val }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        handleChange("photo", uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <UserPlus className="text-indigo-600" size={22} />
            Learner Registration & Master Roster
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Register official DepEd SF1 learner details for {sectionName || "selected section"} (SY {schoolYear || "2025-2026"}).
          </p>
        </div>

        {unenrolledStudents.length > 0 && onEnrollAllLearners && (
          <button
            onClick={onEnrollAllLearners}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-100 transition-all cursor-pointer"
          >
            <Check size={16} /> Enroll All {unenrolledStudents.length} to Subjects
          </button>
        )}
      </div>

      {/* Registration Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              {editingId ? <Edit2 size={18} /> : <UserPlus size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {editingId ? "Edit Learner Record" : "New Learner Registration"}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Standard DepEd School Form 1 (SF1) Format</p>
            </div>
          </div>

          {/* Form Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveFormTab("demographics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormTab === "demographics" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Demographics
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab("family")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormTab === "family" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Parents / Guardian
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab("health")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormTab === "health" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Health & Nutrition
            </button>
          </div>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-6">
          {/* Tab 1: Demographics */}
          {activeFormTab === "demographics" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.lastName || ""}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="e.g. Dela Cruz"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.firstName || ""}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="e.g. Juan"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={form.middleName || ""}
                    onChange={(e) => handleChange("middleName", e.target.value)}
                    placeholder="e.g. Santos"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Name Ext. (Jr, III)
                  </label>
                  <input
                    type="text"
                    value={form.extension || ""}
                    onChange={(e) => handleChange("extension", e.target.value)}
                    placeholder="e.g. Jr., III"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    12-Digit LRN *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={form.lrn || ""}
                    onChange={(e) => handleChange("lrn", e.target.value.replace(/\D/g, ""))}
                    placeholder="109021234567"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Sex *
                  </label>
                  <select
                    value={form.sex || "Male"}
                    onChange={(e) => handleChange("sex", e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Birthdate (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={form.birthdate || ""}
                    onChange={(e) => handleChange("birthdate", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Learner Photo
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium cursor-pointer hover:bg-slate-100">
                    <Camera size={16} className="text-slate-400" />
                    <span>{form.photo ? "Change Photo" : "Upload Photo"}</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={form.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="House #, Street, Barangay, Municipality/City, Province"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Family */}
          {activeFormTab === "family" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Father's Full Name
                  </label>
                  <input
                    type="text"
                    value={form.fatherName || ""}
                    onChange={(e) => handleChange("fatherName", e.target.value)}
                    placeholder="Father's Name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Mother's Maiden Name
                  </label>
                  <input
                    type="text"
                    value={form.motherName || ""}
                    onChange={(e) => handleChange("motherName", e.target.value)}
                    placeholder="Mother's Name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Guardian's Name (if not parent)
                  </label>
                  <input
                    type="text"
                    value={form.guardianName || ""}
                    onChange={(e) => handleChange("guardianName", e.target.value)}
                    placeholder="Guardian Name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Guardian Relationship
                  </label>
                  <input
                    type="text"
                    value={form.guardianRelationship || ""}
                    onChange={(e) => handleChange("guardianRelationship", e.target.value)}
                    placeholder="e.g. Aunt, Grandparent"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Contact / Mobile Number
                  </label>
                  <input
                    type="text"
                    value={form.contactNumber || ""}
                    onChange={(e) => handleChange("contactNumber", e.target.value)}
                    placeholder="0917-xxx-xxxx"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Health */}
          {activeFormTab === "health" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.weight || ""}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    placeholder="e.g. 45.5"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.height || ""}
                    onChange={(e) => handleChange("height", e.target.value)}
                    placeholder="e.g. 152.0"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            {editingId && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 flex items-center gap-2 cursor-pointer"
            >
              <Save size={16} />
              {editingId ? "Update Learner Record" : "Save & Register Learner"}
            </button>
          </div>
        </form>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <Search className="text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search roster by name or LRN..."
            className="w-full bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Learner Full Name</th>
                <th className="py-3.5 px-4">LRN</th>
                <th className="py-3.5 px-4">Sex</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {students.map((st, idx) => (
                <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{formatStudentName(st)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{st.lrn || "N/A"}</td>
                  <td className="py-3.5 px-4">{st.sex}</td>
                  <td className="py-3.5 px-4 text-slate-500">{st.contactNumber || "N/A"}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(st)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Edit Learner"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove learner "${st.name}"?`)) {
                            onDelete(st.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Learner"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No learners found. Use the registration form above to enroll students.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
