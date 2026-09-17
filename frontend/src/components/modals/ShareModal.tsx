import { X, Link as LinkIcon, Hash } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { GroupDetailResponse } from '../../types/api';

interface Props {
  group: GroupDetailResponse;
  onClose: () => void;
}

export default function ShareModal({ group, onClose }: Props) {
  const { showAlert } = useUIStore();
  const inviteUrl = `${window.location.origin}/join/${group.invite_code}`;

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({ title: `Join ${group.name} on Evenly`, url: inviteUrl })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(inviteUrl);
      showAlert("Copied!", "Invite link copied to clipboard.");
    }
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    showAlert("Copied!", "Invite code copied to clipboard.");
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity" 
        onClick={onClose} 
      />
      <div className="fixed bottom-0 left-0 right-0 sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 bg-paper z-50 rounded-t-[24px] sm:rounded-[24px] shadow-2xl sm:w-full sm:max-w-sm overflow-hidden flex flex-col animate-slide-up sm:animate-fade-in">
        
        <div className="flex justify-between items-center p-5 border-b border-line-dark">
          <h2 className="font-display text-[20px] font-medium m-0 text-ink">Share Tab</h2>
          <button onClick={onClose} className="text-on-dark-soft hover:bg-bg p-1.5 rounded-full transition-colors border-none bg-transparent cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <button 
            onClick={handleShareLink}
            className="flex items-center gap-4 p-4 rounded-xl border border-line-dark hover:bg-bg transition-colors bg-transparent cursor-pointer w-full text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <LinkIcon className="text-primary" size={20} />
            </div>
            <div>
              <div className="font-medium text-[15px] text-ink">Share Link</div>
              <div className="text-[13px] text-ink-soft mt-0.5">Anyone with the link can join</div>
            </div>
          </button>

          <button 
            onClick={handleCopyCode}
            className="flex items-center gap-4 p-4 rounded-xl border border-line-dark hover:bg-bg transition-colors bg-transparent cursor-pointer w-full text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Hash className="text-primary" size={20} />
            </div>
            <div>
              <div className="font-medium text-[15px] text-ink">Copy Invite Code</div>
              <div className="text-[13px] text-ink-soft mt-0.5 font-mono">{group.invite_code}</div>
            </div>
          </button>
        </div>
        
        {/* Safe area padding for iOS home indicator */}
        <div className="h-6 sm:hidden"></div>
      </div>
    </>
  );
}
