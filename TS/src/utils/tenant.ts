import { useEffect, useState } from "react";

interface Tenant {
  name: string;
  logo?: string;
  themeColor?: string;
}

const useTenant = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch("/api/institute/tenant-config");
        const data = await res.json();

        if (data.success) {
          setTenant(data.tenant);
        }
      } catch (err) {
        console.error("Tenant fetch error", err);
      }
    };

    fetchTenant();
  }, []);

  return tenant;
};

export default useTenant;