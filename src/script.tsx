import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ExamData, initExam } from './data';

function ExamPractice() {
    const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
    const [examData, setExamData] = useState<ExamData | null>(null);
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [feedback, setFeedback] = useState<{ [key: string]: { correct: boolean, hint: string, loading: boolean } }>({});

    useEffect(() => {
        localStorage.setItem('apiKey', apiKey);
    }, [apiKey]);

    useEffect(() => {
        initExam().then(data => setExamData(data));
    }, []);

    async function generateHint(question: string, userAnswer: string): Promise<string> {
        const messages = [
            { role: 'system', content: 'You are a helpful assistant for language learning. Provide a hint to help correct the user\'s answer.' },
            { role: 'user', content: `Question: ${question}\nIncorrect Answer: ${userAnswer}\nHint:` }
        ];

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                    max_tokens: 50,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenAI API error:', errorData);
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const hint = data.choices[0].message.content.trim();
            return hint;
        } catch (error: any) {
            console.error('Error generating hint:', error?.message || error);
            return 'Error generating hint.';
        }
    }


    const handleAnswerChange = (id: string, value: string) => {
        setUserAnswers(prev => ({ ...prev, [id]: value }));
    };

    async function checkAnswer(questionObj: { id: string; answer: string; dataQuestion: string }) {
        const newFeedback = { ...feedback, [questionObj.id]: { ...feedback[questionObj.id], loading: true } };
        setFeedback(newFeedback);

        if (!apiKey) {
            console.error('Please enter your OpenAI API key.');
            return;
        }

        try {
            const userAnswer = (userAnswers[questionObj.id] || '').trim().toLowerCase();
            const correctAnswer = questionObj.answer.toLowerCase();
            const questionText = questionObj.dataQuestion || '';

            if (userAnswer === correctAnswer) {
                newFeedback[questionObj.id] = { correct: true, hint: '', loading: false };
            } else {
                const hint = await generateHint(questionText, userAnswer);
                newFeedback[questionObj.id] = { correct: false, hint: hint, loading: false };
            }

            setFeedback(newFeedback);
        } catch (error: any) {
            console.error('Error checking answer:', error);
            newFeedback[questionObj.id].loading = false;
            setFeedback(newFeedback);
        }
    }

    return (
        <div>
            <input
                type="password"
                id="apiKey"
                placeholder="Enter your OpenAI API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 mb-5"
            />
            <h1>Exam Practice</h1>
            <div id="exam-content">
                {examData && examData.sections.map((section) => (
                    <div key={section.title} className="mb-10">
                        <h2>{section.title}</h2>
                        {section.instructions && <p><strong>{section.instructions}</strong></p>}
                        {section.additionalInfo && <p>{section.additionalInfo}</p>}
                        {section.questions.map((questionObj) => (
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
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

const container = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(container);
root.render(<ExamPractice />);
