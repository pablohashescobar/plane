import React, { useState, useEffect } from "react";
// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
// services
import authenticationService from "lib/services/authentication.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// layouts
import DefaultLayout from "layouts/DefaultLayout";

const MagicSignIn: NextPage = () => {
  const router = useRouter();

  const [isSigningIn, setIsSigningIn] = useState(true);
  const [errorSigningIn, setErrorSignIn] = useState<string | undefined>();

  const { password, key } = router.query;

  const { setToastAlert } = useToast();

  const { mutateUser } = useUser();

  useEffect(() => {
    setIsSigningIn(true);
    setErrorSignIn(undefined);
    if (!password || !key) return;
    authenticationService
      .magicSignIn({ token: password, key })
      .then(async (res) => {
        setIsSigningIn(false);
        await mutateUser();
        // TODO: add workspace mutations
        if (res.user.is_onboarded) router.push("/");
        else router.push("/invitations");
      })
      .catch((err) => {
        setErrorSignIn(err.response.data.error);
        setIsSigningIn(false);
      });
  }, [password, key, mutateUser, router]);

  return (
    <DefaultLayout
      meta={{
        title: "Magic Sign In",
      }}
    >
      <div className="flex h-screen w-full items-center justify-center overflow-auto bg-gray-50">
        {isSigningIn ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-y-2">
            <h2 className="text-4xl">Signing you in...</h2>
            <p className="text-sm text-gray-600">
              Please wait while we are preparing your take off.
            </p>
          </div>
        ) : errorSigningIn ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-y-2">
            <h2 className="text-4xl">Error</h2>
            <p className="text-sm text-gray-600">
              {errorSigningIn}.
              <span
                className="cursor-pointer underline"
                onClick={() => {
                  authenticationService
                    .emailCode({ email: (key as string).split("_")[1] })
                    .then(() => {
                      setToastAlert({
                        type: "success",
                        title: "Email sent",
                        message: "A new link/code has been send to you.",
                      });
                    })
                    .catch(() => {
                      setToastAlert({
                        type: "error",
                        title: "Error",
                        message: "Unable to send email.",
                      });
                    });
                }}
              >
                Send link again?
              </span>
            </p>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-y-2">
            <h2 className="text-4xl">Success</h2>
            <p className="text-sm text-gray-600">Redirecting you to the app...</p>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default MagicSignIn;
