import { ExpandableChatDemo } from "@/components/demo";
import { AIVoiceInputDemo } from "@/components/ai-voice-input-demo";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-16 px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Multispa Demo
          </h1>
          <p className="text-muted-foreground">
            Click the chat button in the bottom-right corner to open the chat
          </p>
        </div>

        <div className="w-full mb-12">
          <h2 className="text-xl font-semibold text-center mb-4">
            AI Voice Input
          </h2>
          <AIVoiceInputDemo />
        </div>

        <ExpandableChatDemo />
      </main>
    </div>
  );
}
