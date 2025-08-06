import React,{useEffect, useState} from "react";
import {db,auth} from "../config/firebase"
import{ref, onValue,update} from "firebase/database";
import { useLocation , useNavigate} from "react-router-dom";
import { getAuth } from "firebase/auth";
import ChatInput from "./chatinput";
import axios from "axios";


function ChatMessage(){
    const location = useLocation();
    const currentUser = auth.currentUser;
    const currentUserId = currentUser?.uid;
    const { senderId, recieverId } = location.state || {};
     console.log("Sender ID:", senderId);
     console.log("Receiver ID:", recieverId); 
     const navigate = useNavigate();       


    const[messages, setMessages]= useState([]);
    useEffect(()=>{
         if (!senderId || !recieverId) {
            console.warn("Missing sender or receiver ID");
            return;
        }

        const messageref = ref(db, "Chats");

        const unsubscribe = onValue(messageref, (snapshot)=>{
            const data = snapshot.val();
            const filteredMessages = [];

            if(data){
                const allMessages = Object.entries(data);
                
                allMessages.forEach(([key,msg])=>{
                    const isBetweenUsers = (msg.sender== senderId && msg.receiver== recieverId) || (msg.sender== recieverId && msg.receiver== senderId);
                    
                    if(isBetweenUsers){
                        filteredMessages.push({id:key , ...msg})
                        if (msg.receiver === currentUserId && (msg.status === "NOT_SEEN"|| msg.status === undefined)){
                            console.log("Marking message as SEEN:", msg);
                            const updateRef = ref(db, `Chats/${key}`);
                            update(updateRef, { status: "SEEN" });
                        }
                    }

                })
                console.log("Filtered messages:", filteredMessages);
                setMessages(filteredMessages);
            } else {
                setMessages([]);
            }
        })
        return () => unsubscribe();
    },[senderId, recieverId])

     useEffect(() => {
    // Get message history from MongoDB
    const fetchHistory = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await axios.get(
          `http://localhost:5000/api/messages/${recieverId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Optional: merge with Firebase messages or show separately
        console.log("MongoDB messages:", res.data);
        setMessages((prev) => [...prev, ...res.data]);
      } catch (err) {
        console.error("Failed to fetch MongoDB messages", err);
      }
    };

    if (senderId && recieverId) fetchHistory();
  }, [senderId, recieverId]);

    return (
        <div
            style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            backgroundColor: "#f5f5f5",
            fontFamily: "Arial, sans-serif",
            }}
            >
            {/* Chat Header */}
            <div
            style={{
                backgroundColor: "#f0f2f5", // Soft light grey
                color: "#333",
                padding: "12px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #ddd",
                boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.05)",
            }}
            >
            <h3 style={{ margin: 0, fontWeight: 400 }}>💬 Chat with them</h3>

            <button
                onClick={() => navigate("/Chats/call",{
                    state : {senderId: senderId, recieverId: recieverId}
                })}
                style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#4A90E2", 
                color: "#fff",
                padding: "8px 16px",
                border: "none",
                borderRadius: "6px",
                fontSize: "1rem",
                fontWeight: 500,
                cursor: "pointer",
                boxShadow: "0px 2px 5px rgba(0,0,0,0.15)",
                transition: "background-color 0.2s",
                }}
            >
                <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20"
                viewBox="0 0 24 24"
                width="20"
                fill="#ffffff"
                >
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M17 10.5V6c0-1.1-.9-2-2-2H5C3.9 4 3 4.9 3 6v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-4.5l4 4v-11l-4 4z" />
                </svg>
                Video Call
            </button>
            </div>

            {/* Message List */}
            <div
            style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                backgroundColor: "#ffffff",
            }}
            id="message-container"
            >
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {messages.map((msg, index) => {
                const isSender = msg.sender === senderId;
                return (
                    <li
                    key={index}
                    style={{
                        display: "flex",
                        justifyContent: isSender ? "flex-end" : "flex-start",
                        marginBottom: "12px",
                    }}
                    >
                    <div
                        style={{
                        backgroundColor: isSender ? "#dcf8c6" : "#f0f0f0",
                        borderRadius: "12px",
                        padding: "10px 15px",
                        maxWidth: "70%",
                        boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
                        }}
                    >
                        <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                        {isSender ? "You" : "Them"}
                        </div>
                        <div style={{ fontSize: "1rem", marginBottom: "5px" }}>{msg.content}</div>
                        <div style={{ fontSize: "0.75rem", color: "gray", textAlign: "right" }}>
                        {msg.time}
                        {isSender && (
                            <span style={{ marginLeft: "10px", color: "blue" }}>{msg.status}</span>
                        )}
                        </div>
                    </div>
                    </li>
                );
                })}
            </ul>
            </div>

            {/* Chat Input Field */}
            <div
            style={{
                padding: "15px 20px",
                backgroundColor: "#ffffff",
                borderTop: "1px solid #ddd",
                boxShadow: "0px -1px 3px rgba(0,0,0,0.05)",
            }}
            >
            <ChatInput senderId={senderId} recieverId={recieverId} />
            </div>
        </div>
    );
}

export default ChatMessage;