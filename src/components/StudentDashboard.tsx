import React, { useState, useMemo } from 'react';
import { Student, GradeRecord } from '../types';
import { findCurriculumPlan } from '../data/curriculumPlans';
import { CurriculumPlanModal } from './CurriculumPlanModal';
import {
  Award,
  BookOpen,
  Filter,
  Search,
  MessageSquare,
  BarChart2,
  LayoutGrid,
  List,
  Printer,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  FileSpreadsheet,
  GraduationCap,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface StudentDashboardProps {
  student: Student;
  grades: GradeRecord[];
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  grades,
  onLogout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [viewMode, setViewMode] = useState<'report' | 'cards' | 'table' | 'analysis'>('report');
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);

  // Filter student's own grades
  const studentGrades = useMemo(() => {
    return grades.filter((g) => g.studentId === student.id);
  }, [grades, student.id]);

  // Unique semesters and subjects for dropdown filter
  const semesters = useMemo(() => {
    const set = new Set<string>();
    studentGrades.forEach((g) => {
      if (g.semester) set.add(g.semester);
    });
    return Array.from(set);
  }, [studentGrades]);

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    studentGrades.forEach((g) => {
      if (g.subject) set.add(g.subject);
    });
    return Array.from(set);
  }, [studentGrades]);

  // Filtered grades list
  const filteredGrades = useMemo(() => {
    return studentGrades.filter((g) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.subject.toLowerCase().includes(q) ||
        (g.evalArea && g.evalArea.toLowerCase().includes(q)) ||
        (g.evalElement && g.evalElement.toLowerCase().includes(q)) ||
        (g.teacherComment && g.teacherComment.toLowerCase().includes(q));

      const matchSemester = selectedSemester === 'all' || g.semester === selectedSemester;
      const matchSubj = selectedSubject === 'all' || g.subject === selectedSubject;

      return matchSearch && matchSemester && matchSubj;
    });
  }, [studentGrades, searchTerm, selectedSemester, selectedSubject]);

  // Stats calculation (evaluation date removed, replaced with subject count & excellent count)
  const stats = useMemo(() => {
    if (studentGrades.length === 0) {
      return { average: 0, totalCount: 0, highestSubject: '-', subjectCount: 0, excellentCount: 0 };
    }

    const totalScore = studentGrades.reduce((sum, g) => sum + Number(g.score || 0), 0);
    const avg = Math.round((totalScore / studentGrades.length) * 10) / 10;

    let maxGrade = studentGrades[0];
    let excellentCount = 0;
    studentGrades.forEach((g) => {
      if (g.score > maxGrade.score) maxGrade = g;
      if (g.performanceRating === '매우잘함' || g.performanceRating === '잘함' || g.score >= 80) {
        excellentCount++;
      }
    });

    const uniqueSubjects = new Set(studentGrades.map((g) => g.subject));

    return {
      average: avg,
      totalCount: studentGrades.length,
      highestSubject: `${maxGrade.subject}`,
      subjectCount: uniqueSubjects.size,
      excellentCount,
    };
  }, [studentGrades]);

  // Subject-wise averages for analysis
  const subjectStats = useMemo(() => {
    const map: { [subject: string]: { total: number; count: number } } = {};
    studentGrades.forEach((g) => {
      if (!map[g.subject]) {
        map[g.subject] = { total: 0, count: 0 };
      }
      map[g.subject].total += Number(g.score || 0);
      map[g.subject].count += 1;
    });

    return Object.keys(map).map((subj) => ({
      subject: subj,
      average: Math.round((map[subj].total / map[subj].count) * 10) / 10,
      count: map[subj].count,
    }));
  }, [studentGrades]);

  // Helper score color badge for 단원평가 and 수행평가
  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: '매우 우수 (A)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (score >= 80) return { label: '우수 (B)', bg: 'bg-teal-100 text-teal-800 border-teal-200' };
    if (score >= 70) return { label: '보통 (C)', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (score >= 60) return { label: '노력요함 (D)', bg: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { label: '보충필요 (E)', bg: 'bg-red-100 text-red-800 border-red-200' };
  };

  const getPerformanceBadge = (rating?: string, score: number = 0) => {
    if (rating === '매우잘함' || (!rating && score >= 95)) {
      return { label: '매우잘함', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    }
    if (rating === '잘함' || (!rating && score >= 80)) {
      return { label: '잘함', bg: 'bg-teal-100 text-teal-900 border-teal-300' };
    }
    if (rating === '보통' || (!rating && score >= 65)) {
      return { label: '보통', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
    return { label: '노력 요함', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
  };

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Print error or blocked in iframe:', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:py-0 print:px-0">
      {isInIframe && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 flex items-start gap-2.5 print:hidden">
          <span className="font-bold shrink-0">💡 인쇄 안내:</span>
          <span>
            현재 AI Studio 미리보기(iframe) 창에서는 브라우저 보안으로 [성적표 인쇄하기]가 차단될 수 있습니다. 
            화면 우측 상단의 <strong>[새 창에서 열기 ↗]</strong>를 누른 후 인쇄 버튼을 누르시면 정상적으로 브라우저 인쇄 창이 호출됩니다.
          </span>
        </div>
      )}

      {/* Student Profile Header Card */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden print:shadow-none print:border print:border-slate-300 print:text-black print:bg-none">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8 print:hidden">
          <BookOpen className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-900/60 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30 print:bg-slate-100 print:text-slate-800">
                {student.gradeLevel || '6학년'} {student.classNumber || '1반'} {student.studentNumber || ''}
              </span>
              <span className="bg-emerald-900/60 text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30 print:bg-slate-100 print:text-slate-800">
                2학기 운영
              </span>
              <span className="bg-teal-900/60 text-teal-200 text-xs font-semibold px-3 py-1 rounded-full border border-teal-500/30 print:bg-slate-100 print:text-slate-800">
                인증코드: {student.authCode}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {student.name} 학생의 누적 성적 리포트
            </h2>
            <p className="text-emerald-100 text-sm max-w-2xl print:text-slate-600">
              선생님께서 기록하신 성적 및 피드백 한줄평을 실시간으로 확인할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2.5 print:hidden">
            <button
              onClick={() => setIsCurriculumModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 text-xs flex items-center gap-2 transition cursor-pointer"
              title="2026학년도 2학기 교과 평가계획서 및 성취수준 루브릭을 확인합니다."
            >
              <BookOpen className="w-4 h-4 text-emerald-200" />
              <span>교과 평가계획서 보기</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-800" />
              <span>성적표 인쇄하기</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-600/40 print:border-slate-200">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 print:bg-slate-50 print:border-slate-200">
            <div className="text-xs text-emerald-200 print:text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-300 print:text-slate-700" />
              <span>누적 전체 평균</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-1 text-white print:text-slate-900">
              {stats.average} <span className="text-xs font-normal text-emerald-200 print:text-slate-500">점</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 print:bg-slate-50 print:border-slate-200">
            <div className="text-xs text-emerald-200 print:text-slate-500 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-300 print:text-slate-700" />
              <span>최고 점수 과목</span>
            </div>
            <div className="text-base sm:text-lg font-bold mt-1.5 text-white truncate print:text-slate-900">
              {stats.highestSubject}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 print:bg-slate-50 print:border-slate-200">
            <div className="text-xs text-emerald-200 print:text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-300 print:text-slate-700" />
              <span>총 평가 기록</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-1 text-white print:text-slate-900">
              {stats.totalCount} <span className="text-xs font-normal text-emerald-200 print:text-slate-500">건</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 print:bg-slate-50 print:border-slate-200">
            <div className="text-xs text-emerald-200 print:text-slate-500 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-300 print:text-slate-700" />
              <span>평가 교과목</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-1 text-white print:text-slate-900">
              {stats.subjectCount} <span className="text-xs font-normal text-emerald-200 print:text-slate-500">과목</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filter & View Mode */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="과목명, 평가영역/요소, 피드백 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Semester Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none text-xs"
            >
              <option value="all">학기 전체</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none text-xs"
            >
              <option value="all">과목 전체</option>
              {availableSubjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 ml-auto md:ml-2">
            <button
              onClick={() => setViewMode('report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'report'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>성적 리포트</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>카드 보기</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>표 보기</span>
            </button>
            <button
              onClick={() => setViewMode('analysis')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'analysis'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>과목별 분석</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredGrades.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">조회된 성적 기록이 없습니다</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            조건에 맞는 성적이 없거나 선생님께서 아직 성적을 입력하지 않으셨습니다.
          </p>
        </div>
      ) : (
        <>
          {/* VIEW 0: OFFICIAL REPORT VIEW (성적 리포트 / 학교 통지표 양식) */}
          {viewMode === 'report' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0">
              {/* Report Header */}
              <div className="text-center pb-6 border-b-2 border-emerald-800/20">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 print:border print:border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2026학년도 과정중심 교과 성취도 평가 통지표</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  학생 성장·평가 종합 리포트
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto print:text-slate-600">
                  각 교과별 평가 영역 및 연계 평가 요소에 따른 성취 수준과 선생님의 성장 지원 피드백입니다.
                </p>

                {/* Student Info Badge Box */}
                <div className="mt-5 inline-flex items-center flex-wrap justify-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 print:bg-slate-100 print:border-slate-300">
                  <span>학년/반: <strong className="text-emerald-900 ml-1">{student.gradeLevel || '6학년'} {student.classNumber || '1반'} {student.studentNumber ? `${student.studentNumber}번` : ''}</strong></span>
                  <span className="text-slate-300 print:text-slate-400">|</span>
                  <span>성명: <strong className="text-emerald-900 text-base ml-1">{student.name}</strong></span>
                  <span className="text-slate-300 print:text-slate-400">|</span>
                  <span>평가 교과: <strong className="text-slate-700 ml-1">{stats.subjectCount}개 과목 ({stats.totalCount}개 평가 영역)</strong></span>
                </div>
              </div>

              {/* Report Main Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-emerald-900 text-white font-bold text-center print:bg-slate-800 print:text-white">
                      <th className="p-3.5 border border-slate-300 w-12 text-center">순번</th>
                      <th className="p-3.5 border border-slate-300 w-24 text-center">교과목</th>
                      <th className="p-3.5 border border-slate-300 w-36 text-center">평가 영역</th>
                      <th className="p-3.5 border border-slate-300 min-w-[220px] text-left">연계 평가 요소</th>
                      <th className="p-3.5 border border-slate-300 w-28 text-center">성취 수준</th>
                      <th className="p-3.5 border border-slate-300 min-w-[260px] text-left">선생님 성장 피드백</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredGrades.map((grade, idx) => {
                      const perfRating = grade.performanceRating || (grade.score >= 95 ? '매우잘함' : grade.score >= 80 ? '잘함' : grade.score >= 65 ? '보통' : '노력 요함');
                      const perfBadge = getPerformanceBadge(perfRating, grade.score);
                      return (
                        <tr key={grade.id} className={`hover:bg-emerald-50/20 transition ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}>
                          <td className="p-3.5 border border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 border border-slate-200 font-black text-slate-900 text-center text-sm">{grade.subject}</td>
                          <td className="p-3.5 border border-slate-200 font-bold text-emerald-800 text-center">{grade.evalArea || '기본영역'}</td>
                          <td className="p-3.5 border border-slate-200 font-medium text-slate-800">
                            {(() => {
                              const plan = findCurriculumPlan(grade.subject, grade.evalArea || '', grade.evalElement);
                              return (
                                <div className="space-y-1">
                                  {plan && (
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">{plan.month}</span>
                                      <span className="text-emerald-900 font-bold">[{plan.unitName}]</span>
                                    </div>
                                  )}
                                  {grade.evalElement ? (
                                    <span className="leading-relaxed font-semibold text-slate-900 block">{grade.evalElement}</span>
                                  ) : (
                                    <span className="text-slate-400 italic">평가 요소</span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-3.5 border border-slate-200 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${perfBadge.bg}`}>
                              {perfRating}
                            </span>
                          </td>
                          <td className="p-3.5 border border-slate-200 text-slate-700 leading-relaxed font-normal">
                            {grade.teacherComment ? (
                              <p className="italic text-slate-800">"{grade.teacherComment}"</p>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Report Footer / Teacher Sign & Remarks */}
              <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 print:bg-white print:border-slate-300">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span>담임교사 종합 의견 및 성장 격려</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 print:hidden">배움과 성장을 기록하는 과정중심 평가</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  위 학생은 모든 교과 학습 활동 및 평가 영역에서 주도적으로 탐구하며 훌륭한 성취를 이루어가고 있습니다. 배움의 과정에서 발견한 강점을 더욱 발전시키고 적극적인 자세로 꾸준히 성장하기를 격려합니다.
                </p>
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
                  <span className="text-[11px] text-slate-400">발급기관: 초등 교과 성적 관리 시스템</span>
                  <span className="font-bold">담임교사 확인 (인)</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 1: CARDS VIEW */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGrades.map((grade) => {
                const perfRating = grade.performanceRating || (grade.score >= 95 ? '매우잘함' : grade.score >= 80 ? '잘함' : grade.score >= 65 ? '보통' : '노력 요함');
                const perfBadge = getPerformanceBadge(perfRating, grade.score);

                return (
                  <div
                    key={grade.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            {grade.evalArea || '기본영역'}
                          </span>
                          <h4 className="text-lg font-bold text-slate-900 mt-2">{grade.subject}</h4>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${perfBadge.bg}`}>
                          {perfRating}
                        </span>
                      </div>

                      {/* Connected Evaluation Element */}
                      {grade.evalElement && (
                        <div className="text-xs font-medium text-slate-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/70 mb-2">
                          <span className="text-[10px] font-bold text-emerald-800 block mb-0.5">연계 평가 요소</span>
                          <p className="leading-snug">{grade.evalElement}</p>
                        </div>
                      )}

                      {/* Display Box */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 my-3">
                        <div className="flex flex-col items-center justify-center py-2 text-center">
                          <span className="text-xs text-slate-500 font-medium mb-1">성취 수준 결과</span>
                          <span className={`text-2xl font-black px-4 py-1.5 rounded-2xl border shadow-2xs ${perfBadge.bg}`}>
                            {perfRating}
                          </span>
                        </div>
                      </div>

                      {/* Teacher Comment Quote Box */}
                      {grade.teacherComment && (
                        <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-200/60 text-xs text-amber-900 relative">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 mb-1">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                            <span>선생님 한줄평</span>
                          </div>
                          <p className="leading-relaxed italic text-slate-700">
                            "{grade.teacherComment}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer (Evaluation date removed) */}
                    <div className="pt-2.5 border-t border-slate-100 text-[11px] flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>과정중심 성취도 평가</span>
                      </span>
                      <span className="text-slate-400 text-[10px]">확인 완료</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="p-4 w-28">교과목명</th>
                      <th className="p-4 w-36">평가 영역</th>
                      <th className="p-4 min-w-[220px]">연계 평가 요소</th>
                      <th className="p-4 w-32 text-center">성취 수준</th>
                      <th className="p-4 min-w-[280px]">선생님 피드백 한줄평</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGrades.map((grade) => {
                      const perfRating = grade.performanceRating || (grade.score >= 95 ? '매우잘함' : grade.score >= 80 ? '잘함' : grade.score >= 65 ? '보통' : '노력 요함');
                      const perfBadge = getPerformanceBadge(perfRating, grade.score);
                      return (
                        <tr key={grade.id} className="hover:bg-emerald-50/30 transition">
                          <td className="p-4 font-bold text-slate-900">{grade.subject}</td>
                          <td className="p-4 font-semibold text-emerald-800">{grade.evalArea || '기본영역'}</td>
                          <td className="p-4 font-medium text-slate-800">
                            {grade.evalElement ? (
                              <span className="bg-emerald-50 text-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-100 inline-block font-medium">
                                {grade.evalElement}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">평가 요소</span>
                            )}
                          </td>
                          <td className="p-4 text-center font-bold text-sm">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${perfBadge.bg}`}>
                              {perfRating}
                            </span>
                          </td>
                          <td className="p-4 text-slate-700 leading-relaxed" title={grade.teacherComment}>
                            {grade.teacherComment || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: ANALYSIS / SUBJECT BREAKDOWN */}
          {viewMode === 'analysis' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-emerald-600" />
                  <span>교과목별 평균 점수 분포</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  동일 과목의 여러 평가 영역 성적을 종합한 평균 점수입니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectStats.map((item) => {
                  const badge = getScoreBadge(item.average);
                  return (
                    <div
                      key={item.subject}
                      className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-slate-900">{item.subject}</span>
                          <span className="text-xs text-slate-400 ml-2">({item.count}회 기록)</span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                          {item.average}점
                        </span>
                      </div>

                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, item.average)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <CurriculumPlanModal
        isOpen={isCurriculumModalOpen}
        onClose={() => setIsCurriculumModalOpen(false)}
      />
    </div>
  );
};
