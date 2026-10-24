import { z } from 'zod';
import { ContentId } from './content';

// Printable worksheets for the writing parts of a quest (handwriting, dictation, a few sentences) and the hands-on
// activities done at home. One per quest that hands one out, built when asked for, never stored; the game only points
// at it and nothing written on it comes back. Grouped by subject and topic, like the lessons.

/** Inventory items a block was built from, for a quest still played from the book (internal, never shown). */
const legacy = { curriculumRef: z.array(ContentId).min(1).optional() };

export const WorksheetBlock = z.discriminatedUnion('kind', [
  /** Capital letters to trace in the primary-school model hand, then write. */
  z.object({ kind: z.literal('letter'), prompt: z.string(), letters: z.array(z.string().min(1)), ...legacy }),
  /** A sentence to copy; `model` holds its lines when there is one to trace. */
  z.object({ kind: z.literal('copy-line'), text: z.string(), model: z.array(z.string().min(1)).optional(), ...legacy }),
  /** Passage a parent reads aloud slowly while the child writes it. */
  z.object({ kind: z.literal('dictation'), prompt: z.string(), title: z.string().optional(), text: z.string().optional(), ...legacy }),
  /** A few sentences to write, with hints and blank ruled lines. */
  z.object({ kind: z.literal('paragraph-prompt'), prompt: z.string(), hints: z.array(z.string()), lines: z.number().int().min(1), ...legacy }),
  /** Something to do with a parent: weigh, pour, read a clock or calendar, fold and cut, retell a story. */
  z.object({ kind: z.literal('activity'), prompt: z.string(), media: z.array(z.string()), ...legacy }),
]);
export type WorksheetBlock = z.infer<typeof WorksheetBlock>;

export const Worksheet = z.object({
  /** The quest that hands it out. */
  id: ContentId,
  subject: z.object({ id: ContentId, name: z.string() }),
  topic: z.object({ id: ContentId, title: z.string() }),
  /** The quest's title. */
  title: z.string(),
  blocks: z.array(WorksheetBlock).min(1),
});
export type Worksheet = z.infer<typeof Worksheet>;

export const WorksheetSummary = Worksheet.pick({ id: true, subject: true, topic: true, title: true }).extend({
  blockCount: z.number().int().min(1),
});
export type WorksheetSummary = z.infer<typeof WorksheetSummary>;
export const WorksheetListResponse = z.object({ worksheets: z.array(WorksheetSummary) });
export type WorksheetListResponse = z.infer<typeof WorksheetListResponse>;
