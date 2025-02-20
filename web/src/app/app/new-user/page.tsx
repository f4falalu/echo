import React from 'react';
import { NewUserController } from './_NewUserController';
import { LoginConfigProvider } from '../_components/LoginComponents/LoginConfigProvider';

export default function NewUserPage() {
  return (
    <LoginConfigProvider>
      <NewUserController />
    </LoginConfigProvider>
  );
}
