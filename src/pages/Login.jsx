import React, { useState, useRef, useEffect } from 'react';
import { User, LogIn, Ghost, UserPlus, AlertCircle, Shield, Award, Users, Volume2, VolumeX, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  // Auth State
  const [emailOrReg, setEmailOrReg] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [dob, setDob] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [facultyDept, setFacultyDept] = useState('');
  
  // Video State
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isVideoMuted;
    }
  }, [isVideoMuted]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!emailOrReg || !password) return;
    
    setError(null);
    setIsLoading(true);

    // If they typed a Registration Number instead of an email, append college domain
    let parsedEmail = emailOrReg;
    if (!parsedEmail.includes('@')) {
      parsedEmail = parsedEmail.trim() + '@raisoni.ac.in';
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, parsedEmail, password);
        navigate(role === 'faculty' ? '/faculty-dashboard' : '/dashboard');
      } else {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, parsedEmail, password);
        const user = userCredential.user;

        // Save data to Firestore based on role
        const userData = role === 'student' ? {
          uid: user.uid,
          email: user.email,
          role: 'student',
          fullName: fullName,
          regNo: regNo,
          dob: dob,
          branch: branch,
          semester: semester,
          startYear: startYear,
          endYear: endYear,
          profilePicUrl: '',
          createdAt: new Date().toISOString()
        } : {
          uid: user.uid,
          email: user.email,
          role: 'faculty',
          fullName: fullName,
          empId: regNo,
          department: facultyDept,
          profilePicUrl: '',
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', user.uid), userData);

        alert('Account created successfully! You are securely authenticated via Firebase.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col md:flex-row items-center justify-center font-sans px-4 select-none">
      
      {/* 1. Background Video (HD layout) */}
      <video
        ref={videoRef}
        autoPlay
        loop
        playsInline
        className="fixed top-0 left-0 min-w-full min-h-full w-auto h-auto object-cover object-center z-0 transition-opacity duration-1000 opacity-100"
      >
        <source src="/assets/bg.mp4" type="video/mp4" />
      </video>

      {/* 2. Background Overlay (Made completely transparent, letting video shine) */}
      <div className="absolute inset-0 bg-black/10 z-10"></div>

      {/* 3. Floating Light Blobs (Premium Effect) */}
      <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-blue-600/30 rounded-full blur-[120px] z-10 mix-blend-screen animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-purple-600/30 rounded-full blur-[120px] z-10 mix-blend-screen animate-pulse pointer-events-none delay-1000"></div>

      {/* 4. Login Card (Glassmorphism & Gradient Glow) */}
      <div className="relative z-20 w-full max-w-lg">
        {/* Glow wrapper for gradient border */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-[34px] blur-xl opacity-50 transform hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative p-8 sm:p-10 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden transform transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(107,33,168,0.3)]">
          
          {/* Logo Header & Role Switcher */}
          <div className="flex flex-col items-center mb-7 text-center">
            
            <div className="flex bg-white/5 p-1 rounded-full mb-5 w-52 justify-between relative shadow-inner border border-white/10 backdrop-blur-md">
              <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 shadow-sm ${role === 'faculty' ? 'translate-x-[100%]' : 'translate-x-0'}`}></div>
              <button type="button" onClick={() => { setRole('student'); setError(null); }} className={`flex-1 py-1.5 text-xs font-bold z-10 transition-colors ${role === 'student' ? 'text-white' : 'text-white/60'}`}>Student</button>
              <button type="button" onClick={() => { setRole('faculty'); setError(null); }} className={`flex-1 py-1.5 text-xs font-bold z-10 transition-colors ${role === 'faculty' ? 'text-white' : 'text-white/60'}`}>Faculty</button>
            </div>

            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(168,85,247,0.4)] transform transition-transform hover:scale-110 duration-500">
              {role === 'faculty' ? <GraduationCap className="text-white w-7 h-7" /> : <User className="text-white w-7 h-7" />}
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Raisoni PeerSpace
            </h1>
            <p className="text-white/80 font-semibold text-sm sm:text-base mt-4 max-w-sm leading-relaxed italic border-l-4 border-purple-500 pl-3">
              "Where doubts disappear and knowledge multiplies. Learn freely, anonymously."
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-5 py-3 rounded-full mb-6 flex items-center gap-2 animate-in fade-in zoom-in duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error.replace('Firebase:', '').trim()}</p>
            </div>
          )}

          {/* Form */}
          <form className="w-full flex justify-center flex-col gap-4" onSubmit={handleAuth}>
            {!isLogin && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-500 ease-out">
                {/* Registration fields stylized as pills */}
                <input 
                  type="text" 
                  value={fullName} onChange={(e) => setFullName(e.target.value)} required={!isLogin}
                  placeholder="Full Name (e.g. Rahul Sharma)" 
                  className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all font-medium text-sm shadow-inner"
                />

                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={regNo} onChange={(e) => setRegNo(e.target.value)} required={!isLogin}
                    placeholder={role === 'faculty' ? "Employee ID (FAC101)" : "Reg No (EN21001)"} 
                    className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm font-medium shadow-inner flex-1"
                  />
                  {role === 'student' && (
                    <input 
                      type="date" 
                      value={dob} onChange={(e) => setDob(e.target.value)} required={!isLogin}
                      className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-full text-white/50 focus:text-white focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm font-medium [color-scheme:dark] shadow-inner flex-1"
                    />
                  )}
                </div>

                {role === 'student' ? (
                  <>
                    <div className="flex gap-3">
                      <select 
                        value={branch} onChange={(e) => setBranch(e.target.value)} required={!isLogin}
                        className="w-full px-4 py-4 bg-black/40 border border-white/5 rounded-full text-white/90 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm font-medium appearance-none shadow-inner flex-[2]">
                        <option value="" disabled>Select Branch</option>
                        <option value="CSE">Computer Science (CSE)</option>
                        <option value="IT">Information Tech (IT)</option>
                        <option value="MECH">Mechanical (MECH)</option>
                        <option value="CIVIL">Civil Engg (CIVIL)</option>
                        <option value="EXTC">Electronics (EXTC)</option>
                        <option value="AI">Artificial Intelligence (AI)</option>
                        <option value="AIML">AI & Machine Learning (AIML)</option>
                        <option value="DS">Data Science (DS)</option>
                      </select>

                      <select 
                        value={semester} onChange={(e) => setSemester(e.target.value)} required={!isLogin}
                        className="w-full px-4 py-4 bg-black/40 border border-white/5 rounded-full text-white/90 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm font-medium appearance-none shadow-inner flex-[1]">
                        <option value="" disabled>Sem</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-3">
                      <input 
                        type="number" 
                        value={startYear} onChange={(e) => setStartYear(e.target.value)} required={!isLogin}
                        placeholder="Start Year" min="2010" max="2030"
                        className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm font-medium shadow-inner flex-1"
                      />
                      <input 
                        type="number" 
                        value={endYear} onChange={(e) => setEndYear(e.target.value)} required={!isLogin}
                        placeholder="End Year" min="2014" max="2034"
                        className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm font-medium shadow-inner flex-1"
                      />
                    </div>
                  </>
                ) : (
                  <select 
                    value={facultyDept} onChange={(e) => setFacultyDept(e.target.value)} required={!isLogin}
                    className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-full text-white/90 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm font-medium appearance-none shadow-inner">
                    <option value="" disabled>Select Department</option>
                    <option value="CSE">Computer Science</option>
                    <option value="IT">Information Technology</option>
                    <option value="MECH">Mechanical Engineering</option>
                    <option value="CIVIL">Civil Engineering</option>
                    <option value="EXTC">Electronics & Telecom</option>
                    <option value="AI">Artificial Intelligence</option>
                    <option value="AIML">AI & Machine Learning</option>
                    <option value="DS">Data Science</option>
                  </select>
                )}
              </div>
            )}

            <div className="space-y-4">
              <input 
                type="text" 
                value={emailOrReg} onChange={(e) => setEmailOrReg(e.target.value)} required
                placeholder="Email OR Reg No." 
                className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm font-medium shadow-inner"
              />
              <div className="relative w-full shadow-inner rounded-full">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="Password" 
                  className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm font-medium pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            {isLogin && (
              <div className="flex items-center justify-between px-2 pt-1 pb-2">
                <span className="text-white/60 text-xs font-semibold">Remember me</span>
                <button 
                  type="button" 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${rememberMe ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${rememberMe ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="mt-2 relative group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 px-6 rounded-full font-bold transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {/* Button inner glow overlay */}
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              
              {isLoading ? (
                 <><span className="animate-spin h-5 w-5 border-2 border-white/40 border-t-white rounded-full"></span></>
              ) : isLogin ? (
                 <><LogIn className="w-5 h-5" /> Sign in Securely</>
              ) : (
                 <><UserPlus className="w-5 h-5" /> Quick Launch</>
              )}
            </button>
          </form>

          {/* Secondary Actions */}
          <div className="mt-6 w-full space-y-5">
             <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Alternatively</span>
                <div className="flex-grow border-t border-white/10"></div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => {
                   setIsLogin(!isLogin);
                   setError(null);
                }} 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-purple-500/10 to-transparent hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/60 text-white py-3.5 px-4 rounded-xl font-semibold transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:-translate-y-0.5 text-sm"
              >
                {isLogin ? (
                  <><UserPlus className="w-4 h-4 text-purple-400" /> Create Account</>
                ) : (
                  <><LogIn className="w-4 h-4 text-blue-400" /> Back to Login</>
                )}
              </button>

              <button 
                type="button"
                onClick={() => navigate('/dashboard', { state: { isAnonymous: true } })}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-bl from-emerald-500/10 to-transparent hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 text-white py-3.5 px-4 rounded-xl font-semibold transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 text-sm group"
              >
                <Ghost className="w-4 h-4 text-emerald-400 group-hover:animate-bounce" /> Guest Login
              </button>
            </div>
          </div>

          {/* Features Pills */}
          <div className="mt-8 flex justify-center gap-2 flex-wrap">
             <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-2 rounded-full hover:bg-purple-500/10 hover:border-purple-500/30 transition-colors cursor-default group">
                <Shield className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Ask Safely</span>
             </div>
             <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-2 rounded-full hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors cursor-default group">
                <Users className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Learn Peers</span>
             </div>
             <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-2 rounded-full hover:bg-pink-500/10 hover:border-pink-500/30 transition-colors cursor-default group">
                <Award className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Earn Rewards</span>
             </div>
          </div>

        </div>
      </div>

      {/* Bonus: Fixed Mute/Play Button */}
      <button 
        onClick={() => setIsVideoMuted(!isVideoMuted)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-xl"
        title={isVideoMuted ? "Unmute Background" : "Mute Background"}
      >
        {isVideoMuted ? <VolumeX className="w-5 h-5 text-white/70" /> : <Volume2 className="w-5 h-5 text-white" />}
      </button>

    </div>
  );
}
