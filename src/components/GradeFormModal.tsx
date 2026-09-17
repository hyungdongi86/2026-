import React, { useState, useEffect } from 'react';
import {
  GradeRecord,
  Student,
  PerformanceLevel,
  SUBJECT_LIST,
  SUBJECT_EVAL_AREAS,
  SUBJECT_EVAL_ELEMENTS,
} from '../types';
import { findCurriculumPlan } from '../data/curriculumPlans';
import {
  X,
  Save,
  BookOpen,
  User,
  Layers,
  MessageSquare,
  Tag,
  CheckCircle2,
  FileText,
  Sparkles,
  Info,
} from 'lucide-react';

interface GradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gradeData: Omit<GradeRecord, 'id'> & { id?: string }) => void;
  students: Student[];
  initialGrade?: GradeRecord | null;
}

const PERFORMANCE_LEVELS: PerformanceLevel[] = ['매우잘함', '잘함', '보통', '노력 요함'];

const PERFORMANCE_SCORE_MAP: Record<PerformanceLevel, number> = {
  매우잘함: 100,
  잘함: 85,
  보통: 70,
  '노력 요함': 55,
};

export const GradeFormModal: React.FC<GradeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  students,
  initialGrade,
}) => {
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState<string>('도덕');
  const [evalArea, setEvalArea] = useState<string>(SUBJECT_EVAL_AREAS['도덕'][0]);
  const [evalElement, setEvalElement] = useState<string>('');
  const [performanceRating, setPerformanceRating] = useState<PerformanceLevel>('매우잘함');
  const [teacherComment, setTeacherComment] = useState('');

  useEffect(() => {
    if (initialGrade) {
      setStudentId(initialGrade.studentId);
      const subj = initialGrade.subject || '도덕';
      setSubject(subj);

      const availableAreas = SUBJECT_EVAL_AREAS[subj] || ['기본영역'];
      const area = initialGrade.evalArea || availableAreas[0];
      setEvalArea(area);

      const availableElements = SUBJECT_EVAL_ELEMENTS[subj]?.[area] || [];
      setEvalElement(initialGrade.evalElement || availableElements[0] || '');

      setPerformanceRating(initialGrade.performanceRating || '매우잘함');
      setTeacherComment(initialGrade.teacherComment || '');
    } else {
      if (students.length > 0) {
        setStudentId(students[0].id);
      }
      setSubject('도덕');
      const defaultArea = SUBJECT_EVAL_AREAS['도덕'][0];
      setEvalArea(defaultArea);
      const defaultElements = SUBJECT_EVAL_ELEMENTS['도덕']?.[defaultArea] || [];
      setEvalElement(defaultElements[0] || '');
      setPerformanceRating('매우잘함');
      setTeacherComment('');
    }
  }, [initialGrade, isOpen, students]);

  if (!isOpen) return null;

  const handleSubjectChange = (newSubj: string) => {
    setSubject(newSubj);
    const availableAreas = SUBJECT_EVAL_AREAS[newSubj] || ['기본영역'];
    const newArea = availableAreas[0];
    setEvalArea(newArea);
    const availableElements = SUBJECT_EVAL_ELEMENTS[newSubj]?.[newArea] || [];
    setEvalElement(availableElements[0] || '');
  };

  const handleEvalAreaChange = (newArea: string) => {
    setEvalArea(newArea);
    const availableElements = SUBJECT_EVAL_ELEMENTS[subject]?.[newArea] || [];
    setEvalElement(availableElements[0] || '');
  };

  // 평가계획서 공식 루브릭 및 연계 정보 찾기
  const currentPlan = findCurriculumPlan(subject, evalArea, evalElement);
  const officialRubric = currentPlan?.rubrics?.[performanceRating];

  const handleApplyRubricComment = () => {
    if (officialRubric) {
      setTeacherComment(officialRubric);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      alert('학생을 선택해 주세요.');
      return;
    }
    if (!subject.trim()) {
      alert('교과목을 선택해 주세요.');
      return;
    }

    const selectedStudent = students.find((s) => s.id === studentId);
    const finalScore = PERFORMANCE_SCORE_MAP[performanceRating];

    onSave({
      id: initialGrade?.id,
      studentId,
      studentName: selectedStudent ? selectedStudent.name : '학생',
      subject: subject.trim(),
      evalArea: evalArea || (SUBJECT_EVAL_AREAS[subject.trim()]?.[0] ?? '기본영역'),
      evalElement: evalElement.trim(),
      testType: initialGrade?.testType || '수행평가',
      performanceRating,
      score: finalScore,
      maxScore: 100,
      testDate: initialGrade?.testDate || new Date().toISOString().split('T')[0],
      teacherComment: teacherComment.trim(),
    });

    onClose();
  };

  const currentEvalAreas = SUBJECT_EVAL_AREAS[subject] || ['기본영역'];
  const currentEvalElements = SUBJECT_EVAL_ELEMENTS[subject]?.[evalArea] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-200" />
            <h3 className="text-lg font-bold">
              {initialGrade ? '성적 기록 수정' : '새 성적 입력'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Student selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>대상 학생</span>
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.name} ({stu.gradeLevel || ''} {stu.classNumber || ''} {stu.studentNumber || ''} / 코드: {stu.authCode})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector (Fixed 10 subjects in exact order) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>교과목 선택</span>
            </label>
            <select
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {SUBJECT_LIST.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>

            {/* Subject Presets Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUBJECT_LIST.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => handleSubjectChange(subj)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                    subject === subj
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>

          {/* Evaluation Area & Connected Element */}
          {subject === '국어' ? (
            /* 국어 과목: 평가영역당 1회 평가 - 영역 및 평가요소 단일 통합 드롭다운 */
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>국어 평가 영역 및 연계 평가요소 (통합)</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  영역당 1개 단일 평가
                </span>
              </div>

              <select
                value={evalArea}
                onChange={(e) => handleEvalAreaChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-950 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
              >
                {currentEvalAreas.map((area) => {
                  const elem = SUBJECT_EVAL_ELEMENTS['국어']?.[area]?.[0] || '';
                  return (
                    <option key={area} value={area}>
                      [{area}] {elem}
                    </option>
                  );
                })}
              </select>

              {/* Quick Area Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {currentEvalAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleEvalAreaChange(area)}
                    className={`text-[11px] px-3 py-1 rounded-lg font-bold border transition cursor-pointer ${
                      evalArea === area
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>

              {currentPlan && (
                <div className="bg-white/95 p-3 rounded-xl border border-emerald-200 text-[11px] space-y-1 mt-1">
                  <div className="flex items-center flex-wrap gap-2 text-emerald-900 font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">{currentPlan.month}</span>
                    <span>단원: {currentPlan.unitName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{currentPlan.standardCode}</span>
                  </div>
                  <div className="text-slate-700 text-[11px]">
                    <span className="font-semibold text-emerald-900">통합 평가요소: </span>
                    {evalElement}
                  </div>
                  {currentPlan.method && (
                    <div className="text-slate-600 text-[10.5px]">
                      <strong className="text-slate-700">평가방법:</strong> {currentPlan.method}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Evaluation Area (Dropdown per subject) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>평가 영역 (드롭다운)</span>
                  <span className="text-[10px] text-emerald-700 font-normal">({subject} 교과 세부 영역)</span>
                </label>
                <select
                  value={evalArea}
                  onChange={(e) => handleEvalAreaChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {currentEvalAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                {/* Quick area pill buttons */}
                {currentEvalAreas.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentEvalAreas.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => handleEvalAreaChange(area)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium border transition cursor-pointer ${
                          evalArea === area
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Connected Evaluation Element (Dropdown Only) */}
              <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>연계 평가 요소</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    평가계획서 연동
                  </span>
                </div>

                {currentPlan && (
                  <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200 text-[11px] space-y-1">
                    <div className="flex items-center flex-wrap gap-2 text-emerald-900 font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">{currentPlan.month}</span>
                      <span>단원: {currentPlan.unitName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{currentPlan.standardCode}</span>
                    </div>
                    {currentPlan.method && (
                      <div className="text-slate-600 text-[10.5px]">
                        <strong className="text-slate-700">평가방법:</strong> {currentPlan.method}
                      </div>
                    )}
                  </div>
                )}

                <select
                  value={evalElement}
                  onChange={(e) => setEvalElement(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 text-xs font-semibold text-emerald-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                >
                  {currentEvalElements.map((elem, idx) => (
                    <option key={idx} value={elem}>
                      {elem}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Performance Rating (4 Levels) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>평가 결과 (성취 수준)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PERFORMANCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPerformanceRating(level)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                    performanceRating === level
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Teacher Comment / Feedback */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                <span>교사 한줄평 / 피드백</span>
              </label>

              {officialRubric && (
                <button
                  type="button"
                  onClick={handleApplyRubricComment}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 font-bold transition flex items-center gap-1 cursor-pointer"
                  title="2026학년도 평가계획서 공식 성취기준 서술문으로 채웁니다."
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>공식 성취기준 적용하기</span>
                </button>
              )}
            </div>

            {officialRubric && (
              <div className="mb-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                <div className="font-bold flex items-center gap-1 text-amber-800 mb-0.5">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>평가계획서 [{performanceRating}] 공식 성취 기준:</span>
                </div>
                <p className="line-clamp-3 text-slate-700">{officialRubric}</p>
              </div>
            )}

            <textarea
              rows={3}
              placeholder="학생의 학습 태도, 강점 및 성장 포인트 피드백을 한줄평으로 남겨주세요."
              value={teacherComment}
              onChange={(e) => setTeacherComment(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
