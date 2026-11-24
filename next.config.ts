import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server actions default to a 1MB body; prescription photos are larger
      // (up to 5 files x 10MB, see uploadPrescriptions in app/actions/customers.ts)
      bodySizeLimit: "55mb",
    },
  },
};

export default nextConfig;
