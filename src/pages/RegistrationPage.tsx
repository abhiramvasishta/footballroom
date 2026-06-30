import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { uploadProfilePhoto, cropAndResizeImage } from '../lib/cloudinary';
import { AnimatedTransition } from '../components/AnimatedTransition';
import { useUserStore } from '../store/useUserStore';
import { saveUserToFirebase } from '../lib/services';

export default function RegistrationPage() {
  const navigate = useNavigate();
  const { setRegistration } = useUserStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    import('../lib/services').then(({ fetchSettings }) => {
      fetchSettings().then(setSettings);
    });
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploadSuccess(false);

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setError('Unsupported format. Please use JPG, PNG, or WebP.');
      return;
    }

    setIsUploading(true);
    try {
      const processedBlob = await cropAndResizeImage(file);
      const processedFile = new File([processedBlob], 'profile.jpg', { type: 'image/jpeg' });
      const secureUrl = await uploadProfilePhoto(processedFile);
      setUploadedPhotoUrl(secureUrl);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const generateAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=121e42&color=d4af37&size=200&bold=true`;
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setLoading(true);
    
    // Use the explicitly uploaded photo or fallback to generated avatar
    const finalAvatarUrl = uploadedPhotoUrl || generateAvatar(name);
    const entryId = uuidv4();
    const recoveryCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const userDataToSave = {
      entryId,
      name,
      avatar: generateAvatar(name), // Fallback initial
      photoURL: uploadedPhotoUrl || null, // Store the Cloudinary image
      recoveryCode,
      score: 0,
      accuracy: 0,
      correctPicks: 0,
      wrongPicks: 0,
      maxPossible: 120,
      status: 'Still Alive',
      rank: 0,
      submittedAt: null
    };

    console.log("Starting registration");
    console.log("User data to save:", userDataToSave);

    try {
      await saveUserToFirebase(userDataToSave);
      
      console.log("Firestore save successful.");
      
      // Update state only after successful save to avoid premature redirect and unmount
      setRegistration(name, finalAvatarUrl, entryId, recoveryCode);
      console.log("User store updated. Navigating to /predict");
      navigate('/predict');
    } catch (err: any) {
      console.error("Registration failed during saveUserToFirebase:", err);
      if (err?.code) console.error("Firebase Error Code:", err.code);
      if (err?.message) console.error("Firebase Error Message:", err.message);
      
      setError(`Error: ${err?.message || 'Failed to connect to server.'}`);
      setLoading(false);
    }
  };

  if (settings && !settings.registrationOpen) {
    return (
      <AnimatedTransition className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-primary">
        <div className="z-10 w-full max-w-md text-center glass-card p-8">
          <h1 className="text-3xl font-bold mb-4 text-red-400">Registration Closed</h1>
          <p className="text-text-secondary mb-8">Registrations are currently closed. New entries are no longer being accepted.</p>
          <button onClick={() => navigate('/')} className="text-cyan-primary hover:underline">Return to Home</button>
        </div>
      </AnimatedTransition>
    );
  }

  return (
    <AnimatedTransition className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-cyan-primary/10 rounded-full blur-[100px]" />
      
      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Your Profile</h1>
          <p className="text-text-secondary">Join the contest and start predicting.</p>
        </div>

        <form onSubmit={handleContinue} className="glass-card p-8 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="relative w-28 h-28 rounded-full bg-bg-primary border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-text-secondary cursor-pointer hover:border-cyan-primary hover:text-cyan-primary transition-colors overflow-hidden group"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="absolute inset-0 bg-bg-primary/80 flex flex-col items-center justify-center z-10">
                  <Loader2 size={24} className="text-cyan-primary animate-spin" />
                </div>
              ) : uploadedPhotoUrl ? (
                <>
                  <img src={uploadedPhotoUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </>
              ) : (
                <>
                  <Camera size={24} />
                  <span className="text-xs mt-1">Upload Photo</span>
                </>
              )}
            </div>
            {uploadSuccess && (
              <span className="text-green-400 text-xs flex items-center gap-1">
                <CheckCircle2 size={12} /> Uploaded
              </span>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileSelect} 
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Display Name</label>
            <input 
              type="text" 
              value={name}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Nee peru type chey mowaa 😎" 
              className="w-full bg-bg-primary border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-[rgba(255,255,255,0.45)] placeholder:transition-opacity focus:placeholder-opacity-0 focus:outline-none focus:border-cyan-primary focus:shadow-[0_0_10px_rgba(0,217,255,0.3)] transition-all"
            />
            {isFocused && name.length === 0 && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-cyan-primary/80 text-xs mt-2 italic font-medium"
              >
                Mowa, correct name pettu... Leaderboard lo adhe kanipisthadhi 👀
              </motion.p>
            )}
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <button 
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-gradient-to-r from-cyan-primary to-cyan-secondary hover:from-cyan-primary hover:to-cyan-secondary text-navy-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating...' : (
              <>
                <span>Continue</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </AnimatedTransition>
  );
}
