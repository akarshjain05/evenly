import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [isJoin, setIsJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [yourName, setYourName] = useState('');
  const [error, setError] = useState('');
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async () => {
      if (isJoin) {
        return apiClient.post(`groups/by-code/${encodeURIComponent(inviteCode)}/join`, { name: yourName });
      } else {
        return apiClient.post(`groups`, { name: groupName, your_name: yourName });
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      // The API returns the Membership. We want to navigate to the group
      const groupId = res.data.group?.id || res.data.group_id;
      if (groupId) {
        navigate(`/group/${groupId}`);
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'An error occurred');
    }
  });

  return (
    <div className="flex-1 flex flex-col justify-center items-center h-full px-5 pb-20">
      <div className="bg-paper border border-line-dark shadow-sm rounded-[20px] w-full max-w-sm overflow-hidden p-6">
        <h1 className="font-display text-[26px] font-medium text-center mb-6 text-ink">
          {isJoin ? 'Join a Tab' : 'Create a Tab'}
        </h1>
        
        <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(); }} className="flex flex-col gap-4">
          
          {error && <div className="text-[#c81e1e] text-[13px] font-medium">{error}</div>}

          {!isJoin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-ink-soft">Tab Name</label>
              <input type="text" required value={groupName} onChange={e => setGroupName(e.target.value)} className="input-field" placeholder="Miami Trip" />
            </div>
          )}

          {isJoin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-ink-soft">Invite Code</label>
              <input type="text" required value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="input-field uppercase" placeholder="ABCDEF" />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Your Name</label>
            <input type="text" required value={yourName} onChange={e => setYourName(e.target.value)} className="input-field" placeholder="Alice" />
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn-primary mt-2">
            {mutation.isPending ? 'Processing...' : (isJoin ? 'Join Tab' : 'Create Tab')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button type="button" onClick={() => { setIsJoin(!isJoin); setError(''); }} className="text-on-dark-soft text-[14px] hover:text-ink transition-colors">
            {isJoin ? 'Want to create a new tab instead?' : 'Have an invite code?'}
          </button>
        </div>
      </div>
    </div>
  );
}
