import { useEffect, useState } from "react";

interface Tenant {
  name: string;
  logo?: string;
  themeColor?: string;
}

const useTenant = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const domain = window.location.hostname;

       /*  console.log("🌍 Frontend Domain:", domain);
        console.log("🌐 API Base URL:", baseURL); */

        const url = `${baseURL}/api/institute/tenant-config`;

        /* console.log("🚀 Calling API:", url); */

        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "x-tenant-domain": domain, // 🔥 IMPORTANT
          },
        });

        /* console.log("📡 Response Status:", res.status); */

        const text = await res.text(); // 🔥 read raw first
        /* console.log("📦 Raw Response:", text); */

        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("❌ JSON Parse Error:", err);
          return;
        }

        /* console.log("✅ Parsed Data:", data); */

        if (data.success) {
          /* console.log("🎯 Tenant Found:", data.tenant); */
          setTenant(data.tenant);
        } else {
          /* console.warn("⚠️ API returned success: false", data); */
        }

      } catch (err) {
        console.error("❌ Tenant fetch error:", err);
      }
    };

    fetchTenant();
  }, [baseURL]);

  return tenant;
};

export default useTenant;