import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/");
    } else {
      navigate("/login");
    }
  }, []);

  return (
  <div className="flex min-h-screen items-center justify-center bg-[#0B1120] px-4">
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-2xl">
      <div className="flex flex-col items-center text-center">
        
        {/* Animated Loader */}
        <div className="relative mb-6">
          <div className="h-16 w-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <div className="absolute inset-2 rounded-full bg-cyan-400/10 blur-md" />
        </div>

        {/* Branding */}
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome to Nexis
        </h1>

        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
          Authenticating your account and preparing your dashboard...
        </p>

        {/* Progress Bar */}
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-400" />
        </div>
      </div>
    </div>
  </div>
);
}