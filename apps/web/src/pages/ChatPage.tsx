import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useLocation } from "react-router-dom";

type ChatMessage = {
  id?: string;
  chat_id: string;
  sender_id: string;
  message: string;
  attachments?: string[];
  read_by?: string[];
  created_at?: string;
};

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ChatPage() {
  const query = useQuery();
  const [chatId, setChatId] = useState<string>(query.get("chat_id") || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const token = localStorage.getItem("access_token") || "";
  const baseHttp = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
  const baseWs = baseHttp.replace("http", "ws");

  useEffect(() => {
    if (!chatId) return;
    api.get<ChatMessage[]>(`/chat/${chatId}`).then((res) => {
      setMessages(res.data || []);
      api.post(`/chat/${encodeURIComponent(chatId)}/read`, {});
    }).catch(() => {});
  }, [chatId]);

  useEffect(() => {
    api.get(`/chat/conversations/me`).then((res) => {
      setConversations(res.data?.items || []);
    }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!chatId || !token) return;
    const ws = new WebSocket(`${baseWs}/ws/chat/${encodeURIComponent(chatId)}?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === "message") {
          setMessages((prev) => [
            ...prev,
            {
              chat_id: data.room_id,
              sender_id: data.sender_id,
              message: data.content,
              attachments: [],
              created_at: data.timestamp,
            },
          ]);
        }
        if (data.type === "typing") {
          // Optionally show typing indicator
        }
      } catch {}
    };
    ws.onopen = () => {
      // announce online
      ws.send(JSON.stringify({ type: "status", status: "online" }));
    };
    ws.onclose = () => {};
    return () => {
      try { ws.close(); } catch {}
    };
  }, [chatId, token, baseWs]);

  const sendMessage = async () => {
    if (!text.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "message", content: text.trim() }));
    setText("");
  };

  const handleTyping = (val: string) => {
    setText(val);
    setIsTyping(true);
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "typing" }));
    }
    setTimeout(() => setIsTyping(false), 1200);
  };

  const uploadAttachment = async (file: File, kind: string) => {
    if (!chatId) return;
    const form = new FormData();
    form.append("file", file);
    await api.post(`/chat/${encodeURIComponent(chatId)}/attachments?kind=${kind}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // Refresh messages
    const res = await api.get<ChatMessage[]>(`/chat/${chatId}`);
    setMessages(res.data || []);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mime = file.type;
    if (mime.startsWith("image/")) await uploadAttachment(file, "image");
    else if (mime.startsWith("video/")) await uploadAttachment(file, "video");
    else await uploadAttachment(file, "document");
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (ev) => chunks.push(ev.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        await uploadAttachment(file, "voice");
        setRecording(false);
      };
      mr.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    const mine = msg.sender_id === (localStorage.getItem("user_id") || "");
    const others = (chatId.split(":")[2] === (localStorage.getItem("user_id") || "")) ? chatId.split(":")[1] : chatId.split(":")[2];
    const isRead = mine && Array.isArray(msg.read_by) && msg.read_by.includes(others || "");
    return (
      <div key={(msg.id || msg.created_at || Math.random()).toString()} className={`flex my-2 ${mine ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow ${mine ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-900"}`}>
          {msg.attachments && msg.attachments.length > 0 ? (
            <div className="space-y-2">
              {msg.attachments.map((url) => (
                <Attachment key={url} url={url} />
              ))}
              {msg.message && <div className="text-sm">{msg.message}</div>}
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{msg.message}</div>
          )}
          {msg.created_at && (
            <div className={`text-xs mt-1 ${mine ? "text-emerald-200" : "text-gray-500"}`}>
              {new Date(msg.created_at).toLocaleTimeString()}
              {mine && (
                <span className="ml-2">{isRead ? "✓✓" : "✓"}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6">
        <Card className="p-0">
          <div className="flex h-[70vh]">
            <div className="w-1/3 border-r">
              <div className="p-3 font-semibold">Conversations</div>
              <div className="p-3 space-y-2">
                <div className="space-y-2">
                  {conversations.map((c) => (
                    <div
                      key={c.chat_id}
                      className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${c.chat_id === chatId ? "bg-gray-100" : ""}`}
                      onClick={() => setChatId(c.chat_id)}
                    >
                      <div className="font-medium text-sm">{c.chat_id}</div>
                      {c.last_message?.message && (
                        <div className="text-xs text-gray-500 truncate">{c.last_message.message}</div>
                      )}
                    </div>
                  ))}
                </div>
                <Input
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="Enter chat_id or start from listing"
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 bg-white">
                {messages.map(renderMessage)}
                {isTyping && <div className="px-4 py-2 text-sm text-gray-500">Typing...</div>}
              </div>
              <div className="p-3 border-t bg-white">
                <div className="flex items-center gap-2">
                  <label className="px-3 py-2 rounded bg-gray-100 cursor-pointer">
                    📎
                    <input type="file" className="hidden" onChange={onFileChange} />
                  </label>
                  {!recording ? (
                    <Button onClick={startRecording} variant="secondary">🎙️ Voice</Button>
                  ) : (
                    <Button onClick={stopRecording} variant="danger">⏹ Stop</Button>
                  )}
                  <Input
                    value={text}
                    onChange={(e) => handleTyping(e.target.value)}
                    placeholder="Type a message"
                    className="flex-1"
                  />
                  <Button onClick={sendMessage}>Send</Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Attachment({ url }: { url: string }) {
  const fullUrl = url.startsWith("http") ? url : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + url;
  if (url.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
    return <img src={fullUrl} alt="image" className="rounded-md max-h-64" />;
  }
  if (url.match(/\.(mp4|webm|mov)$/i)) {
    return <video src={fullUrl} controls className="rounded-md max-h-64" />;
  }
  if (url.match(/\.(mp3|wav|webm)$/i)) {
    return <audio src={fullUrl} controls />;
  }
  return (
    <a href={fullUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
      Download document
    </a>
  );
}
