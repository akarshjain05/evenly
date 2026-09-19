import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-paper border border-line-dark rounded-[24px] p-10 max-w-md w-full shadow-sm flex flex-col items-center gap-6">
        <div className="text-brass">
          <Logo className="w-16 h-16 mx-auto" />
        </div>
        
        <div>
          <h1 className="font-display text-[32px] font-semibold text-ink m-0 leading-tight">
            404
          </h1>
          <h2 className="text-[20px] font-medium text-ink mt-2 mb-0">
            Page not found
          </h2>
          <p className="text-ink-soft text-[15px] mt-3 leading-snug max-w-[260px] mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <button 
            onClick={() => navigate(-1)} 
            className="flex-1 btn-secondary"
          >
            Go Back
          </button>
          <Link 
            to="/" 
            className="flex-1 btn-primary no-underline"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
