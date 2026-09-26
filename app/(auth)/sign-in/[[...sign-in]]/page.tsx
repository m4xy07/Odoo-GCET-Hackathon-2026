import { SignIn } from '@clerk/nextjs';

// Stock Clerk form so the team can sign in today. The custom Login ID page replaces it.
export default function SignInPage() {
  return <SignIn />;
}
