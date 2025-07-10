import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Auth = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [remember, setRemember] = useState(false);
  const [loginPulled, setLoginPulled] = useState(false);

  // Animation triggers
  const gearRotation = name.length * 20 + email.length * 10;
  const leverAngle = remember ? 45 : 0;
  const handY = remember ? 0 : -20;
  const bottleY = remember ? 40 : 0;
  const loginLever = loginPulled ? 60 : 0;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginPulled(true);
    setTimeout(() => setLoginPulled(false), 1200);
    // Add your login logic here
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9f7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 420, height: 340 }}>
        {/* SVG Rube Goldberg Machine */}
        <svg width="420" height="340" style={{ position: 'absolute', left: 0, top: 0 }}>
          {/* Gears */}
          <g transform="translate(340,60)">
            <circle r="32" fill="#fff" stroke="#222" strokeWidth="2" />
            <g style={{ transform: `rotate(${gearRotation}deg)`, transformOrigin: 'center', transition: 'transform 0.5s cubic-bezier(.4,2,.6,.9)' }}>
              {[...Array(12)].map((_, i) => (
                <rect key={i} x={30} y={-2} width={8} height={4} fill="#bbb" transform={`rotate(${i * 30})`} />
              ))}
            </g>
          </g>
          {/* Lever for Remember Me */}
          <g>
            <rect x="90" y="110" width="6" height="80" fill="#222" rx="3" />
            <rect x="93" y="190" width="60" height="6" fill="#222" rx="3" style={{ transform: `rotate(${leverAngle}deg)`, transformOrigin: '3px 3px', transition: 'transform 0.4s' }} />
            {/* Hand and bottle */}
            <g style={{ transform: `translate(153px,193px) translateY(${handY}px)`, transition: 'transform 0.4s' }}>
              <rect x={-10} y={0} width={20} height={8} rx={4} fill="#aaa" />
              <rect x={-4} y={8} width={8} height={18} rx={4} fill="#bbb" />
              {/* Bottle */}
              <g style={{ transform: `translateY(${bottleY}px)`, transition: 'transform 0.4s' }}>
                <rect x={-6} y={28} width={12} height={20} rx={6} fill="#e0e0e0" stroke="#222" strokeWidth={1} />
                <rect x={-2} y={24} width={4} height={6} rx={2} fill="#bbb" />
              </g>
            </g>
          </g>
          {/* Pulley and string for Name input */}
          <g>
            <circle cx="60" cy="60" r="18" fill="#eee" stroke="#222" strokeWidth="2" />
            <line x1="60" y1="78" x2="60" y2="110" stroke="#222" strokeWidth="2" />
            <rect x="56" y="110" width="8" height="16" rx="4" fill="#bbb" />
            {/* Weight moves as you type */}
            <circle cx="60" cy={126 + name.length * 1.5} r="8" fill="#222" />
          </g>
          {/* Conveyor for Email input */}
          <g>
            <rect x="10" y="250" width="60" height="12" rx="6" fill="#bbb" />
            <rect x="70" y="250" width="30" height="12" rx="6" fill="#ddd" />
            {/* Ball moves as you type */}
            <circle cx={20 + Math.min(email.length * 3, 70)} cy="256" r="6" fill="#222" />
            {/* Hand at the end */}
            <rect x="100" y="245" width="18" height="18" rx="9" fill="#aaa" />
          </g>
          {/* Login lever/button */}
          <g>
            <rect x="320" y="260" width="8" height="60" fill="#222" rx="4" />
            <rect x="328" y="310" width="60" height="12" rx="6" fill="#222" style={{ transform: `rotate(${-loginLever}deg)`, transformOrigin: '0px 6px', transition: 'transform 0.5s cubic-bezier(.4,2,.6,.9)' }} />
            {/* Hand pulls lever */}
            <g style={{ transform: `translate(${388 + Math.sin(loginLever/60*Math.PI)*10}px,${316 - Math.abs(Math.sin(loginLever/60*Math.PI))*10}px)`, transition: 'transform 0.5s cubic-bezier(.4,2,.6,.9)' }}>
              <rect x={-8} y={-8} width={16} height={16} rx={8} fill="#aaa" />
              <rect x={-3} y={8} width={6} height={18} rx={3} fill="#bbb" />
            </g>
          </g>
        </svg>
        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ position: 'absolute', left: 120, top: 40, width: 200, zIndex: 2, background: 'rgba(255,255,255,0.85)', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} autoComplete="off" style={{ marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="off" style={{ marginTop: 4 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <input id="remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ marginRight: 8 }} />
            <Label htmlFor="remember">Remember me</Label>
          </div>
          <Button type="submit" style={{ width: '100%', background: '#222', color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 8, marginTop: 8 }}>Login</Button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
