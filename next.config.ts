import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  experimental: {
    // Image uploads are submitted through Server Actions; the default request
    // body limit is 1 MB, too small for the 5 MB images the dropzone allows.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
