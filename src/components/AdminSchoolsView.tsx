import React, { useState } from 'react';
import { School as SchoolIcon, Plus, Save, Edit2, Trash2, X, MapPin, User, CheckCircle2 } from 'lucide-react';
import { School } from '../types';

interface AdminSchoolsViewProps {
  schools: School[];
  onAddSchool: (school: School) => Promise<void>;
  onUpdateSchool: (id: string, school: Partial<School>) => Promise<void>;
  onDeleteSchool?: (id: string) => Promise<void>;
}

export const AdminSchoolsView: React.FC<AdminSchoolsViewProps> = ({
  schools,
  onAddSchool,
  onUpdateSchool,
  onDeleteSchool
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState<Partial<School>>({
    schoolId: '',
    name: '',
    headOfSchool: '',
    region: 'Region IV-A CALABARZON',
    division: 'Division of Laguna',
    district: 'District of Sta. Cruz'
  });

  const handleOpenAdd = () => {
    setEditingSchool(null);
    setFormData({
      schoolId: '',
      name: '',
      headOfSchool: '',
      region: 'Region IV-A CALABARZON',
      division: 'Division of Laguna',
      district: 'District of Sta. Cruz'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (school: School) => {
    setEditingSchool(school);
    setFormData(school);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchool && editingSchool.id) {
      await onUpdateSchool(editingSchool.id, formData);
    } else {
      await onAddSchool({
        ...formData,
        id: formData.id || `school_${Date.now()}`,
        schoolId: formData.schoolId || '301234',
        name: formData.name || 'Laguna National High School',
        headOfSchool: formData.headOfSchool || 'Principal'
      } as School);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SchoolIcon className="w-6 h-6 text-indigo-600" />
            School Profiles & Institution Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure DepEd School ID, Head of School, Region, and Division information.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add School Profile
        </button>
      </div>

      {/* Schools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map(school => (
          <div key={school.schoolId || school.id} className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between hover:border-indigo-200 transition">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                  <SchoolIcon className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                  ID: {school.schoolId}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{school.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Head: <strong>{school.headOfSchool}</strong>
                </p>
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {school.division || 'Division of Laguna'}
                </p>
                <p className="text-slate-500 text-[11px] pl-5">
                  {school.region || 'Region IV-A'} • {school.district || 'District of Sta. Cruz'}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(school)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingSchool ? 'Edit School Profile' : 'Add New School Profile'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">DepEd School ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 301234"
                  value={formData.schoolId || ''}
                  onChange={e => setFormData({ ...formData, schoolId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laguna National High School"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Head of School / Principal *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos, PhD"
                  value={formData.headOfSchool || ''}
                  onChange={e => setFormData({ ...formData, headOfSchool: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={formData.region || ''}
                    onChange={e => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    value={formData.division || ''}
                    onChange={e => setFormData({ ...formData, division: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={formData.district || ''}
                  onChange={e => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
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
                  Save School Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
