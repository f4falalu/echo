'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Card, CardContent, CardFooter } from '@/components/ui/card/CardBase';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GlobalErrorComponent extends Component<Props, State> {
  state = {
    hasError: false
  };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="bg-opacity-90 flex min-h-screen w-screen flex-col items-center justify-center bg-linear-to-br from-gray-50 to-gray-200 p-8 backdrop-blur-xs backdrop-brightness-95 backdrop-filter"
          role="alert">
          <Card>
            <CardContent>
              <div className="flex flex-col gap-4">
                <h1 className="animate-fade-in text-2xl font-semibold">
                  Looks like we hit an error! 😅
                </h1>

                <h5 className="animate-slide-up m-0 text-base font-medium text-gray-600">
                  Don&apos;t worry, it&apos;s not you - it&apos;s us!
                </h5>
                <h5 className="animate-slide-up m-0 text-base font-medium text-gray-500">
                  If this error persists, please contact Buster support!
                </h5>
              </div>
            </CardContent>

            <CardFooter className="w-full pt-0">
              <a href="/" className="w-full">
                <Button variant="black" block size="tall">
                  Take Me Home 🏠
                </Button>
              </a>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
