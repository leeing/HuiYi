import { ApiError } from "@/api/client";
import { useLogin } from "@/api/hooks/useAuth";
import { useAuth } from "@/app/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(1, "用户名不能为空").describe("用户名"),
  password: z.string().min(1, "密码不能为空").describe("登录密码"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const res = await loginMutation.mutateAsync(values);
      auth.login(res.user_id, values.username, res.avatar, res.signature);
      void navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : "登录失败，请重试";
      setError("root", { message });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-xuan-paper">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-ink-dark">
          会意
        </h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div>
            <label
              htmlFor="username"
              className="block text-sm text-ink-dark/70"
            >
              用户名
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-ink-dark/20 bg-xuan-paper px-3 py-2 text-ink-dark outline-none focus:border-warm-red"
              {...register("username")}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-warm-red">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm text-ink-dark/70"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-ink-dark/20 bg-xuan-paper px-3 py-2 text-ink-dark outline-none focus:border-warm-red"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-warm-red">
                {errors.password.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-warm-red">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-warm-red py-2 text-white transition hover:bg-warm-red/90 disabled:opacity-50"
          >
            {isSubmitting ? "登录中…" : "登录"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-dark/50">
          没有账号？{" "}
          <Link to="/register" className="text-warm-red hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
