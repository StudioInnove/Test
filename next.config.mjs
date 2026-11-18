/** @type {import('next').NextConfig} */
const preview = process.env.PREVIEW === "1";
const nextConfig = {
  reactStrictMode: true,
  ...(preview
    ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
    : {
        async headers() {
          return [{ source: "/film/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
        },
      }),
};
export default nextConfig;
