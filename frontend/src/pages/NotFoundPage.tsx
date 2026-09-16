
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  
  // Generating a pseudo-random ID to match the UI style in the screenshot
  const randomId = `bom1::p${Math.random().toString(36).substring(2, 6)}-${Date.now()}-${Math.random().toString(16).substring(2, 10)}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-sans relative selection:bg-gray-800">
      
      <div className="max-w-md w-full px-6 flex flex-col items-start text-left">
        <h1 className="text-2xl font-bold tracking-tight mb-3">This page doesn't exist</h1>
        <p className="text-[#a1a1aa] mb-6 text-[15px] leading-relaxed">
          It may have been moved, removed, or<br/>never existed.
        </p>
        
        <button 
          onClick={() => navigate(-1)} 
          className="bg-white text-black px-4 py-1.5 rounded-md text-[14px] font-medium hover:bg-gray-200 transition-colors mb-6"
        >
          Go back
        </button>
        
        <div className="text-[12px] font-mono text-[#52525b] leading-tight uppercase">
          <div>404 NOT_FOUND</div>
          <div className="lowercase mt-1">{randomId}</div>
        </div>
      </div>

      <div className="absolute bottom-10 w-full flex justify-center text-[11px] font-mono tracking-widest text-[#52525b]">
        <a href="#" className="hover:text-gray-300 transition-colors">VIEW DOCUMENTATION</a>
        <span className="mx-3">/</span>
        <a href="#" className="hover:text-gray-300 transition-colors">COPY DEBUG PROMPT</a>
      </div>
      
    </div>
  );
}
