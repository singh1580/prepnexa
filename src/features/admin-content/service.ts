import { contentNotFound } from "./errors";
import { findQuestion } from "./repository";

export async function getManagedQuestion(id: string) {
  const question = await findQuestion(id);
  if (!question) throw contentNotFound("Question");
  return question;
}
