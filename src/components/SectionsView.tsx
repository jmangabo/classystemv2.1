import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen, 
  Award, 
  Calendar, 
  Search, 
  CheckCircle2, 
  Lock, 
  Unlock,
  ChevronRight,
  School,
  X,
  Save,
  FileSpreadsheet
} from 'lucide-react';
import { Section, Student, Subject } from '../types';

interface SectionsViewProps {
  sections: Section[];
  students: Student[];
  subjects: Subject[];
  userRole: string;
  userEmail?: string;
  onSelectSection: (section: Section) => void;
  onAddSection: (section: Section) => Promise<void>;
  onUpdateSection: (id: string, section: Partial<Section>) => Promise<void>;
  onDeleteSection?: (id: string) => Promise<void>;
}

export const SectionsView: React.FC<SectionsViewProps> = ({
  sections,
  students,
  subjects,
  userRole,
  userEmail,
  onSelectSection,
  onAddSection,
  onUpdateSection,
  onDeleteSection
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const [formData, setFormData] = useState<Partial<Section>>({
    name: '',
    gradeLevel: 7,
    adviserName: '',
    adviserEmail: userEmail || '',
    schoolYear: '2025-2026',
    schoolName: 'Laguna National High School',
    schoolId: '301234',
    region: 'Region IV-A CALABARZON',
    division: 'Division of Laguna',
    district: 'District of Sta. Cruz',
    createdBy: userEmail || 'admin'
  });

  const filteredSections = sections
    .filter(sec => {
      if (gradeFilter !== 'All' && String(sec.gradeLevel) !== gradeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sec.name.toLowerCase().includes(q) ||
        sec.adviserName.toLowerCase().includes(q) ||
        String(sec.gradeLevel).includes(q)
      );
    })
    .sort((a, b) => a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name));

  const handleOpenAdd = () => {
    setEditingSection(null);
    setFormData({
      name: '',
      gradeLevel: 7,
      adviserName: '',
      adviserEmail: userEmail || '',
      schoolYear: '2025-2026',
      schoolName: 'Laguna National High School',
      schoolId: '301234',
      region: 'Region IV-A CALABARZON',
      division: 'Division of Laguna',
      district: 'District of Sta. Cruz',
      createdBy: userEmail || 'admin'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sec: Section, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSection(sec);
    setFormData(sec);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSection) {
      await onUpdateSection(editingSection.id, formData);
    } else {
      await onAddSection({
        ...formData,
        id: `sec_${Date.now()}`,
        name: formData.name || 'Section Name',
        gradeLevel: Number(formData.gradeLevel) || 7,
        adviserName: formData.adviserName || 'Adviser Name',
        schoolYear: formData.schoolYear || '2025-2026',
        schoolName: formData.schoolName || 'Laguna National High School',
        schoolId: formData.schoolId || '301234',
        region: formData.region || 'Region IV-A',
        division: formData.division || 'Division of Laguna',
        district: formData.district || 'District of Sta. Cruz',
        createdBy: userEmail || 'admin'
      } as Section);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Class Sections & Advisory Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access gradebooks, student masterlists, SF9/SF10 cards, and attendance registers.
          </p>
        </div>

        {(userRole === 'admin' || userRole === 'system_admin' || userRole === 'school_head') && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Section
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search section name, adviser, grade..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Grade Level:</span>
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
            >
              <option value="All">All Grades</option>
              {[7, 8, 9, 10, 11, 12].map(g => (
                <option key={g} value={String(g)}>Grade {g}</option>
              ))}
            </select>
          </div>

          <span className="text-xs font-bold text-slate-500">
            ({filteredSections.length} Sections)
          </span>
        </div>
      </div>

      {/* Sections Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSections.map(sec => {
          const secStudents = students.filter(s => s.sectionId === sec.id);
          const maleCount = secStudents.filter(s => s.sex === 'Male').length;
          const femaleCount = secStudents.filter(s => s.sex === 'Female').length;

          return (
            <div
              key={sec.id}
              onClick={() => onSelectSection(sec)}
              className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 font-mono">
                    Grade {sec.gradeLevel}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition">
                  {sec.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Adviser: <strong>{sec.adviserName}</strong>
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  S.Y. {sec.schoolYear} • {sec.schoolName || 'Laguna National High School'}
                </p>

                {/* Learner Count Pill */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Learners: <strong>{secStudents.length}</strong></span>
                  <span className="text-[11px] text-slate-400">
                    ({maleCount} Male • {femaleCount} Female)
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 group-hover:underline flex items-center gap-1">
                  Open Section Record <ChevronRight className="w-4 h-4" />
                </span>

                {(userRole === 'admin' || userRole === 'system_admin' || userRole === 'school_head') && (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => handleOpenEdit(sec, e)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteSection && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete section ${sec.name}?`)) {
                            onDeleteSection(sec.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Add / Edit Section */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingSection ? 'Edit Section Profile' : 'Create New Class Section'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Level *</label>
                  <select
                    value={formData.gradeLevel || 7}
                    onChange={e => setFormData({ ...formData, gradeLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {[7, 8, 9, 10, 11, 12].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diamond, Sapphire"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class Adviser Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos, LPT"
                  value={formData.adviserName || ''}
                  onChange={e => setFormData({ ...formData, adviserName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adviser Email</label>
                <input
                  type="email"
                  placeholder="adviser@deped.gov.ph"
                  value={formData.adviserEmail || ''}
                  onChange={e => setFormData({ ...formData, adviserEmail: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">School Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="2025-2026"
                    value={formData.schoolYear || ''}
                    onChange={e => setFormData({ ...formData, schoolYear: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">School ID</label>
                  <input
                    type="text"
                    placeholder="301234"
                    value={formData.schoolId || ''}
                    onChange={e => setFormData({ ...formData, schoolId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
