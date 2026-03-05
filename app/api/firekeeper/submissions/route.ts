/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { QuestSubmission } from "@/app/types/submission";

// External JSON storage for submissions (npoint)
const SUBMISSIONS_JSON_URL = process.env.QUEST_SUBMISSIONS_JSON_URL;
const SUBMISSIONS_JSON_PATH = path.join(process.cwd(), "data", "quest-submissions.json");

// Helper to read submissions
async function getSubmissions(): Promise<QuestSubmission[]> {
  try {
    if (SUBMISSIONS_JSON_URL) {
      console.log("Fetching submissions from npoint:", SUBMISSIONS_JSON_URL);
      const response = await fetch(SUBMISSIONS_JSON_URL, {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Npoint fetch failed:", {
          status: response.status,
          statusText: response.statusText,
          url: SUBMISSIONS_JSON_URL,
        });
        throw new Error(`Npoint fetch failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Submissions fetched from npoint:", Array.isArray(data) ? data.length : 0, "items");
      return Array.isArray(data) ? data : [];
    }

    // Fallback to local file (dev only)
    console.log("Using local submissions file");
    const fileContent = await readFile(SUBMISSIONS_JSON_PATH, "utf-8");
    return JSON.parse(fileContent);
  } catch (err) {
    console.error("Error reading submissions:", err);
    return [];
  }
}

// Helper to save submissions
async function saveSubmissions(data: QuestSubmission[]): Promise<boolean> {
  try {
    if (SUBMISSIONS_JSON_URL) {
      console.log("Saving submissions to npoint:", SUBMISSIONS_JSON_URL, "items:", data.length);

      // npoint.io always uses POST for updates
      const response = await fetch(SUBMISSIONS_JSON_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Npoint save failed:", {
          status: response.status,
          statusText: response.statusText,
          url: SUBMISSIONS_JSON_URL,
          error: errorText.substring(0, 500),
        });
        return false;
      }

      console.log("Submissions saved to npoint");
      return true;
    }

    // Fallback to local file (dev only)
    await writeFile(SUBMISSIONS_JSON_PATH, JSON.stringify(data, null, 2));
    console.log("Submissions saved to local file");
    return true;
  } catch (error) {
    console.error("Error saving submissions:", error);
    return false;
  }
}

// GET — list all submissions (optionally filter by status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let submissions = await getSubmissions();

    if (status) {
      submissions = submissions.filter((s) => s.status === status);
    }

    // Sort by newest first
    submissions.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error("GET submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions", details: error?.message },
      { status: 500 }
    );
  }
}

// POST — submit a new quest completion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName, bossId, bossName, bounty, videoFileName, videoUrl } = body;

    if (!playerName || !bossId || !bossName || !videoUrl) {
      return NextResponse.json(
        { error: "Missing required fields: playerName, bossId, bossName, videoUrl" },
        { status: 400 }
      );
    }

    const submission: QuestSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      playerName,
      bossId,
      bossName,
      bounty: bounty || "Unknown",
      videoFileName: videoFileName || "N/A",
      videoUrl,
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    const submissions = await getSubmissions();
    submissions.push(submission);
    const saved = await saveSubmissions(submissions);

    if (!saved) {
      return NextResponse.json(
        { error: "Failed to save submission to storage" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    console.error("POST submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit", details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH — approve or reject a submission
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, reviewNote } = body;

    if (!id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Missing id or invalid status (must be 'approved' or 'rejected')" },
        { status: 400 }
      );
    }

    const submissions = await getSubmissions();
    const index = submissions.findIndex((s) => s.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    submissions[index].status = status;
    submissions[index].reviewedAt = new Date().toISOString();
    submissions[index].reviewNote = reviewNote || undefined;
    const saved = await saveSubmissions(submissions);

    if (!saved) {
      return NextResponse.json(
        { error: "Failed to save submission update to storage" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, submission: submissions[index] });
  } catch (error: any) {
    console.error("PATCH submission error:", error);
    return NextResponse.json(
      { error: "Failed to update submission", details: error?.message },
      { status: 500 }
    );
  }
}
