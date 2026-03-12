"use client";

import { useState } from "react";
import { useAnimatedText } from "@/components/ui/animated-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const DEMO_TEXT = "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.\n\n" +
  "\"Whenever you feel like criticizing anyone,\" he told me, \"just remember that all the people in this world haven't had the advantages that you've had.\"\n\n" +
  "He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I'm inclined to reserve all judgements, a habit that has opened up many curious natures to me.";

function AnimationDemo({ 
  originalText, 
  animatedText 
}: { 
  originalText: string;
  animatedText: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Original</h3>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{originalText}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary">Animated</h3>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{animatedText}</p>
      </Card>
    </div>
  );
}

function ChunkToCharacterDemo() {
  const [isPlaying, setIsPlaying] = useState(true);
  const chunkText = useAnimatedText(isPlaying ? DEMO_TEXT : "", "\n\n");
  const characterText = useAnimatedText(isPlaying ? DEMO_TEXT : "", "");

  const handleRestart = () => {
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 0);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <AnimationDemo originalText={chunkText} animatedText={characterText} />
      
      <div className="flex gap-4">
        <Button onClick={handleRestart} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart
        </Button>
      </div>
    </div>
  );
}

function ChunkToWordDemo() {
  const [isPlaying, setIsPlaying] = useState(true);
  const chunkText = useAnimatedText(isPlaying ? DEMO_TEXT : "", "\n\n", 1);
  const wordText = useAnimatedText(isPlaying ? DEMO_TEXT : "", " ");

  const handleRestart = () => {
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 0);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <AnimationDemo originalText={chunkText} animatedText={wordText} />
      
      <div className="flex gap-4">
        <Button onClick={handleRestart} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart
        </Button>
      </div>
    </div>
  );
}

export default {
  ChunkToCharacterDemo,
  ChunkToWordDemo,
}
