import React, { useState } from 'react';
import { X, BookOpen, CheckSquare, Square, Save } from 'lucide-react';
import { Student, Subject, Section } from '../types';
import { formatStudentName } from '../utils';

interface StudentSubjectEnrollmentModalProps {
  student: Student;
  section: Section;
  subjects: Subject[];
  onClose: () => void;
  onSave: (enrolledSubjectIds: string[]) => void;
}

export const StudentSubjectEnrollmentModal: React.FC<StudentSubjectEnrollmentModalProps> = ({
  student,
  section,
  subjects,
  onClose,
  onSave
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    student.enrolledSubjectIds || subjects.map(s => s.id)
  );

  const toggleSubject = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(subjects.map(s => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(selectedIds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Enrolled Subjects</h2>
              <p className="text-xs text-slate-500">{formatStudentName(student)} • Grade {section.gradeLevel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Selected: <strong>{selectedIds.length}</strong> of {subjects.length} subjects
            </span>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-indigo-600 hover:underline font-semibold"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-slate-500 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2 bg-slate-50">
            {subjects.map(sub => {
              const isSelected = selectedIds.includes(sub.id);
              return (
                <div
                  key={sub.id}
                  onClick={() => toggleSubject(sub.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs">{sub.name}</span>
                  </div>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white/70 text-slate-500 font-mono">
                    {sub.subjectType || 'CORE'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              Save Subject Enrollments
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
