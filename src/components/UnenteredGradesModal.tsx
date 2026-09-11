import React, { useState } from 'react';
import { Student, GradeRecord } from '../types';
import { X, AlertCircle, UserCheck, UserX, Plus, Sparkles, CheckCircle2, ChevronRight, Layers } from 'lucide-react';

interface EvalMissingItem {
  subject: string;
  evalArea: string;
  evalElement: string;
  missingStudents: Student[];
  missingCount: number;
}

interface UnenteredGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentsWithoutGrades: Student[];
  evalMissingDetails: EvalMissingItem[];
  onSelectStudentToGrade: (student: Student) => void;
  onOpenBatchGradeModal: () => void;
}

export const UnenteredGradesModal: React.FC<UnenteredGradesModalProps> = ({
  isOpen,
  onClose,
  studentsWithoutGrades,
  evalMissingDetails,
  onSelectStudentToGrade,
  onOpenBatchGradeModal,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'evaluations'>('students');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-700 to-amber-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">미입력된 성적 기록 상세 현황</h3>
              <p className="text-xs text-amber-100">
                성적이 아직 등록되지 않은 학생 및 진행 중인 평가요소별 미입력 현황입니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Quick Action Bar */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserX className="w-3.5 h-3.5 text-amber-600" />
              <span>성적 미등록 학생 ({studentsWithoutGrades.length}명)</span>
            </button>
            <button
              onClick={() => setActiveTab('evaluations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'evaluations'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-orange-600" />
              <span>실시 평가별 누락 ({evalMissingDetails.length}개 항목)</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenBatchGradeModal();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ 다중(일괄) 성적 입력하기</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'students' ? (
            <div>
              {studentsWithoutGrades.length === 0 ? (
                <div className="text-center py-12 bg-emerald-50/60 rounded-2xl border border-emerald-200/70 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-900">모든 학생의 성적이 등록되어 있습니다!</h4>
                  <p className="text-xs text-emerald-700">성적이 누락된 학생이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                    <span>성적이 1건도 등록되지 않은 학생 명단입니다.</span>
                    <span className="font-bold text-amber-800">총 {studentsWithoutGrades.length}명</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {studentsWithoutGrades.map((stu) => (
                      <div
                        key={stu.id}
                        className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-2xs flex items-center justify-between gap-3 hover:border-amber-400 transition group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                              {stu.studentNumber || '학생'}
                            </span>
                            <span className="text-sm font-black text-slate-900">{stu.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            인증코드: {stu.authCode}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onSelectStudentToGrade(stu);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0 border border-amber-200 cursor-pointer group-hover:bg-amber-600 group-hover:text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>성적 입력</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {evalMissingDetails.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <Layers className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">진행 중인 평가 항목이 없습니다.</h4>
                  <p className="text-xs text-slate-500">성적을 먼저 1건 이상 등록하시면 항목별 누락 현황이 집계됩니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-medium px-1">
                    현재 학급에 1건 이상 등록된 평가 요소 중 아직 성적이 입력되지 않은 학생 현황입니다.
                  </p>

                  <div className="space-y-2.5">
                    {evalMissingDetails.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                {item.subject}
                              </span>
                              <span className="text-xs font-bold text-slate-600">
                                {item.evalArea}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-900 mt-1">
                              {item.evalElement}
                            </h5>
                          </div>
                          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 shrink-0">
                            {item.missingCount}명 미입력
                          </span>
                        </div>

                        {item.missingCount > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                              미입력 학생 ({item.missingStudents.length}명):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.missingStudents.slice(0, 10).map((s) => (
                                <span
                                  key={s.id}
                                  className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium"
                                >
                                  {s.name}
                                </span>
                              ))}
                              {item.missingStudents.length > 10 && (
                                <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                                  외 {item.missingStudents.length - 10}명
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
