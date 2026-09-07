"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { supabase } from "@/lib/supabase";

export default function MetaPixel() {
  const [pixelId, setPixelId] = useState("");

  useEffect(() => {
    async function loadPixel() {
      const { data, error } = await supabase
        .from("settings")
        .select("meta_pixel_id")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.error("Meta Pixel load error:", error);
        return;
      }

      if (data?.meta_pixel_id) {
        setPixelId(data.meta_pixel_id.trim());
      }
    }

    loadPixel();
  }, []);

  if (!pixelId) {
    return null;
  }

  return (
    <Script
      id="CATS HOME-meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;
          n.push=n;
          n.loaded=!0;
          n.version='2.0';
          n.queue=[];
          t=b.createElement(e);
          t.async=!0;
          t.src=v;
          s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}
          (window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');

          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}
