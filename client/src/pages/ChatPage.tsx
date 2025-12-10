import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8999';

type Role = 'user' | 'assistant';

interface ChatMessage {
	id: string;
	role: Role;
	content: string;
}

const createMessage = (overrides?: Partial<ChatMessage>): ChatMessage => ({
	id: Math.random().toString(36).slice(2),
	role: 'assistant',
	content: '',
	...overrides,
});

export default function ChatPage() {
	const [messages, setMessages] = useState<ChatMessage[]>(() => [
		createMessage({
			role: 'assistant',
			content:
				'This is the legal front door AI Service — please start with your request type, department, and location.',
		}),
	]);
	const [input, setInput] = useState('');
	const [isStreaming, setIsStreaming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const canSubmit = useMemo(() => input.trim().length > 0 && !isStreaming, [input, isStreaming]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		setInput(event.target.value);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const userText = input.trim();

		if (!userText || isStreaming) {
			return;
		}

		const userMessage = createMessage({ role: 'user', content: userText });
		const assistantMessage = createMessage({ role: 'assistant', content: '' });

		setMessages((prev) => [...prev, userMessage, assistantMessage]);
		setInput('');
		setError(null);
		setIsStreaming(true);

		const conversation = [...messages, { role: 'user', content: userText }]
			.map(({ role, content }) => ({ role, content }))
			.filter(
				(message): message is { role: Role; content: string } =>
					typeof message.role === 'string' && typeof message.content === 'string'
			);

		try {
			const response = await fetch(`${API_BASE_URL}/api/chat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ messages: conversation }),
			});

			if (!response.ok || !response.body) {
				throw new Error('Failed to connect to chat service');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let assistantText = '';

			while (true) {
				const { value, done } = await reader.read();
				if (done) {
					break;
				}

				if (value) {
					assistantText += decoder.decode(value, { stream: true });
					const currentText = assistantText;
					setMessages((prev) =>
						prev.map((message) =>
							message.id === assistantMessage.id ? { ...message, content: currentText } : message
						)
					);
				}
			}

			assistantText += decoder.decode();

			setMessages((prev) =>
				prev.map((message) =>
					message.id === assistantMessage.id ? { ...message, content: assistantText } : message
				)
			);
		} catch (caughtError) {
			const message = caughtError instanceof Error ? caughtError.message : 'Something went wrong';
			console.error(caughtError);
			setError(message);
			setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id));
		} finally {
			setIsStreaming(false);
		}
	};

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 text-slate-100">
			<header className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold text-white">Frontdoor</h1>
				<p className="text-sm text-slate-400">
					Start with your request type, department, and location to get routed.
				</p>
			</header>

			<div className="flex min-h-[320px] max-h-[480px] flex-col gap-4 overflow-y-auto rounded-2xl bg-slate-900/70 p-6 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]">
				{messages.length === 0 && (
					<p className="m-auto text-center text-slate-500">No messages yet... Make a request!</p>
				)}
				{messages.map((message) => {
					const isUser = message.role === 'user';
					return (
						<div
							key={message.id}
							className={`flex flex-col gap-1 rounded-xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.35)] ${
								isUser ? 'self-end bg-sky-500/90 text-slate-900' : 'bg-slate-800/90'
							}`}
						>
							<span
								className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
									isUser ? 'text-slate-900/70' : 'text-slate-400'
								}`}
							>
								{isUser ? 'You' : 'Assistant'}
							</span>
							<p className="whitespace-pre-wrap text-sm leading-relaxed">
								{message.content || (message.role === 'assistant' && isStreaming ? '…' : '')}
							</p>
						</div>
					);
				})}
				<div ref={messagesEndRef} />
			</div>

			{error && (
				<div className="rounded-xl border border-red-400/50 bg-red-500/15 px-4 py-3 text-red-100">
					{error}
				</div>
			)}

			<form
				className="flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)] sm:flex-row sm:items-center"
				onSubmit={handleSubmit}
			>
				<Input
					id="chat-input"
					type="text"
					value={input}
					onChange={handleInputChange}
					placeholder="What legal request do you have?"
					disabled={isStreaming}
					className="bg-slate-900/80 text-white border-slate-700/70 placeholder:text-slate-500"
				/>
				<Button
					type="submit"
					disabled={!canSubmit}
					className="bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-md disabled:opacity-60 disabled:shadow-none"
				>
					{isStreaming ? 'Thinking…' : 'Send'}
				</Button>
			</form>
		</div>
	);
}
