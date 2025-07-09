import { assets } from '@/assets/assets';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import Image from 'next/image';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

const PrompBox = ({ setIsLoading, isLoading }) => {
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

            // Optimistically update UI
            updateChatMessages(userMessage);

            const { data } = await axios.post('/api/chat/ai', {
                chatId: selectedChat._id,
                prompt: promptCopy
            });

            if (data.success) {
                const aiMessage = {
                    ...data.data,
                    timestamp: Date.now(),
                    role: 'assistant'
                };

                updateChatMessages(aiMessage);
            } else {
                toast.error(data.error || "Failed to get AI response");
                rollbackChatMessages(); // remove the user's message if error
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

    const updateChatMessages = (message) => {
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

    const rollbackChatMessages = () => {
        // Optionally re-fetch or remove last user message if needed
        // For now, we just keep UI unchanged
    };

    return (
        <form onSubmit={sendPrompt} className={`w-full ${selectedChat?.messages.length > 0 ? "max-w-3xl":"max-w-3xl"} max-w-2xl bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}>
            <textarea
                onKeyDown={handleKeyDown}
                className="outline-none w-full resize-none overflow-hidden break-words bg-transparent text-white"
                rows={2}
                placeholder="Message DeepSeek"
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="flex items-center justify-between text-sm mt-2">
                <div className="flex items-center gap-2">
                    <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
                        <Image className="h-5" src={assets.deepthink_icon} alt="" />
                        DeepThink (R1)
                    </p>
                    <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
                        <Image className="h-5" src={assets.search_icon} alt="" />
                        Search
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Image className="w-4 cursor-pointer" src={assets.pin_icon} alt="pin icon" />
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

export default PrompBox;
