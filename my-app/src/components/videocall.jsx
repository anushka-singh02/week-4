import React, {useEffect,useState} from "react";
import { useAuth } from "../config/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {auth} from "../config/firebase";
import axios from "axios";

function JitsiMeetComponent(){
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const {currentuser} = useAuth();
    const user = auth.currentUser;

    console.log(location.state, "recieverid");

    const senderId = user.uid;
    const recieverId = location.state?.recieverId;
    console.log("Jitsi room info:", senderId, recieverId);

    const containerstyle ={
        width : "100vw",
        height: "100vh",
    };
    const jitsicontainerstyle ={
        display:  "block",
        width : "100% ",
        height : "100%"
    };

    const notifyCallStart = async()=>{
        const callref = ref(db, `/Calls/${recieverId}`);
        await set(callref, {
            from: senderId,
            roomName: `${senderId}_${recieverId}`,
            status : "calling"
        });
    }

    const notifyCallEnd= async()=>{
        const callref = ref(db, `/Calls/${recieverId}`);
        await update(callref , {status: "ended"});
    }

    const StartJitsiMeet = async()=>{
        try{
                const domain = "8x8.vc"
                const roomName =  `${senderId}_${recieverId}`;
                const response = await axios.post("http://localhost:5000/api/generatejwt", {
                    roomName: `${senderId}_${recieverId}`,
                    email: user.email,
                    });
                const token = response.data.token;
                console.log("token of videocall is",token);

                const options = {
                    roomName :roomName,
                    jwt: token,
                    height : "100vh",
                    parentNode :  document.getElementById("jitsi-container"),
                    interfaceConfigOverwrite: {
                        filmStripOnly: false,
                        SHOW_JITSI_WATERMARK: false,
                    },
                    configOverwrite: {
                        // disableSimulcast: false,
                        // enableLobby: false, // 🚨 critical to disable waiting for moderator
                        prejoinPageEnabled: false
                    },
                    userinfo :{
                        displayname : user.email|| "ME"
                    }
                }

                const api = new JitsiMeetExternalAPI(domain,options);

                api.addEventListener("videoConferenceJoined", ()=>{
                    console.log("meeting started");
                    setLoading(false);
                    if(senderId && recieverId) notifyCallStart();
                    // const displayname = user.email|| "ME";
                    // api.executeCommand('displayName', displayname);
                });

                api.addEventListener("videoConferenceLeft",()=>{
                    console.log("meeting ended");
                    notifyCallEnd();
                    navigate("/Chats/message");
                })
            }catch(err){
                alert("error connecting with jitsi");
                console.log(err);
            }
    }

    useEffect(()=>{
        if (window.JitsiMeetExternalAPI) StartJitsiMeet();
        else alert("Jitsi script not loaded");
    },[]);

    return(
        <div style={containerstyle}>
            {loading && <p>Loading video call...</p>}
            <div style={jitsicontainerstyle} id="jitsi-container"></div>
        </div>
    )
};

export default JitsiMeetComponent; 