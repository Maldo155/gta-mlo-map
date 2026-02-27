"use client";

const REDDIT_URL =
  process.env.NEXT_PUBLIC_REDDIT_URL || "https://reddit.com/r/mlomesh";

const RedditLogo = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width={34}
    height={34}
    aria-hidden
  >
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.88-7.004 4.88-3.874 0-7.004-2.186-7.004-4.88 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12.056a1.421 1.421 0 0 0 1.42 1.42 1.421 1.421 0 0 0 1.42-1.42 1.421 1.421 0 0 0-1.42-1.42 1.421 1.421 0 0 0-1.42 1.42zm5.5 0a1.421 1.421 0 0 0 1.42-1.42 1.421 1.421 0 0 0-1.42-1.42 1.421 1.421 0 0 0-1.42 1.42 1.421 1.421 0 0 0 1.42 1.42z" />
  </svg>
);

export default function RedditLink() {
  if (REDDIT_URL) {
    return (
      <a
        href={REDDIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="header-pill"
        title="Reddit"
        aria-label="Reddit"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 10px" }}
      >
        <RedditLogo />
      </a>
    );
  }
  return (
    <span className="header-pill" title="Reddit" style={{ display: "inline-flex", alignItems: "center", padding: "6px 10px" }}>
      <RedditLogo />
    </span>
  );
}
