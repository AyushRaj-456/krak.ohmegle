import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

const db = getFirestore();

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is admin
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userRole = userData.role || 'user';

            if (userRole === 'admin') {
              setUser(user);
              setIsAdmin(true);
            } else {
              // Not an admin - sign them out
              await signOut(auth);
              setError('Access denied. Admin privileges required.');
              setUser(null);
              setIsAdmin(false);
            }
          } else {
            // User document doesn't exist
            await signOut(auth);
            setError('User profile not found.');
            setUser(null);
            setIsAdmin(false);
          }
        } catch (err: any) {
          console.error('Error checking admin status:', err);
          await signOut(auth);
          setError('Error verifying admin access.');
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Check if user is admin
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role || 'user';

        if (userRole !== 'admin') {
          await signOut(auth);
          setError('❌ Access denied. This panel is for admins only.');
          setLoading(false);
          return;
        }
      } else {
        await signOut(auth);
        setError('❌ User profile not found.');
        setLoading(false);
        return;
      }

      // If we get here, user is admin
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      if (err.code === 'auth/invalid-credential') {
        setError('❌ Invalid email or password');
      } else {
        setError('❌ ' + err.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAdmin(false);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>🔐 Admin Panel</h1>
          <p className="subtitle">SIT Omegle Payment Management</p>

          <form onSubmit={handleLogin}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sitomegle.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>

          <p className="warning">⚠️ Admin access only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <AdminDashboard user={user} onLogout={handleLogout} />
    </div>
  );
}

export default App;
