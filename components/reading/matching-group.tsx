"use client";
import type { PublicQuestion } from "@/lib/reading/model";

type IndexedQuestion = PublicQuestion & { passageId: string; index: number };
export function matchingBlock(questions: (PublicQuestion & { passageId: string })[], position: number): IndexedQuestion[] {
  const current = questions[position];
  if (!current?.type.startsWith("MATCHING_")) return [];
  const same = (q: typeof current) => q.passageId === current.passageId && q.type === current.type && (current.matchingGroup
    ? q.matchingGroup?.id === current.matchingGroup.id
    : !q.matchingGroup && q.instructions === current.instructions && JSON.stringify(q.options) === JSON.stringify(current.options));
  let start = position, end = position;
  while (start > 0 && same(questions[start - 1])) start--;
  while (end + 1 < questions.length && same(questions[end + 1])) end++;
  return questions.slice(start, end + 1).map((q, i) => ({ ...q, index: start + i }));
}

export function MatchingGroup({ questions, position, answers, flags, disabled, results, onFocus, onAnswer }: {
  questions: IndexedQuestion[]; position: number; answers: Record<string, string>; flags: string[]; disabled: boolean;
  results?: { questionId: string; isCorrect: boolean }[];
  onFocus: (index: number) => void; onAnswer: (index: number, value: string) => void;
}) {
  const first = questions[0], last = questions.at(-1)!;
  const titles: Record<string, string> = { MATCHING_HEADINGS: "List of Headings", MATCHING_INFORMATION: "Paragraphs", MATCHING_FEATURES: "List of Features", MATCHING_SENTENCE_ENDINGS: "Sentence Endings" };
  const title = first.matchingGroup?.optionsTitle ?? titles[first.type] ?? "Choices";
  return <section className="reading-matching-group" aria-label={`${title} exercise`}>
    <h3>Questions {first.index + 1}{last.index !== first.index ? `–${last.index + 1}` : ""}</h3>
    <p className="reading-instruction">{first.instructions}</p>
    {first.matchingGroup?.reuseAllowed && <p><strong>NB</strong> <em>You may use any letter more than once.</em></p>}
    <div className="reading-shared-options" id="matching-options"><h4>{title}</h4>
      <ul>{first.options.map(option => <li key={option}><strong>{option.split(".")[0]}.</strong> {option.slice(option.indexOf(".") + 1).trim()}</li>)}</ul>
    </div>
    <div className="reading-matching-rows">{questions.map(q => {
      const result = results?.find(row => row.questionId === q.id);
      return <div key={q.id} className={`reading-matching-row ${position === q.index ? "active" : ""}`}>
        <button type="button" className="reading-row-number" aria-label={`Show question ${q.index + 1}`} aria-current={position === q.index ? "step" : undefined} onClick={() => onFocus(q.index)}>{q.index + 1}{flags.includes(q.id) && <span aria-label="flagged"> •</span>}</button>
        <label htmlFor={`matching-${q.id}`}>{q.question}</label>
        <select id={`matching-${q.id}`} aria-label={`Answer ${q.index + 1}`} aria-describedby="matching-options" disabled={disabled} value={answers[q.id] ?? ""} onFocus={() => { if(position !== q.index) onFocus(q.index); }} onChange={e => onAnswer(q.index, e.target.value)}>
          <option value="">—</option>{q.options.map(o => <option value={o.split(".")[0]} key={o}>{o.split(".")[0]}</option>)}
        </select>
        {result && <span className={`reading-row-result ${result.isCorrect ? "correct" : "incorrect"}`}>{result.isCorrect ? "Correct" : "Review"}</span>}
      </div>;
    })}</div>
    <p className="small-note">Select a question number to focus its flag, hints or answer review.</p>
  </section>;
}

export function ReadingSource({ source }: { source?: string | null }) {
  if (!source) return null;
  const url = source.match(/https:\/\/[^\s]+/)?.[0];
  return <p className="small-note reading-source">{url ? source.replace(url, "") : source}{url && <a className="text-link" href={url} target="_blank" rel="noreferrer">Read the source ↗</a>}</p>;
}
