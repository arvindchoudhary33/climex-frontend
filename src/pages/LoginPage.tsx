import { LoginForm } from "../components/LoginForm";
import { Logo } from "../components/Logo";

export function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-black px-4">
      <div className="mb-8 w-full max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
      </div>
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
