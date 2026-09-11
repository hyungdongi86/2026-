import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Student } from '../types';
import { X, Printer, KeyRound, ShieldCheck, UserCheck, Filter, AlertCircle } from 'lucide-react';

interface AuthCodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolName: string;
  className: string;
  initialSelectedStudentId?: string | null;
}

export const AuthCodePrintModal: React.FC<AuthCodePrintModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolName,
  className,
  initialSelectedStudentId,
}) => {
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      if (initialSelectedStudentId) {
        setSelectedStudentFilter(initialSelectedStudentId);
      } else {
        setSelectedStudentFilter('all');
      }
      document.body.classList.add('print-auth-modal-active');
    } else {
      document.body.classList.remove('print-auth-modal-active');
    }

    return () => {
      document.body.classList.remove('print-auth-modal-active');
    };
  }, [isOpen, initialSelectedStudentId]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Print error:', err);
    }
  };

  const displayedStudents =
    selectedStudentFilter === 'all'
      ? students
      : students.filter((s) => s.id === selectedStudentFilter);

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn auth-print-portal print:static print:p-0 print:bg-white print:z-auto print-modal-container">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden relative max-h-[90vh] flex flex-col auth-print-card print:max-w-none print:max-h-none print:shadow-none print:border-none print:p-0 print:overflow-visible print:static">
        {/* Modal Header (Hidden during print) */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <KeyRound className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">학생 개인 인증코드 발급표 인쇄</h3>
              <p className="text-xs text-emerald-200">
                {displayedStudents.length === 1
                  ? `${displayedStudents[0].name} 학생 개인 인증코드만 인쇄합니다.`
                  : `전체 ${displayedStudents.length}명의 개인 인증코드를 인쇄합니다.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Student Filter Selector */}
            <div className="flex items-center gap-1 bg-white/15 px-2.5 py-1.5 rounded-xl border border-white/20 text-xs">
              <Filter className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <select
                value={selectedStudentFilter}
                onChange={(e) => setSelectedStudentFilter(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="text-slate-900 font-medium">
                  전체 학생 ({students.length}명)
                </option>
                {students.map((stu) => (
                  <option key={stu.id} value={stu.id} className="text-slate-900 font-medium">
                    {stu.studentNumber ? `${stu.studentNumber}번 ` : ''}{stu.name} (개인 1명)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              title="인쇄 미리보기 및 종이 인쇄를 진행합니다."
            >
              <Printer className="w-4 h-4 text-slate-900" />
              <span>인쇄하기</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Area */}
        <div className="p-6 overflow-y-auto space-y-6 print:p-0 print:overflow-visible">
          {isInIframe && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2 print:hidden">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                현재 AI Studio 미리보기(iframe) 환경에서는 브라우저 보안 정책으로 인쇄 대화상자가 바로 호출되지 않을 수 있습니다. 
                인쇄가 작동하지 않을 경우 화면 우측 상단의 <strong>[새 창에서 열기 ↗]</strong>를 누른 후 인쇄 버튼을 누르시면 정상 출력됩니다.
              </span>
            </div>
          )}

          {/* SINGLE STUDENT PRINT VIEW */}
          {displayedStudents.length === 1 ? (
            <div className="space-y-6">
              <div className="text-center border-b border-slate-200 pb-4">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {schoolName || '다솜 초등학교'} {className || '6학년 1반'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2">
                  학생 개인 성적 조회 인증코드 안내표
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  본 인증코드는 학생 개인의 성적 조회 및 교사 피드백 확인 전용 비밀번호입니다.
                </p>
              </div>

              {/* Centered Large Card for Single Student */}
              <div className="max-w-md mx-auto bg-white rounded-3xl p-6 border-2 border-slate-300 text-center space-y-4 shadow-sm print:border-2 print:border-black print:p-6 print:rounded-2xl print:shadow-none">
                <div className="space-y-1">
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 rounded-md text-slate-600 print:border print:border-slate-300">
                    {displayedStudents[0].gradeLevel || '6학년'} {displayedStudents[0].classNumber || '1반'}{' '}
                    {displayedStudents[0].studentNumber ? `${displayedStudents[0].studentNumber}` : ''}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 pt-1">
                    {displayedStudents[0].name} <span className="text-sm font-medium text-slate-500">학생</span>
                  </h3>
                </div>

                <div className="py-4 px-6 bg-emerald-50/80 rounded-2xl border border-emerald-200 print:bg-white print:border-2 print:border-slate-800">
                  <span className="text-xs text-emerald-900 print:text-black font-bold block mb-1">
                    개인 성적 조회 접속 인증코드
                  </span>
                  <span className="text-3xl font-mono font-black text-emerald-800 print:text-black tracking-widest block">
                    {displayedStudents[0].authCode}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 print:bg-white print:border-slate-300">
                  <p className="font-bold text-slate-700">📌 로그인 안내:</p>
                  <p>1. 성적 관리 시스템 첫 화면에서 학생 본인의 이름({displayedStudents[0].name})을 입력합니다.</p>
                  <p>2. 인증코드 6자리 (<strong className="font-mono font-bold text-emerald-800 print:text-black">{displayedStudents[0].authCode}</strong>)를 입력하여 접속합니다.</p>
                  <p>3. 선생님께서 남겨주신 과목별 성취수준 평가와 한줄평 피드백을 실시간으로 확인하세요.</p>
                </div>

                <div className="pt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>* 타인에게 인증코드가 노출되지 않도록 주의하세요.</span>
                  <span className="font-medium text-slate-600">담임 교사 확인 (인)</span>
                </div>
              </div>
            </div>
          ) : (
            /* ALL STUDENTS GRID VIEW */
            <div className="space-y-6">
              <div className="text-center border-b border-slate-200 pb-4">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {schoolName || '다솜 초등학교'} {className || '6학년 1반'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2">
                  학생 개인 인증코드 안내표 (총 {displayedStudents.length}명)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  본 인증코드는 학생 개인의 성적 조회 로그인에 사용됩니다. 타인에게 유출되지 않도록 각 학생에게 개별 배부해주세요.
                </p>
              </div>

              {/* Cards for all students */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3 print:gap-3">
                {displayedStudents.map((stu) => (
                  <div
                    key={stu.id}
                    className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-300 text-center space-y-1.5 print-avoid-break print:bg-white print:border-slate-400 print:rounded-xl"
                  >
                    <div className="text-xs font-medium text-slate-500">
                      {stu.gradeLevel || '6학년'} {stu.classNumber || '1반'} {stu.studentNumber || ''}
                    </div>
                    <div className="text-base font-bold text-slate-900">{stu.name}</div>
                    <div className="pt-2 border-t border-slate-200 print:border-slate-300">
                      <span className="text-[10px] text-slate-400 block mb-0.5">접속 인증코드</span>
                      <span className="text-sm font-mono font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 tracking-wider inline-block print:border-slate-500 print:text-black print:bg-slate-50">
                        {stu.authCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 print:hidden flex items-center justify-between">
            <div>
              <strong>💡 교사 전달 팁:</strong> 상단의 [인쇄하기] 버튼을 누르면 이 창의 인증코드 안내표만 단독 출력됩니다. 점선대로 오려서 학생들에게 개별 전달해주시면 편리합니다.
            </div>
            {displayedStudents.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedStudentFilter(students[0]?.id || 'all')}
                className="ml-2 text-xs text-amber-800 font-bold underline hover:text-amber-900 shrink-0"
              >
                특정 1명만 선택 인쇄
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

