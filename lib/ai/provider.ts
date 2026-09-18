/**
 * Optional provider contract. Core practice and saved progress work without AI.
 * Implementations belong on the server and read credentials from environment variables.
 */
export type PracticeBandRange = { lower: number; upper: number };

export type SentenceFeedback = {
  original: string;
  suggestion: string;
  explanation: string;
};

export type WritingFeedback = {
  label: "Estimated Practice Feedback";
  taskResponse: string;
  coherence: string;
  lexicalResource: string;
  grammar: string;
  estimatedBandRange: PracticeBandRange | null;
  grammarMistakes: SentenceFeedback[];
  vocabularySuggestions: SentenceFeedback[];
  sentenceFeedback: SentenceFeedback[];
  improvedExamples: string[];
  nextPriorities: [string, string, string];
};

export type SpeakingFeedback = {
  label: "Estimated Practice Feedback";
  transcript: string;
  fluencyObservations: string[];
  grammarMistakes: SentenceFeedback[];
  vocabularySuggestions: SentenceFeedback[];
  repetition: string[];
  answerDevelopment: string;
  estimatedPracticeLevel: string | null;
  improvedResponse: string;
  personalVocabulary: string[];
};

export type AIResult<T> =
  | { available: true; provider: string; feedback: T }
  | { available: false; reason: string };

export interface AIProvider {
  readonly name: string;
  writingFeedback(input: {
    taskType: "TASK_1" | "TASK_2";
    prompt: string;
    essay: string;
  }): Promise<AIResult<WritingFeedback>>;
  speakingFeedback(input: {
    question: string;
    transcript: string;
  }): Promise<AIResult<SpeakingFeedback>>;
  paraphrases(input: {
    sentence: string;
    context?: string;
  }): Promise<AIResult<{ suggestions: string[]; explanations: string[] }>>;
}

/** No paid service is selected or called by default. */
export const unavailableAIProvider: AIProvider = {
  name: "unavailable",
  async writingFeedback() {
    return { available: false, reason: "No AI provider is configured. Use the writing self-check to review your work." };
  },
  async speakingFeedback() {
    return { available: false, reason: "No AI provider is configured. Use the sample answer and reflection notes to review your practice." };
  },
  async paraphrases() {
    return { available: false, reason: "No AI provider is configured. Sentence practice remains available." };
  },
};
