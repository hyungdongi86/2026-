import React, { useState } from 'react';
import { CURRICULUM_EVAL_PLANS, CurriculumPlanItem } from '../data/curriculumPlans';
import { SUBJECT_LIST } from '../types';
import { X, BookOpen, Search, Printer, CheckCircle2, FileText, Sparkles, Filter } from 'lucide-react';

interface CurriculumPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurriculumPlanModal: React.FC<CurriculumPlanModalProps> = ({ isOpen, onClose }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const filteredPlans = CURRICULUM_EVAL_PLANS.filter((item) => {
    const matchSubject = selectedSubject === 'all' || item.subject === selectedSubject;
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.subject.toLowerCase().includes(q) ||
      item.evalArea.toLowerCase().includes(q) ||
      item.evalElement.toLowerCase().includes(q) ||
      item.unitName.toLowerCase().includes(q) ||
      item.standardCode.toLowerCase().includes(q);
    return matchSubject && matchSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                2026학년도 2학기 6학년 교과 및 창체 학생 평가계획서
              </h3>
              <p className="text-xs text-emerald-100">
                학교 공식 평가계획서 원본 기반 과목별 평가영역, 연계 평가요소 및 성취수준 루브릭
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-200" />
              <span>계획표 인쇄</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Subject Selector Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="과목, 단원, 평가영역, 평가요소 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Total Count */}
            <div className="text-xs text-slate-500 shrink-0">
              조회된 평가 계획: <strong className="text-emerald-800 font-bold">{filteredPlans.length}</strong>개 항목
            </div>
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 rounded-lg font-bold shrink-0 transition cursor-pointer ${
                selectedSubject === 'all'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              전체 과목 ({CURRICULUM_EVAL_PLANS.length})
            </button>
            {SUBJECT_LIST.map((subj) => {
              const count = CURRICULUM_EVAL_PLANS.filter((p) => p.subject === subj).length;
              if (count === 0) return null;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition cursor-pointer ${
                    selectedSubject === subj
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {subj} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan Items List / Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100/60">
          {filteredPlans.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
              일치하는 평가 계획 항목이 없습니다.
            </div>
          ) : (
            filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3 transition hover:border-emerald-300"
              >
                {/* Item Top Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-black text-xs">
                      {plan.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                      영역: {plan.evalArea}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-xs">
                      시기: {plan.month}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {plan.standardCode}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    단원: <span className="text-emerald-900">{plan.unitName}</span>
                  </div>
                </div>

                {/* Eval Element Core */}
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>연계 평가 요소:</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-snug pl-5">
                    {plan.evalElement}
                  </p>
                  {plan.method && (
                    <p className="text-xs text-slate-600 pl-5 pt-0.5">
                      <strong className="text-slate-700">평가 방법:</strong> {plan.method}
                    </p>
                  )}
                </div>

                {/* Rubrics (Achievement Levels) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-200/60">
                    <div className="flex items-center gap-1 font-bold text-emerald-900 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>[매우잘함]</span>
                    </div>
                    <p className="text-[11.5px] text-slate-700 leading-relaxed">
                      {plan.rubrics['매우잘함']}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-teal-50/40 border border-teal-200/60">
                    <div className="flex items-center gap-1 font-bold text-teal-900 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>[잘함]</span>
                    </div>
                    <p className="text-[11.5px] text-slate-700 leading-relaxed">
                      {plan.rubrics['잘함']}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-200/60">
                    <div className="flex items-center gap-1 font-bold text-amber-900 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>[보통]</span>
                    </div>
                    <p className="text-[11.5px] text-slate-700 leading-relaxed">
                      {plan.rubrics['보통']}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-orange-50/40 border border-orange-200/60">
                    <div className="flex items-center gap-1 font-bold text-orange-900 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                      <span>[노력 요함]</span>
                    </div>
                    <p className="text-[11.5px] text-slate-700 leading-relaxed">
                      {plan.rubrics['노력 요함']}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            초등 교육과정 연계 평가계획서 (2026학년도 2학기 기준)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
