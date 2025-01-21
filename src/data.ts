export interface Question {
    id: string;
    label: string;
    dataQuestion: string;
    answer: string;
}

export interface Section {
    title: string;
    instructions?: string;
    additionalInfo?: string;
    questions: Question[];
}

export interface ExamData {
    sections: Section[];
}

export async function initExam(): Promise<ExamData | null> {
    try {
        const response = await fetch('questions.json');
        const data: ExamData = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching JSON data:', error);
        return null;
    }
}
