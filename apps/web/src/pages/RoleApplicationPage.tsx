import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  Briefcase,
  FileText,
  CheckCircle2,
  ChevronRight,
  Building2,
  CreditCard,
  User,
  Lock,
  ArrowLeft,
  Upload,
  Camera,
  Users,
  Search,
  Check
} from 'lucide-react';

type ViewType = 'selection' | 'agent_form' | 'seller_confirmation';

const RoleApplicationPage = () => {
  const { user, isAuthenticated, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('selection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Agent Form State
  const [agentForm, setAgentForm] = useState({
    // Section 1: Personal Identification
    full_legal_name: user?.name || '',
    nin: '',
    dob: '',
    gender: '',
    whatsapp_number: '',
    secondary_phone: '',
    residential_address: '',
    professional_photo: null as File | null,

    // Section 2: Professional Credentials
    real_estate_license_number: '',
    ministry_registration_number: '',
    years_experience: '',
    primary_region: '',
    secondary_regions: '',
    market_focus: '',
    license_file: null as File | null,

    // Section 3: Portfolio & Experience
    transactions_last_12_months: '0',
    reference1_name: '',
    reference1_contact: '',
    reference2_name: '',
    reference2_contact: '',

    // Section 4: Office Information
    is_independent: true,
    agency_name: '',
    agency_office_address: '',
    office_phone: '',
    business_email: '',

    // Section 5: Security & Compliance
    has_surveyor_access: false,
    has_disputed_history: false,
    can_verify_authenticity: false,
    background_check_auth: false,

    // Section 6: Banking & Payout Details
    bank_name: '',
    account_number: '',
    account_name: '',
    bank_branch_name: '',
    swift_code: '',

    // Section 7: KYC Requirements (Integrated)
    id_document: null as File | null,
    proof_of_address: null as File | null,
    photo_straight: null as Blob | null,
    photo_left: null as Blob | null,
    photo_right: null as Blob | null,

    // Section 8: Digital Signature & Agreement
    certify_accuracy: false,
    digital_signature: '',
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const idDocInputRef = useRef<HTMLInputElement>(null);
  const poaInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [livenessStep, setLivenessStep] = useState(0);
  const [cameraBlocked, setCameraBlocked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
        if (user?.role === 'agent' || user?.has_pending_agent_application) {
            setView('agent_form');
        }
    }
  }, [isAuthenticated, user]);

  const getCameraStream = async (): Promise<MediaStream> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera API unavailable');
    }

    const attempts: MediaStreamConstraints[] = [
      { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } },
      { video: { facingMode: 'user' } },
      { video: true }
    ];

    for (const constraints of attempts) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Try next fallback constraint.
      }
    }

    throw new Error('Unable to initialize camera stream');
  };

  const startCamera = async () => {
    try {
      setError(null);
      setCameraBlocked(false);
      const stream = await getCameraStream();
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready to play
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element not found'));
            return;
          }

          const handleCanPlay = () => {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            resolve();
          };

          const handleError = (e: Event) => {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            reject(new Error('Video failed to load'));
          };

          if (video.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
            resolve();
          } else {
            video.addEventListener('canplay', handleCanPlay);
            video.addEventListener('error', handleError);
            
            // Fallback timeout
            setTimeout(() => {
              video.removeEventListener('canplay', handleCanPlay);
              video.removeEventListener('error', handleError);
              resolve(); // Proceed anyway
            }, 3000);
          }
        });
        
        await videoRef.current.play();
        setIsCameraActive(true);
        setLivenessStep(1);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraBlocked(true);
      setError("Camera could not start. Allow camera permission in your browser, then tap Start Liveness Check again.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureFrame = (step: 'photo_straight' | 'photo_left' | 'photo_right') => {
    if (!videoRef.current || !isCameraActive) {
      setError("Camera is not active. Please start the camera first.");
      return;
    }

    const video = videoRef.current;
    
    // Check if video is ready
    if (video.readyState < 2) { // HAVE_CURRENT_DATA
      setError("Video stream not ready. Please wait a moment and try again.");
      return;
    }

    // Ensure we have valid dimensions
    const width = video.videoWidth || video.offsetWidth || 640;
    const height = video.videoHeight || video.offsetHeight || 480;

    if (width <= 0 || height <= 0) {
      setError("Unable to capture image. Video dimensions not available.");
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setError("Unable to create canvas context for image capture.");
        return;
      }

      // Mirror the image back to normal (since video is mirrored in CSS)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setAgentForm(prev => ({ ...prev, [step]: blob }));
          if (step === 'photo_straight') setLivenessStep(2);
          else if (step === 'photo_left') setLivenessStep(3);
          else if (step === 'photo_right') {
            setLivenessStep(0);
            stopCamera();
          }
        } else {
          setError("Failed to capture image. Please try again.");
        }
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error("Capture error:", err);
      setError("Failed to capture image. Please try again.");
    }
  };

  const handleSellerUpgrade = async () => {
    if (!isAuthenticated) {
        navigate('/auth/login?redirect=/apply-role');
        return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.post('/api/v1/users/upgrade/seller', {});
      setSuccess('Successfully upgraded to Seller (Owner) role! You can now list your land.');
      await checkAuth();
      setTimeout(() => {
        navigate('/sell');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('KYC')) {
        setError('KYC Verification is required to become a seller. Please complete KYC first.');
      } else {
        setError(err.response?.data?.detail || 'Failed to upgrade to seller role.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAgentRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
        navigate('/auth/login?redirect=/apply-role');
        return;
    }
    if (!agentForm.certify_accuracy) {
        setError('You must certify that the information is accurate.');
        return;
    }

    if (!agentForm.id_document || !agentForm.proof_of_address || !agentForm.photo_straight) {
        setError('Please complete the integrated KYC section (ID, Proof of Address, and Liveness Check).');
        return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // For this implementation, we'll use FormData as it contains multiple files and blobs
      const formData = new FormData();

      // Append all fields to FormData
      Object.entries(agentForm).forEach(([key, value]) => {
          if (value instanceof File || value instanceof Blob) {
              formData.append(key, value);
          } else if (typeof value === 'boolean') {
              formData.append(key, value ? 'true' : 'false');
          } else if (value !== null && value !== undefined) {
              formData.append(key, String(value));
          }
      });

      // Special handling for numeric conversions
      formData.set('years_experience', String(parseInt(agentForm.years_experience) || 0));
      formData.set('transactions_last_12_months', String(parseInt(agentForm.transactions_last_12_months) || 0));

      // Backend requires office_address; use agency office when available, fallback to residential address.
      formData.set('office_address', agentForm.agency_office_address || agentForm.residential_address);

      await api.post('/api/v1/agents/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Agent application submitted successfully with integrated KYC! Your application is under review.');
      await checkAuth();
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 409) {
        setError('You have already applied or are already an agent.');
      } else {
        setError(err.response?.data?.detail || 'Failed to submit agent application.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderSelection = () => (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-8">
      {/* Landowner Card */}
      <Card
        className="hover:border-primary transition-all cursor-pointer group flex flex-col border-2 shadow-sm"
        onClick={() => navigate('/kyc')}
      >
        <CardHeader className="text-center pt-8">
          <div className="mx-auto p-4 bg-blue-50 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors w-16 h-16 flex items-center justify-center mb-4">
            <UserCheck size={32} />
          </div>
          <CardTitle className="text-2xl text-slate-900">I am a Landowner</CardTitle>
          <CardDescription className="text-base mt-2">
            I want to list and sell my own personal property.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              Direct listing of your properties
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              Secure payments via ScruPeak Escrow
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              Verified title deed processing
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white border-primary text-primary">
            Continue as Owner <ChevronRight size={16} className="ml-2" />
          </Button>
        </CardFooter>
      </Card>

      {/* Agent Card */}
      <Card
        className="hover:border-primary transition-all cursor-pointer group flex flex-col border-2 shadow-sm"
        onClick={() => setView('agent_form')}
      >
        <CardHeader className="text-center pt-8">
          <div className="mx-auto p-4 bg-blue-50 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors w-16 h-16 flex items-center justify-center mb-4">
            <Briefcase size={32} />
          </div>
          <CardTitle className="text-2xl text-slate-900">I am a Professional Agent</CardTitle>
          <CardDescription className="text-base mt-2">
            I manage multiple properties for clients or an agency.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              Manage professional client portfolios
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              Earn commissions on successful closures
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              Official ScruPeak Partner Badge
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white border-primary text-primary">
            Continue as Agent <ChevronRight size={16} className="ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  const renderSellerConfirmation = () => (
    <div className="max-w-2xl mx-auto mt-8">
        <Button
            variant="ghost"
            className="mb-4 flex items-center gap-2 hover:bg-slate-100"
            onClick={() => setView('selection')}
        >
            <ArrowLeft size={16} /> Back to selection
        </Button>
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="text-2xl">Landowner Registration</CardTitle>
                <CardDescription>Verify your identity to start listing property.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-lg border">
                    <h4 className="font-medium flex items-center gap-2 mb-2 text-slate-900">
                        Status Check:
                        {user?.kyc_verified ? (
                            <Badge className="bg-green-500">KYC Verified</Badge>
                        ) : (
                            <Badge variant="outline" className="text-primary border-slate-200 bg-white">KYC Required</Badge>
                        )}
                    </h4>
                    {!user?.kyc_verified && (
                        <p className="text-sm text-slate-500 mb-4">
                            You need to complete identity verification before you can upgrade to a seller account.
                        </p>
                    )}
                    {user?.role === 'owner' && (
                        <p className="text-sm text-primary font-medium">
                            You are already a registered Seller/Owner.
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 bg-green-100 p-1 rounded-full"><CheckCircle2 size={14} className="text-green-600" /></div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Immediate Access</p>
                            <p className="text-xs text-slate-500">List your land as soon as KYC is verified.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="mt-1 bg-green-100 p-1 rounded-full"><CheckCircle2 size={14} className="text-green-600" /></div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Zero Listing Fees</p>
                            <p className="text-xs text-slate-500">Only pay a platform fee when your land is successfully sold.</p>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                {user?.role === 'owner' ? (
                    <Button onClick={() => navigate('/sell')} className="w-full bg-primary hover:bg-primary/90 py-6 text-lg font-bold">
                        Go to Seller Dashboard
                    </Button>
                ) : !user?.kyc_verified ? (
                    <Button onClick={() => navigate('/kyc')} className="w-full bg-primary hover:bg-primary/90 py-6 text-lg font-bold">
                        Complete KYC Verification
                    </Button>
                ) : (
                    <Button onClick={handleSellerUpgrade} disabled={loading} className="w-full bg-primary hover:bg-primary/90 py-6 text-lg font-bold">
                        {loading ? 'Processing...' : 'Upgrade to Seller Account'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    </div>
  );

  const renderAgentForm = () => {
    if (user?.role === 'agent') {
        return (
            <div className="max-w-2xl mx-auto mt-8 text-center">
                 <div className="p-8 bg-white border-2 rounded-xl shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="text-green-600 w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Verified Agent Status</h3>
                    <p className="text-slate-600 mb-6">You are a registered professional agent in the ScruPeak ecosystem.</p>
                    <Button onClick={() => navigate('/sell')} className="bg-primary hover:bg-primary/90 w-full max-w-xs py-6 text-lg font-bold">
                        Go to Agent Dashboard
                    </Button>
                 </div>
            </div>
        );
    }

    if (user?.has_pending_agent_application) {
        return (
            <div className="max-w-2xl mx-auto mt-8 text-center">
                 <div className="p-8 bg-white border-2 rounded-xl shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <Briefcase className="text-yellow-600 w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Application Under Review</h3>
                    <p className="text-slate-600 mb-6">
                        Your professional agent application is being reviewed. We verify ministry credentials and background checks manually.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-500 mb-6">
                        Estimated review time: 24 - 48 hours.
                    </div>
                    <Button variant="outline" disabled className="w-full max-w-xs py-6">
                        Pending Verification
                    </Button>
                 </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto mt-8">
            <Button
                variant="ghost"
                className="mb-4 flex items-center gap-2 hover:bg-slate-100"
                onClick={() => setView('selection')}
            >
                <ArrowLeft size={16} /> Back to selection
            </Button>

            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Professional Agent Onboarding</h2>
                <p className="text-slate-600 mt-1">Please provide accurate information including mandatory KYC documents.</p>
            </div>

            <form onSubmit={handleAgentRegistration} className="space-y-8 pb-20">
                {/* 1. Personal Identification */}
                <Card className="border-2 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <div className="flex items-center gap-2 text-primary">
                            <User size={20} />
                            <CardTitle className="text-lg">1. Personal Identification</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Full Legal Name</label>
                                <Input
                                    value={agentForm.full_legal_name}
                                    onChange={e => setAgentForm({...agentForm, full_legal_name: e.target.value})}
                                    placeholder="As it appears on your ID"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">NIN (National Identification Number)</label>
                                <Input
                                    value={agentForm.nin}
                                    onChange={e => setAgentForm({...agentForm, nin: e.target.value})}
                                    placeholder="Enter your NIN"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                                <Input
                                    type="date"
                                    value={agentForm.dob}
                                    onChange={e => setAgentForm({...agentForm, dob: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Gender</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={agentForm.gender}
                                    onChange={e => setAgentForm({...agentForm, gender: e.target.value})}
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">WhatsApp Number</label>
                                <Input
                                    value={agentForm.whatsapp_number}
                                    onChange={e => setAgentForm({...agentForm, whatsapp_number: e.target.value})}
                                    placeholder="+232 ..."
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Residential Address</label>
                                <Input
                                    value={agentForm.residential_address}
                                    onChange={e => setAgentForm({...agentForm, residential_address: e.target.value})}
                                    placeholder="Street, City, District"
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Professional Credentials */}
                <Card className="border-2 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <div className="flex items-center gap-2 text-primary">
                            <Briefcase size={20} />
                            <CardTitle className="text-lg">2. Professional Credentials</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Real Estate License Number</label>
                                <Input
                                    value={agentForm.real_estate_license_number}
                                    onChange={e => setAgentForm({...agentForm, real_estate_license_number: e.target.value})}
                                    placeholder="Enter License No."
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Ministry of Lands Reg. No.</label>
                                <Input
                                    value={agentForm.ministry_registration_number}
                                    onChange={e => setAgentForm({...agentForm, ministry_registration_number: e.target.value})}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Years of Experience</label>
                                <Input
                                    type="number"
                                    value={agentForm.years_experience}
                                    onChange={e => setAgentForm({...agentForm, years_experience: e.target.value})}
                                    placeholder="e.g. 5"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Primary Region</label>
                                <Input
                                    value={agentForm.primary_region}
                                    onChange={e => setAgentForm({...agentForm, primary_region: e.target.value})}
                                    placeholder="e.g. Western Area"
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700">Professional License / Certificate (Upload)</label>
                                <div
                                    onClick={() => licenseInputRef.current?.click()}
                                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/30"
                                >
                                    {agentForm.license_file ? (
                                        <div className="flex items-center justify-center gap-2 text-primary font-bold">
                                            <FileText size={20} /> {agentForm.license_file.name}
                                        </div>
                                    ) : (
                                        <div className="text-slate-400">
                                            <Upload className="mx-auto mb-2" size={24} />
                                            <p className="text-sm font-medium">Upload PDF or JPG of your license</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={licenseInputRef}
                                        className="hidden"
                                        onChange={e => setAgentForm({...agentForm, license_file: e.target.files?.[0] || null})}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 7. INTEGRATED KYC SECTION */}
                <Card className="border-2 shadow-sm border-blue-200 bg-blue-50/10">
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700">
                            <ShieldCheck size={20} />
                            <CardTitle className="text-lg">3. Mandatory KYC Verification</CardTitle>
                        </div>
                        <CardDescription className="text-blue-600">Agents must complete identity verification as part of their onboarding.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                        {/* ID and Proof of Address */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-700 block">Identity Document (ID/Passport)</label>
                                <div
                                    onClick={() => idDocInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${agentForm.id_document ? 'bg-green-50 border-green-300' : 'bg-white hover:bg-slate-50 border-slate-300'}`}
                                >
                                    {agentForm.id_document ? (
                                        <div className="text-green-600 font-bold flex flex-col items-center">
                                            <CheckCircle2 size={24} className="mb-1" />
                                            <span className="text-sm truncate max-w-full px-2">{agentForm.id_document.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-slate-400">
                                            <Upload className="mx-auto mb-1" size={20} />
                                            <p className="text-xs font-medium">Upload Identification</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={idDocInputRef}
                                        className="hidden"
                                        onChange={e => setAgentForm({...agentForm, id_document: e.target.files?.[0] || null})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-700 block">Proof of Address (Utility Bill)</label>
                                <div
                                    onClick={() => poaInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${agentForm.proof_of_address ? 'bg-green-50 border-green-300' : 'bg-white hover:bg-slate-50 border-slate-300'}`}
                                >
                                    {agentForm.proof_of_address ? (
                                        <div className="text-green-600 font-bold flex flex-col items-center">
                                            <CheckCircle2 size={24} className="mb-1" />
                                            <span className="text-sm truncate max-w-full px-2">{agentForm.proof_of_address.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-slate-400">
                                            <Upload className="mx-auto mb-1" size={20} />
                                            <p className="text-xs font-medium">Upload Utility Bill</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={poaInputRef}
                                        className="hidden"
                                        onChange={e => setAgentForm({...agentForm, proof_of_address: e.target.files?.[0] || null})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Liveness Check */}
                        <div className="space-y-4 border-t pt-6">
                            <label className="text-sm font-bold text-slate-700 block text-center">Liveness Verification (Camera)</label>

                            <div className="flex flex-col items-center gap-4">
                                <div className="relative w-full max-w-xs aspect-square bg-slate-900 rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-200 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
                                    />

                                    {!isCameraActive && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                                            {agentForm.photo_right ? (
                                                <div className="text-green-600 flex flex-col items-center">
                                                    <CheckCircle2 size={48} />
                                                    <p className="font-bold mt-2">Captured</p>
                                                </div>
                                            ) : (
                                                <Camera size={48} className="text-slate-300" />
                                            )}
                                        </div>
                                    )}

                                    {isCameraActive && (
                                        <div className="absolute inset-x-0 bottom-4 text-center">
                                            <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                                                {livenessStep === 1 && "Look Straight"}
                                                {livenessStep === 2 && "Turn Left"}
                                                {livenessStep === 3 && "Turn Right"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                    {!isCameraActive ? (
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={startCamera}
                                                className="bg-blue-600 hover:bg-blue-700"
                                                variant="default"
                                            >
                                                {agentForm.photo_straight ? 'Redo Liveness Check' : 'Start Liveness Check'}
                                            </Button>
                                            {cameraBlocked && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={startCamera}
                                                >
                                                    Retry Camera Access
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (livenessStep === 1) captureFrame('photo_straight');
                                                else if (livenessStep === 2) captureFrame('photo_left');
                                                else if (livenessStep === 3) captureFrame('photo_right');
                                            }}
                                            className="bg-primary hover:bg-primary/90 px-8 py-4 font-bold rounded-full shadow-lg animate-pulse"
                                        >
                                            Capture {livenessStep === 1 ? 'Straight' : livenessStep === 2 ? 'Left' : 'Right'}
                                        </Button>
                                    )}

                                    <div className="flex gap-2 mt-2">
                                        <div className={`w-2 h-2 rounded-full ${agentForm.photo_straight ? 'bg-green-500' : 'bg-slate-300'}`} />
                                        <div className={`w-2 h-2 rounded-full ${agentForm.photo_left ? 'bg-green-500' : 'bg-slate-300'}`} />
                                        <div className={`w-2 h-2 rounded-full ${agentForm.photo_right ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    </div>

                                    <p className="text-xs text-slate-600 text-center max-w-sm">
                                        {!isCameraActive && cameraBlocked && (
                                            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-1 font-semibold mb-2">
                                                Camera permission blocked or unavailable
                                            </span>
                                        )}
                                        <br />
                                        {isCameraActive
                                            ? livenessStep === 1
                                                ? 'Look straight at the camera, then capture.'
                                                : livenessStep === 2
                                                    ? 'Turn your head left, then capture.'
                                                    : 'Turn your head right, then capture.'
                                            : 'Tap Start Liveness Check and allow camera access when prompted.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Office & Affiliation */}
                <Card className="border-2 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <div className="flex items-center gap-2 text-primary">
                            <Building2 size={20} />
                            <CardTitle className="text-lg">4. Office & Affiliation</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg border">
                            <span className="text-sm font-medium text-slate-700">Work Status:</span>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={agentForm.is_independent}
                                        onChange={() => setAgentForm({...agentForm, is_independent: true})}
                                    />
                                    <span className="text-sm">Independent Agent</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={!agentForm.is_independent}
                                        onChange={() => setAgentForm({...agentForm, is_independent: false})}
                                    />
                                    <span className="text-sm">Agency Employee</span>
                                </label>
                            </div>
                        </div>

                        {!agentForm.is_independent && (
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Agency Name</label>
                                    <Input
                                        value={agentForm.agency_name}
                                        onChange={e => setAgentForm({...agentForm, agency_name: e.target.value})}
                                        placeholder="e.g. ScruPeak Real Estate"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Agency Office Address</label>
                                    <Input
                                        value={agentForm.agency_office_address}
                                        onChange={e => setAgentForm({...agentForm, agency_office_address: e.target.value})}
                                        placeholder="HQ Location"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Business Email</label>
                                <Input
                                    type="email"
                                    value={agentForm.business_email}
                                    onChange={e => setAgentForm({...agentForm, business_email: e.target.value})}
                                    placeholder="agent@agency.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Office Phone</label>
                                <Input
                                    value={agentForm.office_phone}
                                    onChange={e => setAgentForm({...agentForm, office_phone: e.target.value})}
                                    placeholder="+232 ..."
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 6. Banking & Payout Details */}
                <Card className="border-2 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <div className="flex items-center gap-2 text-primary">
                            <CreditCard size={20} />
                            <CardTitle className="text-lg">5. Banking & Payout Details</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Bank Name</label>
                                <Input
                                    value={agentForm.bank_name}
                                    onChange={e => setAgentForm({...agentForm, bank_name: e.target.value})}
                                    placeholder="e.g. Rokel Commercial Bank"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Account Name</label>
                                <Input
                                    value={agentForm.account_name}
                                    onChange={e => setAgentForm({...agentForm, account_name: e.target.value})}
                                    placeholder="Must match Legal Name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Account Number</label>
                                <Input
                                    value={agentForm.account_number}
                                    onChange={e => setAgentForm({...agentForm, account_number: e.target.value})}
                                    placeholder="Enter Account No."
                                    required
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Bank Branch</label>
                                <Input
                                    value={agentForm.bank_branch_name}
                                    onChange={e => setAgentForm({...agentForm, bank_branch_name: e.target.value})}
                                    placeholder="Branch Name"
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 8. Digital Signature & Agreement */}
                <Card className="border-2 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <div className="flex items-center gap-2 text-primary">
                            <FileText size={20} />
                            <CardTitle className="text-lg">6. Digital Signature & Agreement</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                         <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                            <input
                                type="checkbox"
                                id="certify"
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary"
                                checked={agentForm.certify_accuracy}
                                onChange={e => setAgentForm({...agentForm, certify_accuracy: e.target.checked})}
                                required
                            />
                            <label htmlFor="certify" className="text-sm text-slate-700 font-medium">
                                I certify that all information provided is truthful. I authorize ScruPeak to conduct a background check and verify my ministry credentials.
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Full Name (Digital Signature)</label>
                            <Input
                                value={agentForm.digital_signature}
                                onChange={e => setAgentForm({...agentForm, digital_signature: e.target.value})}
                                className="font-serif italic text-xl"
                                placeholder="Type your full legal name"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t justify-between items-center py-6 px-6 rounded-b-xl">
                        <p className="text-xs text-slate-500 max-w-md">
                            By clicking submit, you agree to ScruPeak's Partner Terms of Service.
                        </p>
                        <Button
                            type="submit"
                            disabled={loading || !agentForm.certify_accuracy}
                            className="bg-primary hover:bg-primary/90 px-12 py-7 text-xl font-bold shadow-xl"
                        >
                            {loading ? 'Submitting Application...' : 'Apply for Agent Verification'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
        <div className="container mx-auto py-16 px-4">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Partner with ScruPeak</h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">Digitizing land ownership in Sierra Leone through verified partnerships.</p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-8 max-w-4xl mx-auto border-2 py-4">
                    <div className="flex items-center gap-2">
                        <Lock size={18} />
                        <span className="font-bold">{error}</span>
                    </div>
                </Alert>
            )}

            {success && (
                <Alert className="mb-8 max-w-4xl mx-auto bg-green-50 text-green-900 border-green-200 border-2 py-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-green-600" />
                        <span className="font-bold">{success}</span>
                    </div>
                </Alert>
            )}

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {view === 'selection' && renderSelection()}
                {view === 'seller_confirmation' && renderSellerConfirmation()}
                {view === 'agent_form' && renderAgentForm()}
            </div>
        </div>
    </div>
  );
};

export default RoleApplicationPage;
