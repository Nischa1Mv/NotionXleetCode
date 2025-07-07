import axios from "axios";
import { convertHtmlToMarkdown } from "./utils.js";
export default async function getProblemDetails(problemName) {
  try {
    const response = await axios.get(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${problemName}`);
    const problem = response.data;

    if (problem && problem.questionId) {
     // console.log(convertHtmlToMarkdown(problem.question));
      return {
        questionId: problem.questionId,
        titleSlug: problem.titleSlug,
         question: convertHtmlToMarkdown(problem.question),
        link: `https://leetcode.com/problems/${problem.titleSlug}/`,
        difficulty: problem.difficulty,
        topicTags: problem.topicTags.map(tag => tag.name).filter(Boolean)
      };
    } else {
      throw new Error("Problem data not found");
    }

  } catch (error) {
    console.error("Error fetching problem details:", error.message);
    throw error;
  }
}
