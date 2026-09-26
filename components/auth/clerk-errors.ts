import { isClerkAPIResponseError } from '@clerk/nextjs/errors';

// Clerk returns a list of { code, message, meta.paramName }. We only need that list, or nothing.
export function clerkErrors(error: unknown) {
  // the type guard throws on null, and null is what a successful call returns
  if (!error || !isClerkAPIResponseError(error)) return [];
  return error.errors.map((e) => ({ code: e.code, param: e.meta?.paramName, message: e.longMessage || e.message }));
}

// After any successful flow: activate the session and land on the dashboard
export function goHome(router: { push: (url: string) => void }) {
  return {
    navigate: ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
      const url = decorateUrl('/');
      if (url.startsWith('http')) window.location.href = url;
      else router.push(url);
    },
  };
}
