import createNextIntlPlugin from "next-intl/plugin";

import type { NextConfig } from "next";

const nextConfig: NextConfig = { output: "standalone", reactStrictMode: false };

const withNextIntl = createNextIntlPlugin("./src/configs/i18n/request.ts");
export default withNextIntl(nextConfig);
