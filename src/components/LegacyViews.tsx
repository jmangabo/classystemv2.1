import React from "react";
import { Student, Subject, Section, UserProfile } from "../types";
import { formatStudentName } from "../utils";
import { X } from "lucide-react";

export const RoleSelectionView: React.FC<{ user: UserProfile | null; onComplete: (profile: any) => void }> = ({ user, onComplete }) => (
  <div className="p-8 max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 text-center space-y-6 mt-12">
    <h2 className="text-2xl font-black text-slate-900">Select Your Role</h2>
    <p className="text-sm text-slate-500">Please choose your access role to proceed to the Class Record System.</p>
    <div className="grid grid-cols-2 gap-4">
      <button type="button" onClick={() => onComplete({ role: 'teacher', approvalStatus: 'approved' })} className="p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition-all cursor-pointer">Teacher / Adviser</button>
      <button type="button" onClick={() => onComplete({ role: 'admin', approvalStatus: 'approved' })} className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-all cursor-pointer">School Admin</button>
      <button type="button" onClick={() => onComplete({ role: 'student', approvalStatus: 'approved' })} className="p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold transition-all cursor-pointer">Learner / Student</button>
      <button type="button" onClick={() => onComplete({ role: 'school_head', approvalStatus: 'approved' })} className="p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold transition-all cursor-pointer">School Head</button>
    </div>
  </div>
);

export const PendingApprovalView: React.FC<{ user: UserProfile | null; onLogout: () => void }> = ({ user, onLogout }) => (
  <div className="p-8 max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 text-center space-y-6 mt-20">
    <h2 className="text-xl font-black text-slate-900">Account Pending Approval</h2>
    <p className="text-sm text-slate-500">Your account ({user?.email}) is awaiting administrator approval.</p>
    <button type="button" onClick={onLogout} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer">Log Out</button>
  </div>
);

export const StudentPortal: React.FC<{ user: UserProfile | null; students: Student[] }> = ({ user, students }) => {
  const student = students.find(s => s.email === user?.email || s.lrn === user?.lrn) || students[0];
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Student Portal</h1>
          <p className="text-sm text-slate-500">Welcome, {student ? formatStudentName(student) : user?.email}</p>
        </div>
      </div>
      {student ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Academic Standing</h3>
          <p className="text-xs text-slate-500">LRN: {student.lrn} | Section: {student.sectionName || 'N/A'}</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center py-12 text-slate-400">
          No linked student record found. Please contact your adviser.
        </div>
      )}
    </div>
  );
};

export const StudentLinkingView: React.FC<any> = () => (
  <div className="p-8 max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 text-center space-y-4 mt-12">
    <h3 className="text-lg font-black text-slate-900">Link Student Record</h3>
    <p className="text-xs text-slate-500">Enter your LRN to link your student account.</p>
  </div>
);

export const AdminUsersView: React.FC<any> = () => (
  <div className="p-6 max-w-7xl mx-auto space-y-6">
    <h1 className="text-2xl font-black text-slate-900">User Management</h1>
  </div>
);

export const AdminSchoolsView: React.FC<any> = () => (
  <div className="p-6 max-w-7xl mx-auto space-y-6">
    <h1 className="text-2xl font-black text-slate-900">School Management</h1>
  </div>
);

export const SubjectsView: React.FC<any> = ({ subjects = [] }) => (
  <div className="p-6 max-w-7xl mx-auto space-y-6">
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h1 className="text-2xl font-black text-slate-900">Subject Configuration & Weights</h1>
      <p className="text-sm text-slate-500 mt-1">Configure learning areas, grading components, and percentage weights.</p>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold uppercase">
            <th className="py-3 px-4">Subject Name</th>
            <th className="py-3 px-4">Grade Level</th>
            <th className="py-3 px-4">Written Works (WW)</th>
            <th className="py-3 px-4">Performance Tasks (PT)</th>
            <th className="py-3 px-4">Quarterly Exam (QA)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {subjects.map((sub: Subject) => (
            <tr key={sub.id} className="hover:bg-slate-50/50">
              <td className="py-3 px-4 font-bold text-slate-800">{sub.name}</td>
              <td className="py-3 px-4 text-slate-600">Grade {sub.gradeLevel}</td>
              <td className="py-3 px-4 font-mono">{sub.wwWeight || 30}%</td>
              <td className="py-3 px-4 font-mono">{sub.ptWeight || 50}%</td>
              <td className="py-3 px-4 font-mono">{sub.taWeight || 20}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const DashboardView: React.FC<any> = ({ students = [], selectedSection }) => (
  <div className="p-6 max-w-7xl mx-auto space-y-6">
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Active Section: {selectedSection ? `${selectedSection.gradeLevel} - ${selectedSection.name}` : 'None Selected'}</p>
      </div>
      <div className="flex gap-4">
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
          <div className="text-2xl font-black text-indigo-600">{students.length}</div>
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5">Enrolled Learners</div>
        </div>
      </div>
    </div>
  </div>
);

export const GradebookView: React.FC<any> = ({ students = [] }) => {
  const getDescriptiveRemark = (grade: number | string): string => {
    const numericGrade = typeof grade === 'string' ? parseFloat(grade) : grade;
    if (isNaN(numericGrade)) return '';
    if (numericGrade >= 90) return 'Advancing';
    if (numericGrade >= 80) return 'Benchmarking';
    if (numericGrade >= 75) return 'Connecting';
    if (numericGrade >= 65) return 'Developing';
    return 'Emerging';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Class Record & Gradebook</h1>
          <p className="text-sm text-slate-500 mt-1">Input scores and evaluate student performance with automatic grade descriptors & remarks.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold uppercase">
              <th className="py-3 px-4">Learner Name</th>
              <th className="py-3 px-4">LRN</th>
              <th className="py-3 px-4">Initial Grade</th>
              <th className="py-3 px-4">Quarterly Grade</th>
              <th className="py-3 px-4">Remarks (Grade Descriptors)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {students.map((student: Student) => {
              const sampleGrade = 88;
              const remark = getDescriptiveRemark(sampleGrade);
              return (
                <tr key={student.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-800">{formatStudentName(student)}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{student.lrn || 'N/A'}</td>
                  <td className="py-3 px-4 font-mono">88.50</td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">89</td>
                  <td className="py-3 px-4">
                    <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-blue-100 text-blue-800">
                      {remark}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AddLearnerView: React.FC<any> = () => (
  <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 space-y-6 mt-6">
    <h1 className="text-2xl font-black text-slate-900">Enroll New Learner</h1>
  </div>
);

export const UserGuideView: React.FC<any> = () => (
  <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 space-y-6 mt-6">
    <h1 className="text-2xl font-black text-slate-900">User Guide & Documentation</h1>
  </div>
);

export const EnrollAllConfirmationModal: React.FC<any> = () => null;

export const MATATAGReportCardModal: React.FC<{ isOpen: boolean; onClose: () => void; student: Student | null }> = ({ isOpen, onClose, student }) => {
  if (!isOpen || !student) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-lg font-black text-slate-900">MATATAG Report Card (SF9) - {formatStudentName(student)}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Learner Reference Number (LRN): {student.lrn}</p>
          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
            <h4 className="font-bold text-xs uppercase text-slate-700">Grade Descriptors & Remarks Scale</h4>
            <ul className="text-xs space-y-1 text-slate-600">
              <li>90–100: <strong className="text-emerald-700">Advancing</strong></li>
              <li>80–89: <strong className="text-blue-700">Benchmarking</strong></li>
              <li>75–79: <strong className="text-indigo-700">Connecting</strong></li>
              <li>65–74: <strong className="text-amber-700">Developing</strong></li>
              <li>0–64: <strong className="text-rose-700">Emerging</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProfileView: React.FC<any> = ({ user }) => (
  <div className="p-6 max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 space-y-6 mt-6">
    <h1 className="text-2xl font-black text-slate-900">User Profile</h1>
    <p className="text-xs text-slate-500">Email: {user?.email} | Role: {user?.role}</p>
  </div>
);
