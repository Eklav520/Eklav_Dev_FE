import React from "react";
import "./AssessmentCompaniesMarquee.css";

import accenture from "@/app/(other)/auth/components/logos/accenture.webp";
import adobe from "@/app/(other)/auth/components/logos/Adobe.webp";
import amazon from "@/app/(other)/auth/components/logos/amazon.webp";
import atlassian from "@/app/(other)/auth/components/logos/Atlassian_logo_PNG1.webp";
import cisco from "@/app/(other)/auth/components/logos/Cisco_logo_PNG2.webp";
import flipkart from "@/app/(other)/auth/components/logos/Flipkart_logo_PNG1.webp";
import google from "@/app/(other)/auth/components/logos/google_PNG.webp";
import infosys from "@/app/(other)/auth/components/logos/Infosys_logo_PNG2.webp";
import oracle from "@/app/(other)/auth/components/logos/Oracle_logo_PNG1.webp";
import paytm from "@/app/(other)/auth/components/logos/Paytm_logo_PNG1.webp";
import phonepe from "@/app/(other)/auth/components/logos/PhonePe_Logo_PNG1.webp";
import unacademy from "@/app/(other)/auth/components/logos/unacamedy.webp";
import walmart from "@/app/(other)/auth/components/logos/Walmart_logo_PNG1.webp";
import wipro from "@/app/(other)/auth/components/logos/wipro.webp";
import yahoo from "@/app/(other)/auth/components/logos/Yahoo_logo_PNG1.webp";
import zomato from "@/app/(other)/auth/components/logos/Zomato_logo_PNG1.webp";

const logos = [
  accenture,
  adobe,
  amazon,
  atlassian,
  cisco,
  flipkart,
  google,
  infosys,
  oracle,
  paytm,
  phonepe,
  unacademy,
  walmart,
  wipro,
  yahoo,
  zomato,
];

export default function AssessmentCompaniesMarquee() {
  return (
    <div className="placement-marquee-wrapper">
      <div className="placement-marquee-row">
        {[...logos, ...logos].map((logo, i) => (
          <div key={i} className="placement-logo">
            <img src={logo} alt="company logo" />
          </div>
        ))}
      </div>

      <div className="placement-marquee-row reverse">
        {[...logos, ...logos].map((logo, i) => (
          <div key={i} className="placement-logo">
            <img src={logo} alt="company logo" />
          </div>
        ))}
      </div>
    </div>
  );
}