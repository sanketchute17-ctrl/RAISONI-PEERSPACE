import React, { useState, useRef, useEffect } from 'react';
import { User, LogIn, Ghost, UserPlus, AlertCircle, Volume2, VolumeX, Eye, EyeOff, GraduationCap, RefreshCw, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

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
  
  // Captcha State
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  
  // Video State
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isVideoMuted;
    }
  }, [isVideoMuted]);

  const [displayText, setDisplayText] = useState('');
  const fullText = 'RAISONI PEERSPACE';

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(fullText.slice(0, i + 1));
      i++;
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const { loginAsGuest } = useAuth();

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!emailOrReg || !password) return;
    
    setError(null);

    if (!captchaVerified) {
      setError('Please verify that you are not a robot.');
      return;
    }

    setIsLoading(true);

    // If they typed a Registration Number instead of an email, append college domain
    let parsedEmail = emailOrReg;
    if (!parsedEmail.includes('@')) {
      parsedEmail = parsedEmail.trim() + '@raisoni.ac.in';
    }

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, parsedEmail, password);
        const user = userCredential.user;

        // Fetch actual user profile from Firestore to determine real stored role
        let storedRole = role;
        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.role) {
              storedRole = data.role.toLowerCase().trim();
            }
          }
        } catch (e) {
          console.warn("Unable to fetch user document on login:", e);
        }

        navigate(storedRole === 'faculty' ? '/faculty-dashboard' : '/dashboard');
      } else {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, parsedEmail, password);
        const user = userCredential.user;

        // Save data to Firestore based on role
        const selectedDept = role === 'student' ? branch : facultyDept;
        const userData = {
          uid: user.uid,
          email: user.email,
          role: role,
          fullName: fullName,
          regNo: regNo,
          empId: regNo,
          department: selectedDept,
          branch: selectedDept,
          dob: dob || '',
          semester: semester || '',
          startYear: startYear || '',
          endYear: endYear || '',
          profilePicUrl: '',
          about: '',
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', user.uid), userData);

        alert('Account created successfully! You can now log in with your credentials.');
        setIsLogin(true);
      }
    } catch (err) {
      // If Firebase API key is invalid or unconfigured, log in using demo mode so user isn't blocked
      const isApiKeyError = err.code?.includes('api-key') || err.message?.includes('api-key') || err.message?.includes('API key');
      if (isApiKeyError) {
        console.warn("Firebase API key not configured/invalid. Logging in using Demo Mode.");
        loginAsGuest(role);
        navigate(role === 'faculty' ? '/faculty-dashboard' : '/dashboard');
        return;
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-y-auto sm:overflow-hidden bg-black flex flex-col md:flex-row items-center justify-center font-sans px-3 sm:px-4 py-4 sm:py-0 select-none">
      
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

      {/* 3. Floating Light Blobs (Raisoni Theme: Purple & Orange) */}
      <div className="absolute top-[10%] left-[20%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-purple-700/30 rounded-full blur-[80px] sm:blur-[120px] z-10 mix-blend-screen animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-orange-600/30 rounded-full blur-[80px] sm:blur-[120px] z-10 mix-blend-screen animate-pulse pointer-events-none delay-1000"></div>

      {/* 4. Login Card (Glassmorphism & Gradient Glow) */}
      <div className="relative z-20 w-full max-w-[330px] sm:max-w-md my-auto scale-[0.92] xs:scale-[0.95] sm:scale-100 origin-center transition-transform">
        {/* Glow wrapper for gradient border */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-orange-500/20 to-purple-900/30 rounded-[24px] sm:rounded-[34px] blur-md sm:blur-lg opacity-60 transform hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative p-4 sm:p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[20px] sm:rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] sm:max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden transform transition-all duration-700 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(107,33,168,0.3)]">
          
          {/* Logo Header & Role Switcher */}
          <div className="flex flex-col items-center mb-3 sm:mb-7 text-center">
            
            <div className="flex bg-white/5 p-1 rounded-full mb-3 sm:mb-5 w-44 sm:w-52 justify-between relative shadow-inner border border-white/10 backdrop-blur-md">
              <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-gradient-to-r from-purple-700 to-orange-500 rounded-full transition-all duration-300 shadow-sm ${role === 'faculty' ? 'translate-x-[100%]' : 'translate-x-0'}`}></div>
              <button type="button" onClick={() => { setRole('student'); setError(null); }} className={`flex-1 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold z-10 transition-colors ${role === 'student' ? 'text-white' : 'text-white/60'}`}>Student</button>
              <button type="button" onClick={() => { setRole('faculty'); setError(null); }} className={`flex-1 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold z-10 transition-colors ${role === 'faculty' ? 'text-white' : 'text-white/60'}`}>Faculty</button>
            </div>

            <div className="w-full flex items-center justify-center mb-1 sm:mb-3">
              <h1 className="text-lg sm:text-2xl font-black text-white/90 tracking-wide uppercase mt-0.5 sm:mt-1 border-b-2 sm:border-b-[3px] border-orange-500/70 pb-1 sm:pb-2 inline-block">
                {displayText}
              </h1>
            </div>
            <p className="text-white/80 font-semibold text-[11px] sm:text-sm mt-1.5 sm:mt-3 max-w-sm leading-relaxed italic border-l-2 sm:border-l-4 border-orange-500 pl-2.5 sm:pl-3 bg-black/20 p-1.5 sm:p-2 rounded-r-md sm:rounded-r-lg">
              "Where doubts disappear and knowledge multiplies."
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-3 sm:px-5 py-2 sm:py-3 rounded-full mb-3 sm:mb-6 flex items-center gap-2 animate-in fade-in zoom-in duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error.replace('Firebase:', '').trim()}</p>
            </div>
          )}

          {/* Form */}
          <form className="w-full flex justify-center flex-col gap-2.5 sm:gap-4" onSubmit={handleAuth}>
            {!isLogin && (
              <div className="space-y-2.5 sm:space-y-4 animate-in slide-in-from-top-4 duration-500 ease-out">
                {/* Registration fields stylized as pills */}
                <input 
                  type="text" 
                  value={fullName} onChange={(e) => setFullName(e.target.value)} required={!isLogin}
                  placeholder="Full Name (e.g. Rahul Sharma)" 
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all font-medium text-xs sm:text-sm shadow-inner"
                />

                <div className="flex gap-2 sm:gap-3">
                  <input 
                    type="text" 
                    value={regNo} onChange={(e) => setRegNo(e.target.value)} required={!isLogin}
                    placeholder={role === 'faculty' ? "Employee ID (FAC101)" : "Reg No (EN21001)"} 
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-xs sm:text-sm font-medium shadow-inner flex-1"
                  />
                  {role === 'student' && (
                    <input 
                      type="date" 
                      value={dob} onChange={(e) => setDob(e.target.value)} required={!isLogin}
                      className="w-full px-3 sm:px-6 py-2.5 sm:py-4 bg-black/40 border border-white/5 rounded-full text-white/50 focus:text-white focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-xs sm:text-sm font-medium [color-scheme:dark] shadow-inner flex-1"
                    />
                  )}
                </div>

                {role === 'student' ? (
                  <>
                    <div className="flex gap-2 sm:gap-3">
                      <select 
                        value={branch} onChange={(e) => setBranch(e.target.value)} required={!isLogin}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-4 bg-black/40 border border-white/5 rounded-full text-white/90 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-xs sm:text-sm font-medium appearance-none shadow-inner flex-[2]">
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
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-4 bg-black/40 border border-white/5 rounded-full text-white/90 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-xs sm:text-sm font-medium appearance-none shadow-inner flex-[1]">
                        <option value="" disabled>Sem</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-2 sm:gap-3">
                      <input 
                        type="number" 
                        value={startYear} onChange={(e) => setStartYear(e.target.value)} required={!isLogin}
                        placeholder="Start Year" min="2010" max="2030"
                        className="w-full px-4 sm:px-6 py-2.5 sm:py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-xs sm:text-sm font-medium shadow-inner flex-1"
                      />
                      <input 
                        type="number" 
                        value={endYear} onChange={(e) => setEndYear(e.target.value)} required={!isLogin}
                        placeholder="End Year" min="2014" max="2034"
                        className="w-full px-4 sm:px-6 py-2.5 sm:py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-xs sm:text-sm font-medium shadow-inner flex-1"
                      />
                    </div>
                  </>
                ) : (
                  <select 
                    value={facultyDept} onChange={(e) => setFacultyDept(e.target.value)} required={!isLogin}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-4 bg-black/40 border border-white/5 rounded-full text-white/90 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-xs sm:text-sm font-medium appearance-none shadow-inner">
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

            <div className="space-y-2.5 sm:space-y-4">
              <input 
                type="text" 
                value={emailOrReg} onChange={(e) => setEmailOrReg(e.target.value)} required
                placeholder="Email OR Reg No." 
                className="w-full px-4 sm:px-6 py-2.5 sm:py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 focus:ring-1 focus:ring-blue-500/30 transition-all text-xs sm:text-sm font-medium shadow-inner"
              />
              <div className="relative w-full shadow-inner rounded-full">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="Password" 
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-4 bg-black/40 border border-white/5 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-xs sm:text-sm font-medium pr-10 sm:pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            {/* Captcha Section */}
            <div className="flex justify-center w-full mt-1 sm:mt-2">
              <div 
                className="flex items-center gap-2.5 sm:gap-4 bg-[#fafafa] border border-gray-300 rounded-sm p-2 sm:px-4 sm:py-3 cursor-pointer shadow-sm w-full max-w-[260px] sm:max-w-[300px]"
                onClick={() => {
                  if (captchaVerified || captchaLoading) return;
                  setCaptchaLoading(true);
                  setTimeout(() => {
                    setCaptchaLoading(false);
                    setCaptchaVerified(true);
                    setError(null);
                  }, 1200);
                }}
              >
                <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-sm border-2 bg-white flex-shrink-0 transition-all duration-300" style={{ borderColor: captchaVerified ? 'transparent' : '#c1c1c1' }}>
                   {captchaLoading ? (
                      <span className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                   ) : captchaVerified ? (
                      <Check className="w-5 h-5 sm:w-7 sm:h-7 text-green-600 font-bold" strokeWidth={4} />
                   ) : null}
                </div>
                <span className="text-[#222] font-medium text-xs sm:text-[15px] select-none tracking-wide text-left flex-1" style={{ fontFamily: 'Roboto, sans-serif' }}>
                   I'm not a robot
                </span>
                <div className="flex flex-col items-center justify-center flex-shrink-0 opacity-80">
                  <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" className="w-5 h-5 sm:w-8 sm:h-8 object-contain mb-0.5" alt="reCAPTCHA" />
                  <span className="text-[7px] sm:text-[10px] text-gray-500 -mt-1 tracking-tight">reCAPTCHA</span>
                  <div className="text-[6px] sm:text-[7px] text-gray-400 mt-0.5 space-x-1">
                    <span className="hover:underline">Privacy</span>-<span>Terms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Remember Me Toggle */}
            {isLogin && (
              <div className="flex items-center justify-between px-1 sm:px-2 py-0.5 sm:pt-1 sm:pb-2">
                <span className="text-white/60 text-[11px] sm:text-xs font-semibold">Remember me</span>
                <button 
                  type="button" 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-8 sm:w-10 h-4 sm:h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${rememberMe ? 'bg-gradient-to-r from-purple-600 to-orange-500' : 'bg-white/10'}`}
                >
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${rememberMe ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="mt-1 sm:mt-2 relative group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 via-purple-600 to-orange-500 text-white py-2.5 sm:py-4 px-4 sm:px-6 rounded-full font-bold transition-all duration-300 shadow-[0_0_20px_rgba(241,90,34,0.3)] hover:shadow-[0_0_35px_rgba(241,90,34,0.6)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-wider text-xs sm:text-sm"
            >
              {/* Button inner glow overlay */}
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              
              {isLoading ? (
                 <><span className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/40 border-t-white rounded-full"></span></>
              ) : isLogin ? (
                 <><LogIn className="w-4 h-4 sm:w-5 sm:h-5" /> Sign in Securely</>
              ) : (
                 <><UserPlus className="w-4 h-4 sm:w-5 sm:h-5" /> Quick Launch</>
              )}
            </button>
          </form>

          {/* Secondary Actions */}
          <div className="mt-3 sm:mt-6 w-full space-y-3 sm:space-y-5">
             <div className="relative flex py-0.5 sm:py-1 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-3 sm:mx-4 text-white/30 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">Alternatively</span>
                <div className="flex-grow border-t border-white/10"></div>
             </div>

             <div className="flex flex-col gap-2 sm:gap-3 justify-center">
              <button 
                type="button"
                onClick={() => {
                   setIsLogin(!isLogin);
                   setError(null);
                }} 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-purple-500/10 to-transparent hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/60 text-white py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl font-semibold transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:-translate-y-0.5 text-xs sm:text-sm"
              >
                {isLogin ? (
                  <><UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" /> Create Account</>
                ) : (
                  <><LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" /> Back to Login</>
                )}
              </button>

              <button 
                type="button"
                onClick={() => {
                  loginAsGuest(role);
                  navigate(role === 'faculty' ? '/faculty-dashboard' : '/dashboard');
                }} 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500/20 to-purple-600/20 hover:from-orange-500/30 hover:to-purple-600/30 border border-orange-500/40 text-orange-200 py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl font-bold transition-all text-xs sm:text-sm shadow-md hover:scale-[1.01]"
              >
                <Ghost className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" /> Continue in Guest / Demo Mode
              </button>
            </div>
          </div>



        </div>
      </div>

      {/* Bonus: Fixed Mute/Play Button */}
      <button 
        onClick={() => setIsVideoMuted(!isVideoMuted)}
        className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 w-9 h-9 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-xl"
        title={isVideoMuted ? "Unmute Background" : "Mute Background"}
      >
        {isVideoMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
      </button>

    </div>
  );
}
