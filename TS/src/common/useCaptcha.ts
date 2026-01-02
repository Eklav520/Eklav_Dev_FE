import { useState } from "react";

const generateRandomCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let captcha = "";
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

const useCaptcha = () => {
  const [captchaText, setCaptchaText] = useState("");
  const [userInput, setUserInput] = useState("");

  const regenerateCaptcha = () => {
    setCaptchaText(generateRandomCaptcha());
    setUserInput("");
  };

  const validateCaptcha = () => {
    return captchaText === userInput.trim().toUpperCase();
  };

  return {
    captchaText,
    userInput,
    setUserInput,
    regenerateCaptcha,
    validateCaptcha,
  };
};

export default useCaptcha;
