'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'single_choice' | 'true_false' | 'text';
  options: string[] | null;
  correct_answer: string;
  order_index: number;
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  questions: QuizQuestion[];
}

interface UserAnswer {
  questionId: string;
  answer: string | string[];
}

interface QuizComponentProps {
  lessonId: string;
  onComplete: (score: number, passed: boolean) => void;
  onCancel: () => void;
}

export function QuizComponent({ lessonId, onComplete, onCancel }: QuizComponentProps) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          handleSubmitQuiz(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lessons/${lessonId}/quiz`);
      
      if (!response.ok) {
        throw new Error('Quiz not found');
      }
      
      const data = await response.json();
      setQuiz(data.quiz);
      
      // Set timer if there's a time limit
      if (data.quiz.time_limit_minutes) {
        setTimeLeft(data.quiz.time_limit_minutes * 60);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки теста');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    setSubmitting(true);
    try {
      // Prepare answers for submission
      const answers = quiz.questions.map(question => ({
        question_id: question.id,
        user_answer: userAnswers[question.id] || '',
      }));

      const response = await fetch(`/api/lessons/${lessonId}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();
      
      setResults({
        score: result.score,
        passed: result.passed,
        correctAnswers: result.correct_answers,
        totalQuestions: quiz.questions.length,
      });
      
      setShowResults(true);
      
      // Call parent callback
      onComplete(result.score, result.passed);
      
    } catch (err) {
      setError('Ошибка отправки теста');
      console.error('Quiz submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: QuizQuestion) => {
    const userAnswer = userAnswers[question.id];

    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Array.isArray(userAnswer) && userAnswer.includes(option)}
                  onChange={(e) => {
                    const currentAnswers = Array.isArray(userAnswer) ? userAnswer : [];
                    if (e.target.checked) {
                      handleAnswerChange(question.id, [...currentAnswers, option]);
                    } else {
                      handleAnswerChange(question.id, currentAnswers.filter(a => a !== option));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'single_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={userAnswer === option}
                  onChange={() => handleAnswerChange(question.id, option)}
                  className="border-gray-300"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={userAnswer === 'true'}
                onChange={() => handleAnswerChange(question.id, 'true')}
                className="border-gray-300"
              />
              <span className="text-gray-700">Верно</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={userAnswer === 'false'}
                onChange={() => handleAnswerChange(question.id, 'false')}
                className="border-gray-300"
              />
              <span className="text-gray-700">Неверно</span>
            </label>
          </div>
        );

      case 'text':
        return (
          <textarea
            rows={3}
            value={typeof userAnswer === 'string' ? userAnswer : ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Введите ваш ответ..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      default:
        return <div>Неподдерживаемый тип вопроса</div>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка теста...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Ошибка загрузки теста</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={onCancel} variant="outline">
          Вернуться к уроку
        </Button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-8">
        <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Тест не найден</h3>
        <p className="text-gray-600 mb-4">К этому уроку не привязан тест</p>
        <Button onClick={onCancel} variant="outline">
          Вернуться к уроку
        </Button>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="text-center py-8">
        {results.passed ? (
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        ) : (
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
        )}
        
        <h3 className={`text-2xl font-bold mb-2 ${
          results.passed ? 'text-green-800' : 'text-red-800'
        }`}>
          {results.passed ? 'Тест пройден!' : 'Тест не пройден'}
        </h3>
        
        <div className="space-y-2 mb-6">
          <p className="text-lg text-gray-700">
            Ваш результат: <span className="font-semibold">{results.score}%</span>
          </p>
          <p className="text-gray-600">
            Правильных ответов: {results.correctAnswers} из {results.totalQuestions}
          </p>
          <p className="text-sm text-gray-500">
            Проходной балл: {quiz.passing_score}%
          </p>
        </div>

        {!results.passed && (
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Вы можете попробовать пройти тест еще раз
            </p>
            <Button 
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setUserAnswers({});
                if (quiz.time_limit_minutes) {
                  setTimeLeft(quiz.time_limit_minutes * 60);
                }
              }}
            >
              Пройти заново
            </Button>
          </div>
        )}
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{quiz.title}</h3>
          {quiz.description && (
            <p className="text-sm text-gray-600">{quiz.description}</p>
          )}
        </div>
        
        {timeLeft !== null && (
          <Badge variant={timeLeft < 300 ? "destructive" : "secondary"}>
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(timeLeft)}
          </Badge>
        )}
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Вопрос {currentQuestionIndex + 1} из {quiz.questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderQuestion(currentQuestion)}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentQuestionIndex > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            >
              Назад
            </Button>
          )}
        </div>

        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              Далее
            </Button>
          ) : (
            <Button
              onClick={handleSubmitQuiz}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Завершить тест
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}