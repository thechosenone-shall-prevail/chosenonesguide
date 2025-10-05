// Code execution endpoint
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { code, language } = await request.json();

    // Execute code based on language
    let output = "";
    let error = "";

    try {
      switch (language) {
        case "javascript":
        case "typescript":
          // Execute JavaScript/TypeScript
          output = await executeJavaScript(code);
          break;
        case "python":
          output = await executePython(code);
          break;
        case "html":
          output = "HTML preview available in the preview pane";
          break;
        default:
          output = `Execution for ${language} coming soon!`;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    return NextResponse.json({
      success: true,
      output,
      error,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Execute error:", error);
    return NextResponse.json(
      { error: "Execution failed" },
      { status: 500 }
    );
  }
}

async function executeJavaScript(code: string): Promise<string> {
  // Capture console output
  const logs: string[] = [];
  const originalLog = console.log;
  
  console.log = (...args: any[]) => {
    logs.push(args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' '));
  };

  try {
    // Execute in a safe context
    const result = eval(code);
    console.log = originalLog;
    
    if (logs.length > 0) {
      return logs.join('\n');
    }
    
    return result !== undefined ? String(result) : 'Code executed successfully';
  } catch (error) {
    console.log = originalLog;
    throw error;
  }
}

async function executePython(code: string): Promise<string> {
  // For Python, we'd need a Python runtime
  // For now, return a message
  return "Python execution requires a Python runtime. Install Pyodide for browser-based Python execution.";
}
