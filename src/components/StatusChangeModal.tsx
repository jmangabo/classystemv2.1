import React, { useState } from 'react';
import { X, UserCheck, Save, AlertTriangle } from 'lucide-react';
import { Student } from '../types';
import { formatStudentName } from '../utils';

interface StatusChangeModalProps {
  student: Student;
  onClose: () => void;
  onSave: (updated: Partial<Student>) => void;
}

const DROPOUT_REASONS = [
  'Family / Personal Problems',
  'Financial / Employment Issues',
  'Illness / Health Condition',
  'Distance of School / Transportation',
  'Early Marriage / Pregnancy',
  'Lack of Interest',
  'Relocation / Transfer to another Province',
  'Others'
];

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  student,
  onClose,
  onSave
}) => {
  const [status, setStatus] = useState<Student['status']>(student.status || 'Active');
  const [dropoutDate, setDropoutDate] = useState<string>(student.dropoutDate || new Date().toISOString().split('T')[0]);
  const [dropoutReason, setDropoutReason] = useState<string>(student.dropoutReason || DROPOUT_REASONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      status,
      dropoutDate: status === 'Dropped Out' || status === 'Transferred Out' ? dropoutDate : undefined,
      dropoutReason: status === 'Dropped Out' || status === 'Transferred Out' ? dropoutReason : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Change Learner Status</h2>
              <p className="text-xs text-slate-500">{formatStudentName(student)}</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Enrollment / Movement Status *
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Student['status'])}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Active">Active (Regular Enrollment)</option>
              <option value="Transferred In">Transferred In</option>
              <option value="Transferred Out">Transferred Out (Moved to other School)</option>
              <option value="Dropped Out">Dropped Out (No Longer in School)</option>
              <option value="Promoted">Promoted</option>
              <option value="Retained">Retained</option>
            </select>
          </div>

          {(status === 'Dropped Out' || status === 'Transferred Out') && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                DepEd SF2 & SF4 Movement Tracking
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Effective Date *
                </label>
                <input
                  type="date"
                  required
                  value={dropoutDate}
                  onChange={e => setDropoutDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  DepEd Recognized Reason *
                </label>
                <select
                  value={dropoutReason}
                  onChange={e => setDropoutReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {DROPOUT_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

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
              Save Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
