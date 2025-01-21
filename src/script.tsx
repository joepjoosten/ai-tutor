import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ExamData, initExam } from './data';
import Question from './components/Question';

function ExamPractice() {
    const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
    const [examData, setExamData] = useState<ExamData | null>(null);
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [feedback, setFeedback] = useState<{ [key: string]: { correct: boolean; hint: string; loading: boolean } }>({});

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
                            <Question
                                key={questionObj.id}
                                questionObj={questionObj}
                                userAnswers={userAnswers}
                                feedback={feedback}
                                handleAnswerChange={handleAnswerChange}
                                checkAnswer={checkAnswer}
                            />
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
