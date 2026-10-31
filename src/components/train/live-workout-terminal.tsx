"use client";
import { useMemo, useState } from "react";
import { Flag, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { useWorkoutSets } from "@/lib/db/hooks";
import { deleteSet, discardWorkout, finishWorkout, logSet } from "@/lib/db/repo";
import { EXERCISE_MAP, EXERCISES, MUSCLE_LABELS, SPLIT_TEMPLATES } from "@/lib/exercises";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { useNow } from "@/lib/hooks/use-today";
import { detectStalledLift, recommendNextTarget, restSecondsFor, type SetType } from "@/lib/math/gym-math";
import { formatClock } from "@/lib/math/pomodoro";
import { fmtInt } from "@/lib/format";
import { useProfile } from "@/lib/db/hooks";
import type { Workout } from "@/types/database.types";
import { CustomNumpad, type NumpadField } from "./custom-numpad";
import { ExerciseCard, type Ghost, type SetDraft } from "./exercise-card";
import { FloatingRestTimer, useRestTimer } from "./rest-timer";
import type { useTrainingData } from "./training-data";

const FIELDS: NumpadField[] = ["weight", "reps", "rir"];

export function LiveWorkoutTerminal({ workout, data }: { workout: Workout; data: ReturnType<typeof useTrainingData> }) {
  const profile = useProfile();
  const sets = useWorkoutSets(workout.id);
  const [plan, setPlan] = useLocalStorage<string[]>(`cc:workout-plan:${workout.id}`, SPLIT_TEMPLATES[workout.split_name] ?? []);
  const [drafts, setDrafts] = useState<Record<string, Record<number, SetDraft | undefined>>>({});
  const [active, setActive] = useState<{ slug: string; setNumber: number; field: NumpadField } | null>(null);
  const [picker, setPicker] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const rest = useRestTimer();
  const elapsed = (useNow(true, 1000) || Date.now()) - new Date(workout.started_at).getTime();

  const slugs = useMemo(() => [...new Set([...plan, ...sets.map((s) => s.exercise_slug)])].filter((s) => EXERCISE_MAP.has(s)), [plan, sets]);
  const volume = sets.filter((s) => s.set_type !== "warmup").reduce((t, s) => t + s.weight_kg * s.reps, 0);

  const ghostsFor = (slug: string): (Ghost | undefined)[] => {
    const prev = data.history(slug, workout.id).at(-1);
    return prev?.sets.map((s) => ({ weight_kg: s.weight_kg, reps: s.reps, rir: s.rir, set_type: s.set_type })) ?? [];
  };

  const draftOf = (slug: string, n: number): SetDraft => drafts[slug]?.[n] ?? { weight: "", reps: "", rir: "", type: ghostsFor(slug)[n - 1]?.set_type ?? "working" };
  const setDraft = (slug: string, n: number, patch: Partial<SetDraft>) =>
    setDrafts((d) => ({ ...d, [slug]: { ...d[slug], [n]: { ...draftOf(slug, n), ...patch } } }));

  async function log(slug: string, n: number) {
    const ex = EXERCISE_MAP.get(slug)!;
    const d = draftOf(slug, n);
    const mine = sets.filter((s) => s.exercise_slug === slug).sort((a, b) => b.set_number - a.set_number);
    // "Copy Last": empty fields fall back to the ghost (previous session) or the previous set this session.
    const g = ghostsFor(slug)[n - 1] ?? (mine[0] ? { weight_kg: mine[0].weight_kg, reps: mine[0].reps, rir: mine[0].rir, set_type: mine[0].set_type } : undefined);
    const weight = d.weight !== "" ? Number(d.weight) : g?.weight_kg;
    const reps = d.reps !== "" ? Number(d.reps) : g?.reps;
    const rir = d.rir !== "" ? Number(d.rir) : g?.rir ?? null;
    if (weight === undefined || reps === undefined || !Number.isFinite(weight) || !Number.isFinite(reps)) {
      setActive({ slug, setNumber: n, field: "weight" });
      return toast("Enter weight & reps", { tone: "amber", body: "No previous set to copy yet." });
    }
    const res = await logSet({ workout_id: workout.id, exercise_slug: slug, set_number: n, set_type: d.type, weight_kg: weight, reps: Math.round(reps), rir: rir === null ? null : Math.min(10, Math.max(0, rir)) });
    setDrafts((all) => ({ ...all, [slug]: { ...all[slug], [n]: undefined } }));
    if (d.type !== "warmup") rest.start(restSecondsFor(ex), `${ex.name} · set ${n}`);
    if (res.set.is_1rm_pr) toast(`NEW 1RM PR: ${res.set.est_1rm.toFixed(1)} kg`, { tone: "gold", body: `${ex.name} · prev ${res.previousBest1RM.toFixed(1)} kg`, ms: 4500 });
    else if (res.set.is_volume_pr) toast(`VOLUME PR: ${weight} × ${reps}`, { tone: "emerald", body: ex.name });
    setActive((a) => (a && a.slug === slug && a.setNumber === n ? { slug, setNumber: n + 1, field: "weight" } : a));
  }

  const activeDraft = active ? draftOf(active.slug, active.setNumber) : null;

  return (
    <div className={active ? "pb-80" : ""}>
      <div className="sticky top-14 z-20 -mx-4 mb-3 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur-xl lg:top-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold">{workout.split_name} <span className="num ml-1 text-xs font-normal text-indigo">{formatClock(Math.max(0, elapsed))}</span></div>
            <div className="num text-[11px] text-muted">{fmtInt(volume)} kg · {sets.filter((s) => s.set_type !== "warmup").length} hard sets · {sets.filter((s) => s.is_1rm_pr || s.is_volume_pr).length} PRs</div>
          </div>
          <Button variant="success" size="sm" className="h-10" onClick={() => setFinishing(true)}><Flag size={14} /> Finish</Button>
        </div>
      </div>

      <div className="space-y-3">
        {slugs.map((slug) => {
          const ex = EXERCISE_MAP.get(slug)!;
          const hist = data.history(slug, workout.id);
          const last = hist.at(-1);
          const target = recommendNextTarget(last?.sets ?? [], ex);
          const stall = detectStalledLift(hist.slice(-4), data.recovery, { body_weight_kg: profile.body_weight_kg });
          return (
            <ExerciseCard key={slug} exercise={ex} logged={sets.filter((s) => s.exercise_slug === slug)} ghosts={ghostsFor(slug)}
              target={target} stall={stall} best1RM={data.best1RM(slug)} drafts={drafts[slug] ?? {}}
              active={active?.slug === slug ? { setNumber: active.setNumber, field: active.field } : null}
              onFocusField={(n, field) => setActive({ slug, setNumber: n, field })}
              onLog={(n) => void log(slug, n)}
              onDelete={(id) => void deleteSet(id)} />
          );
        })}
        <Button className="w-full" onClick={() => setPicker(true)}><Plus size={16} /> Add exercise</Button>
      </div>

      {active && activeDraft && (
        <CustomNumpad
          title={`${EXERCISE_MAP.get(active.slug)?.name} · Set ${active.setNumber}`}
          field={active.field}
          value={activeDraft[active.field]}
          onChange={(v) => setDraft(active.slug, active.setNumber, { [active.field]: v })}
          setType={activeDraft.type}
          onSetType={(t: SetType) => setDraft(active.slug, active.setNumber, { type: t })}
          onNext={() => setActive({ ...active, field: FIELDS[(FIELDS.indexOf(active.field) + 1) % 3]! })}
          onDone={() => void log(active.slug, active.setNumber)}
          onClose={() => setActive(null)}
        />
      )}
      <FloatingRestTimer raised={active !== null} />

      <ExercisePicker open={picker} onOpenChange={setPicker} onPick={(slug) => { setPlan((p) => (p.includes(slug) ? p : [...p, slug])); setPicker(false); }} />
      <FinishSheet open={finishing} onOpenChange={setFinishing} workout={workout} onDone={() => setPlan([])} />
    </div>
  );
}

const MUSCLE_FILTER_GROUPS: { label: string; muscles?: string[] }[] = [
  { label: "All" },
  { label: "Chest", muscles: ["chest"] },
  { label: "Back", muscles: ["back"] },
  { label: "Shoulders", muscles: ["shoulders", "side_delts", "rear_delts"] },
  { label: "Quads & Glutes", muscles: ["quads", "glutes"] },
  { label: "Hams & Calves", muscles: ["hamstrings", "calves"] },
  { label: "Arms", muscles: ["biceps", "triceps"] },
  { label: "Core", muscles: ["core"] },
];

function ExercisePicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (slug: string) => void }) {
  const [q, setQ] = useState("");
  const [activeGroup, setActiveGroup] = useState("All");

  const list = EXERCISES.filter((e) => {
    const matchesQuery = `${e.name} ${e.primary_muscle} ${e.equipment}`.toLowerCase().includes(q.toLowerCase());
    if (!matchesQuery) return false;
    if (activeGroup === "All") return true;
    const group = MUSCLE_FILTER_GROUPS.find((g) => g.label === activeGroup);
    return group?.muscles ? group.muscles.includes(e.primary_muscle) : true;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Add exercise" description={`${EXERCISES.length} cataloged lifts with hypertrophy rep ranges & overload increments.`}>
      <div className="relative mb-2">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <Input className="pl-9" placeholder="Search bench, quads, cable, incline…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto py-1">
        {MUSCLE_FILTER_GROUPS.map((g) => {
          const selected = activeGroup === g.label;
          return (
            <button
              key={g.label}
              type="button"
              onClick={() => setActiveGroup(g.label)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                selected
                  ? "border border-flame/40 bg-flame/15 text-flame"
                  : "border border-line bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      <ul className="max-h-[60vh] space-y-1 overflow-y-auto divide-y divide-line/40">
        {list.map((e) => (
          <li key={e.slug}>
            <button
              type="button"
              onClick={() => onPick(e.slug)}
              className="flex min-h-12 w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-white/5 active:scale-[0.99] transition-all"
            >
              <div className="min-w-0 pr-2">
                <span className="block truncate text-sm font-medium text-fg">{e.name}</span>
                <span className="num text-[10px] text-faint">
                  {e.is_compound ? "Compound" : "Isolation"} · {e.rep_range_min}-{e.rep_range_max} reps · +{e.overload_increment_kg}kg inc
                </span>
              </div>
              <div className="shrink-0 text-right">
                <span className="inline-block rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  {MUSCLE_LABELS[e.primary_muscle] ?? e.primary_muscle}
                </span>
                <span className="block num text-[10px] text-faint capitalize">{e.equipment}</span>
              </div>
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <div className="py-8 text-center text-xs text-muted">No exercises match your search.</div>
        )}
      </ul>
    </Sheet>
  );
}

function FinishSheet({ open, onOpenChange, workout, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; workout: Workout; onDone: () => void }) {
  const [rpe, setRpe] = useState<number | null>(8);
  const [notes, setNotes] = useState("");
  const rest = useRestTimer();
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Finish workout" description="Session RPE feeds the AI coach's sleep ↔ training correlations.">
      <Label>Session RPE</Label>
      <Segmented value={rpe} onChange={setRpe} options={[6, 7, 8, 9, 10].map((v) => ({ value: v, label: <span className="num">{v}</span> }))} />
      <Label className="mt-4">Notes</Label>
      <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Shoulder felt tight on OHP…" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="danger" onClick={async () => {
          if (!confirm("Discard this workout and all its sets?")) return;
          await discardWorkout(workout.id);
          onDone();
          onOpenChange(false);
        }}>Discard</Button>
        <Button variant="primary" onClick={async () => {
          await finishWorkout(workout.id, rpe, notes.trim() || null);
          rest.clear();
          onDone();
          onOpenChange(false);
          toast("Workout saved", { tone: "emerald", body: `${fmtInt(workout.total_volume_kg)} kg total volume` });
        }}>Save workout</Button>
      </div>
    </Sheet>
  );
}
