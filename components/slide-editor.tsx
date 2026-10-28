"use client";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useCallback, useRef } from "react";
import type { z } from "zod";
import type { SlideSpec } from "@/lib/slide-schema";
import { diagramSkeleton } from "@/lib/drawing";
import type { Prisma } from "@/lib/generated/prisma/browser";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";

const Excalidraw = dynamic(() => import("@excalidraw/excalidraw").then(m => m.Excalidraw), { ssr: false });

type Scene = { spec: z.infer<typeof SlideSpec> } | ExcalidrawInitialDataState;
export type SlideData = { id: string; title: string; notes: string | null; scene: unknown };

export function SlideEditor({ slide, onSave }: { slide: SlideData; onSave: (scene: Prisma.InputJsonValue) => void }) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const initial = useCallback(async (): Promise<ExcalidrawInitialDataState> => {
    const scene = slide.scene as Scene;
    if (!("spec" in scene)) return scene;
    const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
    const { spec } = scene;                     // first open: DSL → elements
    const skeleton: ExcalidrawElementSkeleton[] = [
      { type: "text", x: 80, y: 40, text: spec.title, fontSize: 44 },
      ...diagramSkeleton(spec.nodes, spec.edges),
    ];
    return { elements: convertToExcalidrawElements(skeleton, { regenerateIds: false }), appState: { viewBackgroundColor: "#fffdf7" }, scrollToContent: true };
  }, [slide]);

  return (
    <div className="h-[calc(100vh-4rem)] min-h-[480px]">
      <Excalidraw
        initialData={initial}
        onChange={(elements, appState, files) => {
          clearTimeout(timer.current);
          timer.current = setTimeout(() => onSave(JSON.parse(JSON.stringify(
            { elements, appState: { viewBackgroundColor: appState.viewBackgroundColor }, files }))), 1200);
        }}
      />
    </div>
  );
}
