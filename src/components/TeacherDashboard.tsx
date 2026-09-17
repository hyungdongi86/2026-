import React, { useState, useMemo, useEffect } from 'react';
import {
  Student,
  GradeRecord,
  AppSettings,
  SyncResult,
  SUBJECT_LIST,
  PerformanceLevel,
  PERFORMANCE_SCORE_MAP,
} from '../types';
import { StorageService } from '../services/storageService';
import { INITIAL_STUDENTS, INITIAL_GRADES } from '../data/initialData';
import { findCurriculumPlan } from '../data/curriculumPlans';
import { GradeFormModal } from './GradeFormModal';
import { StudentManagementModal } from './StudentManagementModal';
import { AuthCodePrintModal } from './AuthCodePrintModal';
import { BatchGradeModal } from './BatchGradeModal';
import { ConfirmModal } from './ConfirmModal';
import { CurriculumPlanModal } from './CurriculumPlanModal';
import { UnenteredGradesModal } from './UnenteredGradesModal';
import {
  Users,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Database,
  Download,
  Printer,
  KeyRound,
  CheckCircle,
  AlertCircle,
  BarChart,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Lock,
  Layers,
  Save,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface TeacherDashboardProps {
  students: Student[];
  grades: GradeRecord[];
  settings: AppSettings;
  onUpdateStudents: (students: Student[]) => void;
  onUpdateGrades: (grades: GradeRecord[]) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onOpenGasGuide: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  grades,
  settings,
  onUpdateStudents,
  onUpdateGrades,
  onUpdateSettings,
  onOpenGasGuide,
  onDirtyChange,
}) => {
  const [activeTab, setActiveTab] = useState<'grades' | 'students' | 'gas'>('grades');

  // Inline Performance Level Edit state: { [gradeId]: PerformanceLevel }
  const [modifiedRatings, setModifiedRatings] = useState<Record<string, PerformanceLevel>>({});

  // Search & Filters
  const [gradeSearch, setGradeSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const [studentSearch, setStudentSearch] = useState('');

  // Modals state
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeRecord | null>(null);
  const [selectedGradeIds, setSelectedGradeIds] = useState<string[]>([]);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTargetStudentId, setPrintTargetStudentId] = useState<string | null>(null);
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [isUnenteredModalOpen, setIsUnenteredModalOpen] = useState(false);

  // Confirm Modal state
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

  // Sync state
  const [gasUrlInput, setGasUrlInput] = useState(settings.gasUrl || '');
  const [teacherPassInput, setTeacherPassInput] = useState(settings.teacherPassword || '5714');
  const [schoolNameInput, setSchoolNameInput] = useState(settings.schoolName || '다솜 초등학교');
  const [classNameInput, setClassNameInput] = useState(settings.className || '6학년 1반');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncResult | null>(null);

  // Fixed subjects list for filter dropdown (순서 고정: 도덕, 국어, 수학, 사회, 과학, 음악, 미술, 체육, 실과, 영어)
  const availableSubjects = useMemo(() => {
    return Array.from(SUBJECT_LIST);
  }, []);

  // Filtered grades list
  const filteredGrades = useMemo(() => {
    return grades.filter((g) => {
      const q = gradeSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.studentName.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        (g.evalArea && g.evalArea.toLowerCase().includes(q)) ||
        (g.evalElement && g.evalElement.toLowerCase().includes(q)) ||
        (g.teacherComment && g.teacherComment.toLowerCase().includes(q));

      const matchStudent = studentFilter === 'all' || g.studentId === studentFilter;
      const matchSubject = subjectFilter === 'all' || g.subject === subjectFilter;

      return matchSearch && matchStudent && matchSubject;
    });
  }, [grades, gradeSearch, studentFilter, subjectFilter]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        !studentSearch.trim() ||
        s.name.toLowerCase().includes(studentSearch.toLowerCase().trim()) ||
        s.authCode.toLowerCase().includes(studentSearch.toLowerCase().trim())
    );
  }, [students, studentSearch]);

  // Students without any grade records
  const studentsWithoutGrades = useMemo(() => {
    return students.filter(
      (stu) => !grades.some((g) => g.studentId === stu.id || g.studentName === stu.name)
    );
  }, [students, grades]);

  // Active evaluations in current class
  const activeEvaluations = useMemo(() => {
    const map = new Map<string, { subject: string; evalArea: string; evalElement: string }>();
    grades.forEach((g) => {
      const key = `${g.subject}:::${g.evalArea}:::${g.evalElement}`;
      if (!map.has(key)) {
        map.set(key, {
          subject: g.subject,
          evalArea: g.evalArea,
          evalElement: g.evalElement,
        });
      }
    });
    return Array.from(map.values());
  }, [grades]);

  // Missing student breakdown for each active evaluation item
  const evalMissingDetails = useMemo(() => {
    return activeEvaluations.map((evalItem) => {
      const enteredStudentIds = new Set(
        grades
          .filter(
            (g) =>
              g.subject === evalItem.subject &&
              g.evalArea === evalItem.evalArea &&
              g.evalElement === evalItem.evalElement
          )
          .map((g) => g.studentId || g.studentName)
      );
      const missingStudents = students.filter(
        (s) => !enteredStudentIds.has(s.id) && !enteredStudentIds.has(s.name)
      );
      return {
        ...evalItem,
        missingStudents,
        missingCount: missingStudents.length,
      };
    });
  }, [activeEvaluations, grades, students]);

  const activeEvalMissingCount = useMemo(() => {
    return evalMissingDetails.reduce((sum, item) => sum + item.missingCount, 0);
  }, [evalMissingDetails]);

  // Inline Performance Level Edit logic
  const unsavedCount = Object.keys(modifiedRatings).length;
  const hasUnsavedChanges = unsavedCount > 0;

  // Sync dirty status to parent for header logout protection
  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  // Browser unload guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Dirty navigation guard: returns true if safe to proceed, false if cancelled
  const confirmIfDirty = (onProceed?: () => void): boolean => {
    if (hasUnsavedChanges) {
      const ok = window.confirm('수정한 내용이 저장되지 않았습니다. 저장하지 않고 진행하시겠습니까?');
      if (!ok) return false;
      setModifiedRatings({});
    }
    if (onProceed) onProceed();
    return true;
  };

  // Inline Rating change handler
  const handleInlineRatingChange = (
    gradeId: string,
    originalRating: PerformanceLevel,
    newRating: PerformanceLevel
  ) => {
    setModifiedRatings((prev) => {
      if (newRating === originalRating) {
        const next = { ...prev };
        delete next[gradeId];
        return next;
      }
      return { ...prev, [gradeId]: newRating };
    });
  };

  // Save inline modifications
  const handleSaveInlineRatings = () => {
    if (!hasUnsavedChanges) {
      alert('수정된 성취수준이 없습니다.');
      return;
    }

    const updatedGrades = grades.map((g) => {
      if (modifiedRatings[g.id]) {
        const newRating = modifiedRatings[g.id];
        return {
          ...g,
          performanceRating: newRating,
          score: PERFORMANCE_SCORE_MAP[newRating] ?? g.score,
        };
      }
      return g;
    });

    onUpdateGrades(updatedGrades);
    StorageService.saveGrades(updatedGrades);
    setModifiedRatings({});
    alert('저장되었습니다.');
  };

  // Refresh / Inquiry button handler
  const handleRefreshQuery = () => {
    if (!confirmIfDirty()) return;
    setModifiedRatings({});
    const fresh = StorageService.getGrades();
    onUpdateGrades(fresh);
    alert('최신 성적 목록을 조회하였습니다.');
  };

  // Safe tab change
  const handleTabChange = (tab: 'grades' | 'students' | 'gas') => {
    if (tab === activeTab) return;
    if (!confirmIfDirty()) return;
    setActiveTab(tab);
  };

  // Grade CRUD Handlers
  const handleAddGrade = () => {
    if (!confirmIfDirty()) return;
    setSelectedGrade(null);
    setIsGradeModalOpen(true);
  };

  const handleOpenGradeFormForStudent = (student: Student) => {
    if (!confirmIfDirty()) return;
    setSelectedGrade({
      id: '',
      studentId: student.id,
      studentName: student.name,
      subject: '국어',
      evalArea: '문학',
      evalElement: '시나 이야기를 읽고 글에 포함한 표현 방식과 그 의미 추론하기',
      performanceRating: '매우잘함',
      score: 100,
      maxScore: 100,
      teacherComment: '',
    });
    setIsGradeModalOpen(true);
  };

  const handleEditGrade = (grade: GradeRecord) => {
    if (!confirmIfDirty()) return;
    setSelectedGrade(grade);
    setIsGradeModalOpen(true);
  };

  const handleDeleteGrade = (id: string) => {
    if (!confirmIfDirty()) return;
    const targetGrade = grades.find((g) => g.id === id);
    const nameStr = targetGrade ? `${targetGrade.studentName}의 [${targetGrade.subject}]` : '선택한';
    setConfirmState({
      isOpen: true,
      title: '성적 기록 삭제',
      message: `${nameStr} 성적 기록을 정말로 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      variant: 'danger',
      onConfirm: () => {
        const updated = grades.filter((g) => g.id !== id);
        onUpdateGrades(updated);
        StorageService.saveGrades(updated);
        setSelectedGradeIds((prev) => prev.filter((item) => item !== id));
        if (settings.gasUrl) {
          StorageService.pushToGas(settings.gasUrl, students, updated);
        }
      },
    });
  };

  const handleToggleSelectAllGrades = () => {
    const visibleIds = filteredGrades.map((g) => g.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedGradeIds.includes(id));

    if (allSelected) {
      setSelectedGradeIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedGradeIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleSelectGrade = (id: string) => {
    setSelectedGradeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteGrades = () => {
    if (selectedGradeIds.length === 0) return;
    setConfirmState({
      isOpen: true,
      title: '선택 성적 일괄 삭제',
      message: `선택하신 ${selectedGradeIds.length}건의 성적 기록을 일괄 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: '일괄 삭제',
      variant: 'danger',
      onConfirm: () => {
        const updated = grades.filter((g) => !selectedGradeIds.includes(g.id));
        onUpdateGrades(updated);
        StorageService.saveGrades(updated);
        setSelectedGradeIds([]);

        if (settings.gasUrl) {
          StorageService.pushToGas(settings.gasUrl, students, updated);
        }
      },
    });
  };

  const handleSaveGrade = (gradeData: Omit<GradeRecord, 'id'> & { id?: string }) => {
    let updated: GradeRecord[];
    if (gradeData.id) {
      // Edit
      updated = grades.map((g) => (g.id === gradeData.id ? ({ ...g, ...gradeData } as GradeRecord) : g));
    } else {
      // Create
      const newGrade: GradeRecord = {
        ...gradeData,
        id: `grd_${Date.now()}`,
      };
      updated = [newGrade, ...grades];
    }
    onUpdateGrades(updated);
    StorageService.saveGrades(updated);

    // Auto push if GAS url is configured
    if (settings.gasUrl) {
      StorageService.pushToGas(settings.gasUrl, students, updated);
    }
  };

  const handleSaveBatchGrades = (batchRecords: (Omit<GradeRecord, 'id'> & { id?: string })[]) => {
    let updated = [...grades];
    const existingIds = new Set(grades.map((g) => g.id));
    const newRecords: GradeRecord[] = [];

    batchRecords.forEach((record, index) => {
      if (record.id && existingIds.has(record.id)) {
        // Edit existing
        updated = updated.map((g) => (g.id === record.id ? ({ ...g, ...record } as GradeRecord) : g));
      } else {
        // Add new
        const newGrade: GradeRecord = {
          ...record,
          id: record.id || `grd_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
        };
        newRecords.push(newGrade);
      }
    });

    if (newRecords.length > 0) {
      updated = [...newRecords, ...updated];
    }

    onUpdateGrades(updated);
    StorageService.saveGrades(updated);

    if (settings.gasUrl) {
      StorageService.pushToGas(settings.gasUrl, students, updated);
    }
  };

  // Student CRUD Handlers
  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsStudentModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleDeleteStudent = (id: string) => {
    const targetStudent = students.find((s) => s.id === id);
    const nameStr = targetStudent ? targetStudent.name : '해당 학생';
    setConfirmState({
      isOpen: true,
      title: '학생 삭제',
      message: `'${nameStr}' 학생을 삭제하면 해당 학생의 성적 조회 및 모든 기록도 삭제됩니다. 계속하시겠습니까?`,
      confirmLabel: '삭제',
      variant: 'danger',
      onConfirm: () => {
        const updatedStudents = students.filter((s) => s.id !== id);
        onUpdateStudents(updatedStudents);
        StorageService.saveStudents(updatedStudents);
        if (settings.gasUrl) {
          StorageService.pushToGas(settings.gasUrl, updatedStudents, grades);
        }
      },
    });
  };

  const handleSaveStudent = (studentData: Student) => {
    let updated: Student[];
    const exists = students.some((s) => s.id === studentData.id);
    if (exists) {
      updated = students.map((s) => (s.id === studentData.id ? studentData : s));
    } else {
      updated = [...students, studentData];
    }
    onUpdateStudents(updated);
    StorageService.saveStudents(updated);

    if (settings.gasUrl) {
      StorageService.pushToGas(settings.gasUrl, updated, grades);
    }
  };

  // GAS Settings Save
  const handleSaveSettings = () => {
    let cleanGasUrl = gasUrlInput.trim();
    if (cleanGasUrl) {
      const validation = StorageService.validateGasUrl(cleanGasUrl);
      if (!validation.isValid) {
        alert(`[구글 웹 앱 URL 안내]\n${validation.warning}`);
        return;
      }
      if (validation.normalizedUrl) {
        cleanGasUrl = validation.normalizedUrl;
        setGasUrlInput(cleanGasUrl);
      }
    }

    const updatedSettings: AppSettings = {
      ...settings,
      gasUrl: cleanGasUrl,
      teacherPassword: teacherPassInput.trim() || '5714',
      schoolName: schoolNameInput.trim() || '우리학교',
      className: classNameInput.trim() || '우리반',
    };
    onUpdateSettings(updatedSettings);
    StorageService.saveSettings(updatedSettings);
    alert('설정이 성공적으로 저장되었습니다.');
  };

  // Disconnect / Clear GAS URL
  const handleClearGasUrl = () => {
    if (
      window.confirm(
        '구글 시트 연동을 해제하고 로컬 전용 모드로 전환하시겠습니까? (현재 등록된 23명의 학생 및 성적 데이터는 그대로 보존됩니다)'
      )
    ) {
      setGasUrlInput('');
      const updatedSettings: AppSettings = {
        ...settings,
        gasUrl: '',
      };
      onUpdateSettings(updatedSettings);
      StorageService.saveSettings(updatedSettings);
      setSyncStatus({
        success: true,
        message: '구글 시트 연동이 해제되었습니다. 로컬 데이터로 안전하게 유지됩니다.',
      });
    }
  };

  // Test GAS URL
  const handleTestGas = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    const result = await StorageService.testGasUrl(gasUrlInput);
    setSyncStatus(result);
    setIsSyncing(false);
  };

  // Push to GAS
  const handlePushToGas = async () => {
    if (!settings.gasUrl) {
      alert('먼저 구글 앱스 스크립트 URL을 설정해 주세요.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus(null);
    const result = await StorageService.pushToGas(settings.gasUrl, students, grades);
    setSyncStatus(result);
    setIsSyncing(false);
  };

  // Pull from GAS
  const handlePullFromGas = async () => {
    if (!settings.gasUrl) {
      alert('먼저 구글 앱스 스크립트 URL을 설정해 주세요.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus(null);
    const result = await StorageService.pullFromGas(settings.gasUrl);
    if (result.success) {
      if (result.students && result.students.length > 0) {
        onUpdateStudents(result.students);
      }
      if (result.grades && result.grades.length > 0) {
        onUpdateGrades(result.grades);
      }
      setSyncStatus({ success: true, message: result.message });
    } else {
      setSyncStatus({ success: false, message: result.message });
    }
    setIsSyncing(false);
  };

  // Restore 23 Initial Students (부천덕산초 6-1 23명)
  const handleRestoreInitialStudents = () => {
    setConfirmState({
      isOpen: true,
      title: '23명 학생 명단 복구',
      message:
        '부천덕산초 6학년 1반 23명 학생 명단을 다시 불러오시겠습니까? 연동된 구글 시트가 있다면 구글 시트에도 23명 명단이 자동으로 저장됩니다.',
      confirmLabel: '23명 명단 복구',
      variant: 'info',
      onConfirm: async () => {
        onUpdateStudents(INITIAL_STUDENTS);
        StorageService.saveStudents(INITIAL_STUDENTS);
        if (settings.gasUrl) {
          setIsSyncing(true);
          try {
            const pushRes = await StorageService.pushToGas(
              settings.gasUrl,
              INITIAL_STUDENTS,
              grades.length > 0 ? grades : INITIAL_GRADES
            );
            setSyncStatus(pushRes);
            alert(
              '23명의 학생 명단이 성공적으로 복구되었으며, 연동된 구글 스프레드시트에도 즉시 동기화(저장)되었습니다.'
            );
          } catch {
            alert('23명의 학생 명단이 로컬에 복구되었습니다.');
          } finally {
            setIsSyncing(false);
          }
        } else {
          alert('부천덕산초 6학년 1반 23명의 학생 명단이 성공적으로 복구되었습니다.');
        }
      },
    });
  };

  // Reset to Initial Data (23 Students + Default Evaluations)
  const handleResetSampleData = () => {
    setConfirmState({
      isOpen: true,
      title: '23명 기본 데이터로 초기화',
      message:
        '부천덕산초 6학년 1반 학생 23명 명단 및 기본 평가 기록으로 초기화하시겠습니까? (연동된 구글 시트에도 자동 저장됩니다)',
      confirmLabel: '초기화',
      variant: 'warning',
      onConfirm: async () => {
        const resetRes = StorageService.resetToSampleData();
        onUpdateStudents(resetRes.students);
        onUpdateGrades(resetRes.grades);
        onUpdateSettings(resetRes.settings);
        if (settings.gasUrl) {
          setIsSyncing(true);
          try {
            await StorageService.pushToGas(settings.gasUrl, resetRes.students, resetRes.grades);
          } finally {
            setIsSyncing(false);
          }
        }
        alert('부천덕산초 6학년 1반 23명 학생 명단과 기본 데이터로 초기화되었습니다.');
      },
    });
  };

  // CSV Grade Export
  const handleExportCsv = () => {
    if (grades.length === 0) return;
    const headers = ['학생이름', '과목', '평가영역', '연계평가요소', '성취수준', '교사피드백'];
    const rows = grades.map((g) => {
      const perfText = g.performanceRating || (g.score >= 95 ? '매우잘함' : g.score >= 80 ? '잘함' : g.score >= 65 ? '보통' : '노력 요함');
      return [
        g.studentName,
        g.subject,
        g.evalArea || '기본영역',
        `"${(g.evalElement || '').replace(/"/g, '""')}"`,
        perfText,
        `"${(g.teacherComment || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${settings.className}_성적목록_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 미입력된 성적기록 카드 */}
        <div
          onClick={() => setIsUnenteredModalOpen(true)}
          className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:border-amber-400 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-amber-100 text-amber-800 rounded-2xl group-hover:scale-105 transition shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-900 font-bold">미입력된 성적기록</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  클릭하여 확인
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {studentsWithoutGrades.length}명 미등록
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                성적 미등록 학생 {studentsWithoutGrades.length}명 {activeEvalMissingCount > 0 && `· 진행 평가 누락 ${activeEvalMissingCount}건`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="hidden sm:flex px-3.5 py-2 rounded-xl bg-amber-50 group-hover:bg-amber-600 text-amber-800 group-hover:text-white text-xs font-bold transition items-center gap-1 shrink-0 border border-amber-200"
          >
            <span>상세보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 구글 시트 연동 카드 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3.5 rounded-2xl shrink-0 ${
                settings.gasUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">구글 시트 연동</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {settings.gasUrl ? '실시간 연동 활성화' : '미연동 (로컬 브라우저 저장)'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {settings.gasUrl ? '스프레드시트와 자동 동기화' : 'Web App URL 등록 시 시트 연동'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('gas')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition border border-slate-200 hover:border-emerald-300 shrink-0"
          >
            연동 설정
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleTabChange('grades')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'grades'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>성적 입력 및 목록 관리 ({grades.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('students')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'students'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>학생 & 인증코드 발급</span>
          </button>

          <button
            onClick={() => handleTabChange('gas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'gas'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>구글 시트 연동 설정</span>
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => confirmIfDirty(handleResetSampleData)}
            className="text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-slate-200 transition font-medium cursor-pointer"
            title="부천덕산초 6학년 1반 23명 명단 및 기본 성적으로 초기화합니다."
          >
            기본 데이터(23명) 초기화
          </button>
        </div>
      </div>

      {/* TAB 1: GRADES MANAGEMENT */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="학생명, 과목, 평가영역/요소, 피드백 검색..."
                value={gradeSearch}
                onChange={(e) => setGradeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Dropdown Filters & Actions */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              {/* Student Filter */}
              <select
                value={studentFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  if (hasUnsavedChanges) {
                    if (!window.confirm('수정한 내용이 저장되지 않았습니다. 저장하지 않고 필터를 변경하시겠습니까?')) {
                      return;
                    }
                    setModifiedRatings({});
                  }
                  setStudentFilter(val);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700 bg-slate-50"
              >
                <option value="all">학생 전체</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Subject Filter */}
              <select
                value={subjectFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  if (hasUnsavedChanges) {
                    if (!window.confirm('수정한 내용이 저장되지 않았습니다. 저장하지 않고 필터를 변경하시겠습니까?')) {
                      return;
                    }
                    setModifiedRatings({});
                  }
                  setSubjectFilter(val);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none font-medium text-slate-700 bg-slate-50"
              >
                <option value="all">과목 전체</option>
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>

              {/* [조회] 버튼 */}
              <button
                onClick={handleRefreshQuery}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
                title="성적 목록을 새로고침하여 최신 상태로 조회합니다."
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>조회</span>
              </button>

              {/* [저장] 버튼 */}
              <button
                onClick={handleSaveInlineRatings}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm shrink-0 ${
                  hasUnsavedChanges
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400 ring-offset-1 shadow-md animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
                title="수정한 성취수준을 일괄 저장합니다."
              >
                <Save className={`w-4 h-4 ${hasUnsavedChanges ? 'text-white' : 'text-slate-600'}`} />
                <span>
                  저장{hasUnsavedChanges ? ` (${unsavedCount}건)` : ''}
                </span>
              </button>

              {/* Bulk Delete Button when items selected */}
              {selectedGradeIds.length > 0 && (
                <button
                  onClick={() => confirmIfDirty(handleBulkDeleteGrades)}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm animate-fadeIn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>선택 {selectedGradeIds.length}건 삭제</span>
                </button>
              )}

              <button
                onClick={() => confirmIfDirty(() => setIsCurriculumModalOpen(true))}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="2026학년도 2학기 공식 평가계획서 및 성취수준 루브릭을 확인합니다."
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>📋 2학기 평가계획서 보기</span>
              </button>

              <button
                onClick={() => {
                  if (hasUnsavedChanges) {
                    if (!window.confirm('수정한 성취수준이 저장되지 않았습니다. 저장하지 않고 CSV 파일로 내보내시겠습니까?')) {
                      return;
                    }
                  }
                  handleExportCsv();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV 엑셀 저장</span>
              </button>

              <button
                onClick={() => confirmIfDirty(() => setIsBatchModalOpen(true))}
                className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Layers className="w-4 h-4 text-emerald-300" />
                <span>⚡ 다중(일괄) 성적 입력</span>
              </button>

              <button
                onClick={handleAddGrade}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>단일 성적 등록</span>
              </button>
            </div>
          </div>

          {/* Unsaved Changes Warning Banner */}
          {hasUnsavedChanges && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-950 animate-fadeIn shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="font-semibold">
                  성취수준이 수정된 항목이 <strong className="text-emerald-800 font-black underline">{unsavedCount}건</strong> 있습니다. 변경 사항을 반영하려면 <strong>[저장]</strong> 버튼을 눌러주세요.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (window.confirm('수정한 내용을 모두 취소하고 원래대로 되돌리시겠습니까?')) {
                      setModifiedRatings({});
                    }
                  }}
                  className="text-slate-500 hover:text-slate-800 font-medium underline px-2 py-1 cursor-pointer"
                >
                  수정 취소
                </button>
                <button
                  onClick={handleSaveInlineRatings}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1 shadow-sm cursor-pointer transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>지금 저장</span>
                </button>
              </div>
            </div>
          )}

          {/* Grades Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={
                          filteredGrades.length > 0 &&
                          filteredGrades.every((g) => selectedGradeIds.includes(g.id))
                        }
                        onChange={handleToggleSelectAllGrades}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        title="전체 선택 / 해제"
                      />
                    </th>
                    <th className="p-4 w-28">학생 이름</th>
                    <th className="p-4 w-24">교과목명</th>
                    <th className="p-4 w-36">평가 영역</th>
                    <th className="p-4 min-w-[220px]">연계 평가 요소</th>
                    <th className="p-4 w-36 text-center">성취 수준</th>
                    <th className="p-4 min-w-[260px]">교사 한줄평 피드백</th>
                    <th className="p-4 text-center w-20">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGrades.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        기록된 성적이 없거나 검색 조건에 일치하는 항목이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredGrades.map((grade) => {
                      const origPerf = (grade.performanceRating ||
                        (grade.score >= 95 ? '매우잘함' : grade.score >= 80 ? '잘함' : grade.score >= 65 ? '보통' : '노력 요함')) as PerformanceLevel;
                      const currentPerf = (modifiedRatings[grade.id] || origPerf) as PerformanceLevel;
                      const isModified = Boolean(modifiedRatings[grade.id] && modifiedRatings[grade.id] !== origPerf);
                      const isSelected = selectedGradeIds.includes(grade.id);

                      return (
                        <tr
                          key={grade.id}
                          className={`hover:bg-slate-50 transition ${
                            isSelected ? 'bg-emerald-50/40' : isModified ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectGrade(grade.id)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-4 font-bold text-slate-900">{grade.studentName}</td>
                          <td className="p-4 font-bold text-emerald-800">{grade.subject}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200">
                              {grade.evalArea || '기본영역'}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-800">
                            {(() => {
                              const plan = findCurriculumPlan(grade.subject, grade.evalArea || '', grade.evalElement);
                              return (
                                <div className="space-y-1">
                                  {plan && (
                                    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">{plan.month}</span>
                                      <span className="text-emerald-800 font-bold">{plan.unitName}</span>
                                    </div>
                                  )}
                                  {grade.evalElement ? (
                                    <span className="bg-emerald-50/80 text-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-100 inline-block font-medium">
                                      {grade.evalElement}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">평가 요소</span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className={`p-4 text-center ${isModified ? 'bg-emerald-100/30' : ''}`}>
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="relative inline-flex items-center">
                                <select
                                  value={currentPerf}
                                  onChange={(e) =>
                                    handleInlineRatingChange(
                                      grade.id,
                                      origPerf,
                                      e.target.value as PerformanceLevel
                                    )
                                  }
                                  className={`text-xs font-black rounded-full pl-3 pr-7 py-1.5 border transition cursor-pointer appearance-none focus:outline-none focus:ring-2 shadow-2xs ${
                                    currentPerf === '매우잘함'
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 focus:ring-emerald-500 hover:bg-emerald-200/70'
                                      : currentPerf === '잘함'
                                      ? 'bg-teal-100 text-teal-900 border-teal-300 focus:ring-teal-500 hover:bg-teal-200/70'
                                      : currentPerf === '보통'
                                      ? 'bg-amber-100 text-amber-900 border-amber-300 focus:ring-amber-500 hover:bg-amber-200/70'
                                      : 'bg-orange-100 text-orange-900 border-orange-300 focus:ring-orange-500 hover:bg-orange-200/70'
                                  } ${isModified ? 'ring-2 ring-emerald-600 font-black shadow-sm' : ''}`}
                                  title="클릭하여 성취수준을 즉시 변경할 수 있습니다."
                                >
                                  <option value="매우잘함">매우잘함</option>
                                  <option value="잘함">잘함</option>
                                  <option value="보통">보통</option>
                                  <option value="노력 요함">노력 요함</option>
                                </select>
                                {/* Chevron indicator */}
                                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-600">
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                      fillRule="evenodd"
                                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </span>
                                {isModified && (
                                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5" title="수정됨 (미저장)">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                                  </span>
                                )}
                              </div>
                              {isModified && (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 animate-fadeIn">
                                  수정됨
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-700 leading-relaxed" title={grade.teacherComment}>
                            {grade.teacherComment || '-'}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleEditGrade(grade)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title="상세 수정"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGrade(grade.id)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS & AUTH CODES */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="학생 이름 또는 인증코드 검색..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleRestoreInitialStudents}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="부천덕산초 6학년 1반 23명 학생 명단을 다시 불러옵니다."
              >
                <RotateCcw className="w-4 h-4" />
                <span>23명 명단 복구</span>
              </button>

              <button
                onClick={() => {
                  setPrintTargetStudentId(null);
                  setIsPrintModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                <span>학생 인증코드 발급표 인쇄</span>
              </button>

              <button
                onClick={handleAddStudent}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>신규 학생 등록</span>
              </button>
            </div>
          </div>

          {students.length === 0 && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-emerald-950">등록된 학생 명단이 없습니다.</h4>
              <p className="text-xs text-emerald-800 max-w-lg mx-auto">
                구글 스프레드시트 연동 시 비어있는 시트에서 데이터를 불러와 23명의 학생 명단이 비워졌을 수 있습니다. 아래 버튼을 클릭하면 부천덕산초 6학년 1반 23명 학생 명단을 즉시 다시 불러오고 구글 시트에도 자동으로 저장합니다.
              </p>
              <button
                onClick={handleRestoreInitialStudents}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>23명 학생 명단 즉시 복구 및 구글 시트 저장</span>
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-4">학년 / 반 / 번호</th>
                    <th className="p-4">학생 이름</th>
                    <th className="p-4">개인 고유 인증코드</th>
                    <th className="p-4">교사 특이사항 메모</th>
                    <th className="p-4 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((stu) => (
                    <tr key={stu.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 text-slate-500">
                        {stu.gradeLevel || '6학년'} {stu.classNumber || '1반'} {stu.studentNumber || ''}
                      </td>
                      <td className="p-4 font-bold text-slate-900 text-sm">{stu.name}</td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 tracking-wider">
                          {stu.authCode}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 max-w-xs truncate">{stu.note || '-'}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => {
                              setPrintTargetStudentId(stu.id);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title={`${stu.name} 학생 개인 인증코드 인쇄`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditStudent(stu)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                            title="수정"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(stu.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE APPS SCRIPT SETTINGS */}
      {activeTab === 'gas' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>구글 스프레드시트 (Google Apps Script) 연동 설정</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                별도의 유료 AI/DB 서비스 없이, 나의 구글 앱스 스크립트 Web App URL만 넣으면 성적이 시트에 실시간으로 연동됩니다.
              </p>
            </div>
            <button
              onClick={onOpenGasGuide}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>Code.gs & 연동 방법 보기</span>
            </button>
          </div>

          {/* Settings Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  구글 앱스 스크립트 배포 Web App URL
                </label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={gasUrlInput}
                  onChange={(e) => setGasUrlInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1">
                  <p className="text-[11px] text-slate-500">
                    * 구글 시트 [확장 프로그램] → [Apps Script] → [배포] → [새 배포]에서 발급받은 <span className="font-semibold text-emerald-700">/exec</span> URL을 입력하세요.
                  </p>
                  {settings.gasUrl && (
                    <button
                      type="button"
                      onClick={handleClearGasUrl}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline"
                      title="연동을 해제하고 브라우저 로컬 모드로 전환합니다."
                    >
                      연동 해제 (로컬 모드)
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">학교 이름</label>
                  <input
                    type="text"
                    value={schoolNameInput}
                    onChange={(e) => setSchoolNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">학급 이름</label>
                  <input
                    type="text"
                    value={classNameInput}
                    onChange={(e) => setClassNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">교사 대시보드 비밀번호 변경</label>
                <input
                  type="password"
                  value={teacherPassInput}
                  onChange={(e) => setTeacherPassInput(e.target.value)}
                  placeholder="5714"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow transition"
              >
                기본 설정 저장하기
              </button>
            </div>

            {/* Sync Test & Control Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>실시간 구글 시트 동기화 제어</span>
                </h4>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleTestGas}
                    disabled={isSyncing}
                    className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5"
                  >
                    <span>연동 상태 테스트</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handlePushToGas}
                      disabled={isSyncing}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <span>시트로 내보내기 (Push)</span>
                    </button>

                    <button
                      onClick={handlePullFromGas}
                      disabled={isSyncing}
                      className="py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <span>시트에서 가져오기 (Pull)</span>
                    </button>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-1.5 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-700" />
                        <span>부천덕산초 6-1 (23명) 명단 복구 및 시트 전송</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      구글 시트 연동 후 시트가 비어있어 학생 명단이 안 보일 때, 아래 버튼을 누르면 23명 명단을 앱에 불러오고 구글 시트에도 즉시 저장합니다.
                    </p>
                    <button
                      onClick={handleRestoreInitialStudents}
                      disabled={isSyncing}
                      className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>23명 명단 복구 및 구글 시트에 즉시 저장</span>
                    </button>
                  </div>
                </div>

                {/* Status Message */}
                {syncStatus && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      syncStatus.success
                        ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {syncStatus.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <span>{syncStatus.message}</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-200 pt-3">
                * 마지막 성공 동기화: {settings.lastSyncTime || '기록 없음'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <GradeFormModal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        onSave={handleSaveGrade}
        students={students}
        initialGrade={selectedGrade}
      />

      <StudentManagementModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        initialStudent={selectedStudent}
      />

      <AuthCodePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setPrintTargetStudentId(null);
        }}
        students={students}
        schoolName={settings.schoolName}
        className={settings.className}
        initialSelectedStudentId={printTargetStudentId}
      />

      <BatchGradeModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSaveBatch={handleSaveBatchGrades}
        students={students}
        existingGrades={grades}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      <CurriculumPlanModal
        isOpen={isCurriculumModalOpen}
        onClose={() => setIsCurriculumModalOpen(false)}
      />

      <UnenteredGradesModal
        isOpen={isUnenteredModalOpen}
        onClose={() => setIsUnenteredModalOpen(false)}
        studentsWithoutGrades={studentsWithoutGrades}
        evalMissingDetails={evalMissingDetails}
        onSelectStudentToGrade={handleOpenGradeFormForStudent}
        onOpenBatchGradeModal={() => setIsBatchModalOpen(true)}
      />
    </div>
  );
};
