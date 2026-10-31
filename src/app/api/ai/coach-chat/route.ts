import { POST as coachPost } from "../coach/route";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  return coachPost(req);
}
