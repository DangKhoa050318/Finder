import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.access_token);
        navigate('/home');
      } else {
        setMsg(data.message || 'Đăng nhập thất bại');
      }
    } catch {
      setMsg('Lỗi kết nối server');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Đăng nhập</h2>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu" required />
      <button type="submit">Đăng nhập</button>
      {msg && <div style={{color:'red'}}>{msg}</div>}
      <div style={{marginTop: '10px'}}>
        <Link to="/register">Chưa có tài khoản? Đăng ký</Link>
      </div>
    </form>
  );
}