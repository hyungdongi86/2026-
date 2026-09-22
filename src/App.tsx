import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { Student, GradeRecord, AppSettings, UserMode } from './types';
import { INITIAL_STUDENTS } from './data/initialData';
import { Header } from './components/Header';
import { StudentLogin } from './components/StudentLogin';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherLogin } from './components/TeacherLogin';
import { TeacherDashboard } from './components/TeacherDashboard';
import { GasGuideModal } from './components/GasGuideModal';

export default function App() {
  const [mode, setMode] = useState<UserMode>('guest');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());

  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState(false);
  const [isGasGuideOpen, setIsGasGuideOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTeacherDirty, setIsTeacherDirty] = useState(false);

  // Initial Data Load
  useEffect(() => {
    const loadedStudents = StorageService.getStudents();
    const loadedGrades = StorageService.getGrades();
    const loadedSettings = StorageService.getSettings();

    const effectiveStudents = loadedStudents.length > 0 ? loadedStudents : INITIAL_STUDENTS;
    setStudents(effectiveStudents);
    setGrades(loadedGrades);
    setSettings(loadedSettings);

    // If gasUrl exists, validate format before attempting background pull
    if (loadedSettings.gasUrl) {
      const validation = StorageService.validateGasUrl(loadedSettings.gasUrl);
      if (validation.isValid) {
        setIsSyncing(true);
        StorageService.pullFromGas(loadedSettings.gasUrl)
          .then((res) => {
            if (res.success) {
              if (res.students && res.students.length > 0) {
                setStudents(res.students);
                setCurrentStudent((prev) => {
                  if (!prev) return null;
                  const updated = res.students?.find((s) => s.id === prev.id || s.name === prev.name);
                  return updated || prev;
                });
              }
              if (res.grades && res.grades.length > 0) {
                setGrades(res.grades);
              }
            }
          })
          .catch((err) => {
            console.warn('[Initial Sync Warning]', err);
          })
          .finally(() => setIsSyncing(false));
      }
    }
  }, []);

  const handleStudentLoginSuccess = (student: Student) => {
    setCurrentStudent(student);
    setMode('student');
  };

  const handleTeacherLoginSuccess = () => {
    setMode('teacher');
  };

  const handleLogout = () => {
    if (mode === 'teacher' && isTeacherDirty) {
      if (!window.confirm('수정한 내용이 저장되지 않았습니다. 저장하지 않고 로그아웃하시겠습니까?')) {
        return;
      }
    }
    setMode('guest');
    setCurrentStudent(null);
    setIsTeacherDirty(false);
  };

  const handleManualSyncGas = async () => {
    if (mode === 'teacher' && isTeacherDirty) {
      if (!window.confirm('수정한 내용이 저장되지 않았습니다. 저장하지 않고 구글 시트와 동기화하시겠습니까?')) {
        return;
      }
    }
    if (!settings.gasUrl) {
      setIsGasGuideOpen(true);
      return;
    }
    setIsSyncing(true);
    const res = await StorageService.pullFromGas(settings.gasUrl);
    if (res.success) {
      if (res.students && res.students.length > 0) {
        setStudents(res.students);
      }
      if (res.grades && res.grades.length > 0) {
        setGrades(res.grades);
      }
      setIsTeacherDirty(false);
    }
    setIsSyncing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      {/* Top Header */}
      <Header
        mode={mode}
        studentName={currentStudent?.name}
        settings={settings}
        onLogout={handleLogout}
        onSwitchToTeacher={() => setIsTeacherLoginOpen(true)}
        onOpenGasGuide={() => setIsGasGuideOpen(true)}
        onSyncGas={handleManualSyncGas}
        isSyncing={isSyncing}
      />

      {/* Main Container */}
      <main className="flex-1 pb-12">
        {mode === 'guest' && (
          <StudentLogin
            students={students}
            isSyncing={isSyncing}
            onLoginSuccess={handleStudentLoginSuccess}
            onOpenTeacherLogin={() => setIsTeacherLoginOpen(true)}
            onOpenGasGuide={() => setIsGasGuideOpen(true)}
          />
        )}

        {mode === 'student' && currentStudent && (
          <StudentDashboard
            student={currentStudent}
            grades={grades}
            onLogout={handleLogout}
          />
        )}

        {mode === 'teacher' && (
          <TeacherDashboard
            students={students}
            grades={grades}
            settings={settings}
            onUpdateStudents={setStudents}
            onUpdateGrades={setGrades}
            onUpdateSettings={setSettings}
            onOpenGasGuide={() => setIsGasGuideOpen(true)}
            onDirtyChange={setIsTeacherDirty}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 {settings.schoolName || '우리학교'} {settings.className || '우리반'} 성적 관리 및 조회 시스템</p>
          <div className="flex items-center space-x-4 text-slate-400 font-medium">
            <button
              onClick={() => setIsGasGuideOpen(true)}
              className="hover:text-emerald-700 transition"
            >
              구글 시트 Code.gs 복사
            </button>
            <span>•</span>
            <button
              onClick={() => setIsTeacherLoginOpen(true)}
              className="hover:text-amber-700 transition"
            >
              교사 관리자 접속
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TeacherLogin
        isOpen={isTeacherLoginOpen}
        onClose={() => setIsTeacherLoginOpen(false)}
        onLoginSuccess={handleTeacherLoginSuccess}
      />

      <GasGuideModal
        isOpen={isGasGuideOpen}
        onClose={() => setIsGasGuideOpen(false)}
      />
    </div>
  );
}
