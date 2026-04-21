import { OnboardingFormPanel } from "../../components/onboarding-form-panel";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <OnboardingFormPanel nextRoute={params.next ?? "/"} />;
}
