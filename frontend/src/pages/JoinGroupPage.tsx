import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '../utils/errors';

export default function JoinGroupPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (!code) {
      navigate('/', { replace: true });
      return;
    }

    if (attempted.current) return;
    attempted.current = true;

    async function processJoin() {
      try {
        // First get the group info so we know where to redirect if already joined
        const previewRes = await apiClient.get(`/groups/by-code/${code}`);
        const groupId = previewRes.data.id;

        try {
          await apiClient.post(`/groups/by-code/${code}/join`, {});
          queryClient.invalidateQueries({ queryKey: ['groups'] });
          navigate(`/group/${groupId}`, { replace: true });
        } catch (joinErr: any) {
          if (joinErr.response?.status === 400 && joinErr.response?.data?.detail === 'You are already in this tab') {
            // They are already in it, just redirect them silently
            navigate(`/group/${groupId}`, { replace: true });
          } else {
            throw joinErr;
          }
        }
      } catch (err: unknown) {
        const error = err as any;
        if (error.response?.status === 404) {
          setError("This invite link is invalid or has expired.");
        } else {
          setError(getErrorMessage(err));
        }
      }
    }

    processJoin();
  }, [code, navigate]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in pb-32">
      {error ? (
        <div className="bg-paper p-8 rounded-3xl border border-line-paper max-w-sm w-full shadow-sm">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">!</div>
          <h2 className="text-xl font-display font-medium text-ink mb-2">Oops</h2>
          <p className="text-ink-soft mb-8 text-[15px]">{error}</p>
          <button 
            onClick={() => navigate('/', { replace: true })}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-ink-soft font-medium">Joining tab...</p>
        </div>
      )}
    </div>
  );
}
