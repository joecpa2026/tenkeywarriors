import { Resend } from "resend";
import type { MatchedJob } from "@/lib/types";

const resend = new Resend(process.env.RESEND_API_KEY);

function salaryLabel(job: MatchedJob): string {
  if (!job.salary_min && !job.salary_max) return job.salary_snippet ?? "Salary not listed";
  const fmt = (n: number) =>
    job.salary_type === "yearly" ? `$${(n / 1000).toFixed(0)}k/yr` : `$${n}/hr`;
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
  if (job.salary_max) return `Up to ${fmt(job.salary_max)}`;
  return "Salary not listed";
}

function jobRow(job: MatchedJob): string {
  const location = job.is_remote
    ? "Remote"
    : job.formatted_location ?? "Location not listed";
  const salary = salaryLabel(job);
  const applyUrl = job.apply_url ?? "#";
  const score = job.match_score;

  return `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <a href="${applyUrl}" style="font-size:16px;font-weight:600;color:#4f46e5;text-decoration:none;">
                ${job.title}
              </a>
              <p style="margin:2px 0 0;color:#6b7280;font-size:14px;">
                ${job.company ?? "Company not listed"} &bull; ${location}
              </p>
              <p style="margin:4px 0 0;color:#374151;font-size:14px;">${salary}</p>
              ${job.snippet ? `<p style="margin:6px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">${job.snippet.slice(0, 160)}…</p>` : ""}
            </td>
            <td style="text-align:right;vertical-align:top;white-space:nowrap;">
              <span style="background:${score >= 70 ? "#d1fae5" : "#fef9c3"};color:${score >= 70 ? "#065f46" : "#713f12"};padding:4px 10px;border-radius:99px;font-size:13px;font-weight:600;">
                ${score}% match
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export async function sendMatchDigest({
  to,
  name,
  matches,
  frequency,
}: {
  to: string;
  name: string | null;
  matches: MatchedJob[];
  frequency: string;
}) {
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi,";
  const period = frequency === "weekly" ? "this week" : "today";
  const viewAllUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://tenkeywarriors.com"}/matches`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td style="background:#4f46e5;padding:24px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Ten Key Warriors</p>
              <p style="margin:4px 0 0;font-size:14px;color:#c7d2fe;">Your ${frequency} match digest</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0 0 4px;font-size:15px;color:#374151;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;">
                Here are your top ${matches.length} contract accounting match${matches.length !== 1 ? "es" : ""} ${period}:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${matches.map(jobRow).join("")}
              </table>

              <div style="text-align:center;margin-top:28px;">
                <a href="${viewAllUrl}"
                   style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
                  View all matches →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                Ten Key Warriors &bull; tenkeywarriors.com<br>
                <a href="${viewAllUrl.replace("/matches", "/profile")}" style="color:#9ca3af;">Update preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: process.env.EMAIL_FROM ?? "jobs@tenkeywarriors.com",
    to,
    subject: `Your ${frequency} job matches — ${matches.length} new role${matches.length !== 1 ? "s" : ""} found`,
    html,
  });
}
