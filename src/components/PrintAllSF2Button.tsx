import React, { useState, useRef } from 'react';
import { Section, Student } from '../types';
import { safeGetDocs as getDocs, db } from '../firebase';
import { query, collection } from 'firebase/firestore';
import { Printer, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { SF2ReportView } from './SF2ReportView';

interface PrintAllSF2ButtonProps {
  sections: Section[];
  schoolYear: string;
  currentUser: any;
  schoolCalendar: any[];
}

export const PrintAllSF2Button: React.FC<PrintAllSF2ButtonProps> = ({ sections, schoolYear, currentUser, schoolCalendar }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [allSectionsData, setAllSectionsData] = useState<{section: Section, students: Student[], calendar: any[]}[]>([]);
  const hiddenContainerRef = useRef<HTMLDivElement>(null);

  const handlePrintAll = async () => {
    setIsPrinting(true);
    setLoadingText("Fetching sections data...");
    
    const activeSections = sections.filter(s => s.schoolYear === schoolYear);
    
    if (activeSections.length === 0) {
      alert("No sections found for the selected school year.");
      setIsPrinting(false);
      return;
    }

    try {
      const dataToRender: any[] = [];
      const today = new Date();
      const JS_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const currentMonthStr = JS_MONTHS[today.getMonth()];

      for (let i = 0; i < activeSections.length; i++) {
        const sec = activeSections[i];
        setLoadingText(`Fetching students for ${sec.name} (${i + 1}/${activeSections.length})...`);
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
      
      setLoadingText("Generating PDF (this might take a while)...");
      setTimeout(async () => {
         if (!hiddenContainerRef.current) {
            setIsPrinting(false);
            return;
         }
         
         try {
             const doc = new jsPDF({
               orientation: 'l',
               unit: 'mm',
               format: 'a4',
               compress: true
             });
             
             await doc.html(hiddenContainerRef.current, {
               callback: function (doc) {
                 const totalPages = (doc as any).internal.getNumberOfPages();
                 for (let i = 1; i <= totalPages; i++) {
                   doc.setPage(i);
                   doc.setFontSize(8);
                   doc.setTextColor(150);
                   doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 5);
                 }
                 doc.save(`All_SF2_Reports_${schoolYear}.pdf`);
                 setIsPrinting(false);
                 setAllSectionsData([]);
               },
               margin: [5, 5, 5, 5],
               autoPaging: 'text',
               x: 0,
               y: 0,
               width: 287,
               windowWidth: 1200
             });
         } catch (e) {
             console.error("Failed jsPDF", e);
             setIsPrinting(false);
             setAllSectionsData([]);
         }
      }, 3000); 

    } catch (error) {
      console.error(error);
      alert("An error occurred while generating the report.");
      setIsPrinting(false);
      setAllSectionsData([]);
    }
  };

  const today = new Date();
  const JS_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthStr = JS_MONTHS[today.getMonth()];

  return (
    <>
      <button 
        onClick={handlePrintAll} 
        disabled={isPrinting}
        className="flex items-center justify-center gap-2 px-6 h-12 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition-all active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
      >
        {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
        {isPrinting ? loadingText : 'Print All SF2 Reports'}
      </button>

      {allSectionsData.length > 0 && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
           <div ref={hiddenContainerRef} style={{ width: '1200px' }}>
              {allSectionsData.map((data, index) => (
                 <div key={data.section.id} style={{ pageBreakAfter: index < allSectionsData.length - 1 ? 'always' : 'auto', marginBottom: index < allSectionsData.length - 1 ? '20px' : '0' }}>
                    <SF2ReportView
                       section={data.section}
                       students={data.students}
                       calendar={data.calendar}
                       userId={currentUser?.uid}
                       isPrintMode={true}
                       printMonthOverride={currentMonthStr}
                    />
                 </div>
              ))}
           </div>
        </div>
      )}
    </>
  );
};
