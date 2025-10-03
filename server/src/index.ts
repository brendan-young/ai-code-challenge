import path from 'path';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import OpenAI from 'openai';

// Load environment variables from the project root first, then allow local overrides in server/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Streaming requests will fail.');
}

const app = express();
const port = Number.parseInt(process.env.PORT ?? '5000', 10);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });

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

  if (basicMessages.length === 0) {
    res.status(400).json({ error: 'messages array is empty or invalid' });
    return;
  }

  const chatMessages: ChatCompletionMessageParam[] = basicMessages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  let stream: ChatStream | null = null;

  try {
    // If you are using the free tier in groq, beware that there are rate limits.
    // For more info, check out:
    //   https://console.groq.com/docs/rate-limits
    stream = (await openai.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      reasoning_effort: 'low',
      messages: chatMessages,
      stream: true,
    })) as ChatStream;

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

    for await (const part of stream) {
      const content = part.choices?.[0]?.delta?.content;
      if (content) {
        res.write(content);
      }
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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
