import { assets } from '@/assets/assets';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import Image from 'next/image';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

const PromptBox = ({ setIsLoading, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const { user, chats, setChats, selectedChat, setSelectedChat } = useAppContext();

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPrompt(e);
        }
    };

    const sendPrompt = async (e) => {
        e.preventDefault();
        const promptCopy = prompt.trim();
        if (!promptCopy) return;

        try {
            if (!user) return toast.error('Please sign in to send a message');
            if (isLoading) return toast.error('Please wait for the previous response');

            setIsLoading(true);
            setPrompt('');

            const userMessage = {
                role: 'user',
                content: promptCopy,
                timestamp: Date.now()
            };

            // Cập nhật message của user ngay
            updateChatMessages(userMessage);

            // Đẩy placeholder "đang trả lời..."
            const placeholderMessage = {
                role: 'assistant',
                content: '...',
                timestamp: Date.now()
            };
            updateChatMessages(placeholderMessage, true);

            const { data } = await axios.post('/api/chat/ai', {
                chatId: selectedChat._id,
                prompt: promptCopy
            });

            if (data.success) {
                const aiMessage = {
                    ...data.data.choices[0].message,
                    timestamp: Date.now(),
                    role: 'assistant'
                };
                replaceLastMessage(aiMessage);
            } else {
                rollbackChatMessages();
                toast.error(data.error || "Failed to get AI response");
                setPrompt(promptCopy);
            }
        } catch (error) {
            console.error("Prompt Error:", error);
            toast.error(error?.response?.data?.error || error?.message || "Something went wrong");
            rollbackChatMessages();
            setPrompt(promptCopy);
        } finally {
            setIsLoading(false);
        }
    };

    const updateChatMessages = (message, isPlaceholder = false) => {
        setChats(prevChats =>
            prevChats.map(chat =>
                chat._id === selectedChat._id
                    ? { ...chat, messages: [...(chat.messages || []), message] }
                    : chat
            )
        );

        setSelectedChat(prev => ({
            ...prev,
            messages: [...(prev.messages || []), message]
        }));
    };

    const replaceLastMessage = (newMessage) => {
        setChats(prevChats =>
            prevChats.map(chat =>
                chat._id === selectedChat._id
                    ? {
                        ...chat,
                        messages: [...chat.messages.slice(0, -1), newMessage]
                    }
                    : chat
            )
        );
        setSelectedChat(prev => ({
            ...prev,
            messages: [...prev.messages.slice(0, -1), newMessage]
        }));
    };

    const rollbackChatMessages = () => {
        setChats(prevChats =>
            prevChats.map(chat =>
                chat._id === selectedChat._id
                    ? {
                        ...chat,
                        messages: chat.messages.slice(0, -1)
                    }
                    : chat
            )
        );
        setSelectedChat(prev => ({
            ...prev,
            messages: selectedChat.messages.slice(0, -1)
        }));
    };

    return (
        <form onSubmit={sendPrompt} className={`w-full max-w-3xl bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}>
            <textarea
                onKeyDown={handleKeyDown}
                className="outline-none w-full resize-none overflow-hidden break-words bg-transparent text-white"
                rows={2}
                placeholder="Message HealthCare"
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="flex items-center justify-between text-sm mt-2">
                <div className="flex items-center gap-2">
                    {/* <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
                        <Image className="h-5" src={assets.deepthink_icon} alt="" />
                        DeepThink (R1)
                    </p>
                    <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
                        <Image className="h-5" src={assets.search_icon} alt="" />
                        Search
                    </p> */}
                </div>

                <div className="flex items-center gap-2">
                    {/* <Image className="w-4 cursor-pointer" src={assets.pin_icon} alt="pin icon" /> */}
                    <button
                        type="submit"
                        className={`${prompt ? "bg-primary" : "bg-[#71717a]"} rounded-full p-2 cursor-pointer`}
                        disabled={!prompt}
                    >
                        <Image
                            className="w-3.5 aspect-square"
                            src={prompt ? assets.arrow_icon : assets.arrow_icon_dull}
                            alt="send"
                        />
                    </button>
                </div>
            </div>
        </form>
    );
};

export default PromptBox;
