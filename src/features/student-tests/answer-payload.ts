export type AnswerPayload = {
  selectedOptionIds: string[];
  textAnswer: string | null;
  numericAnswer: string | null;
  markedForReview: boolean;
  timeSpentSeconds: number;
  version: number;
};

export function answerInputFromState(
  answer: Omit<AnswerPayload, "version">,
  version: number,
): AnswerPayload {
  return {
    selectedOptionIds: answer.selectedOptionIds,
    textAnswer: answer.textAnswer,
    numericAnswer: answer.numericAnswer,
    markedForReview: answer.markedForReview,
    timeSpentSeconds: answer.timeSpentSeconds,
    version,
  };
}
