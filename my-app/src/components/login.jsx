import React , {useEffect, useState} from "react";
import { useAuth } from "../config/AuthContext";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { onAuthStateChanged} from "firebase/auth"
import {useNavigate} from 'react-router-dom';


function Login(){
    const [email, setEmail]= useState('');
    const [password,setPassword] = useState('');
    const navigate = useNavigate();
    
    const {login, currentuser} = useAuth();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e){
        e.preventDefault();

        try{
            setLoading(true);
            await login(email,password);
            navigate("/Chats")
        }catch(err){
            alert("Server error , login failed")
        }
    }

    return (
        <div
            style={{
            minHeight: "100vh",
            backgroundColor: "#F9FAFB",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: "Segoe UI, sans-serif",
            }}
        >
            <div
            style={{
                backgroundColor: "#fff",
                padding: "30px",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                width: "100%",
                maxWidth: "400px",
            }}
            >
            <h3 style={{ textAlign: "center", marginBottom: "25px", color: "#1F2937" }}>
                Login to Your Account
            </h3>

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label style={{ color: "#374151", fontWeight: "500" }}>Email address</Form.Label>
                <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                    padding: "10px",
                    fontSize: "15px",
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    }}
                />
                </Form.Group>

                <Form.Group className="mb-4" controlId="formBasicPassword">
                <Form.Label style={{ color: "#374151", fontWeight: "500" }}>Password</Form.Label>
                <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                    padding: "10px",
                    fontSize: "15px",
                    borderRadius: "8px",
                    border: "1px solid #D1D5DB",
                    }}
                />
                </Form.Group>

                <Button
                variant="primary"
                type="submit"
                style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "500",
                }}
                >
                Sign In
                </Button>

                <div style={{ textAlign: "center", marginTop: "16px" }}>
                <Form.Text className="text-muted">
                    Don't have an account?{" "}
                    <a href="/register" style={{ color: "#2563EB", textDecoration: "none" }}>
                    Register
                    </a>
                </Form.Text>
                </div>
            </Form>
            </div>
        </div>
        );

};
export default Login;