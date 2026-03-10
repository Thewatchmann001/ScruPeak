import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, RotateCcw } from 'lucide-react';

const KycPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  // ... (rest of state)

  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete

    if (!isAuthenticated) {
      navigate('/auth/login?redirect=/kyc', { replace: true });
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await api.get('/kyc/status');
        if (response.data) {
          setKycStatus(response.data.status);
        }
      } catch (err) {
        console.log('No existing KYC submission or error fetching status');
      }
    };

    checkStatus();
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500"></div>
          <p className="text-gray-600 font-medium animate-pulse">Checking verification status...</p>
        </div>
      </div>
    );
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Explicitly play() to ensure video starts
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Play error:", e));
        };
        setIsCameraActive(true);
        setLivenessStep(1);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please allow camera permissions in your browser.");
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
          
          // Advance step
          if (step === 'straight') setLivenessStep(2);
          else if (step === 'left') setLivenessStep(3);
          else if (step === 'right') {
            setLivenessStep(0); // Done
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!files.id_document || !files.proof_of_address) {
      setError('Please upload ID and Proof of Address documents.');
      return;
    }

    if (!capturedImages.straight || !capturedImages.left || !capturedImages.right) {
      setError('Please complete the live face verification steps.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('id_document', files.id_document);
    formData.append('proof_of_address', files.proof_of_address);
    formData.append('photo_straight', capturedImages.straight, 'straight.jpg');
    formData.append('photo_left', capturedImages.left, 'left.jpg');
    formData.append('photo_right', capturedImages.right, 'right.jpg');

    try {
      await api.post('/kyc/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('KYC documents submitted successfully! Your application is now under review.');
      setKycStatus('PENDING');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit KYC documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (kycStatus === 'APPROVED' || user?.kyc_verified) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-green-600">KYC Verified</CardTitle>
            <CardDescription>
              Congratulations! Your identity has been verified. You now have access to seller features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button onClick={() => navigate('/sell')} className="bg-primary text-white">
                Go to Seller Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kycStatus === 'PENDING') {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-blue-600">Verification Pending</CardTitle>
            <CardDescription>
              Your documents have been received and are currently under review by our admin team.
              This process usually takes 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Alert title="Under Review" className="bg-blue-50 border-blue-200">
               You will be notified once your verification status changes.
             </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Become a Verified Seller</CardTitle>
          <CardDescription>
            To list lands on ScruPeak, we need to verify your identity. Please upload the required documents below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" title="Error" className="mb-6">
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" title="Success" className="mb-6">
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <CheckCircle2 className="h-4 w-4" />
                <div className="ml-2">
                    <p className="font-semibold text-sm">Regulatory Compliance Check</p>
                    <p className="text-xs">
                        By submitting this form, you consent to an automated Anti-Money Laundering (AML) 
                        and PEP (Politically Exposed Person) screening against international watchlists.
                    </p>
                </div>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">1. Identity Document</h3>
              <p className="text-sm text-gray-500">Upload a clear copy of your National ID, Passport, or Driver's License.</p>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input 
                  id="id_document" 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'id_document')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">2. Proof of Address</h3>
              <p className="text-sm text-gray-500">Upload a recent utility bill or bank statement (not older than 3 months).</p>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input 
                  id="proof_of_address" 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'proof_of_address')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">3. Liveness Check (Active Verification)</h3>
              <p className="text-sm text-gray-500">
                Follow the instructions to verify you are a real person. We will capture 3 photos.
              </p>

              <div className="border rounded-xl p-6 bg-gray-50 flex flex-col items-center gap-4">
                {isCameraActive ? (
                   <div className="relative w-full max-w-sm aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                     <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                     
                     {/* Overlay Instructions */}
                     <div className="absolute inset-x-0 bottom-4 text-center">
                       <span className="inline-block px-4 py-2 bg-black/60 text-white rounded-full text-sm font-bold backdrop-blur-sm">
                         {livenessStep === 1 && "Look Straight Ahead"}
                         {livenessStep === 2 && "Turn Head Right"}
                         {livenessStep === 3 && "Turn Head Left"}
                       </span>
                     </div>
                   </div>
                ) : (
                   <div className="w-full max-w-sm aspect-video bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                     {capturedImages.straight && capturedImages.left && capturedImages.right ? (
                       <div className="text-center text-green-600">
                         <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                         <span className="font-medium">Verification Complete</span>
                       </div>
                     ) : (
                       <div className="text-center text-gray-500">
                         <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                         <span>Camera Inactive</span>
                       </div>
                     )}
                   </div>
                )}

                <div className="flex gap-4">
                  {!isCameraActive && (
                    <Button 
                      type="button" 
                      onClick={startCamera} 
                      variant={capturedImages.straight ? "outline" : "default"}
                    >
                      {capturedImages.straight ? "Retake Verification" : "Start Verification"}
                    </Button>
                  )}

                  {isCameraActive && (
                    <Button 
                      type="button" 
                      onClick={() => {
                        if (livenessStep === 1) captureFrame('straight');
                        else if (livenessStep === 2) captureFrame('left'); // User turned right, looking left from camera pov? Or user physically turns right?
                        // "Turn Head Right" -> Capture left profile? Let's stick to prompt names.
                        // Prompt: Turn Right -> Capture 'left' (relative to camera) or 'right' profile?
                        // Let's map simple: Step 2 (Right) -> capture 'left' file?
                        // Actually let's just match the state logic:
                        // Step 2 = "Turn Head Right" -> Save as 'left' (since showing left cheek)?
                        // Let's keep it simple: Step 2 captures 'left' image slot.
                        else if (livenessStep === 3) captureFrame('right');
                      }} 
                      className="bg-primary hover:bg-primary/90 min-w-[120px]"
                    >
                      Capture Frame
                    </Button>
                  )}
                </div>
                
                {/* Progress Indicators */}
                <div className="flex gap-2 mt-2">
                  <div className={`w-3 h-3 rounded-full ${capturedImages.straight ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className={`w-3 h-3 rounded-full ${capturedImages.left ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className={`w-3 h-3 rounded-full ${capturedImages.right ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Verification Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default KycPage;
