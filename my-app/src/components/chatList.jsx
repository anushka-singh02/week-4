import React,{useState, useEffect} from "react";
import {db,auth} from "../config/firebase"
import{ ref, onValue} from "firebase/database";
import { useNavigate } from "react-router-dom";
import ChatInput from "./chatinput";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import axios from "axios";

function ChatList(){
    const [chatUsers, setChatUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser , setSelectedUser]= useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const navigate = useNavigate();

    const handleUserClick = (user) => {
        setSelectedUser(user);
        navigate("/Chats/message", {
        state: {
            
            recieverId: user.id,
            senderId: currentUserId,
      },
    });
  };
    //fetching logged in user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth,(user) => {
        if (user) {
            setCurrentUserId(user.uid);
        }else{
            setCurrentUserId(null);
        }
    });
    return () => {
        if(typeof unsubscribe === "function"){
            unsubscribe();
        }}
    }, []);

    useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const usersRef = ref(db, "/users");
        const unsubscribe = onValue(usersRef, (snapshot)=>{
            if(snapshot.exists()){
                const usersData = snapshot.val();
                const usersList = Object.values(usersData).filter(user => user.id !== currentUserId);
                setAllUsers(usersList);
            }else{
                setAllUsers([]);
            }
        })
     }catch (err) {
        console.error("Failed to fetch all users:", err);
      }
    }

    if (currentUserId) {
      fetchAllUsers();
    }
  }, [currentUserId]);

    useEffect(()=>{
        if(!currentUserId) return;

        const fetchUsers = async () => {
      try {
        const user = getAuth().currentUser;
        const token = await user.getIdToken();
        const res = await axios.get(`http://localhost:5000/api/users/${currentUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const mongoUsers = res.data.filter((u) => u.firebaseUid !== currentUserId);

        setAllUsers((prevUsers) => {
          const merged = [...prevUsers];
          mongoUsers.forEach((mongoUser) => {
            const existingIndex = merged.findIndex((u) => u.id === mongoUser.firebaseUid);
            if (existingIndex !== -1) {
              merged[existingIndex].email = mongoUser.email;
            } else {
              merged.push({
                id: mongoUser.firebaseUid,
                email: mongoUser.email,
              });
            }
          });
          return merged;
        });

      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();

        const chatref = ref(db, `/ChatLists/${currentUserId}`);

        const unsubscribe=  onValue(chatref,(snapshot)=>{
            const data = snapshot.val();
            console.log("Snapshot:", snapshot.val());
            if(data){
                const users = Object.values(data);
                setChatUsers(users);
            }else{
                setChatUsers([]);
            }
        })

    },[currentUserId])

    const combinedUsers = [];

    const seenIds = new Set();

    // 1. Add MongoDB users (have id + email)
    allUsers.forEach((user) => {
      if (!seenIds.has(user.id)) {
        combinedUsers.push(user);
        seenIds.add(user.id);
      }
    });

    // 2. Add Firebase ChatList users if they’re not already present
    chatUsers.forEach((user) => {
      if (!seenIds.has(user.id)) {
        combinedUsers.push({ id: user.id, email: user.id }); // Fallback: show ID if email not known
        seenIds.add(user.id);
      }
    });

    useEffect(() => {
        console.log("selectedUser updated:", selectedUser);
    }, [selectedUser]); 

    useEffect(()=>{
      if(!currentUserId) return;

      const callRef = ref(db, `Calls/${currentUserId}`);
      const unsubscribe = onValue(callRef, (snapshot)=>{
        const callData = snapshot.val();
        if(callData?.status==="calling"){
          const accept = window.confirm("📞 Incoming call! Do you want to join?");
          if(accept){
            navigate("/Chats/call",{
              state :{
                senderId : callData.from,
                recieverId : currentUserId
              },
            })
          }
        }
        if(callData?.status === "ended"){
          alert("call ended");
        };
      })

      return ()=>unsubscribe();

    },[currentUserId])
    
    return (
      <div style={{
        maxWidth: "500px",
        margin: "40px auto",
        padding: "20px",
        backgroundColor: "#F3F4F6",
        borderRadius: "12px",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
        fontFamily: "Segoe UI, sans-serif"
      }}>
        <h2 style={{ textAlign: "center", color: "#1F2937", marginBottom: "24px", fontSize: "28px" }}>
          Chat List
        </h2>

        {combinedUsers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6B7280" }}>
            No other users found. Invite someone to chat!
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {combinedUsers.map((user) => (
              <li
                key={user.id}
                onClick={() => handleUserClick(user)}
                style={{
                  backgroundColor: "#fff",
                  marginBottom: "12px",
                  padding: "14px 20px",
                  borderRadius: "10px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  color: "#1F2937",
                  fontWeight: "500",
                  fontSize: "16px"
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#E5E7EB")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#fff")
                }
              >
                {user.email || user.id}
              </li>
            ))}
          </ul>
        )}

        {selectedUser && (
          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              backgroundColor: "#fff",
              borderRadius: "10px",
              border: "1px solid #D1D5DB",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.06)"
            }}
          >
            <ChatInput recieverId={selectedUser.id} senderId={currentUserId} />
          </div>
        )}
      </div>
    );

}
export default ChatList;