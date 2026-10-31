"use client";
import { Repeat } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/lib/db/hooks";
import { swapBigThree } from "@/lib/db/repo";
import { bigThreeFor } from "@/lib/math/goals-math";
import { toast } from "@/components/ui/toast";

/** Opened when pinning a 4th Big-3 task: "Replace one of today's Big 3 to keep focus sharp". */
export function BigThreeSwapSheet({ taskId, date, onClose }: { taskId: string | null; date: string; onClose: () => void }) {
  const tasks = useTasks();
  const incoming = tasks.find((t) => t.id === taskId);
  const current = bigThreeFor(tasks, date);
  return (
    <Sheet open={taskId !== null} onOpenChange={(o) => !o && onClose()} title="Replace one of today's Big 3 to keep focus sharp"
      description={incoming ? `"${incoming.title}" was saved to your backlog. Swap it in?` : undefined}>
      <ul className="space-y-2">
        {current.map((t) => (
          <li key={t.id}>
            <Button className="h-auto min-h-12 w-full justify-between py-2 text-left" onClick={async () => {
              if (!taskId) return;
              await swapBigThree(taskId, t.id, date);
              toast("Big-3 swapped", { tone: "emerald", body: `"${t.title}" moved to backlog` });
              onClose();
            }}>
              <span className="truncate">{t.title}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted"><Repeat size={14} /> Replace</span>
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" className="mt-3 w-full" onClick={onClose}>Keep in backlog</Button>
    </Sheet>
  );
}
