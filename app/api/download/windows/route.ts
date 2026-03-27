export const runtime = "nodejs"

import path from "node:path"
import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { Readable } from "node:stream"

const RELATIVE_INSTALLER_PATH = path.join("electron", "dist", "HabitFlow Setup 1.0.0.exe")

export async function GET() {
  const filePath = path.join(process.cwd(), RELATIVE_INSTALLER_PATH)

  try {
    const s = await stat(filePath)
    const filename = "HabitFlow-Setup.exe"

    const nodeStream = createReadStream(filePath)
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(s.size),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    })
  } catch {
    return Response.json(
      {
        error: "Windows installer not found on server.",
        expectedPath: RELATIVE_INSTALLER_PATH,
        fix:
          "Ensure the installer exists at electron/dist/ and is included in your deployment, or publish it via GitHub Releases and link there instead.",
      },
      { status: 404 }
    )
  }
}

