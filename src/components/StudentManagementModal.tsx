import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { X, Save, User, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

interface StudentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Student) => void;
  initialStudent?: Student | null;
}

export const StudentManagementModal: React.FC<StudentManagementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStudent,
}) => {
  const [name, setName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [gradeLevel, setGradeLevel] = useState('6학년');
  const [classNumber, setClassNumber] = useState('1반');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialStudent) {
      setName(initialStudent.name);
      setAuthCode(initialStudent.authCode);
      setStudentNumber(initialStudent.studentNumber || '');
      setGradeLevel(initialStudent.gradeLevel || '6학년');
      setClassNumber(initialStudent.classNumber || '1반');
      setNote(initialStudent.note || '');
    } else {
      setName('');
      setAuthCode(generateRandomAuthCode());
      setStudentNumber('');
      setGradeLevel('6학년');
      setClassNumber('1반');
      setNote('');
    }
  }, [initialStudent, isOpen]);

  if (!isOpen) return null;

  function generateRandomAuthCode() {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `DS${randomDigits}`;
  }

  const handleGenerateCode = () => {
    setAuthCode(generateRandomAuthCode());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('학생 이름을 입력해 주세요.');
      return;
    }
    if (!authCode.trim()) {
      alert('개인 인증코드를 입력해 주세요.');
      return;
    }

    onSave({
      id: initialStudent ? initialStudent.id : `stu_${Date.now()}`,
      name: name.trim(),
      authCode: authCode.trim().toUpperCase(),
      studentNumber: studentNumber.trim(),
      gradeLevel: gradeLevel.trim(),
      classNumber: classNumber.trim(),
      note: note.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative">
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-teal-200" />
            <h3 className="text-lg font-bold">
              {initialStudent ? '학생 정보 수정' : '신규 학생 등록'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">학생 이름 *</label>
            <input
              type="text"
              placeholder="예: 홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Auth code with random generator */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1 text-teal-800">
                <KeyRound className="w-3.5 h-3.5" />
                <span>개인 고유 인증코드 *</span>
              </span>
              <button
                type="button"
                onClick={handleGenerateCode}
                className="text-[11px] text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>랜덤 생성</span>
              </button>
            </label>
            <input
              type="text"
              placeholder="예: DS1048"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              학생이 조회 로그인 시 이름과 함께 입력할 고유 비밀코드입니다. (영문 DS + 4자리 숫자)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">학년</label>
              <input
                type="text"
                placeholder="3학년"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">반</label>
              <input
                type="text"
                placeholder="2반"
                value={classNumber}
                onChange={(e) => setClassNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">번호</label>
              <input
                type="text"
                placeholder="1번"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">특이사항 / 교사 메모</label>
            <textarea
              rows={2}
              placeholder="학생에 관한 개인 참고 메모 (학생에게는 표시되지 않음)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>학생 정보 저장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
