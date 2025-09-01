import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { CheckCircle, XCircle, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9825/api';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    setVerificationStatus('loading');
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setVerificationStatus('error');
        setMessage(data.message || 'Failed to verify email. The link may be invalid or expired.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
    }
  };

  const resendVerificationEmail = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setResendStatus('sending');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResendStatus('sent');
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setResendStatus('error');
        setMessage(data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setResendStatus('error');
      setMessage('An error occurred while sending the verification email.');
    }
  };

  // If no token in URL, show resend option
  if (!searchParams.get('token')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              {user?.emailVerified 
                ? 'Your email is already verified!'
                : 'We need to verify your email address to activate your account.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.emailVerified ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your email is verified. You can access all features.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Check your email for a verification link. If you haven't received it, you can request a new one.
                  </AlertDescription>
                </Alert>

                {resendStatus === 'sent' && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                {resendStatus === 'error' && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={resendVerificationEmail}
                  disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                  className="w-full"
                >
                  {resendStatus === 'sending' ? 'Sending...' : 
                   resendStatus === 'sent' ? 'Email Sent!' : 
                   'Resend Verification Email'}
                </Button>
              </>
            )}

            <div className="text-center text-sm">
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Back to Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show verification status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            verificationStatus === 'success' 
              ? 'bg-green-100 dark:bg-green-900' 
              : verificationStatus === 'error'
              ? 'bg-red-100 dark:bg-red-900'
              : 'bg-blue-100 dark:bg-blue-900'
          }`}>
            {verificationStatus === 'loading' && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
            )}
            {verificationStatus === 'success' && (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            )}
            {verificationStatus === 'error' && (
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            )}
            {verificationStatus === 'idle' && (
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verificationStatus === 'loading' && 'Verifying Your Email...'}
            {verificationStatus === 'success' && 'Email Verified!'}
            {verificationStatus === 'error' && 'Verification Failed'}
            {verificationStatus === 'idle' && 'Email Verification'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={
            verificationStatus === 'success' 
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
              : verificationStatus === 'error'
              ? 'border-red-200 bg-red-50 dark:bg-red-900/20'
              : ''
          }>
            <AlertDescription className={
              verificationStatus === 'success'
                ? 'text-green-800 dark:text-green-200'
                : verificationStatus === 'error'
                ? 'text-red-800 dark:text-red-200'
                : ''
            }>
              {message || 'Processing your verification...'}
            </AlertDescription>
          </Alert>

          {verificationStatus === 'success' && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Redirecting to login page...
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="space-y-4">
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full"
              >
                Go to Login
              </Button>
              
              {user && !user.emailVerified && (
                <Button
                  onClick={resendVerificationEmail}
                  disabled={resendStatus === 'sending'}
                  className="w-full"
                >
                  {resendStatus === 'sending' ? 'Sending...' : 'Request New Verification Email'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
