import re

with open('frontend/src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

otp_component = """import React, { useRef } from 'react';

function OtpInput({ length, onComplete, code, setCode }: { length: number, onComplete: (code: string) => void, code: string, setCode: (c: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/[^0-9a-zA-Z]/g, '');
    if (!val) return;

    const newCode = code.split('');
    if (val.length > 1) {
      const pastedCode = val.slice(0, length).split('');
      for (let i = 0; i < pastedCode.length; i++) {
        if (index + i < length) {
          newCode[index + i] = pastedCode[i];
        }
      }
      const finalCode = newCode.join('');
      setCode(finalCode);
      const nextFocus = Math.min(index + pastedCode.length, length - 1);
      inputs.current[nextFocus]?.focus();
      if (finalCode.length === length) onComplete(finalCode);
      return;
    }

    newCode[index] = val;
    const finalCode = newCode.join('');
    setCode(finalCode);

    if (val && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
    
    if (finalCode.length === length) onComplete(finalCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newCode = code.split('');
      if (newCode[index]) {
        newCode[index] = '';
        setCode(newCode.join(''));
      } else if (index > 0) {
        newCode[index - 1] = '';
        setCode(newCode.join(''));
        inputs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="text"
          maxLength={6}
          value={code[i] || ''}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          className="w-full h-12 text-center text-lg font-medium bg-bg text-ink border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg outline-none transition-all uppercase"
        />
      ))}
    </div>
  );
}

export default function Dashboard() {"""

content = content.replace("export default function Dashboard() {", otp_component)

old_input = """{isJoin && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] text-ink-soft">Invite Code</label>
                  <input type="text" required value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="input-field" placeholder="123456" pattern="[0-9]{6}" inputMode="numeric" maxLength={6} />
                </div>
              )}"""

new_input = """{isJoin && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] text-ink-soft">Invite Code</label>
                  <OtpInput 
                    length={6} 
                    code={inviteCode} 
                    setCode={setInviteCode} 
                    onComplete={(code) => {
                      setInviteCode(code);
                      setError('');
                      mutation.mutate();
                    }} 
                  />
                </div>
              )}"""

content = content.replace(old_input, new_input)

# Remove the "Join Tab" button when isJoin is true!
# Wait, the form has a button at the bottom.
# Let's remove or hide the "Join Tab" button since it auto-submits.
# I'll just conditionally render the submit button.
button_search = """<button disabled={mutation.isPending} type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity mt-2">
                {isJoin ? 'Join Tab' : 'Create Tab'}
              </button>"""

button_replace = """{!isJoin && (
                <button disabled={mutation.isPending} type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity mt-2">
                  Create Tab
                </button>
              )}"""

content = content.replace(button_search, button_replace)

with open('frontend/src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
