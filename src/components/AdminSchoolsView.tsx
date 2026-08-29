import React, { useState, useEffect } from "react";
import { 
  Building, 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  MapPin, 
  UserCheck, 
  Save, 
  X,
  School as SchoolIcon
} from "lucide-react";
import { School, UserProfile } from "../types";
import { db } from "../firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";

interface AdminSchoolsViewProps {
  onBack: () => void;
  currentUser?: UserProfile;
}

export function AdminSchoolsView({ onBack, currentUser }: AdminSchoolsViewProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<School>>({
    name: "",
    schoolId: "",
    headOfSchool: "",
    region: "Region VII",
    division: "Cebu Province",
    district: "District I"
  });

  useEffect(() => {
    const q = query(collection(db, "schools"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: School[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        setSchools(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading schools:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleOpenAdd = () => {
    setEditingSchool(null);
    setFormData({
      name: "",
      schoolId: "",
      headOfSchool: "",
      region: "Region VII",
      division: "Cebu Province",
      district: "District I"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({ ...school });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.schoolId) {
      alert("Please fill in School Name and School ID");
      return;
    }
    setIsSaving(true);
    try {
      if (editingSchool?.id) {
        await updateDoc(doc(db, "schools", editingSchool.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        const newRef = doc(collection(db, "schools"));
        await setDoc(newRef, {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Failed to save school: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (school: School) => {
    if (!window.confirm(`Are you sure you want to remove school "${school.name}"?`)) return;
    try {
      if (school.id) {
        await deleteDoc(doc(db, "schools", school.id));
      }
    } catch (err: any) {
      alert("Failed to delete school: " + err.message);
    }
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.schoolId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.headOfSchool || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building className="text-indigo-600" size={20} />
                School Institutional Directory
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Configure school identifiers, divisional jurisdictions, and institutional heads.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all cursor-pointer"
          >
            <Plus size={16} /> Add School
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <Search className="text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search school name, School ID, or Principal..."
            className="w-full bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none"
          />
        </div>

        {/* Schools Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={28} />
              <span className="text-xs font-bold uppercase tracking-wider">Loading institutional list...</span>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Building size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold text-slate-600">No schools registered</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add School" to register a new DepEd institution.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">School Name & ID</th>
                    <th className="py-3.5 px-4">Jurisdiction</th>
                    <th className="py-3.5 px-4">School Head / Principal</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredSchools.map((s) => (
                    <tr key={s.id || s.schoolId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{s.name}</div>
                        <div className="text-[11px] text-indigo-600 font-mono font-bold mt-0.5">
                          ID: {s.schoolId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">{s.division || "N/A"}</div>
                        <div className="text-[11px] text-slate-400">{s.region || "Region VII"} &bull; {s.district || "District I"}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {s.headOfSchool || "Not Specified"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit School"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete School"
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
      </main>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building className="text-indigo-600" size={18} />
                {editingSchool ? "Edit School Profile" : "Register New School"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. San Roque National High School"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  DepEd School ID (6 Digits / Code)
                </label>
                <input
                  type="text"
                  required
                  value={formData.schoolId || ""}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  placeholder="e.g. 302941"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  School Head / Principal
                </label>
                <input
                  type="text"
                  value={formData.headOfSchool || ""}
                  onChange={(e) => setFormData({ ...formData, headOfSchool: e.target.value })}
                  placeholder="e.g. Maria Clara, EdD - Principal IV"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    value={formData.region || ""}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Division
                  </label>
                  <input
                    type="text"
                    value={formData.division || ""}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  />
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
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save School Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
