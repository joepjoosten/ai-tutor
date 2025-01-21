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


    async function checkAnswers() {
        if (!apiKey) {
            alert('Please enter your OpenAI API key.');
            return;
        }

        try {
            let correct = 0;
            let total = 0;

            if (examData) {
                for (const section of examData.sections) {
                    for (const questionObj of section.questions) {
                        total++;
                        const inputElement = document.getElementById(questionObj.id) as HTMLTextAreaElement;
                        const userAnswer = inputElement.value.trim().toLowerCase();
                        const correctAnswer = questionObj.answer.toLowerCase();
                        const feedbackElement = document.getElementById('feedback' + questionObj.id.replace('q', '')) as HTMLDivElement;
                        const questionText = inputElement.getAttribute('data-question') || '';

                        if (userAnswer === correctAnswer) {
                            feedbackElement.textContent = '✔ Correct!';
                            feedbackElement.classList.remove('incorrect');
                            feedbackElement.classList.add('correct');
                            correct++;
                        } else {
                            feedbackElement.textContent = 'Generating hint...';
                            feedbackElement.classList.remove('correct');
                            feedbackElement.classList.add('incorrect');

                            // Generate hint using OpenAI API
                            const hint = await generateHint(questionText, userAnswer);
                            feedbackElement.textContent = '✖ Incorrect. Hint: ' + hint;
                        }
                    }
                }
            }

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
                style={{ width: '100%', padding: '8px', marginBottom: '20px' }}
            />
            <h1>Exam Practice</h1>
            <div id="exam-content">
                {examData && examData.sections.map((section) => (
                    <div key={section.title} className="section">
                        <h2>{section.title}</h2>
                        {section.instructions && <p><strong>{section.instructions}</strong></p>}
                        {section.additionalInfo && <p>{section.additionalInfo}</p>}
                        {section.questions.map((questionObj) => (
                            <div key={questionObj.id} className="question">
                                <label htmlFor={questionObj.id}>{questionObj.label}</label>
                                <textarea
                                    id={questionObj.id}
                                    name={questionObj.id}
                                    data-question={questionObj.dataQuestion}
                                />
                                <div className="feedback" id={'feedback' + questionObj.id.replace('q', '')}></div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <button id="checkAnswers" onClick={checkAnswers}>Check Answers</button>
        </div>
    );
}

const container = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(container);
root.render(<ExamPractice />);
