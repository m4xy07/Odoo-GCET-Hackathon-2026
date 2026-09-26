/** @type {import('next').NextConfig} */
const nextConfig = {
  // next dev would otherwise write extra markdown files into the repo root on every start
  agentRules: false,
};

export default nextConfig;
