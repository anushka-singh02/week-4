import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { VerifyToken } from "./verifytoken.js";
import env from "dotenv";
import fs from "fs";
import jwt from "jsonwebtoken"

env.config();

mongoose.connect("mongodb://localhost:27017/users",{useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));
const router = express.Router();

router.use(cors());
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const appId = process.env.JAAS_APP_ID;        // Your App ID
const kid = process.env.JAAS_KID;             // Key ID
const jaasSub = process.env.JAAS_SUB || "8x8.vc";
const privateKey = fs.readFileSync(process.env.JAAS_PRIVATE_KEY_PATH, 'utf-8');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // Firebase UID
  receiver: { type: String, required: true }, // Firebase UID
  content: { type: String, required: true },
  status: { type: String, enum: ['SEEN', 'NOT_SEEN'], default: 'NOT_SEEN' },
}, { timestamps: true });

const Messages = mongoose.model("messageinfo", messageSchema);

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
    },
    status: {
      type: String,
      default: "online",
    },
  },
  { timestamps: true }
);
const User = mongoose.model("userinfo", userSchema);

// router.post("/test", (req, res) => {
//   console.log("✅ /test endpoint hit");
//   res.json({ success: true });
// });


router.post("/register" , async(req ,res)=>{
    const email = req.body.email;
    const firebaseUid = req.body.firebaseUid;
    const password = req.body.password;
    console.log("BODY:", req.body);
    try{
        const newUser = new User({
            email:email,
            firebaseUid : firebaseUid,
            password : password
        });
        await newUser.save();
        res.status(201).json({ message: "User saved to MongoDB" });
    }catch(err){
        console.log("mongodb not saving",err);
        res.status(500).json({ message: "Internal Error"}); 
    }
});

router.post("/generatejwt", (req,res)=>{
  const {roomName , email} = req.body;
  console.log("roomname", roomName);
  console.log("email", email);
  if(!roomName|| !email)
    return res.status(400).json({error: "Missing roomnNme or useremail"});

  const now = Math.floor(Date.now() / 1000); 

  const payload = {
        aud: "jitsi",
        iss: appId, 
        sub: jaasSub,
        room: roomName, 
        iat: now,                
        nbf: now - 10,         
        exp: now + 60 * 60, 
        context :{
          user: {
            name : email,
            email : email
          },
        },
  };

  const signOptions = {
        algorithm: "RS256",
        keyid: appId,
        header: {
            kid: kid,
            typ: "JWT"
        }
    };

    const token = jwt.sign(payload, privateKey, signOptions);
    res.json({ token });
})

router.get("/users/:uid", VerifyToken ,async (req, res) => {
  try {
    const currentUid = req.params.uid;
    const users = await User.find({ firebaseUid: { $ne: currentUid } });
    res.status(200).json(users);
  } catch (err) {
    console.error("Failed to get users:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/messages", VerifyToken , async(req,res)=>{
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    const { sender, receiver, text: content } = req.body;
    if (!idToken) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }

    try {
      const newMessage = new Messages({
        sender,
        receiver,
        content
      })
      await newMessage.save();
      res.status(201).json({ message: "Message saved to MongoDB" });
    }catch(err){
      console.log("mongodb not saving",err);
      res.status(500).json({ message: "Internal Error"});
      throw err; 
    }
})

router.get("/messages/:recieverId",VerifyToken, async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  const recieverId = req.params.recieverId;

  if (!idToken) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  try {
    const senderId = req.user.uid;
    const recieverId = req.params.recieverId;
  
    // Find all messages between senderId and receiverId
    const messages = await Messages.find({
      $or: [
        { sender: senderId, receiver: recieverId },
        { sender: recieverId, receiver: senderId },
      ],
    }).sort({ createdAt: 1 }); // Sort by timestamp

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

export default router;