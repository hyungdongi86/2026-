import React from 'react';
import { Student } from '../types';
import { X, Printer, KeyRound, ShieldCheck, Download } from 'lucide-react';

interface AuthCodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolName: string;
  className: string;
}

export const AuthCodePrintModal: React.FC<AuthCodePrintModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolName,
  className,
}) => {
  if (!isOpen) return null;

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Print error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn print:static print:p-0 print:bg-white print:z-auto print-modal-container">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden relative max-h-[90vh] flex flex-col print:max-w-none print:max-h-none print:shadow-none print:border-none print:p-0 print:overflow-visible print:static">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-emerald-300" />
            <h3 className="text-lg font-bold">학생 개인 인증코드 발급표 (인쇄용)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄하기</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-6 overflow-y-auto space-y-6 print:p-0 print:overflow-visible">
          {isInIframe && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2 print:hidden">
              <span className="font-bold shrink-0">ℹ️ 안내:</span>
              <span>
                현재 AI Studio 미리보기(iframe) 환경에서는 브라우저 정책으로 인쇄 창이 바로 열리지 않을 수 있습니다. 
                우측 상단의 <strong>[새 창에서 열기 ↗]</strong>를 누른 후 인쇄하시면 인쇄 대화상자가 정상 호출됩니다.
              </span>
            </div>
          )}

          <div className="text-center border-b border-slate-200 pb-4">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {schoolName || '다솜 초등학교'} {className || '6학년 1반'}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              학생 개인 인증코드 안내표
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              본 인증코드는 학생 개인의 성적 조회 로그인에 사용됩니다. 타인에게 유출되지 않도록 주의하세요.
            </p>
          </div>

          {/* Cards for students */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {students.map((stu) => (
              <div
                key={stu.id}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-1.5 print-avoid-break print:bg-white print:border-slate-300"
              >
                <div className="text-xs font-medium text-slate-500">
                  {stu.gradeLevel || '6학년'} {stu.classNumber || '1반'} {stu.studentNumber || ''}
                </div>
                <div className="text-base font-bold text-slate-900">{stu.name}</div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 block mb-0.5">접속 인증코드</span>
                  <span className="text-sm font-mono font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 tracking-wider inline-block print:border-slate-400 print:text-black">
                    {stu.authCode}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 print:hidden">
            <strong>💡 교사 전달 팁:</strong> 해당 화면을 [인쇄하기] 버튼을 눌러 종이로 출력 후 잘라서 각 학생에게 개별 전달해주시면 편리합니다.
          </div>
        </div>
      </div>
    </div>
  );
};
