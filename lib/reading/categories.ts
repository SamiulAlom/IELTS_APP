export const readingCategories = ["COMPLETION", "HEADINGS", "TFNG", "MULTIPLE_CHOICE", "INFORMATION", "SHORT_DIAGRAM", "MIXED"] as const;
export type ReadingCategory = typeof readingCategories[number];
export const categoryNames: Record<ReadingCategory,string> = {COMPLETION:"Fill in the Blank / Completion",HEADINGS:"Matching Headings",TFNG:"True / False / Not Given",MULTIPLE_CHOICE:"Multiple Choice",INFORMATION:"Matching Information / Features",SHORT_DIAGRAM:"Short Answer / Diagram",MIXED:"Mixed Questions"};
export const categoryTypes: Record<ReadingCategory,string[]> = {
  COMPLETION:["SENTENCE_COMPLETION","SUMMARY_COMPLETION","NOTE_COMPLETION","TABLE_COMPLETION","FLOW_CHART_COMPLETION"],HEADINGS:["MATCHING_HEADINGS"],TFNG:["TRUE_FALSE_NOT_GIVEN","YES_NO_NOT_GIVEN"],MULTIPLE_CHOICE:["MULTIPLE_CHOICE","MULTIPLE_ANSWER"],INFORMATION:["MATCHING_INFORMATION","MATCHING_FEATURES","MATCHING_SENTENCE_ENDINGS"],SHORT_DIAGRAM:["SHORT_ANSWER","DIAGRAM_LABEL"],MIXED:[]
};
export function categoryFor(types: string[]): ReadingCategory {
  const matches=readingCategories.filter(c=>c!=="MIXED"&&types.some(t=>categoryTypes[c].includes(t)));
  return matches.length===1?matches[0]:"MIXED";
}
export const realDifficulty=(number:number)=>number<=5?"Moderate":number<=10?"Normal Exam":number<=15?"Exam":number<=20?"Strong Exam":"Band 7.5 Target / Challenging";
