// NEW SCREEN (Master Plan §6, Tài khoản): đăng nhập / tạo tài khoản qua dịch vụ tài khoản dùng chung (auth-next).
// Chưa có mock riêng; theo visual language M1–M3, hướng A (đảo mây kẹo hồng).
import { type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Icon } from '../kit/art';
import { IdpSignInButton, signInErrorKey } from './idp-sign-in-button';
import { SkyScene } from '../kit/sky-scene';
import { LegalLinks } from '../legal/legal-links';
import { T } from '../i18n/use-t';

function SignIn({ title, hint, dataId, switchTo }: { title: ReactNode; hint: ReactNode; dataId: string; switchTo: { text: ReactNode; label: ReactNode; to: string } }) {
  const [params] = useSearchParams();
  const error = params.get('error');
  return (
    <SkyScene hero>
      <main className="panel" data-id={dataId}>
        <h1>{title}</h1>
        <p className="hint">{hint}</p>
        {error ? (
          <p role="alert" className="error">
            <T k={signInErrorKey(error)} />
          </p>
        ) : null}
        <IdpSignInButton dataId={`${dataId}-sign-in`} label={<T k="auth.signIn" />} />
        <p className="note">
          <Icon name="heart" size={28} />
          <span>
            <T k="auth.privacyNote" />
            <span className="legal-links">
              <LegalLinks dataId={dataId} />
            </span>
          </span>
        </p>
        <p className="hint">
          {switchTo.text} <Link to={switchTo.to}>{switchTo.label}</Link>
        </p>
      </main>
    </SkyScene>
  );
}

export function LoginScreen() {
  return (
    <SignIn
      dataId="login"
      title={<T k="auth.loginTitle" />}
      hint={<T k="auth.loginHint" />}
      switchTo={{ text: <T k="auth.firstTimePrompt" />, label: <T k="auth.createParentAccount" />, to: '/register' }}
    />
  );
}

export function RegisterScreen() {
  return (
    <SignIn
      dataId="register"
      title={<T k="auth.registerTitle" />}
      hint={<T k="auth.registerHint" />}
      switchTo={{ text: <T k="auth.haveAccountPrompt" />, label: <T k="auth.loginLink" />, to: '/login' }}
    />
  );
}
