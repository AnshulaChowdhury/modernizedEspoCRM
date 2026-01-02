import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuthStore } from '../store';
import { BetaBanner } from '@/components/common/DevBanner';

export default function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <BetaBanner />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-12">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">EspoCRM</h1>
              <p className="text-sm text-gray-500 mt-1">
                Sign in to your account
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </>
  );
}
