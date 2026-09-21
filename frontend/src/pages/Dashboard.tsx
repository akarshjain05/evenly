import { useLocalGroups } from '../db/hooks';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, Users } from 'lucide-react';
import { syncEngine } from '../db/syncEngine';



export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [isJoin, setIsJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const { data: user } = useCurrentUser();
  const groups = useLocalGroups(user?.id);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isJoin) {
        return apiClient.post(`groups/by-code/${encodeURIComponent(inviteCode)}/join`, {});
      } else {
        return apiClient.post(`groups`, { name: groupName });
      }
    },
    onSuccess: async (res) => {
      // Trigger a sync so the new group is pulled into local Dexie DB
      await syncEngine.sync();
      
      const groupId = res.data.group?.id || res.data.group_id;
      if (groupId) {
        navigate(`/group/${groupId}`);
      }
    },
    onError: (err: any) => {
      const detail = err.response?.data?.userMessage || err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'An error occurred'));
    }
  });

  const shouldShowForm = showForm || (groups && groups.length === 0);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {!shouldShowForm ? (
        <div className="animate-fade-in pt-4 md:pt-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-display font-bold text-ink">Your Tabs</h1>
            <button 
              onClick={() => setShowForm(true)}
              className="btn-primary py-2 px-4 flex items-center gap-2 w-auto"
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">New Tab</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {groups?.map((m: any) => (
              <Link 
                key={m.group.id} 
                to={`/group/${m.group.id}`}
                className="bg-paper border border-line-dark rounded-[16px] p-5 shadow-sm hover:border-brass transition-colors flex flex-col gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center text-ink-soft group-hover:text-brass transition-colors shrink-0">
                    <Users size={20} />
                  </div>
                  <h3 className="font-semibold text-ink text-lg truncate">{m.group.name}</h3>
                </div>
                <div className="text-[13px] text-on-dark-soft">
                  Joined as: <span className="font-medium text-ink">{m.member.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center pt-8 md:pt-20">
          <div className="bg-paper border border-line-dark shadow-sm rounded-[20px] w-full max-w-sm overflow-hidden p-6 animate-fade-in relative">
            
            {groups && groups.length > 0 && (
              <button 
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 text-ink-soft hover:text-ink text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <h1 className="font-display text-[26px] font-medium text-center mb-6 text-ink mt-2">
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

              <button type="submit" disabled={mutation.isPending} className="btn-primary mt-2">
                {mutation.isPending ? 'Processing...' : (isJoin ? 'Join Tab' : 'Create Tab')}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button type="button" onClick={() => { 
                setIsJoin(!isJoin); 
                setError(''); 
                setGroupName('');
                setInviteCode('');
              }} className="text-on-dark-soft text-[14px] hover:text-ink transition-colors cursor-pointer">
                {isJoin ? 'Want to create a new tab instead?' : 'Have an invite code?'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
