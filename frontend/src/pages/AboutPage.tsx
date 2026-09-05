/**
 * About screen — the app's mission statement and the savings-rule
 * reasoning behind its budgeting guidance. Reached via a quiet link on
 * the Dashboard rather than a bottom-nav tab, since it's read once,
 * not a screen people return to daily.
 */

import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/" className="text-sm text-teal-600 dark:text-teal-400">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-2">
          About Finance Tracker
        </h1>
      </div>

      <div className="flex flex-col gap-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <p>
          Financial clarity shouldn't be complicated. Finance Tracker turns every
          transaction into insight — showing exactly where your income goes, where
          spending quietly adds up, and how much room you truly have to save. No
          spreadsheets. No complicated budgeting frameworks. No app that gets
          abandoned after a week.
        </p>

        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            The 20% rule
          </h2>
          <p className="mb-3">
            Saving isn't what's left over — it's the plan itself. As Warren Buffett
            put it:
          </p>
          <blockquote className="border-l-2 border-teal-600 pl-3 italic text-neutral-600 dark:text-neutral-400 mb-3">
            "Do not save what is left after spending, but spend what is left after
            saving."
          </blockquote>
          <p>
            That's the thinking behind this app's budgeting guidance:{" "}
            <strong className="text-neutral-900 dark:text-neutral-100">
              50% for needs, 30% for wants, 20% for savings
            </strong>{" "}
            — the framework popularized by Elizabeth Warren in <i>All Your Worth</i>.
            Your household's exact split may look different, but the principle
            holds — savings gets planned for, not left to chance.
          </p>
        </div>

        <p>
          Just a fast, installable tool built to keep your financial picture
          current — so every decision, big or small, is made with clarity instead
          of guesswork.
        </p>

        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
          Your money, finally visible.
        </p>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 text-xs text-neutral-500 dark:text-neutral-400 flex flex-col gap-1">
        <p>Built with FastAPI, React, and a PWA that installs on your phone like any other app.</p>
        <p>
          Source:{" "}
          <a
            href="https://github.com/ZainabPervaiz-cloud/moneytrail"
            target="_blank"
            rel="noreferrer"
            className="text-teal-600 dark:text-teal-400"
          >
            github.com/ZainabPervaiz-cloud/moneytrail
          </a>
        </p>
        <p className="mt-3 not-italic">Best regards,<br />Zainab</p>
      </div>
    </div>
  );
}
