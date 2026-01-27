"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <FontAwesomeIcon
      icon={faRightFromBracket}
      className="w-6 text-red-500 mb-2 cursor-pointer"
      onClick={async () => {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        router.replace("/sign-in");
      }}
    />
  );
}
