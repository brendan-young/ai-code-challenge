import path from 'path';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { ResponseInput, ResponseStreamEvent } from 'openai/resources/responses/responses';
import { Stream } from 'openai/core/streaming';

import { Rule } from './rules';

import { listRules, createRule, updateRule, deleteRule } from './rules';

// Load environment variables from the project root first, then allow local overrides in server/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.OPENAI_API_KEY) {
	console.warn('Warning: OPENAI_API_KEY is not set. Streaming requests will fail.');
}

export const app = express();
const port = Number.parseInt(process.env.PORT ?? '5000', 10);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	baseURL: process.env.OPENAI_BASE_URL,
});

type ChatCompletionMessageParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type StreamChunk = OpenAI.Chat.Completions.ChatCompletionChunk;
type ChatStream = AsyncIterable<StreamChunk> & { controller?: AbortController };

type BasicRole = Extract<ChatCompletionMessageParam['role'], 'system' | 'user' | 'assistant'>;
type BasicMessage = { role: BasicRole; content: string };

const allowedRoles: ReadonlySet<BasicRole> = new Set<BasicRole>(['system', 'user', 'assistant']);

const sanitizeMessages = (messages: unknown): BasicMessage[] => {
	if (!Array.isArray(messages)) {
		return [];
	}

	const sanitized: BasicMessage[] = [];

	for (const raw of messages) {
		if (!raw || typeof raw !== 'object') {
			continue;
		}

		const maybeMessage = raw as Record<string, unknown>;
		const role = maybeMessage.role;
		const content = maybeMessage.content;

		if (typeof role !== 'string' || typeof content !== 'string') {
			continue;
		}

		if (!allowedRoles.has(role as BasicRole)) {
			continue;
		}

		sanitized.push({ role: role as BasicRole, content });
	}

	return sanitized;
};

app.get('/health', (_req: Request, res: Response) => {
	res.json({ status: 'ok' });
});

app.post('/api/chat', async (req: Request, res: Response) => {
	if (!process.env.OPENAI_API_KEY) {
		res.status(500).json({ error: 'Server missing OpenAI credentials' });
		return;
	}

	const basicMessages = sanitizeMessages(req.body?.messages);

	const rules = await listRules(); // from rules service

	const rulesSummary =
		rules
			.map(
				(rule: Rule) =>
					`-  ${rule.name}: IF ${rule.conditions
						.map(
							(condition) =>
								`${condition.field} ${condition.operator} ${
									Array.isArray(condition.value) ? condition.value.join(', ') : condition.value
								}`
						)
						.join(' AND ')} THEN ${rule.assignee.email}`
			)
			.join('\n') || 'No active rules. Use fallback contact: legal@acme.corp';

	const systemPrompt = `
Input format:
- If the user gives a comma-separated triple, treat it as: requestType, department, location (in that order). Example: “legal contract, Legal, Argentina”.
- Normalize case/spacing; treat “legal” and “Legal” as the same.

Rule handling:
- Match the triple against the rules below (case-insensitive compares for equals/oneOf; includes for keywords).
- If a rule matches, answer with a short sentance that includes the department, location and requestType. Do NOT ask for more info. Example: "For Sales contract reviews in Australia email xyz@acme.corp"
- If no rule matches but all three fields are present, return the fallback contact: legal@acme.com.
- If fewer than three fields are present, ask only for the missing fields (request type, department, location).
If no rule matches, use fallback contact legal@acme.com.
Rules:
${rulesSummary}
`;

	const chatMessages: ResponseInput = [
		{ role: 'system', content: systemPrompt },
		...basicMessages.map(({ role, content }) => ({ role, content })),
	];

	if (basicMessages.length === 0) {
		res.status(400).json({ error: 'messages array is empty or invalid' });
		return;
	}

	let stream: Stream<ResponseStreamEvent> | null = null;

	try {
		// If you are using the free tier in groq, beware that there are rate limits.
		// For more info, check out:
		//   https://console.groq.com/docs/rate-limits
		stream = await openai.responses.create({
			model: 'openai/gpt-oss-120b',
			reasoning: { effort: 'low' },
			input: chatMessages,
			stream: true,
		});

		res.setHeader('Content-Type', 'text/plain; charset=utf-8');
		res.setHeader('Transfer-Encoding', 'chunked');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('X-Accel-Buffering', 'no');

		(res as Response & { flushHeaders?: () => void }).flushHeaders?.();

		const abort = () => {
			try {
				stream?.controller?.abort?.();
			} catch (abortError) {
				console.error('Error aborting OpenAI stream:', abortError);
			}
		};

		req.on('close', abort);
		req.on('error', abort);

		for await (const event of stream) {
			if (event.type !== 'response.output_text.delta') continue;

			const delta = event.delta;
			if (typeof delta !== 'string' || !delta.length) continue;

			res.write(delta);
		}

		res.end();
	} catch (error) {
		console.error('Streaming error:', error);

		if (!res.headersSent) {
			res.status(500).json({ error: 'Failed to stream response' });
			return;
		}

		res.write('\n[Stream error]\n');
		res.end();
	}
});

// GET all
app.get('/api/rules', async (_req, res) => res.json(await listRules()));

// POST create
app.post('/api/rules', async (req: Request, res: Response) => {
	const rule = await createRule(req.body); // add validation here
	res.status(201).json(rule);
});

// PUT update
app.put('/api/rules/:id', async (req: Request, res: Response) => {
	const updated = await updateRule(req.params.id, req.body);
	if (!updated) return res.status(404).json({ error: 'Not found' });
	res.json(updated);
});

// DELETE
app.delete('/api/rules/:id', async (req: Request, res: Response) => {
	const ok = await deleteRule(req.params.id);
	if (!ok) return res.status(404).json({ error: 'Not found' });
	res.status(204).end();
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
