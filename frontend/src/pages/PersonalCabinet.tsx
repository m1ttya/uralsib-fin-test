import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import NavBar from '../components/NavBar';

interface TestResult {
  result_id: number;
  test_id: string;
  test_title: string | null;
  test_category: string | null;
  percentage: number;
  correct_answers: number;
  total_questions: number;
  completed_at: string | null;
}

interface UserCourse {
  course_id: number;
  course_name: string;
  course_category: string | null;
  progress_percentage: number;
  enrolled_at: string;
}

interface CabinetData {
  user: {
    name: string;
    email: string;
    registered_at: string;
  };
  test_results: TestResult[];
  courses: UserCourse[];
  stats: {
    total_tests: number;
    avg_score: number;
    total_courses: number;
    completed_courses: number;
  };
}

export default function PersonalCabinet() {
  const { user } = useAuth();
  const [cabinetData, setCabinetData] = useState<CabinetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tests' | 'courses' | 'activity'>('tests');
  // user is used in the template

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'instant' });

    const fetchCabinetData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/users/cabinet');
        if (response.data.ok) {
          setCabinetData(response.data.cabinet);
        }
      } catch (error) {
        console.error('Failed to fetch cabinet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCabinetData();
  }, []);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Unused function kept for future use
  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full relative">
        <NavBar onShowLoginModal={() => {}} />
        <div className="min-h-screen flex items-center justify-center pt-32">
          <div className="text-center bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-6 text-gray-700 text-lg" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>Загрузка личного кабинета...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cabinetData) {
    return (
      <div className="min-h-screen w-full relative">
        <NavBar onShowLoginModal={() => {}} />
        <div className="min-h-screen flex items-center justify-center pt-32">
          <div className="text-center bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
            <p className="text-gray-700 text-lg" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>Не удалось загрузить данные</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative">
      <style>{`
        .nav-scroll-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <NavBar onShowLoginModal={() => {}} />
      <div className="min-h-screen pt-12 sm:pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}
          >
            <div className="mb-6 sm:mb-8">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border border-white/20">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-primary mb-2 sm:mb-4" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>
                  Личный кабинет
                </h1>
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-primary/10">
                  <p className="text-gray-700 text-sm sm:text-lg" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>
                    Здравствуйте, <span className="font-bold text-primary">{cabinetData.user.name}</span>!
                  </p>
                </div>
              </div>
            </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>Тестов пройдено</p>
                  <p className="text-3xl font-bold text-primary mt-1" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>{cabinetData.stats.total_tests}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>Средний балл</p>
                  <p className="text-3xl font-bold text-primary mt-1" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>
                    {cabinetData.stats.avg_score.toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>Курсов добавлено</p>
                  <p className="text-3xl font-bold text-primary mt-1" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>{cabinetData.stats.total_courses}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/10">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>Курсов завершено</p>
                  <p className="text-3xl font-bold text-primary mt-1" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>{cabinetData.stats.completed_courses}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Вкладки */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="border-b border-gray-200/50">
              <nav
                className="nav-scroll-hide flex space-x-2 overflow-x-auto px-4 sm:px-8 pt-6 pb-2"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`py-4 px-4 sm:py-4 sm:px-5 font-medium text-xs sm:text-sm rounded-3xl transition-all duration-300 whitespace-nowrap ${
                    activeTab === 'tests'
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                      : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
                  style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}
                >
                  Последние тесты
                </button>
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`py-4 px-4 sm:py-4 sm:px-5 font-medium text-xs sm:text-sm rounded-3xl transition-all duration-300 whitespace-nowrap ${
                    activeTab === 'courses'
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                      : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
                  style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}
                >
                  Мои курсы
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-4 px-4 sm:py-4 sm:px-5 font-medium text-xs sm:text-sm rounded-3xl transition-all duration-300 whitespace-nowrap ${
                    activeTab === 'activity'
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                      : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
                  style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}
                >
                  История активности
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'tests' && (
                <div>
                  {cabinetData.test_results.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>Вы еще не проходили тесты</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-primary/5 to-secondary/5">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>
                              Название теста
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>
                              Категория
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>
                              Дата
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>
                              Результат
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/50 divide-y divide-gray-200/50">
                          {cabinetData.test_results.map((test) => (
                            <tr key={test.result_id} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 transition-all duration-300">
                              <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>
                                {test.test_title || test.test_id}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>
                                {test.test_category || 'Без категории'}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>
                                {test.completed_at ? new Date(test.completed_at).toLocaleDateString('ru-RU') : '-'}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${getScoreBadgeColor(test.percentage)} border border-white/50`}>
                                  {test.percentage.toFixed(1)}% ({test.correct_answers}/{test.total_questions})
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'courses' && (
                <div>
                  {cabinetData.courses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>Вы еще не записались на курсы</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cabinetData.courses.map((course) => (
                        <div key={course.course_id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary/20">
                          <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>
                            {course.course_name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>
                            {course.course_category || 'Без категории'}
                          </p>
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-700 mb-2" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>
                              <span>Прогресс</span>
                              <span className="font-semibold text-primary">{course.progress_percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${course.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>
                            Записан: {new Date(course.enrolled_at).toLocaleDateString('ru-RU')}
                          </p>
                          <button className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-medium" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>
                            Продолжить
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div>
                  {cabinetData.test_results.length === 0 && cabinetData.courses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>Пока нет активности</p>
                    </div>
                  ) : (
                    <div className="space-y-4 overflow-x-hidden">
                      {cabinetData.test_results.map((test) => (
                        <div key={`test-${test.result_id}`} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-5 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-primary/20 overflow-hidden">
                          <div className="p-2 sm:p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-primary/10 flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base break-words" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>
                              Прошли тест: {test.test_title || test.test_id}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>
                              Результат: <span className="font-semibold text-primary">{test.percentage.toFixed(1)}%</span> ({test.correct_answers}/{test.total_questions} вопросов)
                            </p>
                            <p className="text-xs text-gray-500 break-words" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>
                              {test.completed_at ? new Date(test.completed_at).toLocaleString('ru-RU') : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                      {cabinetData.courses.map((course) => (
                        <div key={`course-${course.course_id}`} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-5 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-primary/20 overflow-hidden">
                          <div className="p-2 sm:p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-primary/10 flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base break-words" style={{ fontFamily: 'Uralsib-Bold, sans-serif' }}>
                              Записались на курс: {course.course_name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>
                              Прогресс: <span className="font-semibold text-primary">{course.progress_percentage.toFixed(0)}%</span>
                            </p>
                            <p className="text-xs text-gray-500 break-words" style={{ fontFamily: 'Uralsib-Regular, sans-serif' }}>
                              {new Date(course.enrolled_at).toLocaleString('ru-RU')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </div>
  );
}
