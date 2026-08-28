import React, { useState, useRef } from 'react';
import { Section, Student } from '../types';
import { safeGetDocs as getDocs, db } from '../firebase';
import { query, collection } from 'firebase/firestore';
import { Printer, Loader2, X, Download, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { SF2ReportView } from './SF2ReportView';

interface PrintAllSF2ButtonProps {
  sections: Section[];
  schoolYear: string;
  currentUser: any;
  schoolCalendar: any[];
}

const MONTH_OPTIONS = [
  "June", "July", "August", "September", "October", "November", "December", 
  "January", "February", "March", "April", "May"
];

const getInitialMonth = () => {
  const today = new Date();
  const JS_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const current = JS_MONTHS[today.getMonth()];
  return MONTH_OPTIONS.includes(current) ? current : "June";
};

export const PrintAllSF2Button: React.FC<PrintAllSF2ButtonProps> = ({ sections, schoolYear, currentUser, schoolCalendar }) => {
  const [isFetching, setIsFetching] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(getInitialMonth);
  const [allSectionsData, setAllSectionsData] = useState<{ section: Section; students: Student[]; calendar: any[] }[]>([]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const handleFetchAndOpenModal = async () => {
    setIsFetching(true);
    setLoadingText("Fetching active sections...");
    
    const activeSections = sections.filter(s => s.schoolYear === schoolYear);
    
    if (activeSections.length === 0) {
      alert("No sections found for the selected school year.");
      setIsFetching(false);
      return;
    }

    try {
      const dataToRender: { section: Section; students: Student[]; calendar: any[] }[] = [];

      for (let i = 0; i < activeSections.length; i++) {
        const sec = activeSections[i];
        setLoadingText(`Loading ${sec.name} (${i + 1}/${activeSections.length})...`);
        const q = query(collection(db, `sections/${sec.id}/students`));
        const snap = await getDocs(q);
        const students = snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        const enrolledStudents = students.filter(s => s.status !== 'Transferred Out' && s.status !== 'Dropped Out');
        
        const sectionSchoolCalendar = schoolCalendar.filter(c => c.schoolYear === sec.schoolYear);
        
        dataToRender.push({
          section: sec,
          students: enrolledStudents,
          calendar: sectionSchoolCalendar
        });
      }

      setAllSectionsData(dataToRender);
      setIsFetching(false);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error loading sections for SF2 print:", error);
      alert("An error occurred while loading section data.");
      setIsFetching(false);
    }
  };

  const handlePrintWindow = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!printableRef.current) return;
    setIsExportingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      await doc.html(printableRef.current, {
        callback: function (doc) {
          const totalPages = (doc as any).internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 5);
          }
          doc.save(`All_SF2_Reports_${schoolYear}_${selectedMonth}.pdf`);
          setIsExportingPDF(false);
        },
        margin: [5, 5, 5, 5],
        autoPaging: 'text',
        x: 0,
        y: 0,
        width: 287,
        windowWidth: 1200
      });
    } catch (error) {
      console.error("Failed to generate combined PDF:", error);
      alert("Failed to export PDF. You can also click 'Print All Now' and Save as PDF.");
      setIsExportingPDF(false);
    }
  };

  return (
    <>
      {/* Main Action Trigger */}
      <button 
        onClick={handleFetchAndOpenModal} 
        disabled={isFetching}
        className="flex items-center justify-center gap-2 px-6 h-12 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition-all active:scale-95 disabled:opacity-70 disabled:hover:scale-100 cursor-pointer"
      >
        {isFetching ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
        {isFetching ? loadingText : 'Print All SF2 Reports'}
      </button>

      {/* Full-Screen Printed Window Modal matching SF2ReportView's print modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-50 overflow-y-auto flex flex-col font-sans text-slate-800 print-modal-container"
          >
            {/* Inject print media styles for seamless window printing */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: landscape;
                  margin: 5mm;
                }
                html, body, #root, #root > div {
                  background: white !important;
                  color: black !important;
                  height: auto !important;
                  min-height: 0 !important;
                  max-height: none !important;
                  overflow: visible !important;
                  position: static !important;
                  display: block !important;
                }
                .print-modal-container {
                  position: static !important;
                  inset: auto !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                  background: white !important;
                  z-index: auto !important;
                  display: block !important;
                }
                .print-hidden {
                  display: none !important;
                }
                .section-sf2-print-wrapper {
                  display: block !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  position: relative !important;
                  float: none !important;
                  clear: both !important;
                  overflow: visible !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                .section-sf2-print-wrapper + .section-sf2-print-wrapper,
                .section-sf2-print-wrapper:not(:first-child) {
                  page-break-before: always !important;
                  break-before: page !important;
                }
                .sf2-report-container {
                  width: 100% !important;
                  border: none !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  overflow: visible !important;
                  display: block !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                tr {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            `}} />

            {/* STICKY TOP BAR */}
            <div className="sticky top-0 z-[210] bg-slate-900 text-white shadow-xl px-8 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 print-hidden shrink-0">
              <div className="flex flex-col">
                <h2 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <Printer size={16} /> School Form 2 (SF2) - All Sections Attendance Report
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  School Year: <span className="text-white uppercase font-black">{schoolYear}</span> • Total Sections: <span className="text-white uppercase font-black">{allSectionsData.length}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Month Selector Dropdown */}
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                  <Calendar size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Report Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-slate-900 text-white font-bold text-xs px-3 py-1 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer uppercase"
                  >
                    {MONTH_OPTIONS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Print Now Button */}
                <button 
                  onClick={handlePrintWindow}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Printer size={14} />
                  Print All Now
                </button>

                {/* Export PDF Button */}
                <button 
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isExportingPDF ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {isExportingPDF ? 'Exporting PDF...' : 'Export Combined PDF'}
                </button>

                {/* Close Page Button */}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <X size={14} />
                  Close Page
                </button>
              </div>
            </div>

            {/* PRINT WRAPPER / SCROLLABLE CONTENT AREA */}
            <div className="flex-1 flex flex-col items-center justify-start py-8 overflow-y-auto bg-slate-100 gap-10 print:bg-white print:p-0 print:overflow-visible print:block w-full">
              <div ref={printableRef} className="flex flex-col gap-10 print:gap-0 print:block w-full items-center">
                {allSectionsData.map((data, index) => (
                  <div 
                    key={data.section.id} 
                    className="section-sf2-print-wrapper flex flex-col items-center w-full print:block"
                    style={{ 
                      pageBreakBefore: index > 0 ? 'always' : 'auto',
                      breakBefore: index > 0 ? 'page' : 'auto'
                    }}
                  >
                    <div className="text-center mb-2 print-hidden">
                      <span className="px-4 py-1.5 bg-slate-900 text-indigo-300 rounded-full text-xs font-black uppercase tracking-widest shadow">
                        Section {index + 1} of {allSectionsData.length}: {data.section.gradeLevel} - {data.section.name}
                      </span>
                    </div>

                    <SF2ReportView
                      section={data.section}
                      students={data.students}
                      calendar={data.calendar}
                      userId={currentUser?.uid}
                      currentUser={currentUser}
                      isPrintMode={true}
                      printMonthOverride={selectedMonth}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
