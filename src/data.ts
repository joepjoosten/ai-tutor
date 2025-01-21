import { Schema } from 'effect';

export const QuestionSchema = Schema.Struct({
    id: Schema.String,
    label: Schema.String,
    dataQuestion: Schema.String,
    answer: Schema.String,
});

export const SectionSchema = Schema.Struct({
    title: Schema.String,
    instructions: Schema.optional(Schema.String),
    additionalInfo: Schema.optional(Schema.String),
    questions: Schema.Array(QuestionSchema),
});

export const ExamDataSchema = Schema.Struct({
    sections: Schema.Array(SectionSchema),
});

export type Question = Schema.Schema.Type<typeof QuestionSchema>;
export type Section = Schema.Schema.Type<typeof SectionSchema>;
export type ExamData = Schema.Schema.Type<typeof ExamDataSchema>;

export async function initExam(): Promise<ExamData | null> {
    try {
        const response = await fetch('questions.json');
        const json = await response.json();
        const result = Schema.decodeUnknownEither(ExamDataSchema)(json);
        if (result._tag === 'Left') {
            console.error('Invalid JSON structure:', result.left);
            return null;
        }
        return result.right;
    } catch (error) {
        console.error('Error fetching JSON data:', error);
        return null;
    }
}
