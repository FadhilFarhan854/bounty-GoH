import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing bounties:', error);
    return NextResponse.json({ success: false, error: 'Failed to save bounties' }, { status: 500 });
  }
}
