import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NoteIndex, resolveWikilink } from "../lib/note-index";
import { parseWikilinks } from "../lib/wikilink-parser";
import { parseEmbeds, isImageEmbed } from "../lib/embed-parser";
import { sanitizePath, isWithinVault, getParentPath } from "../lib/path-utils";
import WikilinkRenderer from "./WikilinkRenderer";
import ImageEmbed from "./ImageEmbed";

interface MarkdownWithWikilinksProps {
  content: string;
  noteIndex: NoteIndex;
  onNavigate: (path: string) => void;
  accessToken?: string;
  currentPath?: string;
  vaultPath?: string;
}

interface ContentSegment {
  type: "text" | "wikilink" | "image-embed";
  content: string;
  target?: string;
  displayText?: string | null;
  resolved?: string | null;
  filePath?: string;
}

interface ParsedItem {
  type: "wikilink" | "embed";
  startIndex: number;
  endIndex: number;
  target: string;
  displayText?: string | null;
}

function splitContent(
  content: string,
  noteIndex: NoteIndex,
  currentPath?: string,
  vaultPath?: string,
): ContentSegment[] {
  const wikilinks = parseWikilinks(content);
  const embeds = parseEmbeds(content);

  const allItems: ParsedItem[] = [
    ...wikilinks.map((w) => ({
      type: "wikilink" as const,
      startIndex: w.startIndex,
      endIndex: w.endIndex,
      target: w.target,
      displayText: w.displayText,
    })),
    ...embeds.map((e) => ({
      type: "embed" as const,
      startIndex: e.startIndex,
      endIndex: e.endIndex,
      target: e.target,
    })),
  ].sort((a, b) => a.startIndex - b.startIndex);

  if (allItems.length === 0) {
    return [{ type: "text", content }];
  }

  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  for (const item of allItems) {
    if (item.startIndex > lastIndex) {
      segments.push({
        type: "text",
        content: content.slice(lastIndex, item.startIndex),
      });
    }

    if (item.type === "wikilink") {
      segments.push({
        type: "wikilink",
        content: content.slice(item.startIndex, item.endIndex),
        target: item.target,
        displayText: item.displayText,
        resolved: resolveWikilink(item.target, noteIndex),
      });
    } else if (item.type === "embed" && isImageEmbed(item.target)) {
      const parentPath = currentPath ? getParentPath(currentPath) : "";
      const rawImagePath = `${parentPath}/${item.target}`;
      const imagePath = sanitizePath(rawImagePath);

      const isSafe = !vaultPath || isWithinVault(imagePath, vaultPath);

      if (isSafe) {
        segments.push({
          type: "image-embed",
          content: content.slice(item.startIndex, item.endIndex),
          target: item.target,
          filePath: imagePath,
        });
      } else {
        segments.push({
          type: "text",
          content: `[Invalid path: ${item.target}]`,
        });
      }
    } else {
      segments.push({
        type: "text",
        content: content.slice(item.startIndex, item.endIndex),
      });
    }

    lastIndex = item.endIndex;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  return segments;
}

function MarkdownWithWikilinks({
  content,
  noteIndex,
  onNavigate,
  accessToken,
  currentPath,
  vaultPath,
}: MarkdownWithWikilinksProps) {
  const segments = splitContent(content, noteIndex, currentPath, vaultPath);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === "wikilink") {
          return (
            <WikilinkRenderer
              key={index}
              target={segment.target!}
              displayText={segment.displayText ?? null}
              resolved={segment.resolved ?? null}
              onNavigate={onNavigate}
            />
          );
        }

        if (segment.type === "image-embed" && accessToken && segment.filePath) {
          return (
            <ImageEmbed
              key={index}
              target={segment.target!}
              filePath={segment.filePath}
              accessToken={accessToken}
            />
          );
        }

        return (
          <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>
            {segment.content}
          </ReactMarkdown>
        );
      })}
    </>
  );
}

export default MarkdownWithWikilinks;
