import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function extractPdf(buf: Buffer): Promise<string> {
  // Use pdfjs-dist legacy build (Node-friendly). Import dynamically so it
  // only loads when a PDF is actually uploaded.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Importing the worker module (rather than pointing workerSrc at a file
  // path) makes Next bundle pdf.worker.mjs into the serverless function.
  // Without this, pdfjs tries to resolve the worker by path at runtime and
  // crashes on Vercel with "Cannot find module .../pdf.worker.mjs".
  await import("pdfjs-dist/legacy/build/pdf.worker.mjs");

  const task = pdfjs.getDocument({
    data: new Uint8Array(buf),
    // text-only extraction: no browser-dependent machinery
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
    useSystemFonts: false,
  });
  const pdf = await task.promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ") + "\n";
  }
  await pdf.destroy();
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    const name = (file.name || "").toLowerCase();
    const buf = Buffer.from(await file.arrayBuffer());

    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "File is over 5 MB. Try a smaller file." }, { status: 400 });
    }

    let text = "";

    if (name.endsWith(".docx")) {
      const mammoth = (await import("mammoth")).default;
      const out = await mammoth.extractRawText({ buffer: buf });
      text = out.value;
    } else if (name.endsWith(".pdf")) {
      text = await extractPdf(buf);
    } else if (name.endsWith(".doc")) {
      return NextResponse.json(
        { error: "Old .doc isn't supported. Re-save as .docx or .pdf and try again." },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file. Upload a .docx or .pdf." },
        { status: 400 }
      );
    }

    text = text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

    if (text.length < 30) {
      return NextResponse.json(
        { error: "Couldn't read enough text from that file. It may be a scanned image — try pasting instead." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Couldn't parse that file.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
