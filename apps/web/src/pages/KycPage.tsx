import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, ShieldCheck, Upload, User, ArrowRight, ArrowLeft, Loader2, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KycPage = () => {
  const { user, isAuthenticated, loading: authLoading, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  // Files state
  const [files, setFiles] = useState({
    id_document: null as File | null,
    proof_of_address: null as File | null,
  });

  // Camera / Liveness state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [livenessStep, setLivenessStep] = useState(0); // 0: initial, 1: straight, 2: left, 3: right
  const [capturedImages, setCapturedImages] = useState({
    straight: null as Blob | null,
    left: null as Blob | null,
    right: null as Blob | null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/auth/login?redirect=/kyc', { replace: true });
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await api.get('/kyc/status');
        if (response.data) {
          setKycStatus(response.data.status);
          if (response.data.status === 'APPROVED') {
             await checkAuth(); // Sync local user state
          }
        }
      } catch (err) {
        console.log('No existing KYC submission');
      }
    };

    checkStatus();
  }, [isAuthenticated, authLoading, navigate]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Play error:", e));
        };
        setIsCameraActive(true);
        setLivenessStep(1);
      }
    } catch (err) {
      setError("Unable to access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const captureFrame = (step: 'straight' | 'left' | 'right') => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          setCapturedImages(prev => ({ ...prev, [step]: blob }));
          if (step === 'straight') setLivenessStep(2);
          else if (step === 'left') setLivenessStep(3);
          else if (step === 'right') {
            setLivenessStep(0);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const formData = new FormData();
    if (files.id_document) formData.append('id_document', files.id_document);
    if (files.proof_of_address) formData.append('proof_of_address', files.proof_of_address);
    if (capturedImages.straight) formData.append('photo_straight', capturedImages.straight, 'straight.jpg');
    if (capturedImages.left) formData.append('photo_left', capturedImages.left, 'left.jpg');
    if (capturedImages.right) formData.append('photo_right', capturedImages.right, 'right.jpg');

    try {
      await api.post('/kyc/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('KYC submitted! Under review.');
      setKycStatus('PENDING');
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white"><Loader2 className="animate-spin h-8 w-8 text-orange-500" /></div>;

  if (kycStatus === 'APPROVED' || user?.kyc_verified) {
    return (
      <div className="container mx-auto py-20 px-4 max-w-2xl text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1e293b] p-12 rounded-3xl border border-orange-500/20 shadow-2xl">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Identity Verified</h1>
          <p className="text-slate-400 mb-8 text-lg">Your account is fully verified. You can now access all seller features and list your land parcels.</p>
          <Button onClick={() => navigate('/sell')} size="lg" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-12 h-14 font-bold text-lg shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02]">
            Enter Seller Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-12">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
            currentStep === s ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20' :
            currentStep > s ? 'bg-green-500 border-green-500 text-white' : 'border-slate-700 text-slate-500'
          }`}>
            {currentStep > s ? <CheckCircle2 className="h-5 w-5" /> : s}
          </div>
          {s < 3 && <div className={`w-12 h-0.5 rounded-full ${currentStep > s ? 'bg-green-500' : 'bg-slate-700'}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold uppercase tracking-wider border border-orange-500/20 mb-4">
              <ShieldCheck className="h-3 w-3" /> Secure Verification
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Become a Verified Seller</h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">To maintain a secure marketplace, we require all land owners and agents to verify their identity via a secure liveness check.</p>
          </motion.div>
        </header>

        {kycStatus === 'PENDING' ? (
           <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1e293b] p-12 rounded-3xl border border-blue-500/20 shadow-2xl text-center">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Under Review</h2>
              <p className="text-slate-400 mb-8">We have received your documents. Our compliance team is currently reviewing your application. This typically takes 24-48 hours.</p>
              <Alert className="bg-blue-500/5 border-blue-500/20 text-blue-400 inline-block py-2">
                We will notify you via email once approved.
              </Alert>
           </motion.div>
        ) : (
          <div className="bg-[#1e293b]/50 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-sm">
            <StepIndicator />

            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-white">Upload Documents</h2>
                      <p className="text-slate-400">Please provide high-quality scans or photos of your government-issued ID and a recent proof of address.</p>

                      <div className="space-y-4">
                         <div className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${files.id_document ? 'border-green-500 bg-green-500/5' : 'border-slate-700 bg-slate-800/50 hover:border-orange-500/50'}`}>
                           <label className="flex items-center gap-4 cursor-pointer">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${files.id_document ? 'bg-green-500/20 text-green-500' : 'bg-slate-700 text-slate-400'}`}>
                               <User className="h-6 w-6" />
                             </div>
                             <div className="flex-1">
                               <p className="font-bold text-white">Identity Document</p>
                               <p className="text-xs text-slate-500">{files.id_document ? files.id_document.name : 'Passport, ID, or License (PDF/JPG)'}</p>
                             </div>
                             <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'id_document')} />
                             <Upload className="h-5 w-5 text-slate-600" />
                           </label>
                         </div>

                         <div className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${files.proof_of_address ? 'border-green-500 bg-green-500/5' : 'border-slate-700 bg-slate-800/50 hover:border-orange-500/50'}`}>
                           <label className="flex items-center gap-4 cursor-pointer">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${files.proof_of_address ? 'bg-green-500/20 text-green-500' : 'bg-slate-700 text-slate-400'}`}>
                               <Landmark className="h-6 w-6" />
                             </div>
                             <div className="flex-1">
                               <p className="font-bold text-white">Proof of Address</p>
                               <p className="text-xs text-slate-500">{files.proof_of_address ? files.proof_of_address.name : 'Utility bill or bank statement'}</p>
                             </div>
                             <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'proof_of_address')} />
                             <Upload className="h-5 w-5 text-slate-600" />
                           </label>
                         </div>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center justify-center bg-slate-800/30 rounded-3xl border border-slate-700/50">
                       <div className="p-8 text-center">
                          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="h-8 w-8 text-orange-500" />
                          </div>
                          <p className="text-sm text-slate-400 font-medium">Your data is encrypted and stored securely in compliance with national privacy laws.</p>
                       </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-8 border-t border-slate-800">
                    <Button onClick={() => setCurrentStep(2)} disabled={!files.id_document || !files.proof_of_address} className="h-14 px-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold group">
                      Next Step <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                  <div className="text-center max-w-xl mx-auto mb-10">
                    <h2 className="text-3xl font-bold text-white mb-4">Liveness Check</h2>
                    <p className="text-slate-400">Follow the instructions to verify you are a real person. This step is critical for fraud prevention.</p>
                  </div>

                  <div className="flex flex-col items-center gap-8">
                    <div className="relative">
                      {/* Camera Frame */}
                      <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-dashed border-orange-500/30 p-2 flex items-center justify-center overflow-hidden bg-slate-900 shadow-2xl shadow-orange-500/10">
                         {isCameraActive ? (
                           <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-full scale-x-[-1]" />
                         ) : (
                           <div className="text-center p-8">
                             {capturedImages.straight && capturedImages.left && capturedImages.right ? (
                               <div className="text-green-500 animate-in zoom-in duration-500">
                                 <CheckCircle2 className="w-20 h-20 mx-auto mb-4" />
                                 <span className="font-bold text-lg">Check Complete</span>
                               </div>
                             ) : (
                               <div className="text-slate-600">
                                 <Camera className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                 <span className="text-sm font-medium uppercase tracking-widest">Camera Inactive</span>
                               </div>
                             )}
                           </div>
                         )}

                         {/* Scan Animation Overlay */}
                         {isCameraActive && (
                           <div className="absolute inset-0 border-4 border-orange-500 rounded-full animate-pulse opacity-20" />
                         )}
                      </div>

                      {/* Direction Overlay */}
                      {isCameraActive && (
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-orange-600 text-white px-6 py-2 rounded-full font-bold shadow-xl animate-bounce">
                           {livenessStep === 1 && "Look Straight Ahead"}
                           {livenessStep === 2 && "Turn Head Left"}
                           {livenessStep === 3 && "Turn Head Right"}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                       {!isCameraActive ? (
                         <Button onClick={startCamera} className="h-14 px-10 rounded-xl bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 font-bold transition-all">
                           {capturedImages.straight ? "Restart Check" : "Start Liveness Check"}
                         </Button>
                       ) : (
                         <Button
                            onClick={() => {
                              if (livenessStep === 1) captureFrame('straight');
                              else if (livenessStep === 2) captureFrame('left');
                              else if (livenessStep === 3) captureFrame('right');
                            }}
                            className="h-14 px-14 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-600/20"
                          >
                           Capture
                         </Button>
                       )}
                    </div>

                    {/* Progress Dots */}
                    <div className="flex gap-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`h-2 rounded-full transition-all duration-500 ${
                          (i === 1 && capturedImages.straight) || (i === 2 && capturedImages.left) || (i === 3 && capturedImages.right)
                          ? 'w-8 bg-green-500' : 'w-2 bg-slate-700'
                        }`} />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-8 border-t border-slate-800">
                    <Button variant="ghost" onClick={() => setCurrentStep(1)} className="text-slate-400 hover:text-white">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Documents
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(3)}
                      disabled={!capturedImages.straight || !capturedImages.left || !capturedImages.right}
                      className="h-14 px-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold group"
                    >
                      Continue <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-8">
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-white">Final Review</h2>
                    <p className="text-slate-400">Please review your submission details before sending them for verification.</p>
                  </div>

                  <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 grid md:grid-cols-2 gap-6">
                     <div className="space-y-4 text-sm">
                        <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Documents</h4>
                        <div className="flex items-center justify-between text-white py-2 border-b border-slate-700/50">
                           <span>ID Document</span>
                           <span className="text-green-500 flex items-center gap-1 font-bold"><CheckCircle2 className="h-4 w-4" /> {files.id_document?.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-white py-2 border-b border-slate-700/50">
                           <span>Proof of Address</span>
                           <span className="text-green-500 flex items-center gap-1 font-bold"><CheckCircle2 className="h-4 w-4" /> {files.proof_of_address?.name}</span>
                        </div>
                     </div>
                     <div className="space-y-4 text-sm">
                        <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Biometric Data</h4>
                        <div className="flex items-center justify-between text-white py-2 border-b border-slate-700/50">
                           <span>3D Face Profiles</span>
                           <span className="text-green-500 font-bold">Captured & Encrypted</span>
                        </div>
                        <div className="flex items-center justify-between text-white py-2 border-b border-slate-700/50">
                           <span>Liveness Status</span>
                           <span className="text-green-500 font-bold">Verified Locally</span>
                        </div>
                     </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-xl">
                      {error}
                    </Alert>
                  )}

                  <div className="flex justify-between pt-8 border-t border-slate-800">
                    <Button variant="ghost" onClick={() => setCurrentStep(2)} className="text-slate-400 hover:text-white">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Camera
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="h-14 px-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold shadow-xl shadow-orange-600/20 flex items-center gap-2">
                      {loading ? (
                        <><Loader2 className="animate-spin h-5 w-5" /> Processing...</>
                      ) : (
                        <>Submit Verification Request <CheckCircle2 className="h-5 w-5 ml-1" /></>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default KycPage;
