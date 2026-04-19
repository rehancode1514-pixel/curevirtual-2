import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import api from "../../../Lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PatientInbox() {
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  const userId = localStorage.getItem("userId") || "";
  const role = "PATIENT";

  const fetchInbox = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get("/messages/inbox");
      const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setMessages(items);
      // Auto-select first contact if none selected
      if (items.length > 0 && !selectedContact) {
        setSelectedContact(items[0]);
      }
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
      toast.error("Failed to load inbox.");
    }
  }, [userId, selectedContact]);

  const fetchChatHistory = useCallback(async (contactId) => {
    try {
      const res = await api.get(`/messages/history/${contactId}`);
      setChatHistory(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  useEffect(() => {
    if (selectedContact) {
      fetchChatHistory(selectedContact.contactId);
    }
  }, [selectedContact, fetchChatHistory]);

  const handleSend = async () => {
    if (!replyContent.trim() || !selectedContact) return;
    setSending(true);
    try {
      await api.post("/messages/send", {
        senderId: userId,
        receiverId: selectedContact.contactId,
        content: replyContent,
      });
      setReplyContent("");
      await fetchChatHistory(selectedContact.contactId);
      toast.success("Message sent");
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout role={role}>
      <div className="h-[calc(100vh-160px)] flex gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Sidebar: Contact List */}
        <aside className="w-80 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Messages</h2>
            <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary-container/20 transition-all">
              <span className="material-symbols-outlined text-primary">edit_square</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
            {messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedContact(msg)}
                className={`w-full p-4 rounded-[28px] transition-all flex items-center gap-4 ${
                  selectedContact?.contactId === msg.contactId
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-xl flex-shrink-0">
                  {msg.contactName?.[0] || "?"}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-sm truncate">{msg.contactName}</span>
                    <span className={`text-[10px] uppercase font-bold opacity-60 ${selectedContact?.contactId === msg.contactId ? "text-white" : "text-outline"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-xs font-medium truncate opacity-70 ${selectedContact?.contactId === msg.contactId ? "text-white/80" : "text-on-surface-variant"}`}>
                    {msg.content}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content: Active Chat */}
        <main className="flex-1 glass-panel rounded-[40px] flex flex-col overflow-hidden shadow-2xl shadow-primary/5">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="px-8 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-on-surface leading-none">{selectedContact.contactName}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Active Provider</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-all">
                     <span className="material-symbols-outlined text-outline">videocam</span>
                   </button>
                   <button className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-all">
                     <span className="material-symbols-outlined text-outline">call</span>
                   </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                {chatHistory.map((chat) => {
                  const isMine = chat.senderId === userId;
                  return (
                    <div key={chat.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] p-4 ${isMine ? "message-bubble-out" : "message-bubble-in"}`}>
                        <p className="text-sm font-medium leading-relaxed">{chat.content}</p>
                        <p className={`text-[10px] font-bold mt-2 opacity-50 uppercase tracking-widest ${isMine ? "text-white" : "text-outline"}`}>
                          {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-white/50 border-t border-outline-variant/30">
                <div className="flex items-end gap-4 bg-surface-container-low p-2 rounded-[32px] border border-outline-variant/50 focus-within:border-primary transition-all">
                  <button className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-outline">add_circle</span>
                  </button>
                  <textarea
                    rows={1}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your secure message..."
                    className="flex-1 bg-transparent border-none focus:ring-0 py-2.5 px-2 text-sm font-medium text-on-surface placeholder:text-outline"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={sending || !replyContent.trim()}
                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
               <span className="material-symbols-outlined text-8xl mb-4">forum</span>
               <h3 className="text-xl font-bold">Select a conversation to begin</h3>
            </div>
          )}
        </main>
      </div>
      <ToastContainer position="top-right" autoClose={2200} theme="colored" />
    </DashboardLayout>
  );
}

