"use client";

import { useState } from "react";
import Link from "next/link";
import { StartAttemptButton } from "./start-button";

export function TestInstructionsStart({
  testId,
  activeAttemptId,
  courseSlug,
  exhausted,
}: {
  testId: string;
  activeAttemptId: string | null;
  courseSlug?: string;
  exhausted: boolean;
}) {
  const [accepted, setAccepted] = useState(Boolean(activeAttemptId));
  const backHref = courseSlug
    ? `/dashboard/courses/${encodeURIComponent(courseSlug)}?view=tests`
    : "/dashboard/tests";
  return (
    <div className="grid w-full gap-4">
      <label className="flex min-h-[3.6rem] w-full cursor-pointer items-center gap-3 rounded-[.42rem] bg-[#fff7f1] px-[1.15rem] py-4 text-[.8rem] text-[#33383c]">
        <input
          className="size-[1.15rem] shrink-0 accent-[#e84916]"
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span>
          I have read and understood the instructions. I am ready to begin the
          test.
        </span>
      </label>
      <div className="flex items-center justify-between gap-4 max-[700px]:flex-col-reverse max-[700px]:items-stretch">
        <Link
          className="flex min-h-[2.55rem] items-center justify-center gap-[.55rem] rounded-[.38rem] border border-[#bfc1c4] px-[1.2rem] py-[.6rem] text-[.82rem] font-bold hover:bg-[#f5f5f4] max-[700px]:w-full"
          href={backHref}
        >
          ← <span>Back to package</span>
        </Link>
        {exhausted ? (
          <div
            className="rounded-[.5rem] border border-[#f4aaa4] bg-[#fff1f0] px-4 py-3 text-[.78rem] text-[#a62a24]"
            role="status"
          >
            You have used all available attempts.
          </div>
        ) : (
          <StartAttemptButton
            testId={testId}
            activeAttemptId={activeAttemptId}
            courseSlug={courseSlug}
            disabled={!accepted}
          />
        )}
      </div>
    </div>
  );
}
