import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadProfilePhoto, cropAndResizeImage } from '../lib/cloudinary';
import { updateUserPhoto } from '../lib/services';
import type { UserData, Team } from '../types';

interface ProfileModalProps {
  user: UserData;
  predictionsCount: number;
  totalMatches: number;
  championTeam: Team | null;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  user, 
  predictionsCount, 
  totalMatches, 
  championTeam, 
  onClose 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for immediate UI update before Firestore syncs back (though Dashboard listens real-time)
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(user.photoURL || null);

  useEffect(() => {
    setCurrentPhoto(user.photoURL || null);
  }, [user.photoURL]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[DEBUG] File picker onChange fired');
    const file = e.target.files?.[0];
    if (file) {
      console.log('[DEBUG] Selected file:', file.name, file.type, file.size);
      processAndUploadFile(file);
    } else {
      console.log('[DEBUG] No file selected');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const processAndUploadFile = async (file: File) => {
    console.log('[DEBUG] Starting processAndUploadFile for:', file.name);
    setError(null);
    setUploadSuccess(false);

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('[DEBUG] File size rejected:', file.size);
      setError('File is too large. Maximum size is 5MB.');
      return;
    }
    
    // Validate format
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      console.log('[DEBUG] File format rejected:', file.type);
      setError('Unsupported format. Please use JPG, PNG, or WebP.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Process image client-side (Crop 1:1, resize 300x300, 85% JPEG)
      console.log('[DEBUG] Starting image crop and resize...');
      const processedBlob = await cropAndResizeImage(file);
      console.log('[DEBUG] Image cropped successfully. Blob size:', processedBlob.size);
      const processedFile = new File([processedBlob], 'profile.jpg', { type: 'image/jpeg' });

      // 2. Upload to Cloudinary
      console.log('[DEBUG] Starting Cloudinary upload...');
      const secureUrl = await uploadProfilePhoto(processedFile);
      console.log('[DEBUG] Cloudinary upload successful. URL:', secureUrl);

      // 3. Update Firestore
      console.log('[DEBUG] Updating Firestore user document...');
      await updateUserPhoto(user.entryId, secureUrl);
      console.log('[DEBUG] Firestore update successful.');
      
      setCurrentPhoto(secureUrl);
      setUploadSuccess(true);
      
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      console.error('[DEBUG] Upload process failed:', err);
      setError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentPhoto) return;
    try {
      await updateUserPhoto(user.entryId, null);
      setCurrentPhoto(null);
    } catch (err) {
      setError('Failed to remove photo.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-bg-primary border border-cyan-primary/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-10"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-primary/5 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between p-6 border-b border-[rgba(0,217,255,0.18)] bg-bg-primary/95 sticky top-0 z-20">
          <h2 className="text-2xl font-bold font-display text-cyan-primary">User Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Avatar Section */}
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            
            <div 
              className="relative group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <motion.div 
                onClick={() => {
                  console.log("Upload Photo clicked (Avatar)");
                  console.log("fileInputRef:", fileInputRef.current);
                  fileInputRef.current?.click();
                }}
                animate={uploadSuccess ? { scale: [0.8, 1.08, 1] } : { scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`w-40 h-40 rounded-full border-4 border-cyan-primary/50 bg-bg-secondary flex flex-col items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(0,217,255,0.2)] relative cursor-pointer ${isUploading ? 'pointer-events-none' : ''}`}
              >
                {isUploading ? (
                  <div className="absolute inset-0 bg-bg-primary/80 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                    <Loader2 size={32} className="text-cyan-primary animate-spin mb-2" />
                  </div>
                ) : null}

                {currentPhoto ? (
                  <img src={currentPhoto} alt="Profile" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-5xl font-bold text-cyan-primary">
                    {user.avatar || user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                
                {/* Overlay for drop/hover */}
                {!isUploading && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Camera size={32} className="text-white" />
                  </div>
                )}
              </motion.div>

              <div className="mt-4 flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileSelect} 
                />
                <button 
                  onClick={() => {
                    console.log("Upload Photo clicked (Button)");
                    console.log("fileInputRef:", fileInputRef.current);
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-primary/10 hover:bg-cyan-primary/20 text-cyan-primary border border-cyan-primary/30 px-4 py-2 rounded-lg transition-colors text-sm font-bold cursor-pointer"
                >
                  <Upload size={16} /> Change Photo
                </button>
                {currentPhoto && (
                  <button 
                    onClick={handleRemovePhoto}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg transition-colors text-sm font-bold"
                  >
                    <Trash2 size={16} /> Remove Photo
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 text-center md:text-left w-full">
              <div>
                <h3 className="text-3xl font-bold font-display text-white">{user.name}</h3>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                  <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-text-secondary font-mono">
                    Code: {user.recoveryCode}
                  </span>
                  <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-text-secondary">
                    Joined: {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}
              
              <AnimatePresence>
                {uploadSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Profile Updated Successfully
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[rgba(0,217,255,0.18)]">
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)]">
              <span className="text-3xl font-bold font-mono text-cyan-primary drop-shadow-[0_0_10px_rgba(0,217,255,0.5)]">{user.rank ? `#${user.rank}` : '—'}</span>
              <span className="text-xs text-text-secondary uppercase font-bold tracking-widest">Global Rank</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)]">
              <span className="text-3xl font-bold font-mono text-white">{user.score}</span>
              <span className="text-xs text-text-secondary uppercase font-bold tracking-widest">Total Score</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)]">
              <span className="text-3xl font-bold font-mono text-white">{user.accuracy}%</span>
              <span className="text-xs text-text-secondary uppercase font-bold tracking-widest">Accuracy</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)]">
              <span className="text-3xl font-bold font-mono text-white">{predictionsCount}/{totalMatches}</span>
              <span className="text-xs text-text-secondary uppercase font-bold tracking-widest">Predicted</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)]">
              <span className="text-3xl font-bold font-mono text-status-success">{user.correctPicks}</span>
              <span className="text-xs text-text-secondary uppercase font-bold tracking-widest">Correct</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.18)]">
              <span className="text-3xl font-bold font-mono text-status-danger">{user.wrongPicks}</span>
              <span className="text-xs text-text-secondary uppercase font-bold tracking-widest">Wrong</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 border-[rgba(0,217,255,0.3)] md:col-span-2 shadow-[0_0_15px_rgba(0,217,255,0.05)]">
              {championTeam ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={championTeam.flagUrl} alt={championTeam.name} className="h-6 object-cover rounded border border-[rgba(0,217,255,0.3)] shadow-sm" />
                  <span className="text-xl font-bold font-display tracking-wide text-cyan-primary">
                    {championTeam.name}
                  </span>
                </div>
              ) : (
                <span className="text-xl font-bold font-display text-text-muted tracking-wide">
                  Not Selected
                </span>
              )}
              <span className="text-xs text-text-secondary uppercase font-bold tracking-widest mt-1">Champion</span>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
