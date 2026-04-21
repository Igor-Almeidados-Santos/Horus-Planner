import { AuthFormPanel } from "../../components/auth-form-panel";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <AuthFormPanel mode="register" nextRoute={params.next ?? "/"} />;
}
