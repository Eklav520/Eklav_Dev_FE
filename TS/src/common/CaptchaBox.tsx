import React, { useEffect, useState } from "react";
import useCaptcha from "./useCaptcha";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import RefreshIcon from "../../public/RefreshIcon.png";

interface CaptchaBoxProps {
  onValidate?: (valid: boolean) => void;
  debounceMs?: number;
}

const CaptchaBox = ({ onValidate, debounceMs = 1000 }: CaptchaBoxProps) => {
  const { captchaText, userInput, setUserInput, regenerateCaptcha, validateCaptcha } = useCaptcha();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    regenerateCaptcha();
  }, []);

  useEffect(() => {
    if (!userInput) {
      setVerified(false);
      setError("");
      onValidate?.(false);
      return;
    }

    const t = setTimeout(() => {
      const valid = validateCaptcha();
      setVerified(valid);
      setError(valid ? "" : "Captcha does not match!");
      onValidate?.(valid);
    }, debounceMs);

    return () => clearTimeout(t);
  }, [userInput]);

  return (
    <div className="mb-3">
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

        <input
          className="form-control"
          placeholder="Enter Captcha"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value.toUpperCase())}
          disabled={verified}
          style={{
            flex: "1 1 120px",
            minWidth: 0,
            borderColor: verified ? "#fd692a" : undefined,
            boxShadow: verified
              ? "0 0 0 0.2rem rgba(253,105,42,.25)"
              : undefined,
          }}
        />

        <div
          style={{
            flexShrink: 0,
            background: "#24292d",
            padding: "8px 10px",
            textAlign: "center",
            fontSize: 18,
            letterSpacing: 2,
            fontWeight: "bold",
            borderRadius: 8,
            userSelect: "none",
            color: "#fd692a",
            border: "1px solid rgba(253,105,42,.4)",
            whiteSpace: "nowrap",
          }}
        >
          {captchaText}
        </div>

        {verified ? (
          <FaCheckCircle color="#fd692a" size={22} style={{ flexShrink: 0 }} />
        ) : (
          <img
            src={RefreshIcon}
            alt="Refresh Captcha"
            onClick={() => {
              regenerateCaptcha();
              setVerified(false);
              setError("");
              onValidate?.(false);
            }}
            style={{
              width: 22,
              height: 22,
              flexShrink: 0,
              cursor: "pointer",
              filter:
                "invert(52%) sepia(94%) saturate(1550%) hue-rotate(346deg) brightness(101%) contrast(101%)",
            }}
          />
        )}
      </div>

      <div className="d-flex align-items-center gap-2 mt-3">
        {!verified && error && (
          <>
            <FaTimesCircle color="#fd692a" size={22} />
            <span style={{ color: "#fd692a" }}>{error}</span>
          </>
        )}
      </div>
    </div>
  );

};

export default CaptchaBox;
