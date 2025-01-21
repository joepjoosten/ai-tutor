import React from 'react';

interface QuestionProps {
    questionObj: { id: string; answer: string; dataQuestion: string; label: string };
    userAnswers: { [key: string]: string };
    feedback: { [key: string]: { correct: boolean; hint: string; loading: boolean } };
    handleAnswerChange: (id: string, value: string) => void;
    checkAnswer: (questionObj: { id: string; answer: string; dataQuestion: string }) => void;
}

const Question: React.FC<QuestionProps> = ({ questionObj, userAnswers, feedback, handleAnswerChange, checkAnswer }) => (
    <div key={questionObj.id} className="mb-7.5">
        <label htmlFor={questionObj.id} className="block font-bold mb-2.5">{questionObj.label}</label>
        <div className="flex items-start">
            <button
                onClick={() => checkAnswer(questionObj)}
                className="py-1 px-3 text-sm mr-2 cursor-pointer text-center border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                disabled={feedback[questionObj.id]?.loading}
            >
                {feedback[questionObj.id]?.loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"></path>
                    </svg>
                ) : (
                    'Check'
                )}
            </button>
            <textarea
                className="p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                id={questionObj.id}
                name={questionObj.id}
                data-question={questionObj.dataQuestion}
                value={userAnswers[questionObj.id] || ''}
                onChange={(e) => handleAnswerChange(questionObj.id, e.target.value)}
            />
        </div>
        <div className="mt-2.5 text-sm">
            {feedback[questionObj.id] && (
                feedback[questionObj.id].correct ? (
                    <span className="text-green-500">✔ Correct!</span>
                ) : (
                    <span className="text-red-500">✖ Incorrect. Hint: {feedback[questionObj.id].hint}</span>
                )
            )}
        </div>
    </div>
);

export default Question;
