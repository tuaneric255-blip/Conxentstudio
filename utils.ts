import { Article } from "./types";

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function safeJsonParse<T>(str: string): T | null {
  try {
    // Strategy 1: Find a JSON markdown block, which is a common response format.
    const markdownMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      return JSON.parse(markdownMatch[1]) as T;
    }

    // Strategy 2: If no markdown, find the first '{' or '[' and the last '}' or ']'.
    // This is a fallback for raw JSON responses that might have leading/trailing text.
    const jsonStart = str.indexOf('{');
    const arrayStart = str.indexOf('[');
    
    let start = -1;
    // Find the earliest start of a JSON object or array.
    if (jsonStart !== -1 && (arrayStart === -1 || jsonStart < arrayStart)) {
        start = jsonStart;
    } else if (arrayStart !== -1) {
        start = arrayStart;
    }

    if (start === -1) {
      console.error("No JSON object or array found in the string.");
      return null;
    }
    
    const jsonEnd = str.lastIndexOf('}');
    const arrayEnd = str.lastIndexOf(']');
    const end = Math.max(jsonEnd, arrayEnd);

    if (end === -1 || end < start) {
      console.error("Could not find the end of the JSON object or array.");
      console.error("Original string:", str);
      return null;
    }

    const jsonStr = str.substring(start, end + 1);
    return JSON.parse(jsonStr) as T;

  } catch (e) {
    console.error("Failed to parse JSON string:", e);
    console.error("Original string:", str);
    return null;
  }
}

export function calculateWordCount(text: string): number {
  if (!text) return 0;
  // Remove markdown image placeholders, headings, bold, italics, links, etc. for a more accurate count.
  const cleanedText = text
    .replace(/\[IMAGE_\d+\]/g, '') // Remove placeholders
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove markdown images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Keep link text, remove markdown link syntax
    .replace(/#{1,6}\s/g, '') // Remove headings markers
    .replace(/(\*\*|__|\*|_|~~|`{1,3})/g, '') // Remove bold, italic, strikethrough, and code markers
    .replace(/\s+/g, ' '); // Normalize whitespace

  return cleanedText.match(/\b\w+\b/g)?.length || 0;
}

export function calculateReadingTime(wordCount: number, wpm = 225): number {
  if (wordCount === 0) return 0;
  return Math.ceil(wordCount / wpm);
}