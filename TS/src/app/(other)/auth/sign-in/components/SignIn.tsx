import IconTextFormInput from '@/components/form/IconTextFormInput'
import { BsEnvelopeFill } from 'react-icons/bs'
import { FaLock } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import useSignIn from '../useSignIn'
import { useState } from 'react'
import CaptchaBox from '@/common/CaptchaBox'

const SignIn = () => {
  const { loading, login, control } = useSignIn();
  const [captchaValid, setCaptchaValid] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!captchaValid) return;
        login(e);
      }}
    >
      <div className="mb-4">
        <IconTextFormInput
          control={control}
          icon={BsEnvelopeFill}
          placeholder="E-mail"
          label="Email Address *"
          name="email"
        />
      </div>

      <div className="mb-4">
        <IconTextFormInput
          type="password"
          control={control}
          icon={FaLock}
          placeholder="Password"
          label="Password *"
          name="password"
        />
        <div className="form-text">Your password must be 8+ characters</div>
      </div>

      <div className="mb-3 d-flex justify-content-end">
        <span
          className="text-secondary"
          style={{ cursor: "pointer" }}
          onClick={() => {
            window.dispatchEvent(new CustomEvent("openForgot"));
          }}
        >
          <u>Forgot password?</u>
        </span>
      </div>

      <CaptchaBox onValidate={setCaptchaValid} />

      <div className="d-grid">
        <button
          className="btn orange-btn"
          type="submit"
          disabled={!captchaValid || loading}
          style={{
            backgroundColor: '#fd692a',
            borderColor: '#fd692a',
            color: '#fff'
          }}
        >

          {loading ? "Logging in..." : "Login"}
        </button>
        {/*  <span>
          Don&apos;t have an account ? <Link to="/auth/sign-up" style={{ color: '#fd692a' }}>
            Signup here
          </Link>
        </span> */}
      </div>
    </form>
  );
};

export default SignIn;
