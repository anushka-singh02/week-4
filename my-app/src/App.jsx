import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import {Route, Routes} from "react-router-dom"
import { AuthProvider } from "./config/AuthContext";
import Register  from "./components/register";
import Login  from "./components/login";
import Profile from "./components/profile";
import Header from "./components/header";
import ChatList from "./components/chatList";
import ChatMessage from "./components/chatmsg";
import VideoCall from "./components/videocall";

export function App(){
    return(
        <AuthProvider>
            <Header />
            <Routes>
                <Route path="/register" index element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path= "/Chats" element = {<ChatList />} />
                <Route path= "/Chats/message" element = {<ChatMessage />} />
                <Route path= "/Chats/call" element = {<VideoCall />} />
            </Routes>
        </AuthProvider>
    )
}