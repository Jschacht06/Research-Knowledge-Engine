import type { FormEvent } from 'react'
import { FileText } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

type AuthPageProps = {
  mode: 'login' | 'register'
}

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app/dashboard'
  const isLogin = mode === 'login'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    window.localStorage.setItem('rke-authenticated', 'true')
    navigate(from, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-5 py-10">
      <div className="w-full max-w-[445px] rounded-[22px] border border-[#e3e9f2] bg-white px-8 py-10 shadow-[0_14px_40px_rgba(15,23,42,0.08)] sm:px-10">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#22386d] text-white shadow-sm">
          <FileText size={23} />
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-[34px] font-extrabold tracking-tight text-rke-navy">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="mt-3 text-[15px] text-slate-500">
            {isLogin ? 'Log in to access your research' : 'Sign up to access your research'}
          </p>
        </div>

        <form className="mt-10" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-5">
              <label
                className="mb-2 block text-xs font-bold uppercase tracking-[0.04em] text-[#4b5f7d]"
                htmlFor="fullName"
              >
                Full name
              </label>
              <input
                className="h-11 w-full rounded-2xl border border-[#dfe6ef] px-4 text-base text-rke-navy outline-none transition placeholder:text-slate-400 focus:border-rke-teal"
                id="fullName"
                placeholder="Enter your name"
                type="text"
              />
            </div>
          )}

          <div className="mb-5">
            <label
              className="mb-2 block text-xs font-bold uppercase tracking-[0.04em] text-[#4b5f7d]"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="h-11 w-full rounded-2xl border border-[#dfe6ef] px-4 text-base text-rke-navy outline-none transition placeholder:text-slate-400 focus:border-rke-teal"
              id="email"
              placeholder="Enter your email"
              type="email"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-bold uppercase tracking-[0.04em] text-[#4b5f7d]"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="h-11 w-full rounded-2xl border border-[#dfe6ef] px-4 text-base text-rke-navy outline-none transition placeholder:text-slate-400 focus:border-rke-teal"
              id="password"
              placeholder={isLogin ? 'Enter your password' : 'Create a password'}
              type="password"
            />
          </div>

          <div className="mt-4 flex justify-end">
            {isLogin ? (
              <button className="text-sm font-medium text-rke-teal transition hover:text-rke-navy" type="button">
                Forgot password?
              </button>
            ) : (
              <p className="text-sm text-slate-500">Use at least 8 characters.</p>
            )}
          </div>

          <button
            className="mt-5 h-12 w-full rounded-2xl bg-rke-amber text-base font-bold text-white shadow-[0_10px_24px_rgba(245,162,6,0.28)] transition hover:brightness-105"
            type="submit"
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#dfe6ef]" />
          <span className="text-sm text-slate-500">or</span>
          <div className="h-px flex-1 bg-[#dfe6ef]" />
        </div>

        <p className="mt-7 text-center text-[15px] text-slate-500">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link className="font-bold text-rke-teal transition hover:text-rke-navy" to={isLogin ? '/register' : '/login'}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </Link>
        </p>
      </div>
    </div>
  )
}
