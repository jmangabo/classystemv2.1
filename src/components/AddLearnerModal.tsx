import React, { useState } from 'react';
import { X, UserPlus, Save, User, MapPin, Calendar, Heart, Shield, Phone } from 'lucide-react';
import { Student, Section } from '../types';

interface AddLearnerModalProps {
  section: Section;
  existingStudent?: Student | null;
  onClose: () => void;
  onSave: (studentData: Partial<Student>) => void;
}

export const AddLearnerModal: React.FC<AddLearnerModalProps> = ({
  section,
  existingStudent,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    id: existingStudent?.id || `stu_${Date.now()}`,
    name: existingStudent?.name || '',
    lastName: existingStudent?.lastName || '',
    firstName: existingStudent?.firstName || '',
    middleName: existingStudent?.middleName || '',
    extension: existingStudent?.extension || '',
    studentNumber: existingStudent?.studentNumber || '',
    lrn: existingStudent?.lrn || '',
    sex: existingStudent?.sex || 'Male',
    birthdate: existingStudent?.birthdate || '',
    birthplace: existingStudent?.birthplace || '',
    age: existingStudent?.age || 12,
    address: existingStudent?.address || '',
    fatherName: existingStudent?.fatherName || '',
    motherName: existingStudent?.motherName || '',
    guardianName: existingStudent?.guardianName || '',
    guardianRelationship: existingStudent?.guardianRelationship || '',
    contactNumber: existingStudent?.contactNumber || '',
    status: existingStudent?.status || 'Active',
    sectionId: section.id,
    sectionName: section.name,
    gradeLevel: section.gradeLevel,
    height: existingStudent?.height || 145,
    weight: existingStudent?.weight || 40,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${formData.lastName || ''}, ${formData.firstName || ''} ${formData.middleName || ''} ${formData.extension || ''}`.trim();
    onSave({
      ...formData,
      name: fullName || formData.name || 'UNNAMED LEARNER',
      studentNumber: formData.studentNumber || formData.lrn || `LRN-${Date.now()}`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {existingStudent ? 'Edit Learner Profile' : 'Register New Learner'}
              </h2>
              <p className="text-xs text-slate-500">
                Grade {section.gradeLevel} - {section.name} • DepEd Basic Education Registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* LRN & Name Fields */}
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" /> Basic Identity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Learner Reference Number (12-digit LRN) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 109283746512"
                  value={formData.lrn || ''}
                  onChange={e => setFormData({ ...formData, lrn: e.target.value, studentNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DELA CRUZ"
                  value={formData.lastName || ''}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JUAN"
                  value={formData.firstName || ''}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  placeholder="e.g. SANTOS"
                  value={formData.middleName || ''}
                  onChange={e => setFormData({ ...formData, middleName: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name Extension (Jr., III)</label>
                <input
                  type="text"
                  placeholder="e.g. JR"
                  value={formData.extension || ''}
                  onChange={e => setFormData({ ...formData, extension: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Demographic & Birth Details */}
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Demographics & Birth
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sex *</label>
                <select
                  value={formData.sex || 'Male'}
                  onChange={e => setFormData({ ...formData, sex: e.target.value as 'Male' | 'Female' })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Birthdate</label>
                <input
                  type="date"
                  value={formData.birthdate || ''}
                  onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age || 12}
                  onChange={e => setFormData({ ...formData, age: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Birthplace</label>
                <input
                  type="text"
                  placeholder="e.g. Sta. Cruz, Laguna"
                  value={formData.birthplace || ''}
                  onChange={e => setFormData({ ...formData, birthplace: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Residence & Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Residence & Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Barangay, Municipality/City, Province"
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Father's Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pedro Dela Cruz"
                  value={formData.fatherName || ''}
                  onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mother's Maiden Name</label>
                <input
                  type="text"
                  placeholder="e.g. Maria Santos"
                  value={formData.motherName || ''}
                  onChange={e => setFormData({ ...formData, motherName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Name (if not parent)</label>
                <input
                  type="text"
                  placeholder="e.g. Josefa Dela Cruz"
                  value={formData.guardianName || ''}
                  onChange={e => setFormData({ ...formData, guardianName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact / Mobile Number</label>
                <input
                  type="text"
                  placeholder="0917-123-4567"
                  value={formData.contactNumber || ''}
                  onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              {existingStudent ? 'Update Learner' : 'Save Learner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
