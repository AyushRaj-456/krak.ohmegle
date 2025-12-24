import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
    onAuth: (uid: string, email: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = () => {
    const { signUp, signIn, resetPassword } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [isResetMode, setIsResetMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (isResetMode) {
            if (!email.trim()) {
                setError('Please enter your email.');
                return;
            }
            setLoading(true);
            const { error } = await resetPassword(email);
            setLoading(false);
            if (error) {
                setError(error);
            } else {
                setSuccessMessage('Password reset email sent! Check your inbox.');
            }
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setError("Passwords don't match!");
            return;
        }

        if (email.trim() && password.trim()) {
            setLoading(true);

            const result = isLogin
                ? await signIn(email, password)
                : await signUp(email, password);

            setLoading(false);

            if (result.error) {
                // Format Firebase errors to be user-friendly
                let errorMessage = result.error;
                if (errorMessage.includes('auth/email-already-in-use')) {
                    errorMessage = 'This email is already registered. Please login instead.';
                } else if (errorMessage.includes('auth/invalid-email')) {
                    errorMessage = 'Invalid email address.';
                } else if (errorMessage.includes('auth/weak-password')) {
                    errorMessage = 'Password should be at least 6 characters.';
                } else if (errorMessage.includes('auth/user-not-found')) {
                    errorMessage = 'No account found with this email.';
                } else if (errorMessage.includes('auth/wrong-password')) {
                    errorMessage = 'Incorrect password.';
                } else if (errorMessage.includes('auth/invalid-credential')) {
                    errorMessage = 'Invalid email or password.';
                }
                setError(errorMessage);
            }
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-[#0a0a0f] p-6 overflow-hidden">
            {/* Subtle blurred background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl"></div>
            </div>

            {/* Auth card */}
            <div className="relative w-full max-w-md bg-[#16161d]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/5 shadow-2xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-wider font-mono flex items-center justify-center">
                        krak.Ωegle
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isResetMode ? 'Reset your password' : (isLogin ? 'Login to start chatting' : 'Create your account')}
                    </p>
                </div>

                {/* Toggle between Login/Signup (Hidden in Reset Mode) */}
                {!isResetMode && (
                    <div className="relative grid grid-cols-2 gap-0 bg-[#0f0f14] rounded-lg p-1 border border-white/5 mb-6">
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-purple-600 rounded-md transition-all duration-300 ease-out shadow-lg shadow-purple-600/30 ${isLogin ? 'left-1' : 'left-[calc(50%+2px)]'
                                }`}
                        />
                        <button
                            type="button"
                            className={`relative z-10 py-2.5 rounded-md font-medium transition-all duration-300 ${isLogin ? 'text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            onClick={() => setIsLogin(true)}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            className={`relative z-10 py-2.5 rounded-md font-medium transition-all duration-300 ${!isLogin ? 'text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            onClick={() => setIsLogin(false)}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Messages */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-green-400 text-sm">
                            {successMessage}
                        </div>
                    )}

                    {/* Email Input */}
                    <div className="group">
                        <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-white/10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            disabled={loading}
                        />
                    </div>

                    {!isResetMode && (
                        <>
                            {/* Password Input */}
                            <div className="group">
                                <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-white/10 pr-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        minLength={6}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot Password Link */}
                            {isLogin && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                        onClick={() => {
                                            setIsResetMode(true);
                                            setError('');
                                            setSuccessMessage('');
                                        }}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Confirm Password (only for signup) */}
                    {!isLogin && !isResetMode && (
                        <div className="group">
                            <label className="block text-sm font-medium mb-2 text-gray-400 group-hover:text-purple-400 transition-colors duration-200">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="w-full bg-[#0f0f14] text-white rounded-lg px-4 py-3 border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder-gray-600 hover:border-white/10 pr-10"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    required
                                    minLength={6}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3.5 rounded-lg transition-all mt-6 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                {isResetMode ? 'Sending Link...' : (isLogin ? 'Logging in...' : 'Creating account...')}
                            </span>
                        ) : (
                            isResetMode ? 'Send Reset Link' : (isLogin ? 'Login' : 'Create Account')
                        )}
                    </button>

                </form>

                {isResetMode && (
                    <button
                        className="w-full text-gray-400 hover:text-white text-sm font-medium mt-4 transition-colors p-2"
                        onClick={() => {
                            setIsResetMode(false);
                            setError('');
                            setSuccessMessage('');
                        }}
                    >
                        Back to Login
                    </button>
                )}
            </div>
        </div>
    );
};
