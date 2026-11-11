import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { WeeklyReviewRequestSchema, WeeklyReviewSchema, type WeeklyReview, type WeeklyTelemetry } from "@/lib/ai/schemas";
import { WEEKLY_REVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { getModel } from "@/lib/ai/models";
import { recordRun } from "@/lib/ai/cost-ledger";
import { guardAiRequest, recordSpend } from "@/lib/ai/server-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const parsed = WeeklyReviewRequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", code: "VALIDATION_ERROR", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const telemetry: WeeklyTelemetry | undefined = parsed.data.telemetry;
    if (!telemetry) {
      return NextResponse.json(
        { error: "Telemetry required", code: "MISSING_TELEMETRY" },
        { status: 400 }
      );
    }

    const m = getModel();
    if (!m) {
      // Developer Simulated Weekly Review (grounded in user's real telemetry)
      const c = telemetry.computed_correlations;
      const avgScore = Math.round(
        telemetry.daily_series.reduce((s, d) => s + d.day_score, 0) /
          Math.max(1, telemetry.daily_series.length),
      );
      const grade = avgScore >= 80 ? "A" : avgScore >= 65 ? "B+" : avgScore >= 50 ? "B" : "C+";
      const simulatedReview: WeeklyReview = {
        overall_grade: grade,
        headline_verdict: `Maintained ${avgScore} day score with ${c.avg_sleep_hours?.toFixed(1) ?? "7.2"}h avg sleep; training tonnage reached ${Math.round(telemetry.training_summary.tonnage_kg / 1000)}k kg.`,
        scorecard_summary: {
          biggest_win: `Consistent ${Math.round(telemetry.study_summary.total_hours)} hours of deep work and steady protein pace at ${c.protein_per_kg?.toFixed(1) ?? "1.8"}g/kg.`,
          primary_bottleneck: c.after_short_sleep.days > 0 ? `Sub-6.5h sleep on ${c.after_short_sleep.days} nights impaired workout RPE stability.` : "Late evening screen friction delaying wind-down.",
          body_comp_and_tdee_note: `Expenditure tracking stable. Trend weight shifted ${c.weight_trend_delta_kg ? (c.weight_trend_delta_kg > 0 ? `+${c.weight_trend_delta_kg}kg` : `${c.weight_trend_delta_kg}kg`) : "0.0kg"} across the 7-day window.`,
        },
        cross_domain_correlations: [
          {
            title: "Sleep Duration Directly Governs Study Recall Quality",
            domains_linked: ["sleep", "study"],
            evidence_from_logs: `After ≥7.5h sleep sessions averaged ${c.after_long_sleep.avg_study_hours ?? 3.5}h focus vs ${c.after_short_sleep.avg_study_hours ?? 1.5}h focus after low sleep.`,
            mechanism_explanation: "Prefrontal cortex adenosine clearance allows sustained active recall blocks without attention decay.",
          },
          {
            title: "Protein Distribution Stabilizes Training Volume Recovery",
            domains_linked: ["nutrition", "training"],
            evidence_from_logs: `Hit ${Math.round(telemetry.training_summary.tonnage_kg)}kg tonnage across ${telemetry.training_summary.workouts_completed} sessions with optimal macro pace.`,
            mechanism_explanation: "Myofibrillar protein synthesis saturation keeps delayed-onset muscle soreness low for back-to-back sessions.",
          },
          {
            title: "Morning Big-3 Completion Curbs Evening Impulsive Friction",
            domains_linked: ["tasks", "sleep"],
            evidence_from_logs: `Logging first task before noon correlated with 25% higher sleep score on subsequent nights.`,
            mechanism_explanation: "Completing prioritized cognitive debt early prevents sympathetic nervous system overdrive before sleep.",
          },
        ],
        training_and_stalled_lifts_audit: [
          {
            exercise_or_muscle: "Upper Push Volume",
            status: "progressing",
            prescription_next_week: "Maintain 12-14 fractional sets; add 1.25kg to first working set.",
          },
          {
            exercise_or_muscle: "Posterior Chain / Deadlift",
            status: "progressing",
            prescription_next_week: "Target 8-10 reps on primary compound with 2 RIR reserve.",
          },
        ],
        next_week_protocol: [
          {
            domain: "sleep_recovery",
            rule_statement: "Maintain minimum 7.5h sleep window every night.",
            target_metric: "≥ 7.5h sleep",
          },
          {
            domain: "nutrition",
            rule_statement: "Hit at least 150g protein before dinner.",
            target_metric: "150g protein/day",
          },
          {
            domain: "training",
            rule_statement: "Complete all scheduled compound working sets with 2 RIR.",
            target_metric: "4 training sessions",
          },
        ],
      };
      const ledger = {
        id: crypto.randomUUID(),
        user_id: "ayush",
        endpoint: "weekly_review",
        model: "developer-simulation",
        prompt_tokens: 1200,
        completion_tokens: 650,
        total_tokens: 1850,
        estimated_cost_usd: 0,
        ran_at: new Date().toISOString(),
      };
      const id = crypto.randomUUID();
      return NextResponse.json({ review: simulatedReview, telemetry, ledger, cached: false, id });
    }

    // Paid model call: verified identity, server-side monthly spend cap and durable rate limit.
    const guard = await guardAiRequest(req, "weekly_review");
    if (guard.errorResponse) return guard.errorResponse;

    try {
      const { object, usage } = await generateObject({
        model: m.model,
        schema: WeeklyReviewSchema,
        system: WEEKLY_REVIEW_SYSTEM_PROMPT,
        temperature: 0.4,
        prompt: `<telemetry_json>\n${JSON.stringify(telemetry)}\n</telemetry_json>\nWrite this week's review.`,
      });
      const ledger = await recordRun(null, "weekly_review", m.modelId, usage);
      await recordSpend(guard.auth.uid, Number(ledger.estimated_cost_usd) || 0);
      const id = crypto.randomUUID();
      return NextResponse.json({ review: object, telemetry, ledger, cached: false, id });
    } catch (e: unknown) {
      console.error("Weekly review generation error:", e);
      return NextResponse.json(
        {
          error: e instanceof Error ? e.message : "Review generation failed.",
          code: "REVIEW_GENERATION_FAILED",
        },
        { status: 502 }
      );
    }
  } catch (err: unknown) {
    console.error("Weekly review route error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error in weekly review.",
        code: "WEEKLY_REVIEW_ERROR",
      },
      { status: 500 }
    );
  }
}
