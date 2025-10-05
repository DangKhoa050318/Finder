import React, { useState, useEffect } from 'react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [majorId, setMajorId] = useState('');
  const [majors, setMajors] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/major')
      .then(res => res.json())
      .then(data => setMajors(Array.isArray(data) ? data : []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, password, major_id: majorId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Đăng ký thành công!');
      } else {
        setMsg(data.message || 'Đăng ký thất bại');
      }
    } catch {
      setMsg('Lỗi kết nối server');
    }
  };

  console.log(majors);

  return (
    <form onSubmit={handleSubmit}>
      <h2>Đăng ký</h2>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Họ và tên" required />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu" required />
      <select value={majorId} onChange={e => setMajorId(e.target.value)} required>
        <option value="">Chọn ngành học</option>
        {majors.map(m => <option key={m._id} value={m._id}>{m.major_name}</option>)}
      </select>
      <button type="submit">Đăng ký</button>
      {msg && <div style={{color:'red'}}>{msg}</div>}
    </form>
  );
}