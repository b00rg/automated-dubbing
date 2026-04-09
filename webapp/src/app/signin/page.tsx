"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/server/better-auth/client";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a className="flex items-center gap-2 self-center text-2xl font-medium">
          AutoDub
        </a>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>Sign in with your Google or Microsoft account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={async () => {
                    await authClient.signIn.social({
                      provider: "google",
                      callbackURL: "/",
                    });
                  }}
                >
                  Sign in with Google
                </Button>
                <Button
                
                className="w-full"
                onClick={async () => {
                  await authClient.signIn.social({
                    provider: "microsoft",
                    callbackURL: "/",
                  });
                }}
              >
                Sign in with Microsoft
              </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
