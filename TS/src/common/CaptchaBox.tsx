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
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          className="form-control"
          placeholder="Enter Captcha"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value.toUpperCase())}
          disabled={verified}
        />

        <div
          style={{
            background: "#24292d",
            padding: 12,
            textAlign: "center",
            fontSize: 22,
            letterSpacing: 3,
            fontWeight: "bold",
            borderRadius: 8,
            userSelect: "none",
            color: "#066ac9",
          }}
        >
          {captchaText}
        </div>

       {verified ? <FaCheckCircle color="green" size={26} />: <img
          src={RefreshIcon}
          alt="Refresh Captcha"
          onClick={() => {
            regenerateCaptcha();
            setVerified(false);
            setError("");
            onValidate?.(false);
          }}
          style={{ width: 28, height: 28, cursor: "pointer", marginTop: 8 }}
        />
        }
      </div>

      <div className="d-flex align-items-center gap-2 mt-3">
        {!verified && error && <><FaTimesCircle color="red" size={26} />{error}</>}
      </div>
    </div>
  );
};

export default CaptchaBox;
