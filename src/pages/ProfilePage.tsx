import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Camera, Loader2, Share2, Copy, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadProfilePhoto, cropAndResizeImage } from '../lib/cloudinary';
import { updateUserPhoto, fetchTeams, getPredictionData } from '../lib/services';
import { useUserStore } from '../store/useUserStore';
import { ShareBracket, type ShareBracketRef } from '../components/ShareBracket';
import { AnimatedTransition } from '../components/AnimatedTransition';
import type { UserData } from '../types';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { entryId } = useUserStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareRef = useRef<ShareBracketRef>(null);



  useEffect(() => {
    if (!entryId) {
      navigate('/');
      return;
    }

    const loadStaticData = async () => {
      try {
        await Promise.all([
          fetchTeams(),
          getPredictionData(entryId)
        ]);
      } catch (err) {
        console.error("Failed to load profile static data", err);
      }
    };
    
    loadStaticData();

    // Real-time listener for user data
    const unsubscribe = onSnapshot(doc(db, 'users', entryId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        setUserData(data);
        setCurrentPhoto(data.photoURL || null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [entryId, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const processAndUploadFile = async (file: File) => {
    setError(null);
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
      
      if (entryId) {
        await updateUserPhoto(entryId, secureUrl);
      }
      
      setCurrentPhoto(secureUrl);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!entryId) return;
    setIsUploading(true);
    try {
      await updateUserPhoto(entryId, '');
      setCurrentPhoto(null);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setError('Failed to remove photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyCode = () => {
    if (userData) {
      navigator.clipboard.writeText(userData.recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (shareRef.current) {
      setIsSharing(true);
      try {
        await shareRef.current.generateAndShare();
      } catch (err) {
        console.error("Profile handleShare caught error:", err);
      } finally {
        setIsSharing(false);
      }
    }
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-primary"></div>
      </div>
    );
  }

  // Get Avatar initials
  const initials = userData.name.charAt(0).toUpperCase();

  return (
    <AnimatedTransition className="min-h-screen bg-bg-primary text-text-primary p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 mt-12 md:mt-4">
        
        {/* Profile Header & Edit */}
        <div className="glass-card p-6 md:p-10 border-[rgba(0,217,255,0.18)] flex flex-col items-center">
          <div className="relative group mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-bg-secondary bg-bg-tertiary flex items-center justify-center relative">
              {currentPhoto ? (
                <img 
                  src={currentPhoto} 
                  alt={userData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl font-display font-bold text-cyan-primary/50">{initials}</span>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-primary animate-spin" />
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 p-3 bg-cyan-primary text-navy-900 rounded-full hover:bg-white transition-all shadow-[0_0_15px_rgba(0,217,255,0.3)] disabled:opacity-50 group-hover:scale-110"
              title="Change photo"
            >
              <Camera size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
            />
          </div>

          <h1 className="text-3xl font-display font-bold text-white mb-2">{userData.name}</h1>
          <p className="text-text-secondary">Entry ID: {userData.entryId}</p>

          {currentPhoto && (
            <button
              onClick={handleRemovePhoto}
              disabled={isUploading}
              className="mt-4 flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors bg-red-500/10 px-4 py-2 rounded-lg"
            >
              <Trash2 size={16} />
              Remove Photo
            </button>
          )}

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-sm mt-4 text-center">
                {error}
              </motion.p>
            )}
            {uploadSuccess && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-green-500 text-sm mt-4 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> Photo updated successfully
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recovery Code Card */}
          <div className="glass-card p-6 border-[rgba(0,217,255,0.18)] flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-white mb-2">Recovery Code</h3>
            <p className="text-sm text-text-secondary mb-4">
              Save this code to recover your account if you clear your browser data.
            </p>
            <div className="bg-bg-tertiary p-4 rounded-xl flex items-center justify-between gap-4 w-full border border-white/5">
              <code className="text-cyan-primary font-mono text-lg font-bold tracking-widest truncate">
                {userData.recoveryCode}
              </code>
              <button
                onClick={handleCopyCode}
                className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10'}`}
                title="Copy code"
              >
                {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          {/* Share Actions Card */}
          <div className="glass-card p-6 border-[rgba(0,217,255,0.18)] flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-white mb-2">Share Predictions</h3>
            <p className="text-sm text-text-secondary mb-4">
              Generate an image of your predictions to share with friends!
            </p>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-cyan-primary text-navy-900 rounded-xl font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,217,255,0.2)] hover:shadow-[0_0_30px_rgba(0,217,255,0.4)] hover:scale-[1.02]"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Image...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  <span>Share Predictions</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
      
      {/* Hidden ShareBracket component for image generation */}
      <div className="absolute top-0 left-[-9999px] opacity-0 pointer-events-none">
        <ShareBracket ref={shareRef} />
      </div>
    </AnimatedTransition>
  );
}
