"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = ({ children }) => {
    const { user } = useUser()
    const { getToken } = useAuth()
    const [chats, setChats] = useState([])
    const [selectedChat, setSelectedChat] = useState(null)
    const createNewChat = async () => {
        // Function to create a new chat
        try {
            if (!user) return null;
            // You can use the token for API calls or other purposes
            const token = await getToken();
            await axios.post('/api/chat/create', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            fetchUsersChats();
        } catch (error) {
            toast.error(error.message)
        }

    }
    const fetchUsersChats = async () => {
        // Function to create a new chat
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/chat/get', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (data.success) {
                console.log(data.data)
                setChats(data.data)
                //if the user has no chats, create a new chat
                if (data.data.length === 0) {
                    await createNewChat();
                    return fetchUsersChats();

                } else {
                    data.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                }
                // set recently created chat as selected chat
                setSelectedChat(data.data[0])
                console.log(data.data[0])
            } else {
                toast.error(data.error)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }
    useEffect(() => {
        if(user){
            fetchUsersChats();
        }
        // Fetch user's chats when the component mounts
    }, [user]);
    const value = {
        user,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        fetchUsersChats,
        createNewChat
    }
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}