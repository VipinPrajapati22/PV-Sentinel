import { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@pvsystem.com');
  const [password, setPassword] = useState('Admin@1234');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark"><ShieldCheck size={26} /></span>
          <div>
            <strong>PV Sentinel</strong>
            <span>Pharmacovigilance Signal Detection</span>
          </div>
        </div>

        <h1 className="login-title">Sign in to your account</h1>
        <p className="login-sub">Enterprise-grade drug safety intelligence platform</p>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input
                id="password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <button type="button" className="eye-btn" onClick={() => setShow(!show)}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button className="btn-primary login-btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner-sm" /> : <Lock size={16} />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-footer">
          <strong>Demo credentials</strong>
          <span>admin@pvsystem.com / Admin@1234</span>
        </div>
      </div>

      {/* Background decoration */}
      <div className="login-bg" aria-hidden="true">
        <div className="bg-blob b1" />
        <div className="bg-blob b2" />
      </div>
    </div>
  );
}
