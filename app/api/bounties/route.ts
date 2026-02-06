import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// Force dynamic to enable file system operations
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'app', 'data', 'activeBounties.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const bounties = JSON.parse(fileContent);
    return NextResponse.json(bounties);
  } catch (error) {
    console.error('Error reading bounties:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const bounties = await request.json();
    const filePath = path.join(process.cwd(), 'app', 'data', 'activeBounties.json');
    await writeFile(filePath, JSON.stringify(bounties, null, 2));
    
    console.log('Bounties saved successfully:', bounties);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error writing bounties:', error);
    return NextResponse.json({ success: false, error: 'Failed to save bounties' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { bossId, hunted, huntedBy, huntedAt } = await request.json();
    
    const filePath = path.join(process.cwd(), 'app', 'data', 'activeBounties.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const bounties = JSON.parse(fileContent);
    
    // Find and update the boss
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
    
    await writeFile(filePath, JSON.stringify(bounties, null, 2));
    
    console.log(`Boss ${bossId} marked as hunted by ${huntedBy}`);
    return NextResponse.json({ success: true, boss: bounties[bossIndex] });
  } catch (error) {
    console.error('Error updating boss hunted status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update boss' }, { status: 500 });
  }
}
