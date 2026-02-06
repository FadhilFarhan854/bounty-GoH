import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// Force dynamic to enable file system operations and external requests
export const dynamic = 'force-dynamic';

const JSON_URL = process.env.JSON_STORAGE_URL;
const JSON_KEY = process.env.JSON_STORAGE_KEY;

console.log('API Route Config:', {
  hasJsonUrl: !!JSON_URL,
  jsonUrl: JSON_URL ? 'Set' : 'Not Set',
  cwd: process.cwd()
});

// Helper to get headers for external request
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (JSON_KEY) {
    headers['X-Master-Key'] = JSON_KEY;
    headers['X-Access-Key'] = JSON_KEY;
    headers['secret-key'] = JSON_KEY;
  }
  return headers;
};

export async function GET() {
  try {
    if (JSON_URL) {
      console.log('Fetching from external storage:', JSON_URL);
      const response = await fetch(JSON_URL, {
        headers: getHeaders(),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`External storage fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      // Handle JSONBin.io structure where data is wrapped in 'record'
      const bounties = data.record || data;
      return NextResponse.json(bounties);
    }

    // Fallback to local file
    const filePath = path.join(process.cwd(), 'app', 'data', 'activeBounties.json');
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      const bounties = JSON.parse(fileContent);
      return NextResponse.json(bounties);
    } catch {
      // Return empty array if file doesn't exist yet
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error reading bounties:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const bounties = await request.json();

    if (JSON_URL) {
      console.log('Saving to external storage...');

      // Auto-detect method: npoint.io uses POST for updates, JSONBin uses PUT
      const method = JSON_URL.includes('npoint.io') ? 'POST' : 'PUT';

      const response = await fetch(JSON_URL, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(bounties)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('External storage error details:', errorText);
        throw new Error(`External storage save failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    }

    // Fallback to local file
    const filePath = path.join(process.cwd(), 'app', 'data', 'activeBounties.json');
    await writeFile(filePath, JSON.stringify(bounties, null, 2));

    console.log('Bounties saved successfully locally:', bounties);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error writing bounties:', error);
    return NextResponse.json({ success: false, error: 'Failed to save bounties' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { bossId, hunted, huntedBy, huntedAt } = await request.json();

    let bounties: any[] = [];

    // 1. Fetch current bounties
    if (JSON_URL) {
      const response = await fetch(JSON_URL, {
        headers: getHeaders(),
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Failed to fetch for update');
      const data = await response.json();
      bounties = data.record || data;
    } else {
      const filePath = path.join(process.cwd(), 'app', 'data', 'activeBounties.json');
      const fileContent = await readFile(filePath, 'utf-8');
      bounties = JSON.parse(fileContent);
    }

    // 2. Update the specific boss
    const bossIndex = bounties.findIndex((b: { id: string }) => b.id === bossId);
    if (bossIndex === -1) {
      return NextResponse.json({ success: false, error: 'Boss not found' }, { status: 404 });
    }

    bounties[bossIndex] = {
      ...bounties[bossIndex],
      hunted,
      huntedBy,
      huntedAt
    };

    // 3. Save back
    if (JSON_URL) {
      // Auto-detect method: npoint.io uses POST for updates, JSONBin uses PUT
      const method = JSON_URL.includes('npoint.io') ? 'POST' : 'PUT';

      const response = await fetch(JSON_URL, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(bounties)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('External storage error details:', errorText);
        throw new Error(`External storage update failed: ${response.status} ${errorText}`);
      }
    } else {
      const filePath = path.join(process.cwd(), 'app', 'data', 'activeBounties.json');
      await writeFile(filePath, JSON.stringify(bounties, null, 2));
    }

    console.log(`Boss ${bossId} marked as hunted by ${huntedBy}`);
    return NextResponse.json({ success: true, boss: bounties[bossIndex] });
  } catch (error) {
    console.error('Error updating boss hunted status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update boss' }, { status: 500 });
  }
}
