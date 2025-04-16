import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export default function Login() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      } else if (event === 'USER_DELETED') {
        setAuthError('Your account has been deleted.');
      } else if (event === 'TOKEN_REFRESHED') {
        // Clear any existing errors when the token is refreshed successfully
        setAuthError(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to GoToMarket.AI</h1>
          <p className="mt-2 text-gray-600">Sign in to start your market analysis</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
          {authError && (
            <div className="mb-4 p-4 text-sm text-red-800 bg-red-50 rounded-lg" role="alert">
              {authError}
            </div>
          )}
          <div className="mb-4 text-sm text-gray-600">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside mt-1">
              <li>At least 6 characters long</li>
              <li>Contains letters and numbers</li>
            </ul>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              style: {
                button: { background: '#4F46E5', color: 'white' },
                anchor: { color: '#4F46E5' }
              }
            }}
            providers={[]}
            theme="light"
            onError={(error) => {
              if (error.message === 'Invalid login credentials') {
                setAuthError('The email or password you entered is incorrect. Please try again.');
              } else {
                setAuthError(error.message);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}