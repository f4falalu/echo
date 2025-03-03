import React, { PropsWithChildren } from 'react';
import { Metadata } from 'next';
import { LoginConfigProvider } from './_LoginComponents/LoginConfigProvider';
import { WelcomeToBuster } from './_LoginComponents/WelcomeSidebar';

export const metadata: Metadata = {
  title: 'Buster Login'
};

const LoginLayout: React.FC<PropsWithChildren<{}>> = async ({ children }) => {
  return (
    <LoginConfigProvider>
      <section className="h-[100vh]">
        <div className="flex h-[100vh] items-center">
          <div className="mx-auto flex min-h-[100vh] w-full">
            <div className="hidden w-1/2 bg-gray-50 md:flex dark:bg-gray-900">
              <WelcomeToBuster hasUser={true} />
            </div>
            <div className="w-1/2 bg-white dark:bg-black">{children}</div>
          </div>
        </div>
      </section>
    </LoginConfigProvider>
  );
};

export default LoginLayout;
