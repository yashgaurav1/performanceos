"use client";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RefreshCw, Sparkles, Trophy, TriangleAlert } from "lucide-react";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, type Tone } from "@/components/ui/pill";
import { toast } from "@/components/ui/toast";
import { localMonthSpend, mirrorLedger, postJSON } from "@/lib/ai/client";
import { buildLocalTelemetry } from "@/lib/ai/local-telemetry";
import { WeeklyReviewSchema, type WeeklyReview, type WeeklyTelemetry } from "@/lib/ai/schemas";
import { getDB } from "@/lib/db/dexie";
import { useWeeklyReview } from "@/lib/db/hooks";
import { addTask, getProfile, updateProfile } from "@/lib/db/repo";
import type { Domain } from "@/lib/math/goals-math";
import type { AIRunLedger } from "@/types/database.types";

const GRADE_TONE = (g: string): Tone => (g.startsWith("A") ? "emerald" : g.startsWith("B") ? "flame" : g.startsWith("C") ? "amber" : "coral");
const DOMAIN_LABEL = { sleep: "Sleep", nutrition: "Protein", training: "Training", study: "Study", tasks: "Tasks" } as const;
const STATUS_TONE = { progressing: "emerald", stalled_recovery: "coral", stalled_fatigue: "coral", under_volume: "amber" } as const;
const PROTOCOL_DOMAIN: Record<WeeklyReview["next_week_protocol"][number]["domain"], Domain> = {
  sleep_recovery: "life", nutrition: "physique", training: "physique", study_execution: "study",
};

interface ReviewResponse { review: WeeklyReview; telemetry: WeeklyTelemetry; ledger: AIRunLedger | null; cached: boolean; id: string }

export function WeeklyExecutiveBrief({ weekStart, today }: { weekStart: string; today: string }) {
  const stored = useWeeklyReview(weekStart);
  const parsed = stored ? WeeklyReviewSchema.safeParse(stored.review_payload) : null;
  const review = parsed?.success ? parsed.data : null;

  const generate = useMutation({
    mutationFn: async (force: boolean) =>
      postJSON<ReviewResponse>("/api/ai/weekly-review", {
        week_start_date: weekStart, end_date: today, force,
        telemetry: await buildLocalTelemetry(today),
        month_spend_usd: await localMonthSpend(),
      }),
    onSuccess: async (res) => {
      if (res.ledger) await mirrorLedger(res.ledger);
      const db = getDB();
      await db.weeklyReviews.where("week_start_date").equals(weekStart).delete();
      await db.weeklyReviews.put({
        id: res.id, user_id: "", week_start_date: weekStart, overall_grade: res.review.overall_grade, telemetry_snapshot: res.telemetry,
        review_payload: res.review, created_at: new Date().toISOString(), sync_status: "synced",
      });
      toast(res.cached ? "Loaded cached review" : "Weekly review ready", { tone: "emerald" });
    },
    onError: (e) => toast("Review failed", { tone: "coral", body: e.message }),
  });

  const commit = useMutation({
    mutationFn: async (r: WeeklyReview) => {
      let tasks = 0;
      for (const p of r.next_week_protocol) {
        await addTask({ title: p.rule_statement, domain: PROTOCOL_DOMAIN[p.domain], scheduled_date: today });
        tasks++;
      }
      // Lightweight target updates when a rule names a concrete number.
      const profile = await getProfile();
      const patch: Parameters<typeof updateProfile>[0] = {};
      for (const p of r.next_week_protocol) {
        const text = `${p.rule_statement} ${p.target_metric}`;
        const protein = p.domain === "nutrition" ? text.match(/(\d{2,3})\s*g\s*(?:of\s*)?protein/i) : null;
        if (protein && Number(protein[1]) !== profile.target_protein_g) patch.target_protein_g = Number(protein[1]);
        const sleep = p.domain === "sleep_recovery" ? text.match(/(\d(?:\.\d)?)\s*h/i) : null;
        if (sleep && Number(sleep[1]) >= 6 && Number(sleep[1]) <= 10) patch.target_sleep_hours = Number(sleep[1]);
      }
      if (Object.keys(patch).length) await updateProfile(patch);
      return { tasks, targets: Object.keys(patch).length };
    },
    onSuccess: ({ tasks, targets }) => toast("Protocol committed", { tone: "emerald", body: `${tasks} tasks added${targets ? ` · ${targets} target${targets > 1 ? "s" : ""} updated` : ""}` }),
  });

  if (!review) {
    return (
      <Card>
        <CardHeader eyebrow="Sunday audit" title="Weekly executive brief" icon={<Sparkles size={16} />} />
        <EmptyState icon={<Trophy size={22} />} title="No review for this week yet"
          body="Your coach audits 7 days of sleep, food, training, study and money · citing your real numbers."
          action={
            <Button variant="primary" disabled={generate.isPending} onClick={() => generate.mutate(false)}>
              {generate.isPending ? <><Loader2 size={16} className="animate-spin" /> Auditing…</> : <><Sparkles size={16} /> Generate review</>}
            </Button>
          } />
        {generate.isError && <p className="mt-3 text-xs text-coral">{generate.error.message}</p>}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="relative overflow-hidden" highlight="flame">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-flame/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className={`num flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-2xl font-bold ${GRADE_TONE(review.overall_grade) === "emerald" ? "border-emerald/40 bg-emerald/10 text-emerald" : GRADE_TONE(review.overall_grade) === "flame" ? "border-flame/40 bg-flame/15 text-flame" : GRADE_TONE(review.overall_grade) === "amber" ? "border-amber/40 bg-amber/10 text-amber" : "border-coral/40 bg-coral/10 text-coral"}`}>
            {review.overall_grade}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.08em] text-faint">Week of {weekStart}</div>
            <p className="num mt-0.5 text-[15px] font-semibold leading-snug">{review.headline_verdict}</p>
          </div>
        </div>
        <div className="relative mt-4 space-y-2 text-sm">
          <div className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald" /><span className="num text-muted"><b className="font-medium text-fg">Win: </b>{review.scorecard_summary.biggest_win}</span></div>
          <div className="flex gap-2"><TriangleAlert size={16} className="mt-0.5 shrink-0 text-coral" /><span className="num text-muted"><b className="font-medium text-fg">Bottleneck: </b>{review.scorecard_summary.primary_bottleneck}</span></div>
          <div className="num rounded-xl bg-surface-2 p-2.5 text-xs text-muted">{review.scorecard_summary.body_comp_and_tdee_note}</div>
        </div>
        <div className="relative mt-3 flex justify-end">
          <Button size="sm" variant="ghost" disabled={generate.isPending} onClick={() => generate.mutate(true)}>
            <RefreshCw size={13} className={generate.isPending ? "animate-spin" : ""} /> Regenerate
          </Button>
        </div>
      </Card>

      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Cross-domain correlations</div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0">
        {review.cross_domain_correlations.map((c) => (
          <Card key={c.title} className="w-[85%] shrink-0 snap-start lg:w-auto">
            <div className="flex flex-wrap gap-1">
              <Pill tone="flame">{c.domains_linked.map((d) => DOMAIN_LABEL[d]).join(" ↔ ")}</Pill>
            </div>
            <h3 className="mt-2 text-sm font-semibold">{c.title}</h3>
            <p className="num mt-1.5 text-xs text-fg/80">{c.evidence_from_logs}</p>
            <p className="mt-1.5 text-xs text-muted">{c.mechanism_explanation}</p>
          </Card>
        ))}
      </div>

      {review.training_and_stalled_lifts_audit.length > 0 && (
        <Card>
          <CardHeader eyebrow="Audit" title="Training & stalled lifts" />
          <ul className="space-y-2">
            {review.training_and_stalled_lifts_audit.map((a) => (
              <li key={a.exercise_or_muscle} className="rounded-xl bg-surface-2 p-2.5">
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{a.exercise_or_muscle}</span><Pill tone={STATUS_TONE[a.status]}>{a.status.replace("_", " ")}</Pill></div>
                <p className="num mt-1 text-xs text-muted">{a.prescription_next_week}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="border-flame/30" highlight="flame">
        <CardHeader eyebrow="Next 7 days" title="Protocol" />
        <ol className="space-y-2">
          {review.next_week_protocol.map((p, i) => (
            <li key={p.rule_statement} className="flex gap-3 rounded-xl bg-surface-2 p-3">
              <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-flame text-xs font-bold text-white shadow-xs">{i + 1}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium">{p.rule_statement}</div>
                <div className="num mt-0.5 text-[11px] text-flame font-semibold">{p.target_metric}</div>
              </div>
            </li>
          ))}
        </ol>
        <Button variant="primary" className="mt-3 w-full" disabled={commit.isPending || commit.isSuccess} onClick={() => commit.mutate(review)}>
          {commit.isSuccess ? <><CheckCircle2 size={16} /> Committed</> : "Commit Protocol to This Week's Goals"}
        </Button>
      </Card>
    </div>
  );
}
