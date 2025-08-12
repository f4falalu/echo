import { createFileRoute, useRouter } from "@tanstack/react-router";
import { signInWithEmailAndPassword } from "../integrations/supabase/signIn";

export const Route = createFileRoute("/auth/login")({
  component: LoginComp,
});

function LoginComp() {
  const router = useRouter();

  const onSubmit = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    await signInWithEmailAndPassword({ data: { email, password } });
    router.invalidate();
    router.navigate({ to: "/" });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form className="flex flex-col gap-2" action={onSubmit}>
        <input
          className="border border-gray-300 rounded-md p-2"
          type="email"
          name="email"
          defaultValue={"chad@buster.so"}
          placeholder="Email"
        />
        <input
          className="border border-gray-300 rounded-md p-2"
          type="password"
          name="password"
          placeholder="Password"
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
