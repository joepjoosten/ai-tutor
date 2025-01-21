import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ExamData, initExam } from './data';

function ExamPractice() {
    const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
    const [examData, setExamData] = useState(null as ExamData | null);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);

useEffect(() => {
    initExam().then(data => {
        if (data) {
            setExamData(data);
        }
    });
}, []);

    useEffect(() => {
        localStorage.setItem('apiKey', apiKey);
    }, [apiKey]);

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


    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [feedback, setFeedback] = useState<{ [key: string]: { correct: boolean, hint: string } }>({});

    const handleAnswerChange = (id: string, value: string) => {
        setUserAnswers(prev => ({ ...prev, [id]: value }));
    };

    async function checkAnswers() {
        if (!apiKey) {
            alert('Please enter your OpenAI API key.');
            return;
        }

        try {
            let correct = 0;
            let total = 0;
            const newFeedback: { [key: string]: { correct: boolean, hint: string } } = {};

            if (examData) {
                for (const section of examData.sections) {
                    for (const questionObj of section.questions) {
                        total++;
                        const userAnswer = (userAnswers[questionObj.id] || '').trim().toLowerCase();
                        const correctAnswer = questionObj.answer.toLowerCase();
                        const questionText = questionObj.dataQuestion || '';

                        if (userAnswer === correctAnswer) {
                            newFeedback[questionObj.id] = { correct: true, hint: '' };
                            correct++;
                        } else {
                            const hint = await generateHint(questionText, userAnswer);
                            newFeedback[questionObj.id] = { correct: false, hint: hint };
                        }
                    }
                }
            }

            setFeedback(newFeedback);
            setCorrectCount(correct);
            setTotalQuestions(total);
            alert('You got ' + correct + ' out of ' + total + ' correct.');
        } catch (error: any) {
            console.error('Error checking answers:', error);
            alert('An error occurred while checking the answers.');
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
                                <textarea
                                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    id={questionObj.id}
                                    name={questionObj.id}
                                    data-question={questionObj.dataQuestion}
                                    value={userAnswers[questionObj.id] || ''}
                                    onChange={(e) => handleAnswerChange(questionObj.id, e.target.value)}
                                />
                                <div className="mt-2.5 text-sm" id={'feedback' + questionObj.id.replace('q', '')}>
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
            <button id="checkAnswers" onClick={checkAnswers} className="py-3 px-6 text-lg mt-5 cursor-pointer">Check Answers</button>
        </div>
    );
}

const container = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(container);
root.render(<ExamPractice />);
