import { POST as visionPost } from "../vision/meal/route";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  return visionPost(req);
}
