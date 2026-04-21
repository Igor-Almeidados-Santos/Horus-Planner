import { AuthFormPanel } from "../../components/auth-form-panel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <AuthFormPanel mode="login" nextRoute={params.next ?? "/"} />;
}
