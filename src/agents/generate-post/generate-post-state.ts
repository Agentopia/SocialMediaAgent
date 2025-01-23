import { Annotation, END } from "@langchain/langgraph";
import { IngestDataAnnotation } from "../ingest-data/ingest-data-state.js";
import { POST_TO_LINKEDIN_ORGANIZATION, TEXT_ONLY_MODE } from "./constants.js";
import { DateType } from "../types.js";

export type LangChainProduct = "langchain" | "langgraph" | "langsmith";

export type YouTubeVideoSummary = {
  /**
   * The link to the YouTube video the summary is for.
   */
  link: string;
  /**
   * The summary of the video.
   */
  summary: string;
};

export const GeneratePostAnnotation = Annotation.Root({
  /**
   * The links to use to generate a post.
   */
  links: Annotation<string[]>,
  /**
   * The report generated on the content of the message. Used
   * as context for generating the post.
   */
  report: IngestDataAnnotation.spec.report,
  /**
   * Page content used in the verification nodes. Will be used in the report
   * generation node.
   */
  pageContents: Annotation<string[] | undefined>({
    reducer: (state, update) => {
      if (update === undefined) return undefined;
      return (state || []).concat(update);
    },
    default: () => [],
  }),
  /**
   * Relevant links found in the message.
   */
  relevantLinks: Annotation<string[] | undefined>({
    reducer: (state, update) => {
      if (update === undefined) return undefined;
      // Use a set to ensure no duplicate links are added.
      const stateSet = new Set(state || []);
      update.forEach((link) => stateSet.add(link));
      return Array.from(stateSet);
    },
    default: () => [],
  }),
  /**
   * The generated post for LinkedIn/Twitter.
   */
  post: Annotation<string>,
  /**
   * The date to schedule the post for.
   */
  scheduleDate: Annotation<DateType>,
  /**
   * Response from the user for the post. Typically used to request
   * changes to be made to the post.
   */
  userResponse: Annotation<string | undefined>,
  /**
   * The node to execute next.
   */
  next: Annotation<
    | "schedulePost"
    | "rewritePost"
    | "updateScheduleDate"
    | "unknownResponse"
    | typeof END
    | undefined
  >,
  /**
   * The image to attach to the post, and the MIME type.
   */
  image: Annotation<
    | {
        imageUrl: string;
        mimeType: string;
      }
    | undefined
  >,
  /**
   * Image options to provide to the user.
   */
  imageOptions: Annotation<string[]>({
    reducer: (_state, update) => update,
    default: () => [],
  }),
  /**
   * The number of times the post has been condensed. We should stop condensing after
   * 3 times to prevent an infinite loop.
   */
  condenseCount: Annotation<number>({
    reducer: (_state, update) => update,
    default: () => 0,
  }),
});

export const GeneratePostInputAnnotation = Annotation.Root({
  /**
   * The links to use to generate a post.
   */
  links: Annotation<string[]>,
});

export const GeneratePostConfigurableAnnotation = Annotation.Root({
  /**
   * Whether to post to the LinkedIn organization or the user's profile.
   * If true, [LINKEDIN_ORGANIZATION_ID] is required.
   */
  [POST_TO_LINKEDIN_ORGANIZATION]: Annotation<boolean | undefined>,
  /**
   * Whether or not to use text only mode throughout the graph.
   * If true, it will not try to extract, validate, or upload images.
   * Additionally, it will not be able to handle validating YouTube videos.
   * @default false
   */
  [TEXT_ONLY_MODE]: Annotation<boolean | undefined>({
    reducer: (_state, update) => update,
    default: () => false,
  }),
});
