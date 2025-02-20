import { ChatOpenAI } from "@langchain/openai";
import { CampaignPlan, RepurposerState } from "../types.js";

const GENERATE_CAMPAIGN_PLAN_PROMPT = `You're a highly skilled marketing professional, working on crafting a thoughtful and detailed marketing campaign plan for a new series of posts for your Twitter and LinkedIn pages.

You originally publicized this content on your socials (this could be your blog, Twitter/LinkedIn page, or a combination). Here is the content you already published:

For this new marketing campaign, you wrote a highly detailed marketing report on the content, using the original content, and some additional resources. This report contains key details extracted from the original, and new context.

Your task is to write a detailed marketing campaign plan for {NUM_POSTS} new {POST_OR_POSTS}.
For each new post you intend to write, ensure it does not simply repeat the original content, but instead provides new context from the report, focusing on areas which were not originally covered.

You should respond in the following format with the marketing campaign plan:
<response-format-instructions>
For each post in the campaign, ensure you include at least one key point from the marketing report to be the subject of the post.
You are allowed to include multiple key points, but be aware that too many key points may feel repetitive, or too dense for the readers to easily grasp.
It is important to remember that if generating more than one post, the campaign should flow seamlessly between each post, without repeating or duplicating content.

Ensure each post in the campaign is wrapped in '<post>' tags. This MUST have opening and closing tags.
Inside these '<post>' tags, it should have three sub-tags:
1. "<header>" This should be a short header, one to two sentence summary of what the post should cover.
2. "<details>" This should also be a short summary, referencing key detail(s) from the marketing report this post will be focused on.
3. "<index>" This should be the index of the post, it should be an ordered list starting from '1'.

For example:
<post>
<header>
some header text here
</header>
<details>
some details text here
</details>
<index>
1
</index>
</post>

<post>
<header>
some header text here
</header>
<details>
some details text here
</details>
<index>
2
</index>
</post>

<post>
<header>
some header text here
</header>
<details>
some details text here
</details>
<index>
3
</index>
</post>
</response-format-instructions>

<original-content>
{ORIGINAL_CONTENT}
</original-content>

<new-marketing-report>
{NEW_MARKETING_REPORT}
</new-marketing-report>`;

function extractCampaignPlan(response: string): CampaignPlan[] {
  // Match each post block including its contents
  const postMatches = response.match(/<post>([\s\S]*?)<\/post>/g);

  if (!postMatches) {
    return [];
  }

  return postMatches.map((postBlock) => {
    // Extract header content
    const headerMatch = postBlock.match(/<header>([\s\S]*?)<\/header>/);
    const header = headerMatch ? headerMatch[1].trim() : "";

    // Extract details content
    const detailsMatch = postBlock.match(/<details>([\s\S]*?)<\/details>/);
    const details = detailsMatch ? detailsMatch[1].trim() : "";

    // Extract index content and convert to number
    const indexMatch = postBlock.match(/<index>([\s\S]*?)<\/index>/);
    const index = indexMatch ? parseInt(indexMatch[1].trim(), 10) : 0;

    return {
      header,
      details,
      index,
    };
  });
}

export async function generateCampaignPlan(
  state: RepurposerState,
): Promise<Partial<RepurposerState>> {
  const model = new ChatOpenAI({
    model: "o1",
    streaming: false,
  });

  const formattedUserPrompt = GENERATE_CAMPAIGN_PLAN_PROMPT.replace(
    `{NUM_POSTS}`,
    state.quality.toString(),
  )
    .replace("{POST_OR_POSTS}", state.quality === 1 ? "post" : "posts")
    .replace("{ORIGINAL_CONTENT}", state.originalContent)
    .replace(
      "{NEW_MARKETING_REPORT}",
      `<key-details>\n${state.reports[0].keyDetails}\n</key-details>\n\n<report>\n${state.reports[0].report}\n</report>`,
    );

  const response = await model.invoke(formattedUserPrompt);

  return {
    campaignPlan: extractCampaignPlan(response.content as string),
  };
}
