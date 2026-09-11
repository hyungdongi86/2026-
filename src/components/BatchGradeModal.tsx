import React, { useState, useEffect } from 'react';
import { GradeRecord, Student, PerformanceLevel, TestType, SUBJECT_LIST, SUBJECT_EVAL_AREAS, SUBJECT_EVAL_ELEMENTS } from '../types';
import { findCurriculumPlan } from '../data/curriculumPlans';
import { X, Save, Layers, BookOpen, Users, CheckCircle2, AlertTriangle, MessageSquare, Sparkles, ArrowRight, RotateCcw, FileText, Wand2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface BatchGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (newOrUpdatedGrades: (Omit<GradeRecord, 'id'> & { id?: string })[]) => void;
  students: Student[];
  existingGrades: GradeRecord[];
}

interface BatchRowItem {
  id?: string; // existing grade id if editing
  studentId: string;
  studentName: string;
  subject: string;
  evalArea: string;
  evalElement: string;
  testType?: TestType | string;
  performanceRating: PerformanceLevel;
  score: number | '';
  maxScore: number;
  testDate?: string;
  teacherComment: string;
  isInclude: boolean; // whether to save this row
}

const PERFORMANCE_LEVELS: PerformanceLevel[] = ['매우잘함', '잘함', '보통', '노력 요함'];

const PERFORMANCE_SCORE_MAP: Record<PerformanceLevel, number> = {
  매우잘함: 100,
  잘함: 85,
  보통: 70,
  '노력 요함': 55,
};

export const BatchGradeModal: React.FC<BatchGradeModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch,
  students,
  existingGrades,
}) => {
  // Batch Preset Header Controls
  const [batchSubject, setBatchSubject] = useState<string>('도덕');
  const [batchEvalArea, setBatchEvalArea] = useState<string>(SUBJECT_EVAL_AREAS['도덕'][0]);
  const [batchEvalElement, setBatchEvalElement] = useState<string>(
    SUBJECT_EVAL_ELEMENTS['도덕']?.[SUBJECT_EVAL_AREAS['도덕'][0]]?.[0] || ''
  );
  const [batchPerfRating, setBatchPerfRating] = useState<PerformanceLevel>('매우잘함');

  // Mode: 'new' (entire class new assessment) vs 'existing' (load existing records for bulk edit)
  const [entryMode, setEntryMode] = useState<'new' | 'existing'>('new');
  const [filterSubjectForExisting, setFilterSubjectForExisting] = useState<string>('all');

  // Rows state & Saved Snapshot
  const [rows, setRows] = useState<BatchRowItem[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<BatchRowItem[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Synchronize dynamic areas and elements for batch header when subject changes
  const handleBatchSubjectChange = (newSubj: string) => {
    setBatchSubject(newSubj);
    const availableAreas = SUBJECT_EVAL_AREAS[newSubj] || ['기본영역'];
    const newArea = availableAreas[0];
    setBatchEvalArea(newArea);
    const availableElements = SUBJECT_EVAL_ELEMENTS[newSubj]?.[newArea] || [];
    setBatchEvalElement(availableElements[0] || '');
  };

  const handleBatchEvalAreaChange = (newArea: string) => {
    setBatchEvalArea(newArea);
    const availableElements = SUBJECT_EVAL_ELEMENTS[batchSubject]?.[newArea] || [];
    setBatchEvalElement(availableElements[0] || '');
  };

  // Initialize or reload rows when modal opens or mode changes
  useEffect(() => {
    if (!isOpen) return;

    if (entryMode === 'new') {
      // Create new assessment row for each student
      const initialRows: BatchRowItem[] = students.map((stu) => ({
        studentId: stu.id,
        studentName: stu.name,
        subject: batchSubject,
        evalArea: batchEvalArea,
        evalElement: batchEvalElement,
        testType: '수행평가',
        performanceRating: batchPerfRating,
        score: PERFORMANCE_SCORE_MAP[batchPerfRating],
        maxScore: 100,
        testDate: new Date().toISOString().split('T')[0],
        teacherComment: '',
        isInclude: true,
      }));
      setRows(initialRows);
      setSavedSnapshot(initialRows.map((r) => ({ ...r })));
    } else {
      // Load existing records
      let filtered = existingGrades;
      if (filterSubjectForExisting !== 'all') {
        filtered = existingGrades.filter((g) => g.subject === filterSubjectForExisting);
      }

      const existingRows: BatchRowItem[] = filtered.map((g) => {
        const area = g.evalArea || (SUBJECT_EVAL_AREAS[g.subject]?.[0] ?? '기본영역');
        const defaultElem = SUBJECT_EVAL_ELEMENTS[g.subject]?.[area]?.[0] || '';
        return {
          id: g.id,
          studentId: g.studentId,
          studentName: g.studentName,
          subject: g.subject,
          evalArea: area,
          evalElement: g.evalElement || defaultElem,
          testType: g.testType || '수행평가',
          performanceRating: g.performanceRating || '매우잘함',
          score: g.score,
          maxScore: g.maxScore || 100,
          testDate: g.testDate || new Date().toISOString().split('T')[0],
          teacherComment: g.teacherComment || '',
          isInclude: true,
        };
      });
      setRows(existingRows);
      setSavedSnapshot(existingRows.map((r) => ({ ...r })));
    }
    setIsDirty(false);
  }, [isOpen, entryMode, filterSubjectForExisting, students]);

  if (!isOpen) return null;

  // Apply batch preset to all rows
  const handleApplyBatchPresetToAll = () => {
    const updated = rows.map((row) => {
      const areaList = SUBJECT_EVAL_AREAS[batchSubject] || ['기본영역'];
      const area = areaList.includes(batchEvalArea) ? batchEvalArea : areaList[0];
      return {
        ...row,
        subject: batchSubject,
        evalArea: area,
        evalElement: batchEvalElement,
        testType: '수행평가',
        performanceRating: batchPerfRating,
        score: PERFORMANCE_SCORE_MAP[batchPerfRating],
      };
    });
    setRows(updated);
    setIsDirty(true);
  };

  // Apply Official Rubric to All active rows based on each student's rating
  const handleApplyOfficialRubricToAll = () => {
    let appliedCount = 0;
    const updated = rows.map((row) => {
      if (!row.isInclude) return row;
      const plan = findCurriculumPlan(row.subject, row.evalArea, row.evalElement);
      if (plan && plan.rubrics[row.performanceRating]) {
        appliedCount++;
        return {
          ...row,
          teacherComment: plan.rubrics[row.performanceRating],
        };
      }
      return row;
    });
    setRows(updated);
    setIsDirty(true);
    alert(`총 ${appliedCount}명의 학생에게 해당 성취수준의 2026학년도 공식 루브릭 피드백이 일괄 채워졌습니다.`);
  };

  // Apply Official Rubric to a single row
  const handleApplyOfficialRubricToRow = (index: number) => {
    const row = rows[index];
    const plan = findCurriculumPlan(row.subject, row.evalArea, row.evalElement);
    if (plan && plan.rubrics[row.performanceRating]) {
      handleRowChange(index, 'teacherComment', plan.rubrics[row.performanceRating]);
    } else {
      alert('해당 평가요소 및 성취수준의 공식 루브릭 문장이 없습니다.');
    }
  };

  // Row Change Handlers
  const handleRowChange = (index: number, field: keyof BatchRowItem, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };

      // Handle dependent fields
      if (field === 'subject') {
        const availableAreas = SUBJECT_EVAL_AREAS[value] || ['기본영역'];
        const newArea = availableAreas[0];
        target.evalArea = newArea;
        const availableElements = SUBJECT_EVAL_ELEMENTS[value]?.[newArea] || [];
        target.evalElement = availableElements[0] || '';
      }

      if (field === 'evalArea') {
        const availableElements = SUBJECT_EVAL_ELEMENTS[target.subject]?.[value] || [];
        target.evalElement = availableElements[0] || '';
      }

      if (field === 'performanceRating') {
        target.score = PERFORMANCE_SCORE_MAP[value as PerformanceLevel];
      }

      next[index] = target;
      return next;
    });
    setIsDirty(true);
  };

  // Reset/Undo changes to last saved snapshot
  const handleReset = () => {
    if (!isDirty) {
      return;
    }

    setConfirmState({
      isOpen: true,
      title: '입력 되돌리기',
      message: '마지막 저장 이후 수정하신 임시 입력 및 변경사항을 모두 취소하고, 최근 확정 저장된 상태로 되돌리시겠습니까?',
      confirmLabel: '되돌리기',
      variant: 'warning',
      onConfirm: () => {
        setRows(savedSnapshot.map((r) => ({ ...r })));
        setIsDirty(false);
      },
    });
  };

  // Safe Close Request
  const handleRequestClose = () => {
    if (isDirty) {
      setConfirmState({
        isOpen: true,
        title: '닫기 확인',
        message: '저장되지 않은 수정사항이 있습니다.\n저장하지 않고 정말 창을 닫으시겠습니까?',
        confirmLabel: '닫기',
        variant: 'warning',
        onConfirm: () => {
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  // Save Batch
  const handleSave = () => {
    const validRows = rows.filter((r) => r.isInclude);
    if (validRows.length === 0) {
      alert('저장할 성적 항목이 하나도 선택되지 않았습니다.');
      return;
    }

    // Prepare payload
    const recordsToSave: (Omit<GradeRecord, 'id'> & { id?: string })[] = validRows.map((r, idx) => ({
      ...(r.id ? { id: r.id } : { id: `grd_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}` }),
      studentId: r.studentId,
      studentName: r.studentName,
      subject: r.subject,
      evalArea: r.evalArea,
      evalElement: r.evalElement.trim(),
      testType: r.testType || '수행평가',
      performanceRating: r.performanceRating,
      score: PERFORMANCE_SCORE_MAP[r.performanceRating] || 100,
      maxScore: 100,
      testDate: r.testDate || new Date().toISOString().split('T')[0],
      teacherComment: r.teacherComment.trim(),
    }));

    onSaveBatch(recordsToSave);
    setIsDirty(false);
    alert(`✅ 총 ${recordsToSave.length}건의 성적이 성공적으로 저장되었습니다.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <Layers className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">학급 성적 다중(일괄) 입력 및 피드백 작성</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  시스템 일괄 수정
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                여러 학생의 과목, 평가영역, 수행평가 결과, 단원점수, 한줄평 피드백을 한 화면에서 직접 수정·입력합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isDirty && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>미저장 변경사항 있음</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>일괄 저장하기</span>
            </button>

            <button
              type="button"
              onClick={handleRequestClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="창 닫기"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Toolbar & Batch Preset Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3 shrink-0">
          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setEntryMode('new')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  entryMode === 'new'
                    ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✨ 전체 학생 신규 성적 입력 ({students.length}명)
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('existing')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  entryMode === 'existing'
                    ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📝 기존 성적 전체 일괄 수정 ({existingGrades.length}건)
              </button>
            </div>

            {entryMode === 'existing' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-600">수정 과목 필터:</span>
                <select
                  value={filterSubjectForExisting}
                  onChange={(e) => setFilterSubjectForExisting(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="all">과목 전체</option>
                  {SUBJECT_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Preset Row Configuration Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900 shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>공통 항목 빠른 설정:</span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap text-xs flex-1">
              {/* Subject Preset */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-semibold">과목:</span>
                <select
                  value={batchSubject}
                  onChange={(e) => handleBatchSubjectChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50"
                >
                  {SUBJECT_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Eval Area Preset */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-semibold">평가영역:</span>
                <select
                  value={batchEvalArea}
                  onChange={(e) => handleBatchEvalAreaChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-emerald-900 bg-emerald-50/50"
                >
                  {(SUBJECT_EVAL_AREAS[batchSubject] || ['기본영역']).map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* Eval Element Preset (Linked with Eval Area) */}
              <div className="flex items-center gap-1 min-w-[240px] flex-1">
                <span className="text-slate-500 font-semibold shrink-0">연계 평가요소:</span>
                <select
                  value={batchEvalElement}
                  onChange={(e) => setBatchEvalElement(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 text-xs font-medium text-slate-800 bg-white"
                >
                  {(SUBJECT_EVAL_ELEMENTS[batchSubject]?.[batchEvalArea] || []).map((elem, idx) => (
                    <option key={idx} value={elem}>
                      {elem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Rating Preset */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-semibold">기본성취도:</span>
                <select
                  value={batchPerfRating}
                  onChange={(e) => setBatchPerfRating(e.target.value as PerformanceLevel)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-emerald-800 bg-emerald-50"
                >
                  {PERFORMANCE_LEVELS.map((pl) => (
                    <option key={pl} value={pl}>
                      {pl}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleApplyBatchPresetToAll}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>과목/요소 일괄 적용</span>
              </button>

              <button
                type="button"
                onClick={handleApplyOfficialRubricToAll}
                className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                title="각 학생에게 부여된 성취수준(매우잘함, 잘함 등)에 맞는 2026학년도 공식 루브릭 문구를 전체 한줄평 피드백에 일괄 채웁니다."
              >
                <Wand2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>✨ 전원 루브릭 일괄 채우기</span>
              </button>
            </div>

            {/* Curriculum context info for selected preset */}
            {(() => {
              const currentPlan = findCurriculumPlan(batchSubject, batchEvalArea, batchEvalElement);
              if (!currentPlan) return null;
              return (
                <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-2 mt-1 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      단원: {currentPlan.unitName} ({currentPlan.month})
                    </span>
                    <span className="font-mono text-slate-400">{currentPlan.standardCode}</span>
                    {currentPlan.method && (
                      <span className="text-slate-500">방법: {currentPlan.method}</span>
                    )}
                  </div>
                  <span className="text-emerald-700 font-medium">
                    2026학년도 2학기 공식 평가계획서 연계됨
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100/50">
          {rows.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
              <Users className="w-12 h-12 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">수정하거나 입력할 항목이 없습니다.</p>
              <p className="text-xs text-slate-400">학생을 추가하거나 선택 필터를 변경해 보세요.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold sticky top-0 z-10">
                    <th className="p-3.5 text-center w-12">선택</th>
                    <th className="p-3.5 w-32">학생 이름</th>
                    <th className="p-3.5 w-28">교과목</th>
                    <th className="p-3.5 w-36">평가 영역</th>
                    <th className="p-3.5 min-w-[240px]">연계 평가 요소</th>
                    <th className="p-3.5 w-32 text-center">성취 수준</th>
                    <th className="p-3.5 min-w-[280px]">교사 피드백 (한줄평 Direct 입력)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, idx) => {
                    const availableAreas = SUBJECT_EVAL_AREAS[row.subject] || ['기본영역'];
                    const availableElements = SUBJECT_EVAL_ELEMENTS[row.subject]?.[row.evalArea] || [];

                    return (
                      <tr
                        key={row.id || `${row.studentId}_${idx}`}
                        className={`hover:bg-emerald-50/40 transition ${
                          !row.isInclude ? 'opacity-40 bg-slate-50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.isInclude}
                            onChange={(e) => handleRowChange(idx, 'isInclude', e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* Student Name */}
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex flex-col">
                            <span>{row.studentName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {row.studentId.replace('stu_', '학생 #')}
                            </span>
                          </div>
                        </td>

                        {/* Subject Selector */}
                        <td className="p-3">
                          <select
                            value={row.subject}
                            disabled={!row.isInclude}
                            onChange={(e) => handleRowChange(idx, 'subject', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500"
                          >
                            {SUBJECT_LIST.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Eval Area Selector */}
                        <td className="p-3">
                          <select
                            value={row.evalArea}
                            disabled={!row.isInclude}
                            onChange={(e) => handleRowChange(idx, 'evalArea', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-emerald-900 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-500"
                          >
                            {availableAreas.map((area) => (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Eval Element Selector (Dropdown Only) */}
                        <td className="p-3">
                          <select
                            value={row.evalElement}
                            disabled={!row.isInclude}
                            onChange={(e) => handleRowChange(idx, 'evalElement', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                          >
                            {availableElements.map((el, eIdx) => (
                              <option key={eIdx} value={el}>
                                {el}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Performance Rating */}
                        <td className="p-3 text-center">
                          <select
                            value={row.performanceRating}
                            disabled={!row.isInclude}
                            onChange={(e) =>
                              handleRowChange(idx, 'performanceRating', e.target.value as PerformanceLevel)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 font-extrabold text-xs text-emerald-900 bg-emerald-100/60 focus:ring-2 focus:ring-emerald-500"
                          >
                            {PERFORMANCE_LEVELS.map((pl) => (
                              <option key={pl} value={pl}>
                                {pl}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Teacher Feedback (Direct Edit) */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={row.teacherComment}
                              disabled={!row.isInclude}
                              onChange={(e) => handleRowChange(idx, 'teacherComment', e.target.value)}
                              placeholder="학생의 성장과 강점을 담은 교사 한줄평 피드백 입력..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              disabled={!row.isInclude}
                              onClick={() => handleApplyOfficialRubricToRow(idx)}
                              title="해당 학생 성취수준에 맞는 공식 루브릭 문장 자동 채우기"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer shrink-0 disabled:opacity-30"
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            선택된 입력 항목: <strong className="text-emerald-800">{rows.filter((r) => r.isInclude).length}</strong> / 전체 {rows.length}건
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>입력 되돌리기</span>
            </button>
          </div>
        </div>

        <ConfirmModal
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          variant={confirmState.variant}
          onConfirm={confirmState.onConfirm}
          onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
};
