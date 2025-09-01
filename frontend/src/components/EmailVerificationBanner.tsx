import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Mail, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9825/api';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if email verification is enabled
    fetch(`${API_URL}/auth/features`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.features) {
          setEmailVerificationEnabled(data.data.features.emailVerification);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Don't show if loading, feature disabled, user is verified, or banner is dismissed
  if (loading || !emailVerificationEnabled || !user || user.emailVerified || dismissed) {
    return null;
  }

  const resendVerificationEmail = async () => {
    setSending(true);
    setError('');
    
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
        setSent(true);
        setTimeout(() => setSent(false), 5000); // Reset after 5 seconds
      } else {
        setError(data.message || 'Failed to send verification email');
      }
    } catch (err) {
      setError('An error occurred while sending the verification email');
    } finally {
      setSending(false);
    }
  };

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
      <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-yellow-800 dark:text-yellow-200 font-medium">
            Verify your email address
          </span>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Please check your email and click the verification link to access all features.
          </p>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {sent ? (
            <span className="text-sm text-green-600 dark:text-green-400">Email sent!</span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={resendVerificationEmail}
              disabled={sending}
              className="whitespace-nowrap"
            >
              {sending ? 'Sending...' : 'Resend Email'}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
